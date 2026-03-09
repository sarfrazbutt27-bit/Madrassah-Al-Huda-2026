
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, ShieldCheck, Users, Calendar, Hash, Phone } from 'lucide-react';
import { WaitlistEntry } from '../types';
import LogoIcon from './LogoIcon';

const WaitlistPrintView: React.FC<{ waitlist: WaitlistEntry[] }> = ({ waitlist }) => {
  const navigate = useNavigate();
  
  const sortedWaitlist = [...waitlist].sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white pb-20 font-sans text-black">
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all">
              <ChevronLeft size={16} /> Zurück
           </button>
           <h1 className="text-lg font-black uppercase italic leading-none text-yellow-400">Wartelisten Export</h1>
        </div>
        <button onClick={() => window.print()} className="bg-emerald-500 text-white px-10 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
          <Printer size={20} /> Liste drucken (PDF)
        </button>
      </div>

      <div className="p-8 print:p-0 mx-auto w-full max-w-[297mm]">
        <div className="bg-white p-12 print:p-10 shadow-2xl print:shadow-none min-h-[210mm] flex flex-col border border-gray-200 print:border-none relative">
          
          <div className="flex justify-between items-start border-b-[4px] border-black pb-8 mb-10">
            <div className="flex items-center gap-8">
              <div className="p-4 bg-black text-white rounded-2xl shadow-xl">
                 <LogoIcon className="w-16 h-16" />
              </div>
              <div>
                <h1 className="text-4xl font-black uppercase italic leading-none tracking-tighter">Madrassah Al-Huda Hamburg</h1>
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-gray-500 mt-2">Offizielles Wartelisten-Register • Stand 2026</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-indigo-950 text-white px-5 py-2 text-[10px] font-black uppercase rounded-lg mb-3 italic">INTERNE VORMERKUNGEN</div>
              <p className="text-lg font-black italic uppercase">STATUS: {sortedWaitlist.length} INTERESSENTEN</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Druckdatum: {new Date().toLocaleDateString('de-DE')}</p>
            </div>
          </div>

          <div className="flex-1">
             <table className="w-full border-collapse border-2 border-black font-sans text-[10px]">
                <thead>
                   <tr className="bg-gray-100 uppercase font-black border-b-2 border-black h-12">
                      <th className="p-3 w-10 text-center border-r border-black italic">#</th>
                      <th className="p-3 w-28 text-left border-r border-black">Eingang</th>
                      <th className="p-3 text-left border-r border-black">Vormund / Name</th>
                      <th className="p-3 w-32 text-center border-r border-black">Kontakt</th>
                      <th className="p-3 w-16 text-center border-r border-black">Pers.</th>
                      <th className="p-3 text-left border-r border-black">Teilnehmer-Details</th>
                      <th className="p-3 text-left w-32">Bearbeitungsnotiz</th>
                   </tr>
                </thead>
                <tbody>
                   {sortedWaitlist.map((w, idx) => (
                     <tr key={w.id} className={`border-b border-black/10 h-14 italic ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>
                        <td className="p-3 text-center border-r border-black font-black text-gray-400">{idx + 1}</td>
                        <td className="p-3 border-r border-black font-bold text-gray-500">
                           {new Date(w.appliedDate).toLocaleDateString('de-DE')}
                        </td>
                        <td className="p-3 border-r border-black font-black uppercase text-sm leading-tight">
                           {w.guardianName}
                           <div className="text-[7px] text-gray-400 mt-1 uppercase">ID: {w.id}</div>
                        </td>
                        <td className="p-3 border-r border-black text-center font-black text-emerald-700 tracking-tighter">
                           {w.whatsapp}
                        </td>
                        <td className="p-3 border-r border-black text-center font-black">
                           {w.participants?.length || 0}
                        </td>
                        <td className="p-3 border-r border-black">
                           <div className="flex flex-col gap-0.5">
                              {w.participants?.map((p, pIdx) => (
                                 <span key={pIdx} className="text-[8px] font-bold uppercase truncate">
                                    • {p.firstName} {p.lastName} ({new Date(p.birthDate).getFullYear()})
                                 </span>
                              ))}
                           </div>
                        </td>
                        <td className="p-3"></td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div className="grid grid-cols-2 gap-40 pt-16 pb-10 mt-auto">
             <div className="text-center border-t border-black pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 italic">Bearbeitung Verwaltung</p>
                <div className="h-8"></div>
                <p className="text-[10px] font-bold border-t border-dotted border-black/20 pt-1">Unterschrift / Datum</p>
             </div>
             <div className="text-center border-t border-black pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 italic">Prüfung Schulleitung</p>
                <div className="h-8"></div>
                <p className="text-[11px] font-black uppercase pt-1">Sarfraz Azmat Butt</p>
             </div>
          </div>

          <div className="mt-auto pt-6 text-[8px] font-black text-gray-300 uppercase tracking-[0.5em] flex justify-between border-t border-dotted border-gray-200">
             <span>Digital Admissions Ledger &copy; 2026 • FISCAL VERIFIED</span>
             <div className="flex items-center gap-4">
                <ShieldCheck size={10} className="grayscale opacity-30" />
                <span>EXPORT-ID: {new Date().getTime()}</span>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 1cm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .shadow-2xl { box-shadow: none !important; }
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>
    </div>
  );
};

export default WaitlistPrintView;
