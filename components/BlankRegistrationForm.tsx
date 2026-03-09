
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, ShieldCheck, Euro, Landmark, User, Users } from 'lucide-react';
import LogoIcon from './LogoIcon';

const BlankRegistrationForm: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white pb-32 font-sans text-black no-scrollbar">
      {/* Controls */}
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all">
              <ChevronLeft size={16} /> Zurück
           </button>
           <h1 className="text-lg font-black uppercase italic leading-none text-yellow-400">Blanko-Anmeldung Druckmodul</h1>
        </div>
        <button onClick={() => window.print()} className="bg-emerald-500 text-white px-10 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-3 shadow-lg hover:scale-105 transition-all">
          <Printer size={20} /> Formular jetzt drucken
        </button>
      </div>

      <div className="p-8 print:p-0 mx-auto w-full max-w-[210mm]">
        <div className="bg-white p-12 print:p-10 shadow-2xl print:shadow-none min-h-[297mm] flex flex-col border border-gray-200 print:border-none relative">
          
          {/* Offizieller Header */}
          <div className="flex justify-between items-start border-b-[4px] border-black pb-8 mb-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-black text-white rounded-2xl shadow-xl">
                 <LogoIcon className="w-16 h-16" />
              </div>
              <div>
                <h1 className="text-4xl font-black uppercase italic leading-none tracking-tighter">Madrassah Al-Huda</h1>
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-gray-500 mt-2">Akademie für Islamische Bildung Hamburg</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-black text-white px-5 py-2 text-[10px] font-black uppercase rounded-lg mb-3">FORMULAR: NEUAUFNAHME</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Schuljahr 2025 / 2026</p>
            </div>
          </div>

          <div className="space-y-10 flex-1">
             <h2 className="text-center text-3xl font-black mb-8 italic uppercase tracking-tighter underline underline-offset-8">Antrag auf Schulaufnahme</h2>
             
             {/* I. Sorgeberechtigte */}
             <section className="space-y-6">
                <h3 className="text-[12px] font-black uppercase bg-gray-100 px-4 py-2 border-l-8 border-black italic flex items-center gap-3">
                   <Users size={16} /> I. Angaben zum Erziehungsberechtigten / Vertragspartner
                </h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-10 pt-4">
                   <div className="border-b-2 border-black/20 pb-2 relative">
                      <label className="text-[8px] font-black uppercase text-gray-400 absolute -top-5 left-0">Vorname, Nachname (Druckbuchstaben)</label>
                      <div className="h-6"></div>
                   </div>
                   <div className="border-b-2 border-black/20 pb-2 relative">
                      <label className="text-[8px] font-black uppercase text-gray-400 absolute -top-5 left-0">WhatsApp / Mobilnummer für Notfälle</label>
                      <div className="h-6"></div>
                   </div>
                   <div className="border-b-2 border-black/20 pb-2 col-span-2 relative">
                      <label className="text-[8px] font-black uppercase text-gray-400 absolute -top-5 left-0">Vollständige Anschrift (Straße, Nr, PLZ, Ort)</label>
                      <div className="h-6"></div>
                   </div>
                </div>
             </section>

             {/* II. Kinder / Teilnehmer */}
             <section className="space-y-6">
                <h3 className="text-[12px] font-black uppercase bg-gray-100 px-4 py-2 border-l-8 border-black italic flex items-center gap-3">
                   <User size={16} /> II. Angaben zu den Teilnehmern (Schüler/innen)
                </h3>
                <table className="w-full border-collapse border-2 border-black font-sans text-[11px]">
                   <thead>
                      <tr className="bg-gray-50 uppercase font-black border-b-2 border-black h-10">
                         <th className="p-3 w-10 text-center border-r border-black">#</th>
                         <th className="p-3 text-left border-r border-black">Vorname, Nachname</th>
                         <th className="p-3 w-32 text-center border-r border-black">Geburtsdatum</th>
                         <th className="p-3 w-20 text-center border-r border-black">M / W</th>
                         <th className="p-3 text-left">Kurs-Wunsch / Vorkenntnisse</th>
                      </tr>
                   </thead>
                   <tbody>
                      {[1, 2, 3, 4].map(n => (
                        <tr key={n} className="border-b border-black/10 h-14">
                           <td className="p-3 text-center border-r border-black font-bold text-gray-400">{n}.</td>
                           <td className="p-3 border-r border-black"></td>
                           <td className="p-3 border-r border-black"></td>
                           <td className="p-3 border-r border-black"></td>
                           <td className="p-3 italic text-gray-300">z.B. Tajweed, Arabisch, Hifz...</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </section>

             {/* III. Bestimmungen */}
             <section className="grid grid-cols-2 gap-8 pt-4">
                <div className="p-6 border-2 border-black rounded-3xl bg-gray-50/50 space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-b border-black/10 pb-2">
                      <Euro size={14}/> Beitrags-Information (Monatlich)
                   </h4>
                   <ul className="text-[9px] font-bold text-gray-600 space-y-2 uppercase leading-tight">
                      <li className="flex justify-between"><span>• 1 Kind:</span> <span className="font-black text-black">30,00 €</span></li>
                      <li className="flex justify-between"><span>• 2 Kinder (Gesamt):</span> <span className="font-black text-black">50,00 €</span></li>
                      <li className="flex justify-between"><span>• Ab 3 Kindern:</span> <span className="font-black text-black">20,00 € pro Kind</span></li>
                      <li className="flex justify-between pt-2 border-t border-black/10"><span>• Aufnahmegebühr (einmalig):</span> <span className="font-black text-black">10,00 € p.K.</span></li>
                   </ul>
                </div>
                <div className="p-6 border-2 border-indigo-900 rounded-3xl bg-indigo-50/30 flex flex-col justify-center">
                   <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-indigo-950"><Landmark size={14}/> Bankverbindung</h4>
                   <p className="text-[8px] font-black uppercase text-indigo-400">Kontoinhaber: Azmat Ullah Butt</p>
                   <p className="text-[11px] font-black font-mono text-indigo-950 mt-1">IBAN: DE79 2004 1177 0546 3088 00</p>
                   <p className="text-[7px] text-gray-400 mt-2 italic uppercase">Verwendungszweck: Vorname Nachname Schüler</p>
                </div>
             </section>

             {/* Einverständnis */}
             <div className="mt-4 border-2 border-dashed border-black/20 p-8 rounded-[2.5rem] bg-gray-50/20 italic">
                <p className="text-[10px] leading-relaxed text-gray-600">
                   Mit meiner Unterschrift erkenne ich die Hausordnung der Madrassah Al-Huda Hamburg an. Ich willige ein, dass die personenbezogenen Daten zum Zwecke der Schulverwaltung digital verarbeitet werden. Zahlungen sind pünktlich bis zum 5. des Kalendermonats zu leisten. 
                </p>
             </div>

             <div className="grid grid-cols-2 gap-40 pt-20 mt-auto">
                <div className="text-center border-t-2 border-black pt-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Hamburg, den ________________</p>
                   <p className="text-[11px] font-black uppercase italic">Unterschrift Eltern / Vormund</p>
                </div>
                <div className="text-center border-t-2 border-black pt-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Stempel / Freigabe Leitung</p>
                   <p className="text-[12px] font-black uppercase italic tracking-tighter">Madrassah Al-Huda</p>
                </div>
             </div>
          </div>

          <div className="mt-8 pt-6 text-[7px] font-black text-gray-300 uppercase tracking-[0.6em] flex justify-between border-t border-dotted border-gray-200">
             <span>Digital Admissions Ledger &copy; 2026 • OFFICIAL DOCUMENT • ISO-PRINT-READY</span>
             <ShieldCheck size={12} className="opacity-20" />
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default BlankRegistrationForm;
