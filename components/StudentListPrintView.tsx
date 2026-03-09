
import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Printer, ChevronLeft, ShieldCheck } from 'lucide-react';
import { Student } from '../types';
import LogoIcon from './LogoIcon';

const StudentListPrintView: React.FC<{ students: Student[] }> = ({ students }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classFilter = searchParams.get('class') || 'Alle';

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => s.status === 'active' && (classFilter === 'Alle' || s.className === classFilter))
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [students, classFilter]);

  const [genHash] = useState(() => Date.now().toString(36).toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white pb-20 font-sans text-black">
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all">
              <ChevronLeft size={16} /> Zurück
           </button>
           <h1 className="text-lg font-black uppercase italic leading-none text-yellow-400">Schülerliste PDF-Export</h1>
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
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-gray-500 mt-2">Offizielles Schülerregister • Jahrgang 2025/2026</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-black text-white px-5 py-2 text-[10px] font-black uppercase rounded-lg mb-3 italic">REVISIERTES REGISTER</div>
              <p className="text-lg font-black italic uppercase">KLASSE: {classFilter}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Druckdatum: {new Date().toLocaleDateString('de-DE')}</p>
            </div>
          </div>

          <div className="flex-1">
             <table className="w-full border-collapse border-2 border-black font-sans text-[11px]">
                <thead>
                   <tr className="bg-gray-100 uppercase font-black border-b-2 border-black h-12">
                      <th className="p-3 w-10 text-center border-r border-black italic">#</th>
                      <th className="p-3 w-28 text-left border-r border-black">Stamm-ID</th>
                      <th className="p-3 text-left border-r border-black">Schüler Name</th>
                      <th className="p-3 w-16 text-center border-r border-black">Klasse</th>
                      <th className="p-3 text-left border-r border-black">Vormund / Eltern</th>
                      <th className="p-3 text-left">Kontakt WhatsApp</th>
                   </tr>
                </thead>
                <tbody>
                   {filteredStudents.map((s, idx) => (
                     <tr key={s.id} className="border-b border-black/10 h-10 italic">
                        <td className="p-3 text-center border-r border-black font-black text-gray-400">{idx + 1}</td>
                        <td className="p-3 border-r border-black font-mono font-bold text-indigo-700">{s.id}</td>
                        <td className="p-3 border-r border-black font-black uppercase text-sm">{s.firstName} {s.lastName}</td>
                        <td className="p-3 border-r border-black text-center font-bold text-gray-500">{s.className}</td>
                        <td className="p-3 border-r border-black font-bold uppercase">{s.guardian}</td>
                        <td className="p-3 font-black text-emerald-700">{s.whatsapp}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div className="grid grid-cols-2 gap-40 pt-16 pb-10">
             <div className="text-center border-t border-black pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 italic">Prüfung Verwaltung</p>
                <div className="h-8"></div>
                <p className="text-[10px] font-bold border-t border-dotted border-black/20 pt-1">Unterschrift / Datum</p>
             </div>
             <div className="text-center border-t border-black pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 italic">Beglaubigung Schulleitung</p>
                <div className="h-8"></div>
                <p className="text-[11px] font-black uppercase pt-1">Sarfraz Azmat Butt</p>
             </div>
          </div>

          <div className="mt-auto pt-6 text-[8px] font-black text-gray-300 uppercase tracking-[0.5em] flex justify-between border-t border-dotted border-gray-200">
             <span>Digital Student Ledger &copy; 2026 • FISCAL VERIFIED</span>
             <div className="flex items-center gap-4">
                <ShieldCheck size={10} className="grayscale opacity-30" />
                <span>GEN-HASH: {genHash}</span>
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

export default StudentListPrintView;
