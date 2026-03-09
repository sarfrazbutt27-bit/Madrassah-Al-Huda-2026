
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, Book, CheckCircle2, AlertTriangle, XCircle, Clock, FileText, Hash } from 'lucide-react';
import { Student, HomeworkAssignment, HomeworkAttempt, User, HomeworkTeacherRating } from '../types';
import LogoIcon from './LogoIcon';

interface Props {
  students: Student[];
  homework: HomeworkAssignment[];
  attempts: HomeworkAttempt[];
  ratings: HomeworkTeacherRating[];
  users: User[];
}

const HomeworkPrintView: React.FC<Props> = ({ students, homework, attempts, ratings, users }) => {
  const { homeworkId } = useParams();
  const navigate = useNavigate();

  const currentHw = useMemo(() => homework.find(h => h.id === homeworkId), [homework, homeworkId]);
  const creator = useMemo(() => users.find(u => u.id === currentHw?.teacherId), [users, currentHw]);

  const classList = useMemo(() => {
    if (!currentHw) return [];
    return students
      .filter(s => s.className === currentHw.className && s.status === 'active')
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [students, currentHw]);

  const stats = useMemo(() => {
    if (!currentHw) return null;
    const relevantAttempts = attempts.filter(a => a.assignmentId === homeworkId);
    const completed = classList.filter(s => relevantAttempts.some(a => a.studentId === s.id && a.isPerfect)).length;
    const total = classList.length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    
    return { completed, total, rate };
  }, [currentHw, attempts, homeworkId, classList]);

  if (!currentHw) return <div className="p-20 text-center font-black uppercase">Bericht nicht gefunden</div>;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white pb-20">
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all"><ChevronLeft size={16} /> Zurück</button>
        <button onClick={() => window.print()} className="bg-emerald-500 text-white px-10 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-3 shadow-lg hover:scale-105 transition-all"><Printer size={20} /> Bericht als PDF drucken</button>
      </div>

      <div className="p-8 print:p-0 mx-auto w-full max-w-[210mm] text-black">
        <div className="bg-white p-12 print:p-8 shadow-2xl print:shadow-none min-h-[297mm] flex flex-col border border-gray-200 print:border-none font-sans relative overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-[4px] border-black pb-8 mb-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-black text-white rounded-2xl"><LogoIcon className="w-16 h-16" /></div>
              <div>
                <h1 className="text-4xl font-black uppercase italic leading-none">Madrassah Al-Huda</h1>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500 mt-2">Akademie-Leistungsnachweis • Hamburg</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-black text-white px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3 rounded-lg">Hausaufgabenbericht</div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">REF: {currentHw.id}</p>
            </div>
          </div>

          {/* Assignment Info Block */}
          <div className="grid grid-cols-3 gap-8 mb-12">
             <div className="col-span-2 space-y-6">
                <div>
                   <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Thema der Hausaufgabe</p>
                   <h2 className="text-3xl font-black italic uppercase text-madrassah-950 leading-tight">{currentHw.title}</h2>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-4">
                   <div>
                      <p className="text-[9px] font-black uppercase text-gray-400">Fachbereich</p>
                      <p className="text-lg font-bold text-indigo-700 uppercase italic">{currentHw.subject}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase text-gray-400">Klasse / Kurs</p>
                      <p className="text-lg font-bold text-indigo-950 uppercase italic">Klasse {currentHw.className}</p>
                   </div>
                </div>
             </div>
             <div className="bg-gray-50 border-2 border-black p-6 rounded-3xl text-center flex flex-col justify-center">
                <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Erledigungsquote</p>
                <p className="text-5xl font-black text-emerald-600 italic">{stats?.rate.toFixed(0)}%</p>
                <div className="w-full h-1 bg-gray-200 mt-4 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500" style={{ width: `${stats?.rate}%` }}></div>
                </div>
             </div>
          </div>

          {/* Instructions Summary */}
          <div className="mb-12 bg-gray-50/50 border border-gray-100 p-8 rounded-[2rem] italic">
             <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-black/10 pb-2"><Book size={14} /> Aufgabenstellung</h3>
             <p className="text-sm text-gray-700 leading-relaxed">Buch: {currentHw.bookUrl}</p>
             <p className="text-sm text-gray-700 leading-relaxed">Seiten: {currentHw.pagesFrom} bis {currentHw.pagesTo}</p>
          </div>

          {/* Submission List Table */}
          <section className="flex-1">
             <h3 className="text-[11px] font-black uppercase bg-gray-100 px-4 py-2 border-l-4 border-black italic mb-6 flex items-center gap-3">
                <FileText size={16}/> Abgabe-Protokoll (Klassenliste)
             </h3>
             <table className="w-full border-collapse border-2 border-black font-sans text-[10px]">
                <thead>
                   <tr className="bg-gray-50 uppercase font-black border-b-2 border-black text-gray-600">
                      <th className="p-3 text-left border-r border-black">Teilnehmer</th>
                      <th className="p-3 text-center border-r border-black">Abgabe am</th>
                      <th className="p-3 text-center border-r border-black">Status</th>
                      <th className="p-3 text-right pr-6">Bewertung</th>
                   </tr>
                </thead>
                <tbody>
                   {classList.map((student) => {
                      const studentAttempts = attempts.filter(a => a.assignmentId === homeworkId && a.studentId === student.id);
                      const bestAttempt = studentAttempts.sort((a, b) => b.scorePercent - a.scorePercent)[0];
                      const rating = ratings.find(r => r.assignmentId === homeworkId && r.studentId === student.id);
                      
                      return (
                        <tr key={student.id} className="border-b border-black/10 h-10 italic">
                           <td className="p-3 border-r border-black font-bold uppercase">{student.firstName} {student.lastName}</td>
                           <td className="p-3 border-r border-black text-center text-gray-500">
                              {bestAttempt?.completedAt ? new Date(bestAttempt.completedAt).toLocaleDateString('de-DE') : '---'}
                           </td>
                           <td className="p-3 border-r border-black text-center">
                              {bestAttempt?.isPerfect && <span className="text-emerald-700 font-black uppercase text-[8px] flex items-center justify-center gap-2"><CheckCircle2 size={10}/> 100% ERREICHT</span>}
                              {!bestAttempt?.isPerfect && bestAttempt && <span className="text-indigo-600 font-black uppercase text-[8px]">{bestAttempt.scorePercent}% SCORE</span>}
                              {!bestAttempt && <span className="text-red-500 font-black uppercase text-[8px] flex items-center justify-center gap-2"><XCircle size={10}/> FEHLT</span>}
                           </td>
                           <td className="p-3 text-right pr-6 font-black">
                              {rating?.rating || (studentAttempts.length > 0 ? `${studentAttempts.length} Versuche` : '---')}
                           </td>
                        </tr>
                      );
                   })}
                </tbody>
             </table>
          </section>

          {/* Footer / Signatures */}
          <div className="grid grid-cols-2 gap-32 pt-20 pb-10 mt-12">
             <div className="text-center border-t border-black pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Dozent / Fachbereich</p>
                <p className="text-xs font-bold uppercase italic">{creator?.name || 'Madrassah Dozent'}</p>
             </div>
             <div className="text-center border-t border-black pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Prüfung Schulleitung</p>
                <p className="text-xs font-bold uppercase italic">Sarfraz Azmat Butt</p>
             </div>
          </div>

          <div className="mt-auto pt-6 text-[8px] font-black text-gray-300 uppercase tracking-[0.5em] flex justify-between border-t border-dotted border-gray-200">
             <span>LMS Audit Module &copy; 2026 • OFFICIAL RECORD</span>
             <span className="flex items-center gap-2"><Hash size={10}/> {currentHw.id}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .shadow-2xl { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default HomeworkPrintView;
