
import React, { useState, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, UserPlus, Users, User, Phone, MapPin, 
  Globe, Plus, Trash2, BookOpen, CreditCard, Loader2, Landmark, Check, ArrowRight, Euro, Printer, Hash
} from 'lucide-react';
import { WaitlistEntry, ParticipantInfo, CourseType, Gender } from '../types';
import LogoIcon from './LogoIcon';

const KIDS_COURSES: CourseType[] = [
  'Alif-Ba (Basis)', 'Qur’an lesen', 'Tajweed', 'Islamkunde', 'Hifz (Memorieren)'
];

const ADULT_COURSES: CourseType[] = [
  'Arabisch (Sprachkurs)', 'Imam Ausbildung', 'Ijazah Programm', 'Ilmiyah Studium', 'Tafheem ul Quran'
];

const PublicEnrollmentForm: React.FC<{ onAdd: (entry: WaitlistEntry) => void, waitlist?: WaitlistEntry[] }> = ({ onAdd, waitlist = [] }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const waitlistId = searchParams.get('waitlistId');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<{
    type: 'FAMILY' | 'ADULT';
    guardianName: string;
    whatsapp: string;
    email: string;
    address: string;
    paymentMethod: 'Bar' | 'Überweisung';
    preferredLanguage: 'Deutsch' | 'Türkisch' | 'Urdu' | 'Arabisch';
    participants: ParticipantInfo[];
    agreed: boolean;
  }>({
    type: 'FAMILY',
    guardianName: '',
    whatsapp: '',
    email: '',
    address: '',
    paymentMethod: 'Überweisung',
    preferredLanguage: 'Deutsch',
    participants: [{
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: 'Mädchen',
      priorKnowledge: 'Keine',
      preferredCourses: [],
      preferredDays: 'Wochenende'
    }],
    agreed: false
  });

  const [enrollmentId] = useState(() => waitlistId || `ANM-2026-${Date.now().toString().slice(-6)}`);

  React.useEffect(() => {
    if (waitlistId && waitlist.length > 0) {
      const entry = waitlist.find(w => w.id === waitlistId);
      if (entry) {
        setFormData({
          type: entry.type,
          guardianName: entry.guardianName,
          whatsapp: entry.whatsapp,
          email: entry.email || '',
          address: entry.address || '',
          paymentMethod: 'Überweisung',
          preferredLanguage: (entry.preferredLanguage as any) || 'Deutsch',
          participants: entry.participants,
          agreed: false
        });
        setStep(1); // Stay on step 1 to show pre-filled data
      }
    }
  }, [waitlistId, waitlist]);

  const addParticipant = () => {
    if (formData.type === 'ADULT') return;
    setFormData({
      ...formData,
      participants: [...formData.participants, {
        firstName: '',
        lastName: formData.participants[0].lastName,
        birthDate: '',
        gender: 'Junge',
        priorKnowledge: 'Keine',
        preferredCourses: [],
        preferredDays: 'Wochenende'
      }]
    });
  };

  const removeParticipant = (idx: number) => {
    if (formData.participants.length > 1) {
      setFormData({
        ...formData,
        participants: formData.participants.filter((_, i) => i !== idx)
      });
    }
  };

  const updateParticipant = (idx: number, field: keyof ParticipantInfo, value: any) => {
    const updated = [...formData.participants];
    updated[idx] = { ...updated[idx], [field]: value };
    
    let nextGuardian = formData.guardianName;
    if (formData.type === 'ADULT' && idx === 0 && (field === 'firstName' || field === 'lastName')) {
      nextGuardian = field === 'firstName' 
        ? `${value} ${updated[0].lastName}` 
        : `${updated[0].firstName} ${value}`;
    }

    setFormData({ ...formData, participants: updated, guardianName: nextGuardian });
  };

  const toggleCourse = (pIdx: number, course: CourseType) => {
    const current = formData.participants[pIdx].preferredCourses;
    const next = current.includes(course) ? current.filter(c => c !== course) : [...current, course];
    updateParticipant(pIdx, 'preferredCourses', next);
  };

  const fees = useMemo(() => {
    const count = formData.participants.length;
    let monthly = 0;
    if (formData.type === 'ADULT') {
      monthly = count * 30;
    } else {
      if (count === 1) monthly = 30;
      else if (count === 2) monthly = 50;
      else monthly = count * 20;
    }
    const regFee = count * 10;
    return { monthly, regFee, total: monthly + regFee };
  }, [formData.participants.length, formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreed) { alert("Bitte stimmen Sie den Bestimmungen zu."); return; }
    
    setIsSubmitting(true);
    const entry: WaitlistEntry = {
      id: enrollmentId,
      ...formData,
      appliedDate: new Date().toISOString(),
      status: 'pending',
      paymentConfirmed: false
    };

    onAdd(entry);
    setIsSubmitting(false);
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
           <button onClick={() => navigate('/')} className="flex items-center gap-3 text-madrassah-950 font-black uppercase text-[10px] bg-white px-8 py-5 rounded-[2rem] shadow-xl hover:bg-gray-50 transition-all border border-gray-100"><ArrowLeft size={18} /> Abbrechen</button>
           <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                 <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Digital Enrollment</p>
                 <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase justify-end">
                    <Hash size={12}/> {enrollmentId}
                 </div>
              </div>
              <LogoIcon className="w-14 h-14 text-madrassah-950" />
           </div>
        </div>

        {step < 4 && (
          <form onSubmit={handleSubmit} className="space-y-12">
             {step === 1 && (
                <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500">
                   <div className="bg-madrassah-950 p-12 md:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Globe size={300} /></div>
                      <div className="relative z-10 space-y-8">
                         <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">Online Aufnahme</h1>
                         <div className="flex bg-white/10 p-1.5 rounded-[2rem] border border-white/20 w-fit">
                            <button type="button" onClick={() => setFormData({...formData, type: 'FAMILY', participants: [{...formData.participants[0], gender: 'Mädchen', preferredCourses: []}]})} className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${formData.type === 'FAMILY' ? 'bg-white text-madrassah-950 shadow-xl' : 'text-white/40'}`}>Eltern meldet Kind an</button>
                            <button type="button" onClick={() => setFormData({...formData, type: 'ADULT', participants: [{...formData.participants[0], gender: 'Frau', preferredCourses: []}]})} className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${formData.type === 'ADULT' ? 'bg-white text-madrassah-950 shadow-xl' : 'text-white/40'}`}>Selbst-Anmeldung</button>
                         </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-[3.5rem] p-10 md:p-16 shadow-xl border border-gray-100">
                      <h3 className="text-2xl font-black text-madrassah-950 uppercase italic mb-10 flex items-center gap-4"><Phone size={28} className="text-indigo-600" /> 1. Kontaktdaten</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         {formData.type === 'FAMILY' && (
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Name des Vormunds (Vater/Mutter)</label>
                              <input required value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold outline-none focus:border-madrassah-950" placeholder="Vorname Nachname" />
                           </div>
                         )}
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">WhatsApp-Nummer</label>
                            <div className="relative">
                               <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                               <input required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full pl-16 bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold outline-none focus:border-madrassah-950" placeholder="0176..." />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">E-Mail Adresse (Optional)</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold outline-none focus:border-madrassah-950" placeholder="mail@beispiel.de" />
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Wohnanschrift</label>
                            <div className="relative">
                               <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                               <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full pl-16 bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold outline-none focus:border-madrassah-950" placeholder="Straße, Ort" />
                            </div>
                         </div>
                      </div>
                      <div className="mt-12 flex justify-end">
                         <button type="button" onClick={() => setStep(2)} className="bg-madrassah-950 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center gap-4 hover:bg-black">Weiter <ArrowRight size={20} /></button>
                      </div>
                   </div>
                </div>
             )}

             {step === 2 && (
                <div className="space-y-10 animate-in slide-in-from-right-6 duration-500">
                   <div className="flex items-center justify-between px-4">
                      <h2 className="text-3xl font-black text-madrassah-950 uppercase italic flex items-center gap-4"><Users size={36} className="text-indigo-600" /> 2. Teilnehmer Daten</h2>
                      {formData.type === 'FAMILY' && (
                         <button type="button" onClick={addParticipant} className="bg-emerald-50 text-emerald-700 px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] border border-emerald-100 shadow-sm flex items-center gap-3 hover:bg-emerald-100 transition-all"><Plus size={18} /> Weiteres Kind hinzufügen</button>
                      )}
                   </div>

                   {formData.participants.map((p, idx) => (
                      <div key={idx} className="bg-white rounded-[4rem] p-10 md:p-16 shadow-xl border border-gray-100 relative group overflow-hidden">
                         <div className="absolute top-0 left-0 w-2 h-full bg-indigo-950 opacity-10 group-hover:opacity-100 transition-opacity"></div>
                         <div className="flex justify-between items-start mb-12">
                            <div className="flex items-center gap-6">
                               <div className="w-12 h-12 bg-indigo-950 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg">0{idx + 1}</div>
                               <h4 className="text-2xl font-black uppercase italic text-madrassah-950">{formData.type === 'ADULT' ? 'Ihre Daten' : `Kind: ${p.firstName || 'Neu'}`}</h4>
                            </div>
                            {formData.participants.length > 1 && (
                               <button type="button" onClick={() => removeParticipant(idx)} className="p-4 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={24}/></button>
                            )}
                         </div>

                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="space-y-8">
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Vor- und Nachname</label>
                                  <div className="grid grid-cols-2 gap-4">
                                     <input required value={p.firstName} onChange={e => updateParticipant(idx, 'firstName', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl font-bold outline-none" placeholder="Vorname" />
                                     <input required value={p.lastName} onChange={e => updateParticipant(idx, 'lastName', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl font-bold outline-none" placeholder="Nachname" />
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Geburtsdatum</label>
                                  <input type="date" required value={p.birthDate} onChange={e => updateParticipant(idx, 'birthDate', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl font-bold outline-none" />
                               </div>
                            </div>

                            <div className="space-y-8">
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Vorkenntnisse</label>
                                  <select value={p.priorKnowledge} onChange={e => updateParticipant(idx, 'priorKnowledge', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl font-black uppercase text-[10px] outline-none">
                                     {['Keine (Alif-Ba)', 'Grundkenntnisse', 'Qur’an lesen (Basis)', 'Qur’an lesen (Fortgeschritten)', 'Tajweed Regeln'].map(k => <option key={k}>{k}</option>)}
                                  </select>
                               </div>
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Geschlecht</label>
                                  <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner">
                                     {(formData.type === 'FAMILY' ? ['Junge', 'Mädchen'] : ['Mann', 'Frau']).map(g => (
                                        <button key={g} type="button" onClick={() => updateParticipant(idx, 'gender', g)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${p.gender === g ? 'bg-madrassah-950 text-white shadow-md' : 'text-gray-400'}`}>{g}</button>
                                     ))}
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-4">
                               <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><BookOpen size={14}/> Wunsch-Kurs(e)</label>
                               <div className="flex flex-wrap gap-2">
                                  {(formData.type === 'FAMILY' ? KIDS_COURSES : ADULT_COURSES).map(c => (
                                     <button key={c} type="button" onClick={() => toggleCourse(idx, c)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase border-2 transition-all ${p.preferredCourses.includes(c) ? 'bg-indigo-950 text-white border-indigo-950 shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-100'}`}>{c}</button>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   ))}

                   <div className="flex justify-between items-center pt-8">
                      <button type="button" onClick={() => setStep(1)} className="text-gray-400 font-black uppercase text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Zurück</button>
                      <button type="button" onClick={() => setStep(3)} className="bg-madrassah-950 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center gap-4 hover:bg-black">Preise & Abschluss <ArrowRight size={20} /></button>
                   </div>
                </div>
             )}

             {step === 3 && (
                <div className="space-y-12 animate-in fade-in duration-500">
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                      <div className="lg:col-span-7 space-y-12">
                         <div className="bg-indigo-50 border-2 border-indigo-100 p-10 md:p-16 rounded-[4rem] space-y-10">
                            <div className="flex items-center gap-6">
                               <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-xl"><Landmark size={42} /></div>
                               <div>
                                  <h3 className="text-indigo-950 font-black uppercase text-xl italic">Kontodaten für Aufnahmegebühr</h3>
                                  <p className="text-indigo-800/60 text-[10px] font-black uppercase mt-1 italic">Bitte erst nach Bestätigung überweisen</p>
                               </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-2">
                                  <p className="text-[10px] font-black uppercase text-indigo-400">Zahlungsweise</p>
                                  <div className="flex bg-white/50 p-1 rounded-2xl border border-indigo-100">
                                     {['Überweisung', 'Bar'].map((m) => (
                                        <button 
                                          key={m} 
                                          type="button" 
                                          onClick={() => setFormData({...formData, paymentMethod: m as any})} 
                                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.paymentMethod === m ? 'bg-indigo-950 text-white shadow-md' : 'text-indigo-400 hover:text-indigo-600'}`}
                                        >
                                           {m}
                                        </button>
                                     ))}
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <p className="text-[10px] font-black uppercase text-indigo-400">Verwendungszweck</p>
                                  <p className="text-lg font-black font-mono text-indigo-950 bg-white px-4 py-2 rounded-xl border border-indigo-100">{enrollmentId}</p>
                               </div>
                               <div className="space-y-2 col-span-full">
                                  <p className="text-[10px] font-black uppercase text-indigo-400">IBAN für Überweisung</p>
                                  <p className="text-xl font-black font-mono text-indigo-950 bg-white px-6 py-4 rounded-2xl border border-indigo-100 tracking-tighter">DE79 2004 1177 0546 3088 00</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="lg:col-span-5 space-y-12">
                         <div className="bg-emerald-600 p-10 md:p-14 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Euro size={150} /></div>
                            <h3 className="text-xl font-black uppercase italic mb-10 tracking-widest flex items-center gap-4"><CreditCard size={24}/> Gebühren-Übersicht</h3>
                            
                            <div className="space-y-8 relative z-10">
                               <div className="flex justify-between items-center border-b border-white/20 pb-6">
                                  <div>
                                     <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">Monatsbeitrag (Gesamt)</p>
                                     <p className="text-[8px] font-bold text-emerald-200 uppercase">Tarif: {formData.type === 'FAMILY' ? 'Inkl. Rabatt' : 'Einzeltarif'}</p>
                                  </div>
                                  <p className="text-5xl font-black italic">{fees.monthly.toFixed(2)} €</p>
                               </div>
                               <div className="flex justify-between items-center border-b border-white/20 pb-6">
                                  <div>
                                     <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">Aufnahmegebühr</p>
                                     <p className="text-[8px] font-bold text-emerald-200 uppercase italic">Einmalig fällig</p>
                                  </div>
                                  <p className="text-4xl font-black italic">{fees.regFee.toFixed(2)} €</p>
                               </div>
                               <div className="pt-4">
                                  <label className="flex items-start gap-4 cursor-pointer group">
                                     <input type="checkbox" required checked={formData.agreed} onChange={e => setFormData({...formData, agreed: e.target.checked})} className="mt-1 w-5 h-5 rounded border-2 border-white/30 bg-transparent" />
                                     <p className="text-[10px] font-bold text-emerald-50 leading-relaxed italic group-hover:text-white transition-colors">
                                        Ich bestätige die Richtigkeit der Angaben und akzeptiere die Akademie-Bestimmungen.
                                     </p>
                                  </label>
                               </div>
                            </div>
                         </div>

                         <button 
                           type="submit" 
                           disabled={!formData.agreed || isSubmitting}
                           className="w-full bg-madrassah-950 text-white font-black py-8 rounded-[3rem] shadow-2xl uppercase text-[14px] tracking-[0.4em] hover:bg-black transition-all flex items-center justify-center gap-8 disabled:opacity-30"
                         >
                            {isSubmitting ? <Loader2 className="animate-spin" size={32} /> : <UserPlus size={32} />}
                            {isSubmitting ? 'Wird gesendet...' : 'Anmeldung absenden'}
                         </button>
                      </div>
                   </div>
                </div>
             )}
          </form>
        )}

        {step === 4 && (
          <div className="bg-white rounded-[4rem] p-12 md:p-20 shadow-2xl text-center space-y-10 animate-in zoom-in duration-500">
             <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={48} /></div>
             <div>
                <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter">Anmeldung eingegangen!</h2>
                <p className="text-gray-500 font-medium italic mt-4">Wir haben Ihre Unterlagen erhalten. Bitte notieren Sie Ihre Vorgangsnummer:</p>
                <div className="mt-6 inline-flex items-center gap-4 bg-indigo-50 text-indigo-700 px-8 py-4 rounded-2xl border-2 border-indigo-100 font-mono text-2xl font-black">
                   <Hash size={24} /> {enrollmentId}
                </div>
             </div>
             <p className="text-sm text-gray-400 max-w-lg mx-auto italic">Sie werden in Kürze von unserer Schulleitung kontaktiert, um die Einstufung und den Vertragsschluss abzuschließen.</p>
             <button onClick={() => navigate('/')} className="px-12 py-5 bg-madrassah-950 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl">Zur Startseite</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicEnrollmentForm;
