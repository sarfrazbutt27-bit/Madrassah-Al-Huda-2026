
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, ShieldCheck } from 'lucide-react';
import { Student, Grade, ClassConfig } from '../types';
import LogoIcon from './LogoIcon';

interface Props {
  students: Student[];
  grades: Grade[];
  subjects: string[];
  classConfigs: ClassConfig[];
}

const ClassGradeRegisterPrintView: React.FC<Props> = ({ students, grades, subjects, classConfigs }) => {
  const { className, term } = useParams();
  const navigate = useNavigate();
  const reportType = term as 'Halbjahr' | 'Abschluss';

  const classStudents = useMemo(() => {
    return students
      .filter(s => s.className === className && s.status === 'active')
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [students, className]);

  const activeSubjects = useMemo(() => {
    const config = classConfigs.find(c => c.className === className);
    if (config && config.selectedSubjects && config.selectedSubjects.length > 0) {
      return config.selectedSubjects;
    }
    return subjects;
  }, [subjects, className, classConfigs]);

  const getPoints = (studentId: string, subject: string) => {
    return grades.find(g => g.studentId === studentId && g.term === reportType && g.subject === subject)?.points || 0;
  };

  const getGermanGrade = (points: number, max: number) => {
    if (max === 0) return "-";
    const perc = (points / max) * 100;
    if (perc >= 92) return "1";
    if (perc >= 81) return "2";
    if (perc >= 67) return "3";
    if (perc >= 50) return "4";
    if (perc >= 30) return "5";
    return "6";
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
              <h1 className="text-lg font-black uppercase italic leading-none text-yellow-400">Nummerierter Dienstbericht (Notenliste)</h1>
              <p className="text-[10px] font-bold text-white/50 uppercase mt-1">Klasse: {className} • Zeitraum: {reportType}</p>
           </div>
        </div>
        <div className="flex gap-4">
           <button onClick={() => window.print()} className="bg-emerald-500 text-white px-10 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-3 shadow-lg hover:scale-105 transition-all">
             <Printer size={20} /> Register drucken / PDF speichern
           </button>
        </div>
      </div>

      <div className="p-8 print:p-0 mx-auto w-full max-w-[297mm] text-black">
        <div className="bg-white p-10 print:p-6 shadow-2xl print:shadow-none min-h-[210mm] flex flex-col border border-gray-200 print:border-none relative">
          
          {/* Official Document Header */}
          <div className="flex justify-between items-start border-b-[3px] border-black pb-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="p-3 bg-black text-white rounded-2xl"><LogoIcon className="w-12 h-12" /></div>
              <div>
                <h1 className="text-3xl font-black uppercase italic leading-none tracking-tighter">Madrassah Al-Huda Hamburg</h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500 mt-2">Akademisches Klassenregister • Internes Prüfungsdokument</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-madrassah-950 text-white px-4 py-1.5 text-[9px] font-black uppercase rounded-lg mb-2">OFFIZIELLES REGISTER</div>
              <p className="text-xl font-black italic uppercase tracking-widest leading-none">KLASSE: {className}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{reportType} Schuljahr 2025/2026</p>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-4 gap-4 mb-8 no-print">
             <div className="bg-gray-50 p-4 rounded-2xl border border-black/10 flex flex-col items-center">
                <span className="text-[8px] font-black uppercase text-gray-400">Schüler</span>
                <span className="text-2xl font-black">{classStudents.length}</span>
             </div>
             <div className="bg-gray-50 p-4 rounded-2xl border border-black/10 flex flex-col items-center">
                <span className="text-[8px] font-black uppercase text-gray-400">Soll-Fächer</span>
                <span className="text-2xl font-black">{activeSubjects.length}</span>
             </div>
             <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center">
                <span className="text-[8px] font-black uppercase text-emerald-600">Status</span>
                <span className="text-xs font-black uppercase italic text-emerald-700 mt-2">Abgeschlossen</span>
             </div>
             <div className="bg-indigo-950 p-4 rounded-2xl border border-black/10 flex flex-col items-center text-white">
                <span className="text-[8px] font-black uppercase text-white/50">Druckdatum</span>
                <span className="text-xs font-black italic mt-2">{new Date().toLocaleDateString('de-DE')}</span>
             </div>
          </div>

          {/* MAIN GRADE LIST TABLE */}
          <div className="flex-1 border-2 border-black rounded-lg overflow-hidden mb-12">
             <table className="w-full border-collapse text-[10px]">
                <thead>
                   <tr className="bg-gray-100 uppercase font-black border-b-2 border-black h-20">
                      <th className="p-3 text-center border-r border-black w-12 italic">Nr.</th>
                      <th className="p-3 text-left border-r border-black w-24">System-ID</th>
                      <th className="p-3 text-left border-r border-black">Vollständiger Name</th>
                      {activeSubjects.map(s => (
                        <th key={s} className="p-2 text-center border-r border-black h-24 bg-gray-50/50">
                           <div className="origin-bottom-left rotate-[-45deg] whitespace-nowrap w-4 mb-2">{s}</div>
                        </th>
                      ))}
                      <th className="p-3 text-center border-r border-black bg-indigo-50 w-20">Summe (Σ)</th>
                      <th className="p-3 text-center bg-madrassah-950 text-white w-16">Note</th>
                   </tr>
                </thead>
                <tbody>
                   {classStudents.map((student, idx) => {
                      const totalPoints = activeSubjects.reduce((sum, s) => sum + getPoints(student.id, s), 0);
                      const maxPossible = reportType === 'Halbjahr' ? (activeSubjects.length * 20) : (activeSubjects.length * 40);
                      const grade = getGermanGrade(totalPoints, maxPossible);
                      
                      return (
                        <tr key={student.id} className={`border-b border-black/10 h-10 italic ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                           <td className="p-3 text-center border-r border-black font-black text-gray-400">{idx + 1}.</td>
                           <td className="p-3 border-r border-black font-mono font-bold text-indigo-700">{student.id}</td>
                           <td className="p-3 border-r border-black font-black uppercase tracking-tight">{student.firstName} {student.lastName}</td>
                           {activeSubjects.map(s => {
                              const p = getPoints(student.id, s);
                              return (
                                <td key={s} className={`p-3 text-center border-r border-black font-bold text-sm ${p === 0 ? 'text-gray-200' : 'text-black'}`}>
                                   {p || '-'}
                                </td>
                              );
                           })}
                           <td className="p-3 text-center border-r border-black font-black text-lg bg-indigo-50/50">
                              {totalPoints}
                           </td>
                           <td className="p-3 text-center font-black text-lg text-madrassah-950 bg-gray-100">
                              {grade}
                           </td>
                        </tr>
                      );
                   })}
                </tbody>
             </table>
          </div>

          {/* Verification & Signatures */}
          <div className="grid grid-cols-3 gap-20 pt-10 pb-8 mt-auto">
             <div className="text-center border-t border-black pt-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Dozent / Kursleiter</p>
                <div className="h-10"></div>
                <p className="text-[10px] font-bold border-t border-dotted border-black/20 pt-1">Unterschrift</p>
             </div>
             <div className="text-center border-t border-black pt-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Prüfung & Audit</p>
                <div className="h-10 flex items-center justify-center italic text-[8px] text-emerald-600 font-black uppercase tracking-[0.2em]">VERIFIZIERT ✓</div>
                <p className="text-[10px] font-bold border-t border-dotted border-black/20 pt-1">Digitaler Check</p>
             </div>
             <div className="text-center border-t border-black pt-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Institutsleitung</p>
                <div className="h-10"></div>
                <p className="text-[10px] font-bold border-t border-dotted border-black/20 pt-1">Sarfraz Azmat Butt</p>
             </div>
          </div>

          {/* System Footer Area */}
          <div className="mt-8 pt-6 text-[7px] font-black text-gray-300 uppercase tracking-[0.6em] flex justify-between border-t border-dotted border-gray-200">
             <span>Digital Grade Registry &copy; 2026 • Madrassah Al-Huda Automation</span>
             <div className="flex items-center gap-4">
                <span>REF: {className}-{reportType}-REG-{new Date().getTime()}</span>
                <ShieldCheck size={10} className="grayscale opacity-30" />
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

export default ClassGradeRegisterPrintView;
