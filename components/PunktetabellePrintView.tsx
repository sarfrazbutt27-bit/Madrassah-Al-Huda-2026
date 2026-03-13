
import React, { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Printer, ChevronLeft, ShieldCheck } from 'lucide-react';
import { Student, Grade, ClassConfig, User } from '../types';
import LogoIcon from './LogoIcon';

interface Props {
  students: Student[];
  grades: Grade[];
  classConfigs: ClassConfig[];
  user: User;
}

const PunktetabellePrintView: React.FC<Props> = ({ students, grades, classConfigs, user }) => {
  const { className, term } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const reportType = term as 'Halbjahr' | 'Abschluss';

  const classStudents = useMemo(() => {
    return students
      .filter(s => s.className === className && s.status === 'active')
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [students, className]);

  const config = useMemo(() => {
    return classConfigs.find(c => c.className === className);
  }, [classConfigs, className]);

  const activeSubjects = useMemo(() => {
    if (config && config.selectedSubjects && config.selectedSubjects.length > 0) {
      return config.selectedSubjects;
    }
    // Default fallback if none selected
    return ['Yassarnal Quran', 'Tajweed', 'Hifz', 'Fiqh', 'Sierah', 'Akhlaq'];
  }, [config]);

  const getPoints = (studentId: string, subject: string) => {
    return grades.find(g => g.studentId === studentId && g.term === reportType && g.subject === subject)?.points || 0;
  };

  if (!classStudents.length) return <div className="p-20 text-center font-black uppercase">Keine Daten für diese Klasse gefunden.</div>;

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white pb-20 font-sans">
      {/* Control Bar */}
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all">
              <ChevronLeft size={16} /> Zurück
           </button>
           <div>
              <h1 className="text-lg font-black uppercase italic leading-none text-yellow-400">Punktetabelle Druckansicht</h1>
              <p className="text-[10px] font-bold text-white/50 uppercase mt-1">Klasse: {className} • Zeitraum: {reportType}</p>
           </div>
        </div>
        <div className="flex gap-4">
           <button onClick={() => window.print()} className="bg-emerald-500 text-white px-10 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-3 shadow-lg hover:scale-105 transition-all">
             <Printer size={20} /> Tabelle drucken
           </button>
        </div>
      </div>

      <div className="p-8 print:p-0 mx-auto w-full max-w-[210mm] text-black">
        <div className="bg-white p-12 print:p-8 shadow-2xl print:shadow-none min-h-[297mm] flex flex-col border border-gray-200 print:border-none relative">
          
          {/* Header matching the image style */}
          <div className="flex justify-between items-center mb-12">
             <div className="w-16 h-16 bg-indigo-950 text-white rounded-2xl flex items-center justify-center p-2">
                <LogoIcon className="w-full h-full" />
             </div>
             <h1 className="text-5xl font-serif italic font-black text-indigo-950">Punktetabelle</h1>
             <div className="w-16"></div> {/* Spacer */}
          </div>

          <div className="grid grid-cols-2 gap-12 mb-10 text-xl">
             <div className="flex items-baseline gap-4 border-b-2 border-gray-300 pb-2">
                <span className="font-black uppercase text-sm text-gray-400">Klasse:</span>
                <span className="font-bold italic">{className}</span>
             </div>
             <div className="flex items-baseline gap-4 border-b-2 border-gray-300 pb-2">
                <span className="font-black uppercase text-sm text-gray-400">Prüfer:</span>
                <span className="font-bold italic">{user.name}</span>
             </div>
          </div>

          {/* Table */}
          <div className="flex-1 border-2 border-indigo-950 rounded-xl overflow-hidden mb-12">
             <table className="w-full border-collapse text-sm">
                <thead>
                   <tr className="bg-indigo-950 text-white uppercase font-black h-16">
                      <th className="p-4 text-left border-r border-white/20">Name</th>
                      {activeSubjects.map(s => (
                        <th key={s} className="p-2 text-center border-r border-white/20 text-[10px] tracking-tighter">
                           {s}
                        </th>
                      ))}
                      <th className="p-4 text-center bg-indigo-900">Gesamt</th>
                   </tr>
                </thead>
                <tbody>
                   {classStudents.map((student, idx) => {
                      const totalPoints = activeSubjects.reduce((sum, s) => {
                        const p = getPoints(student.id, s);
                        return sum + (p === -1 ? 0 : p);
                      }, 0);
                      
                      return (
                        <tr key={student.id} className={`border-b border-gray-200 h-12 italic ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                           <td className="p-4 border-r border-gray-200 font-bold text-indigo-950">{student.firstName} {student.lastName}</td>
                           {activeSubjects.map(s => {
                              const p = getPoints(student.id, s);
                              return (
                                <td key={s} className="p-4 text-center border-r border-gray-200 font-medium">
                                   {p === 0 ? '' : (p === -1 ? '*' : p)}
                                </td>
                              );
                           })}
                           <td className="p-4 text-center font-black text-lg bg-indigo-50/30">
                              {totalPoints}
                           </td>
                        </tr>
                      );
                   })}
                   {/* Fill empty rows to make it look like a full page if needed */}
                   {Array.from({ length: Math.max(0, 15 - classStudents.length) }).map((_, i) => (
                     <tr key={`empty-${i}`} className="border-b border-gray-200 h-12">
                        <td className="p-4 border-r border-gray-200"></td>
                        {activeSubjects.map(s => <td key={s} className="p-4 border-r border-gray-200"></td>)}
                        <td className="p-4"></td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {/* Footer matching the image style */}
          <div className="grid grid-cols-2 gap-20 pt-10 pb-8 mt-auto">
             <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-4">
                   <span className="font-black uppercase text-xs text-gray-400">Unterschrift:</span>
                   <div className="flex-1 border-b-2 border-gray-300 h-8"></div>
                </div>
             </div>
             <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-4">
                   <span className="font-black uppercase text-xs text-gray-400">Datum:</span>
                   <div className="flex-1 border-b-2 border-gray-300 h-8 font-bold italic pl-4">
                      {new Date().toLocaleDateString('de-DE')}
                   </div>
                </div>
             </div>
          </div>

          {/* System Footer Area */}
          <div className="mt-8 pt-6 text-[7px] font-black text-gray-300 uppercase tracking-[0.6em] flex justify-between border-t border-dotted border-gray-200">
             <span>Digital Grade Registry &copy; 2026 • Madrassah Al-Huda Automation</span>
             <div className="flex items-center gap-4">
                <span>REF: {className}-{reportType}-PUNKT-{new Date().getTime()}</span>
                <ShieldCheck size={10} className="grayscale opacity-30" />
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
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

export default PunktetabellePrintView;
