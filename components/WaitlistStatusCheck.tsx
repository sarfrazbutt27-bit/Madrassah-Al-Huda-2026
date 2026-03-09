
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Hourglass, CheckCircle2, MessageSquare, User, XCircle, Phone, Loader2, Users, Info } from 'lucide-react';
import { WaitlistEntry } from '../types';
import LogoIcon from './LogoIcon';

const WaitlistStatusCheck: React.FC<{ waitlist: WaitlistEntry[] }> = ({ waitlist }) => {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState('');
  const [results, setResults] = useState<WaitlistEntry[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      const cleanPhone = phoneInput.replace(/\D/g, '');
      const found = waitlist.filter(w => w.whatsapp.replace(/\D/g, '').includes(cleanPhone) && cleanPhone.length > 5);
      setResults(found);
      setIsSearching(false);
    }, 800);
  };

  const getStatusVisuals = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: <Hourglass size={14}/>, label: 'Warteliste (In Prüfung)' };
      case 'invited': return { color: 'bg-amber-50 text-amber-700 border-amber-100', icon: <MessageSquare size={14}/>, label: 'Eingeladen zum Gespräch' };
      case 'classified': return { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle2 size={14}/>, label: 'Angenommen & Eingestuft' };
      case 'rejected': return { color: 'bg-red-50 text-red-700 border-red-100', icon: <XCircle size={14}/>, label: 'Leider Abgelehnt' };
      default: return { color: 'bg-gray-100 text-gray-400', label: 'Unbekannt' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
           <button onClick={() => navigate('/')} className="flex items-center gap-2 text-madrassah-950 font-black uppercase text-[10px] bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100"><ArrowLeft size={16} /> Zurück</button>
           <LogoIcon className="w-12 h-12 text-madrassah-950" />
        </div>

        <div className="bg-madrassah-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden text-center">
           <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Search size={240} /></div>
           <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-6">Status prüfen</h1>
           <p className="text-madrassah-300 font-bold uppercase text-[11px] tracking-widest max-w-xl mx-auto italic">
              Geben Sie die WhatsApp-Nummer der Anmeldung ein.
           </p>
        </div>

        <div className="bg-white rounded-[4rem] p-10 md:p-16 shadow-xl border border-gray-100">
           <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-5 mb-12">
              <div className="relative flex-1">
                 <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                 <input 
                  required 
                  type="text" 
                  value={phoneInput} 
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="Telefonnummer (z.B. 0176...)"
                  className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-gray-50 rounded-[2rem] font-bold text-lg outline-none focus:border-madrassah-950 shadow-inner"
                 />
              </div>
              <button 
                type="submit" 
                disabled={isSearching}
                className="bg-madrassah-950 text-white font-black px-12 py-6 rounded-[2rem] shadow-xl uppercase text-[11px] tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                 {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} Suchen
              </button>
           </form>

           {results !== null && (
              <div className="space-y-6">
                 {results.length > 0 ? results.map(entry => (
                    <div key={entry.id} className="bg-gray-50 rounded-[3rem] p-8 md:p-12 border border-gray-100 space-y-8 relative overflow-hidden group">
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg"><User size={32} className="text-madrassah-950" /></div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">ID: {entry.id}</p>
                                <h3 className="text-2xl font-black text-madrassah-950 uppercase italic leading-none">{entry.guardianName}</h3>
                             </div>
                          </div>
                          <div className="flex flex-col gap-3">
                            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase border shadow-sm ${getStatusVisuals(entry.status).color}`}>
                               {getStatusVisuals(entry.status).icon} {getStatusVisuals(entry.status).label}
                            </div>
                            <button 
                              onClick={() => navigate(`/enroll?waitlistId=${entry.id}`)}
                              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                            >
                               <CheckCircle2 size={14}/> Jetzt Anmelden
                            </button>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-gray-200">
                          <div className="space-y-6">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border text-indigo-600"><Users size={20}/></div>
                                <div>
                                   <p className="text-[9px] font-black uppercase text-gray-400">Teilnehmer</p>
                                   <p className="font-bold text-gray-900">{entry.participants.length} Personen</p>
                                </div>
                             </div>
                          </div>
                          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm italic">
                             <p className="text-[10px] font-black uppercase text-indigo-950 mb-3 flex items-center gap-2"><Info size={14}/> Information</p>
                             <p className="text-sm text-gray-500 leading-relaxed">
                                {entry.status === 'pending' && "Ihre Anmeldung ist bei uns eingegangen. Wir prüfen aktuell die Kapazitäten für die gewählten Kurse."}
                                {entry.status === 'invited' && "Bitte prüfen Sie Ihr WhatsApp für einen Terminvorschlag zum persönlichen Gespräch."}
                                {entry.status === 'classified' && "Ihre Plätze sind reserviert. Die Zugangsdaten erhalten Sie zum Kursstart."}
                             </p>
                          </div>
                       </div>
                    </div>
                 )) : (
                    <div className="text-center py-20 bg-red-50 rounded-[4rem] border-2 border-dashed border-red-100">
                       <XCircle size={64} className="text-red-300 mx-auto mb-6" />
                       <h3 className="text-2xl font-black text-red-900 uppercase italic">Nichts gefunden</h3>
                       <p className="text-sm text-red-600 font-medium mt-2">Unter dieser Nummer liegt keine Anmeldung für 2026 vor.</p>
                    </div>
                 )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default WaitlistStatusCheck;
