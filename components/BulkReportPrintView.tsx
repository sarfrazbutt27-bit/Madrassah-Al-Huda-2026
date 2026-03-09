
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, Calendar } from 'lucide-react';
import { Student, Grade, ParticipationRecord } from '../types';
import LogoIcon from './LogoIcon';

interface BulkReportPrintViewProps {
  students: Student[];
  subjects: string[];
  grades: Grade[];
  participation: ParticipationRecord[];
}

const BulkReportPrintView: React.FC<BulkReportPrintViewProps> = ({ 
  students, subjects, grades, participation 
}) => {
  const { className, term } = useParams();
  const navigate = useNavigate();
  const reportType = term as 'Halbjahr' | 'Abschluss';

  const classStudents = useMemo(() => {
    return students
      .filter(s => s.className === className && s.status === 'active')
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [students, className]);

  const getPointsForTerm = (studentId: string, subj: string, t: 'Halbjahr' | 'Abschluss') => {
    const g = grades.find(g => g.studentId === studentId && g.term === t && g.subject === subj);
    return g ? g.points : 0;
  };

  const getGermanGrade = (points: number, max: number) => {
    if (points < 0) return "*";
    if (max === 0) return "-";
    const perc = (points / max) * 100;
    if (perc >= 92) return "1";
    if (perc >= 81) return "2";
    if (perc >= 67) return "3";
    if (perc >= 50) return "4";
    if (perc >= 30) return "5";
    return "6";
  };

  if (!classStudents.length) return <div className="p-20 text-center font-black uppercase">Keine Schüler in dieser Klasse gefunden.</div>;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white pb-20 font-sans">
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all">
              <ChevronLeft size={16} /> Zurück
           </button>
           <div>
              <h1 className="text-lg font-black uppercase italic leading-none">Klassen-Sammeldruck</h1>
              <p className="text-[10px] font-bold text-madrassah-300 uppercase mt-1">Klasse: {className} • {reportType}</p>
           </div>
        </div>
        <button onClick={() => window.print()} className="bg-emerald-500 text-white px-10 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-3 shadow-lg hover:scale-105 transition-all">
          <Printer size={20} /> Sammeldruck starten
        </button>
      </div>

      <div className="mx-auto w-full max-w-[210mm] print:max-w-none print:w-[210mm] text-black">
        
        {/* DECKBLATT FÜR DIE KLASSE */}
        <div className="bg-white p-[20mm] print:p-[15mm] border-[8px] border-black min-h-[297mm] flex flex-col justify-between page-break-after-always shadow-2xl print:shadow-none">
           <div className="flex flex-col items-center text-center space-y-10">
              <div className="p-8 bg-black text-white rounded-[3rem] shadow-2xl">
                 <LogoIcon className="w-32 h-32" />
              </div>
              <div className="space-y-4">
                 <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Madrassah Al-Huda</h1>
                 <p className="text-xl font-bold uppercase tracking-[0.5em] text-gray-500">Institut Hamburg</p>
              </div>
              <div className="w-32 h-2 bg-black rounded-full"></div>
           </div>

           <div className="bg-gray-50 p-16 rounded-[4rem] border-2 border-black text-center space-y-8">
              <h2 className="text-4xl font-black uppercase italic tracking-widest text-madrassah-950">Klassenregister</h2>
              <div className="grid grid-cols-2 gap-10">
                 <div className="p-6 bg-white rounded-3xl border border-black/10">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Klasse</p>
                    <p className="text-5xl font-black italic">{className}</p>
                 </div>
                 <div className="p-6 bg-white rounded-3xl border border-black/10">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Abschlussberichte</p>
                    <p className="text-5xl font-black italic">{classStudents.length}</p>
                 </div>
              </div>
              <div className="p-6 bg-indigo-950 text-white rounded-3xl shadow-xl flex items-center justify-center gap-4">
                 <Calendar size={24} />
                 <p className="text-xl font-black uppercase italic">{reportType} • Schuljahr 2025/2026</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-40 pt-20">
              <div className="text-center border-t-2 border-black pt-4">
                 <p className="text-xs font-black uppercase tracking-widest italic">Dozent / Prüfer</p>
              </div>
              <div className="text-center border-t-2 border-black pt-4">
                 <p className="text-xs font-black uppercase tracking-widest italic">Institutsleitung</p>
              </div>
           </div>
        </div>

        {/* INDIVIDUELLE ZEUGNISSE */}
        {classStudents.map((student) => {
          const currentParticipation = participation.find(p => p.studentId === student.id && p.term === reportType) || {
            studentId: student.id,
            term: reportType,
            verhalten: 'Sehr gut', 
            vortrag: 'Sehr gut',
            puenktlichkeit: 'Sehr gut', 
            zusatzpunkte: 0,
            remarks: 'Der Teilnehmer zeigt stetiges Engagement und eine vorbildliche Akhlaq im Unterricht.'
          };

          return (
            <div key={student.id} className="bg-white p-[15mm] print:p-[10mm] border-[6px] border-black relative min-h-[297mm] flex flex-col page-break-before-always shadow-2xl print:shadow-none">
              <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center pointer-events-none">
                 <LogoIcon className="w-[160mm] h-[160mm]" />
              </div>

              <div className="border-[2px] border-black p-8 print:p-6 flex-1 flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
                  <div className="w-16 h-16 bg-black text-white p-2 rounded-xl"><LogoIcon className="w-full h-full" /></div>
                  <div className="text-right flex-1 pr-4 font-serif">
                    <div className="text-2xl font-bold uppercase leading-none">مدرسة الهدى</div>
                    <div className="text-lg font-bold uppercase tracking-widest">MADRASSAH AL HUDA</div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-gray-500">Akademie Hamburg</p>
                  </div>
                </div>

                <h1 className="text-center text-3xl font-black mb-8 italic uppercase tracking-tighter underline underline-offset-8">
                  {reportType === 'Halbjahr' ? 'Halbjahres-Zeugnis' : 'Akademisches Jahreszeugnis'}
                </h1>

                <div className="grid grid-cols-2 border border-black mb-6 font-sans">
                  <div className="border-r border-b border-black p-4 bg-gray-50/20">
                    <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Teilnehmer</p>
                    <p className="font-black text-xl uppercase italic leading-none">{student.firstName} {student.lastName}</p>
                  </div>
                  <div className="border-b border-black p-4">
                    <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Klasse</p>
                    <p className="font-black text-xl uppercase tracking-widest leading-none">{student.className}</p>
                  </div>
                  <div className="p-3 border-r border-black flex justify-between items-center text-[9px] font-bold">
                    <span>GEB-DATUM: {new Date(student.birthDate).toLocaleDateString('de-DE')}</span>
                  </div>
                  <div className="p-3 text-[9px] font-black text-indigo-700 italic">OFFIZIELLE ABSCHRIFT</div>
                </div>

                <div className="mb-6 border border-black overflow-hidden rounded-lg">
                   <table className="w-full text-sm border-collapse">
                      <thead>
                         <tr className="bg-gray-100 border-b border-black text-[8px] uppercase font-black">
                            <th className="p-2 text-left border-r border-black italic">Fachbereich</th>
                            <th className="p-2 text-center border-r border-black">Punkte</th>
                            <th className="p-2 text-right pr-6">Note</th>
                         </tr>
                      </thead>
                      <tbody>
                        {subjects.map(subj => {
                          const ptsH = getPointsForTerm(student.id, subj, 'Halbjahr');
                          const ptsA = getPointsForTerm(student.id, subj, 'Abschluss');
                          
                          let totalPoints: number | string;
                          let maxPossible: number;

                          if (reportType === 'Halbjahr') {
                            totalPoints = ptsH;
                            maxPossible = 20;
                          } else {
                            if (ptsH === -1 && ptsA === -1) {
                              totalPoints = -1;
                            } else {
                              totalPoints = (ptsH === -1 ? 0 : ptsH) + (ptsA === -1 ? 0 : ptsA);
                            }
                            maxPossible = 40;
                          }

                          return (
                            <tr key={subj} className="border-b border-black last:border-0 h-10">
                              <td className="border-r border-black p-2 font-bold uppercase italic text-[11px]">{subj}</td>
                              <td className="border-r border-black p-2 text-center font-black text-lg">
                                 {totalPoints === -1 ? '*' : totalPoints} <span className="text-[10px] text-gray-300">/ {maxPossible}</span>
                              </td>
                              <td className="p-2 text-right pr-6 font-black text-lg italic">
                                 {getGermanGrade(typeof totalPoints === 'number' ? totalPoints : 0, maxPossible)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                   </table>
                </div>

                <div className="mb-6 border border-black overflow-hidden rounded-lg bg-gray-50/30">
                   <div className="p-4 grid grid-cols-3 gap-4 font-sans text-center">
                      <div><span className="text-[7px] font-black uppercase text-gray-400 block mb-0.5">Verhalten</span><span className="font-black text-xs uppercase italic">{currentParticipation.verhalten}</span></div>
                      <div className="border-x border-black/10"><span className="text-[7px] font-black uppercase text-gray-400 block mb-0.5">Pünktlichkeit</span><span className="font-black text-xs uppercase italic">{currentParticipation.puenktlichkeit}</span></div>
                      <div><span className="text-[7px] font-black uppercase text-gray-400 block mb-0.5">Mitarbeit</span><span className="font-black text-xs uppercase italic">{currentParticipation.vortrag}</span></div>
                   </div>
                </div>

                <div className="border border-black mb-8 flex-1 flex flex-col rounded-lg overflow-hidden min-h-[100px]">
                   <div className="bg-gray-100 border-b border-black px-4 py-1.5 font-black uppercase text-[8px] tracking-widest">Gutachten</div>
                   <div className="p-5 flex-1 italic leading-relaxed text-lg font-serif text-gray-800 bg-white">
                      "{currentParticipation.remarks}"
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-32 pt-8 mt-auto">
                   <div className="text-center border-t border-black pt-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Institutsleitung</p>
                   </div>
                   <div className="text-center border-t border-black pt-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Datum</p>
                   </div>
                </div>

                <div className="mt-4 pt-4 border-t border-dotted border-gray-200 flex justify-between items-center text-[6px] font-black text-gray-300 uppercase tracking-[0.4em]">
                   <span>Digital Audit &copy; 2026</span>
                   <span>ID: {student.id}-{reportType === 'Halbjahr' ? 'H1' : 'FY'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break-after-always { page-break-after: always; }
          .page-break-before-always { page-break-before: always; }
        }
      `}</style>
    </div>
  );
};

export default BulkReportPrintView;
