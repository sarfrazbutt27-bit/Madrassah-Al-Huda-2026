
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, Euro, Loader2, 
  GraduationCap, Clock, CheckCircle, 
  Plus, Trash2, ShieldCheck, Users,
  ArrowRight, Phone, Send
} from 'lucide-react';
import { WaitlistEntry, CourseType, Gender, ParticipantInfo } from '../types';
import LogoIcon from './LogoIcon';

const COURSES = [
  { id: 'Quran Basis', cycle: 'Wochenende', price: '30€', desc: 'Grundlagen der islamischen Bildung für Kindern.' },
  { id: 'Arabisch (3 Jahre)', cycle: 'Studium', price: '30€', desc: 'Systematisches Erlernen der arabischen Sprache.' },
  { id: 'Hifz (Memorieren)', cycle: 'Täglich/WE', price: '50€', desc: 'Strukturiertes Auswendiglernen des edlen Qurans.' },
  { id: 'Imam Kurs', cycle: 'Akademisch', price: '50€', desc: 'Ausbildung zum Gemeindeleiter & Vorbeter.' }
];

const WaitlistForm: React.FC<{ onAdd: (entry: WaitlistEntry) => void }> = ({ onAdd }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  
  const [entryType, setEntryType] = useState<'FAMILY' | 'ADULT'>('FAMILY');
  const [guardianName, setGuardianName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [participants, setParticipants] = useState<ParticipantInfo[]>([{
    firstName: '', lastName: '', gender: 'Junge', birthDate: '', preferredCourses: ['Quran Basis'], priorKnowledge: 'Keine', preferredDays: 'Wochenende'
  }]);

  const addParticipant = () => {
    if (entryType === 'ADULT') return;
    setParticipants([...participants, {
      firstName: '', lastName: participants[0]?.lastName || '', gender: 'Junge', birthDate: '', preferredCourses: ['Quran Basis'], priorKnowledge: 'Keine', preferredDays: 'Wochenende'
    }]);
  };

  const removeParticipant = (idx: number) => {
    if (participants.length > 1) setParticipants(participants.filter((_, i) => i !== idx));
  };

  const updateParticipant = (idx: number, field: keyof ParticipantInfo, value: string | string[] | Gender) => {
    const next = [...participants];
    next[idx] = { ...next[idx], [field]: value } as ParticipantInfo;
    setParticipants(next);
  };

  const calculatedFees = useMemo(() => {
    const count = participants.length;
    let monthly = 0;
    if (entryType === 'ADULT') {
      monthly = count * 30;
    } else {
      if (count === 1) monthly = 30;
      else if (count === 2) monthly = 50;
      else monthly = count * 20;
    }
    return { monthly, registration: count * 10 };
  }, [participants.length, entryType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const entry: WaitlistEntry = {
      id: `W-${Date.now().toString().slice(-5)}`,
      type: entryType,
      guardianName: entryType === 'ADULT' ? `${participants[0].firstName} ${participants[0].lastName}` : guardianName,
      whatsapp,
      address,
      preferredLanguage: 'Deutsch',
      appliedDate: new Date().toISOString(),
      status: 'pending',
      paymentConfirmed: true, // In Demo immer true
      participants
    };
    
    onAdd(entry);
    setStep(3);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Top Nav */}
        <div className="flex items-center justify-between mb-12">
           <button onClick={() => navigate('/')} className="flex items-center gap-3 text-madrassah-950 font-black uppercase text-[10px] bg-white px-8 py-5 rounded-[2rem] shadow-xl border border-gray-100 hover:bg-gray-50 transition-all"><ArrowLeft size={18} /> Abbrechen</button>
           <LogoIcon className="w-14 h-14 text-madrassah-950" />
        </div>

        {step === 1 && (
           <div className="space-y-12 animate-in slide-in-from-bottom-6">
              <div className="bg-madrassah-950 p-12 md:p-20 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden text-center">
                 <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><GraduationCap size={300} /></div>
                 <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none mb-10">Vormerkung 2026</h1>
                 <div className="flex bg-white/10 p-1.5 rounded-[2.5rem] border border-white/20 w-fit mx-auto">
                    <button onClick={() => { setEntryType('FAMILY'); setParticipants([{...participants[0], gender: 'Junge'}]); }} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all ${entryType === 'FAMILY' ? 'bg-white text-madrassah-950 shadow-2xl' : 'text-white/40'}`}>Eltern meldet Kinder an</button>
                    <button onClick={() => { setEntryType('ADULT'); setParticipants([{...participants[0], gender: 'Mann'}]); }} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all ${entryType === 'ADULT' ? 'bg-white text-madrassah-950 shadow-2xl' : 'text-white/40'}`}>Ich melde mich selbst an</button>
                 </div>
              </div>

              <div className="bg-white rounded-[4rem] p-10 md:p-16 shadow-xl border border-gray-100 space-y-12">
                 <h3 className="text-2xl font-black text-madrassah-950 uppercase italic mb-10 flex items-center gap-4"><Users size={32} className="text-indigo-600" /> 1. Basis-Kontaktdaten</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {entryType === 'FAMILY' && (
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Name des Vormunds (Vater/Mutter)</label>
                          <input required value={guardianName} onChange={e => setGuardianName(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-6 rounded-[2rem] font-bold outline-none focus:border-madrassah-950" placeholder="Vorname Nachname" />
                       </div>
                    )}
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-1">WhatsApp-Nummer (Primärkontakt)</label>
                       <input required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-6 rounded-[2rem] font-bold outline-none focus:border-madrassah-950" placeholder="0176 1234567" />
                    </div>
                    <div className="space-y-4 col-span-full">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Wohnanschrift</label>
                       <input required value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-6 rounded-[2rem] font-bold outline-none focus:border-madrassah-950" placeholder="Straße, Nr., PLZ & Stadt" />
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="flex justify-between items-center px-4">
                    <h3 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter">2. Teilnehmer</h3>
                    {entryType === 'FAMILY' && <button onClick={addParticipant} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-black transition-all flex items-center gap-3"><Plus size={18}/> Weiteres Kind hinzufügen</button>}
                 </div>

                 {participants.map((p, idx) => (
                    <div key={idx} className="bg-white rounded-[4rem] p-10 md:p-16 shadow-xl border border-gray-100 relative group overflow-hidden animate-in zoom-in">
                       <div className={`absolute top-0 left-0 w-2 h-full ${p.gender === 'Junge' || p.gender === 'Mann' ? 'bg-indigo-950' : 'bg-pink-600'} opacity-10 group-hover:opacity-100 transition-opacity`}></div>
                       <div className="flex justify-between items-start mb-12">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 bg-madrassah-950 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl italic">0{idx + 1}</div>
                             <h4 className="text-3xl font-black uppercase italic text-madrassah-950">{entryType === 'ADULT' ? 'Persönliche Daten' : `Kind: ${p.firstName || 'Neu'}`}</h4>
                          </div>
                          {participants.length > 1 && <button onClick={() => removeParticipant(idx)} className="p-4 text-gray-300 hover:text-red-500"><Trash2 size={24}/></button>}
                       </div>

                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                          <div className="space-y-6">
                             <input required placeholder="Vorname" value={p.firstName} onChange={e => updateParticipant(idx, 'firstName', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold" />
                             <input required placeholder="Nachname" value={p.lastName} onChange={e => updateParticipant(idx, 'lastName', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold" />
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Geburtsdatum</label>
                                <input required type="date" value={p.birthDate} onChange={e => updateParticipant(idx, 'birthDate', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold" />
                             </div>
                          </div>
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Geschlecht</label>
                                <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] shadow-inner">
                                   {(entryType === 'FAMILY' ? ['Junge', 'Mädchen'] : ['Mann', 'Frau']).map(g => (
                                      <button key={g} type="button" onClick={() => updateParticipant(idx, 'gender', g as Gender)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${p.gender === g ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}>{g}</button>
                                   ))}
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Vorkenntnisse</label>
                                <select value={p.priorKnowledge} onChange={e => updateParticipant(idx, 'priorKnowledge', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-black uppercase text-[10px] outline-none">
                                   <option>Keine (Alif-Ba)</option><option>Basis Wissen</option><option>Quran flüssig lesen</option><option>Tajweed Regeln</option>
                                </select>
                             </div>
                          </div>
                          <div className="space-y-6">
                             <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Interesse am Programm</label>
                             <div className="grid grid-cols-1 gap-3">
                                {COURSES.map(c => (
                                   <button key={c.id} type="button" onClick={() => updateParticipant(idx, 'preferredCourses', [c.id])} className={`p-4 rounded-[1.5rem] border-2 text-left transition-all ${p.preferredCourses.includes(c.id) ? 'bg-indigo-950 border-indigo-950 text-white shadow-lg scale-[1.02]' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-100'}`}>
                                      <div className="flex justify-between items-center mb-1">
                                         <span className="font-black text-[11px] uppercase tracking-tighter">{c.id}</span>
                                         <span className={`text-[8px] font-black uppercase ${p.preferredCourses.includes(c.id) ? 'text-indigo-300' : 'text-emerald-600'}`}>{c.price}</span>
                                      </div>
                                      <p className={`text-[8px] italic leading-tight ${p.preferredCourses.includes(c.id) ? 'text-white/60' : 'text-gray-300'}`}>{c.desc}</p>
                                   </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="flex justify-center pt-8">
                 {/* Fixed: Added ArrowRight import */}
                 <button onClick={() => setStep(2)} className="bg-madrassah-950 text-white px-24 py-8 rounded-[3rem] font-black uppercase text-[14px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center gap-8 group">Zusammenfassung & Senden <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform"/></button>
              </div>
           </div>
        )}

        {step === 2 && (
           <div className="max-w-4xl mx-auto space-y-12 animate-in zoom-in duration-500">
              <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl border border-gray-100 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-3 bg-emerald-500"></div>
                 <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter mb-12">Prüfung & Bestätigung</h2>
                 
                 <div className="space-y-10">
                    <div className="flex items-center gap-8 bg-gray-50 p-8 rounded-[2.5rem]">
                       {/* Fixed: Added Phone import */}
                       <div className="w-16 h-16 bg-indigo-950 text-white rounded-2xl flex items-center justify-center shadow-xl"><Phone size={32}/></div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Kontakt WhatsApp</p>
                          <p className="text-2xl font-black text-indigo-950 tracking-tighter">{whatsapp}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-emerald-50 p-8 rounded-[3rem] border-2 border-emerald-100">
                          <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest mb-4 flex items-center gap-2"><Euro size={16}/> Geschätzter Monatsbeitrag</p>
                          <h3 className="text-6xl font-black text-emerald-950 italic">{calculatedFees.monthly.toFixed(2)} €</h3>
                          <p className="text-[9px] font-bold text-emerald-600 uppercase mt-4 italic">Berechnet für {participants.length} Personen</p>
                       </div>
                       <div className="bg-indigo-50 p-8 rounded-[3rem] border-2 border-indigo-100 flex flex-col justify-center">
                          <p className="text-[10px] font-black uppercase text-indigo-700 tracking-widest mb-2">Aufnahmegebühr</p>
                          <h3 className="text-4xl font-black text-indigo-950 italic">{calculatedFees.registration.toFixed(2)} €</h3>
                          <p className="text-[8px] font-bold text-indigo-400 uppercase mt-2 italic">Einmalig fällig bei Kursstart</p>
                       </div>
                    </div>

                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-[3rem] space-y-6">
                       <h4 className="text-sm font-black uppercase tracking-widest text-indigo-950 flex items-center gap-4 italic"><ShieldCheck size={20} className="text-indigo-600" /> Bestimmungen & Datenschutz</h4>
                       <p className="text-[11px] font-medium text-gray-500 italic leading-relaxed uppercase tracking-widest">
                          Mit dem Absenden der Vormerkung stimme ich zu, dass meine Daten zum Zwecke der Kursplanung verarbeitet werden. 
                          Diese Vormerkung ist unverbindlich, bis ein persönliches Gespräch und der Vertragsschluss stattgefunden haben.
                       </p>
                       <label className="flex items-center gap-4 cursor-pointer group">
                          <div className="w-6 h-6 border-2 border-indigo-950 rounded flex items-center justify-center group-hover:bg-indigo-50 transition-all">
                             <CheckCircle size={16} className="text-indigo-950" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-indigo-950 italic">Ich akzeptiere die Bedingungen</span>
                       </label>
                    </div>
                 </div>

                 <div className="mt-16 flex flex-col gap-6">
                    {/* Fixed: Added Send import */}
                    <button onClick={handleSubmit} className="w-full bg-emerald-600 text-white py-10 rounded-[3rem] font-black uppercase text-[16px] tracking-[0.4em] shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-8 active:scale-95 group">
                       {isSubmitting ? <Loader2 className="animate-spin" size={32}/> : <Send size={32} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />} Vormerkung jetzt absenden
                    </button>
                    <button onClick={() => setStep(1)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-madrassah-950 transition-colors">Daten korrigieren</button>
                 </div>
              </div>
           </div>
        )}

        {step === 3 && (
           <div className="max-w-3xl mx-auto bg-white rounded-[4rem] p-16 md:p-24 shadow-2xl text-center space-y-12 animate-in zoom-in duration-700">
              <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={64} /></div>
              <div>
                 <h2 className="text-5xl font-black text-madrassah-950 uppercase italic tracking-tighter mb-6">Barakallahu Feekum!</h2>
                 <p className="text-xl text-gray-500 font-medium italic leading-relaxed">Ihre Vormerkung für das Jahr 2026 ist erfolgreich in unserem System eingegangen.</p>
              </div>
              
              <div className="bg-indigo-50 p-10 rounded-[3.5rem] border-2 border-indigo-100 text-left space-y-6">
                 <h4 className="font-black uppercase text-xs text-indigo-950 flex items-center gap-3 border-b border-indigo-200 pb-3 italic"><Clock size={20}/> Wie geht es weiter?</h4>
                 <ul className="space-y-4">
                    <li className="flex gap-4 items-start"><div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shrink-0 border border-indigo-200 font-black text-[10px]">1</div><p className="text-xs text-indigo-900 font-medium italic">Unsere Schulleitung prüft die Kapazitäten für die gewählten Kurse.</p></li>
                    <li className="flex gap-4 items-start"><div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shrink-0 border border-indigo-200 font-black text-[10px]">2</div><p className="text-xs text-indigo-900 font-medium italic">Sie erhalten eine Einladung zum persönlichen Gespräch via WhatsApp.</p></li>
                    <li className="flex gap-4 items-start"><div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shrink-0 border border-indigo-200 font-black text-[10px]">3</div><p className="text-xs text-indigo-900 font-medium italic">Vor Ort findet die Einstufung und der Vertragsschluss statt.</p></li>
                 </ul>
              </div>

              <button onClick={() => navigate('/')} className="px-16 py-6 bg-madrassah-950 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-black transition-all">Zurück zum Portal</button>
           </div>
        )}
      </div>
    </div>
  );
};

export default WaitlistForm;
