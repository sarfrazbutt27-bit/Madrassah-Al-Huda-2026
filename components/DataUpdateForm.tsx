
import React, { useState } from 'react';
import { 
  User, Phone, MapPin, Save, 
  CheckCircle2, ArrowRight, Loader2, Users, 
  Fingerprint, Baby, ArrowLeft, Hash, UserCircle,
  CreditCard, Banknote, MessageCircle, Copy, Check, School, Info
} from 'lucide-react';
import { Student, PaymentMethod } from '../types';
import LogoIcon from './LogoIcon';

interface DataUpdateFormProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => Promise<boolean>;
  isPublic?: boolean;
}

const DataUpdateForm: React.FC<DataUpdateFormProps> = ({ students, onUpdateStudents, isPublic = false }) => {
  const [step, setStep] = useState<'identify' | 'edit'>('identify');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState<{ name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Identifizierung
  const [idInput, setIdInput] = useState('');
  const [identifiedFamily, setIdentifiedFamily] = useState<Student[]>([]);
  const [isAdultView, setIsAdultView] = useState(false);

  // Formular-Status
  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: '', lastName: '', guardian: '', address: '', whatsapp: '', siblingsCount: 0, paymentMethod: 'Überweisung'
  });

  // Hochpräzise Link-Generierung für WhatsApp
  const getPortalUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname.endsWith('/') 
      ? window.location.pathname 
      : window.location.pathname + '/';
    return `${origin}${pathname}#/portal`;
  };

  const PORTAL_LINK = getPortalUrl();

  // --- LOGIK ---

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    const input = idInput.trim().toUpperCase();
    
    let found: Student[] = [];
    let adult = false;

    if (input.startsWith('FAM-')) {
      found = students.filter(s => s.familyId === input);
      adult = false;
    } else {
      const single = students.find(s => s.id === input);
      if (single) {
        adult = single.gender === 'Mann' || single.gender === 'Frau';
        if (adult) {
          found = [single];
        } else {
          found = students.filter(s => s.familyId === single.familyId);
        }
      }
    }

    if (found.length > 0) {
      setIdentifiedFamily(found);
      setIsAdultView(adult);
      setFormData({ 
        ...found[0],
        siblingsCount: found[0].siblingsCount || found.length,
        paymentMethod: found[0].paymentMethod || 'Überweisung'
      });
      setStep('edit');
    } else {
      alert("Identifikations-ID nicht gefunden. Bitte prüfen Sie die HUDA-ID oder FAM-ID auf dem Ausweis Ihres Kindes.");
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Update all students in the identified family with the new shared data
    const updatedStudents: Student[] = identifiedFamily.map(s => ({
      ...s,
      guardian: formData.guardian || s.guardian,
      address: formData.address || s.address,
      whatsapp: formData.whatsapp || s.whatsapp,
      siblingsCount: formData.siblingsCount,
      paymentMethod: formData.paymentMethod || s.paymentMethod,
      phoneError: false
    }));

    const success = await onUpdateStudents(updatedStudents);
    if (success) {
      setShowResult({ name: isAdultView ? `${formData.firstName}` : `${formData.guardian}` });
    }
    setIsSubmitting(false);
  };

  const handleShareWhatsApp = () => {
    const message = `Salam! Hier ist der Link zum Daten-Portal der Madrassah Al-Huda Hamburg (Jenfeld) Quran Schule zur Aktualisierung Ihrer Kontaktdaten:\n\n${PORTAL_LINK}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(PORTAL_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetPortal = () => {
    setStep('identify');
    setShowResult(null);
    setIdInput('');
    setIdentifiedFamily([]);
  };

  if (showResult) {
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white rounded-[3rem] shadow-2xl text-center my-20 border-4 border-emerald-50 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <CheckCircle2 size={42} />
        </div>
        <h2 className="text-3xl font-black text-madrassah-950 uppercase italic mb-4">Daten erfolgreich geprüft!</h2>
        <p className="text-gray-500 font-medium italic leading-relaxed">
          Vielen Dank, {showResult.name}. Ihre Informationen wurden sicher in der Datenbank der <br/>
          <span className="text-madrassah-950 font-bold uppercase">Madrassah Al-Huda Hamburg (Jenfeld) Quran Schule</span> hinterlegt.
        </p>
        
        <div className="mt-12 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6">
           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Link zur Weiterleitung an andere Eltern:</p>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={handleShareWhatsApp}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
              >
                <MessageCircle size={20} /> Per WhatsApp
              </button>
              <button 
                onClick={handleCopyLink}
                className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${copied ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-600'}`}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                {copied ? 'Kopiert!' : 'Link kopieren'}
              </button>
           </div>
        </div>

        <button onClick={resetPortal} className="mt-10 text-gray-400 font-black uppercase text-[9px] tracking-widest hover:text-madrassah-950 transition-all">Sitzung beenden</button>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto pb-32 animate-in fade-in duration-700 ${isPublic ? 'mt-10' : ''}`}>
      {/* Header */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-10 mb-10">
        <div className="flex items-center gap-8">
           <div className="bg-madrassah-950 p-6 rounded-[2rem] shadow-2xl text-white transform -rotate-3">
              <LogoIcon className="w-10 h-10" />
           </div>
           <div>
              <h2 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Daten-Portal</h2>
              <p className="text-gray-400 font-bold uppercase text-[9px] mt-2 italic tracking-widest">Madrassah Al-Huda Hamburg (Jenfeld) Quran Schule</p>
           </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleShareWhatsApp}
            title="Link an Eltern senden"
            className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm group"
          >
            <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={handleCopyLink}
            title="Link kopieren"
            className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group"
          >
            {copied ? <Check size={24} /> : <Copy size={24} className="group-hover:scale-110 transition-transform" />}
          </button>
        </div>
      </div>

      {step === 'identify' && (
        <div className="bg-white rounded-[4rem] shadow-2xl p-12 md:p-20 border border-gray-50 text-center animate-in zoom-in duration-500">
           <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[1.75rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
              <Fingerprint size={42} />
           </div>
           <h3 className="text-3xl font-black text-madrassah-950 uppercase italic mb-4 tracking-tighter leading-none">Identität bestätigen</h3>
           <p className="text-gray-500 font-medium italic mb-12 max-w-md mx-auto leading-relaxed">
              Geben Sie die **Familien-ID** (FAM-...) oder die **Schüler-ID** (HUDA-...) ein, um Ihre hinterlegten Daten abzugleichen.
           </p>

           <div className="mb-10 bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4 text-left max-w-md mx-auto">
              <School size={20} className="text-amber-600 shrink-0 mt-1" />
              <p className="text-[11px] text-amber-900 leading-relaxed font-medium italic">
                Dies ist das offizielle Portal der <span className="font-bold">Madrassah Al-Huda Hamburg (Jenfeld) Quran Schule</span>. Hier verwalten Sie Ihre Notfall-Kontakte und Anschriften.
              </p>
           </div>

           <form onSubmit={handleIdentify} className="max-w-md mx-auto space-y-6">
              <div className="relative">
                 <Hash size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-300" />
                 <input 
                   required autoFocus 
                   value={idInput} onChange={e => setIdInput(e.target.value)}
                   className="w-full pl-16 pr-8 py-7 bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] font-black text-2xl text-indigo-950 outline-none focus:border-madrassah-950 shadow-inner tracking-widest placeholder:text-gray-200" 
                   placeholder="FAM-XXXXX / HUDA-..." 
                 />
              </div>
              <button type="submit" className="w-full bg-madrassah-950 text-white font-black py-7 rounded-[2.5rem] shadow-2xl uppercase text-[12px] tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-4 group">
                 Daten aufrufen <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
           </form>
        </div>
      )}

      {step === 'edit' && (
        <form onSubmit={handleFinalSubmit} className="space-y-10 animate-in slide-in-from-right duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className={`${isAdultView ? 'lg:col-span-12' : 'lg:col-span-8'} bg-indigo-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10`}>
                 <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">{isAdultView ? <UserCircle size={180}/> : <Baby size={180}/>}</div>
                 <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-white/10 rounded-[1.75rem] flex items-center justify-center border border-white/20 shadow-xl">
                       {isAdultView ? <UserCircle size={36} className="text-amber-400" /> : <Users size={36} className="text-emerald-400" />}
                    </div>
                    <div>
                       <h3 className="text-3xl font-black uppercase italic leading-none">
                          {isAdultView ? `${formData.firstName} ${formData.lastName}` : formData.guardian}
                       </h3>
                       <div className="flex gap-4 mt-3">
                          <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">Registriert in Jenfeld</span>
                          <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">ID: {isAdultView ? formData.id : formData.familyId}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {!isAdultView && (
                <div className="lg:col-span-4 bg-white p-8 rounded-[3.5rem] border-4 border-indigo-50 shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden">
                   <p className="text-[10px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Anzahl der Kinder</p>
                   
                   <div className="flex items-center gap-6 mb-6">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, siblingsCount: Math.max(1, (formData.siblingsCount || 0) - 1)})}
                        className="w-12 h-12 bg-gray-50 text-indigo-950 rounded-xl font-black text-2xl flex items-center justify-center hover:bg-indigo-100 transition-all border border-gray-100 shadow-sm"
                      >
                        -
                      </button>
                      <div className="text-7xl font-black text-indigo-950 italic leading-none">
                         {formData.siblingsCount}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, siblingsCount: (formData.siblingsCount || 0) + 1})}
                        className="w-12 h-12 bg-gray-50 text-indigo-950 rounded-xl font-black text-2xl flex items-center justify-center hover:bg-indigo-100 transition-all border border-gray-100 shadow-sm"
                      >
                        +
                      </button>
                   </div>
                   
                   <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-indigo-700 font-black text-[8px] uppercase tracking-widest">
                         <Info size={12} /> Information
                      </div>
                      <p className="text-[9px] text-indigo-800 italic leading-tight">
                        Bitte geben Sie die Gesamtzahl Ihrer Kinder an, die an der Madrassah angemeldet sind.
                      </p>
                   </div>
                </div>
              )}
           </div>

           {!isAdultView && identifiedFamily.length > 0 && (
             <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm animate-in fade-in duration-700">
                <div className="flex items-center gap-3 mb-6">
                   <Users size={20} className="text-indigo-600" />
                   <h4 className="text-[10px] font-black uppercase text-madrassah-950 tracking-widest">Identifizierte Kinder ({identifiedFamily.length})</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                   {identifiedFamily.map(s => (
                     <div key={s.id} className="bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm font-black text-[10px]">
                           {s.gender === 'Junge' ? 'J' : 'M'}
                        </div>
                        <div>
                           <p className="text-[11px] font-black text-madrassah-950 uppercase italic">{s.firstName} {s.lastName}</p>
                           <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{s.className} • {s.id}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           <div className="bg-white rounded-[4rem] shadow-xl border border-gray-100 p-10 md:p-14 space-y-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><MapPin size={24}/></div>
                    <div>
                       <h3 className="text-2xl font-black text-madrassah-950 uppercase italic tracking-tighter">Daten-Abgleich</h3>
                       <p className="text-gray-400 text-[9px] font-black uppercase mt-1 italic">Hamburg (Jenfeld) Erreichbarkeits-Prüfung</p>
                    </div>
                 </div>
                 
                 <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg text-madrassah-950 shadow-sm"><Info size={16} /></div>
                    <p className="text-[8px] font-black uppercase text-gray-400 leading-tight">
                       Bei Namensfehlern:<br/>
                       <span className="text-madrassah-950">Bitte im Büro melden</span>
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 {!isAdultView && (
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Erziehungsberechtigte/r</label>
                      <div className="relative">
                         <User size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-200" />
                         <input required value={formData.guardian} onChange={e => setFormData({...formData, guardian: e.target.value})} className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] font-bold text-lg outline-none focus:border-madrassah-950 transition-all shadow-inner" />
                      </div>
                   </div>
                 )}
                 <div className={`${isAdultView ? 'col-span-full' : ''} space-y-4`}>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">WhatsApp Kontakt (Notfall)</label>
                    <div className="relative">
                       <Phone size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-200" />
                       <input required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] font-bold text-lg outline-none focus:border-madrassah-950 transition-all shadow-inner" />
                    </div>
                 </div>
                 <div className="space-y-4 col-span-full">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Aktuelle Wohnanschrift</label>
                    <div className="relative">
                       <MapPin size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-200" />
                       <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] font-bold text-lg outline-none focus:border-madrassah-950 transition-all shadow-inner" placeholder="Straße, Nr, PLZ, Stadt" />
                    </div>
                 </div>
              </div>

              {/* Zahlungsweise Sektion */}
              <div className="pt-8 border-t border-gray-50 space-y-6">
                 <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-indigo-600" />
                    <h4 className="text-[10px] font-black uppercase text-madrassah-950 tracking-widest">Zahlungsweise bestätigen</h4>
                 </div>
                 <div className="flex flex-wrap gap-4">
                    {(['Überweisung', 'Bar'] as PaymentMethod[]).map(method => (
                       <button
                         key={method}
                         type="button"
                         onClick={() => setFormData({...formData, paymentMethod: method})}
                         className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 border-2 ${
                           formData.paymentMethod === method 
                             ? 'bg-indigo-950 text-white border-indigo-950 shadow-lg scale-[1.02]' 
                             : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-100'
                         }`}
                       >
                          {method === 'Bar' ? <Banknote size={16} /> : <CreditCard size={16} />}
                          {method}
                          {formData.paymentMethod === method && <CheckCircle2 size={14} className="text-emerald-400 ml-2" />}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
                 <button type="button" onClick={resetPortal} className="flex items-center gap-3 text-[10px] font-black uppercase text-gray-400 hover:text-madrassah-950 transition-all italic">
                    <ArrowLeft size={16} /> Zurück zur Anmeldung
                 </button>
                 <button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-emerald-600 text-white px-20 py-7 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-6 disabled:opacity-50 group">
                    {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} className="group-hover:rotate-12 transition-transform" />} 
                    Daten jetzt sichern
                 </button>
              </div>
           </div>
        </form>
      )}
    </div>
  );
};

export default DataUpdateForm;
