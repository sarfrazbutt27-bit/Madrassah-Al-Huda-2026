
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Printer, ChevronLeft, FileText } from 'lucide-react';
import { Student, Attendance } from '../types';
import LogoIcon from './LogoIcon';

interface AttendancePrintViewProps {
  students: Student[];
  attendance: Attendance[];
}

const AttendancePrintView: React.FC<AttendancePrintViewProps> = ({ students, attendance }) => {
  const { className, month, year } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [printMode, setPrintMode] = useState<'data' | 'empty'>('data');
  const [model, setModel] = useState<'Weekend' | 'Weekday'>((searchParams.get('model') as any) || 'Weekend');
  
  const m = parseInt(month || String(new Date().getMonth() + 1));
  const y = parseInt(year || String(new Date().getFullYear()));
  
  const monthName = new Date(y, m - 1, 1).toLocaleString('de-DE', { month: 'long' });
  
  const filteredDays = useMemo(() => {
    const daysInMonthCount = new Date(y, m, 0).getDate();
    const result: number[] = [];
    for (let i = 1; i <= daysInMonthCount; i++) {
      const date = new Date(y, m - 1, i);
      const day = date.getDay(); 
      if (model === 'Weekend') {
        if (day === 0 || day === 6) result.push(i);
      } else {
        if (day >= 1 && day <= 4) result.push(i);
      }
    }
    return result;
  }, [y, m, model]);

  const classesToPrint = useMemo(() => {
    const uniqueClasses = Array.from(new Set(students.map(s => s.className))).sort();
    if (className !== 'Gesamt' && className !== 'Alle') {
      return [className];
    }
    return uniqueClasses;
  }, [students, className]);

  const getStatusForDay = (studentId: string, day: number) => {
    if (printMode === 'empty') return null;
    const dateString = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = attendance.find(a => a.studentId === studentId && a.date === dateString);
    return record?.status;
  };

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white pb-10">
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all">
              <ChevronLeft size={16} /> Zurück
           </button>
           <h1 className="text-lg font-black uppercase italic leading-none text-yellow-400">Präsenz-Register Druckmodul</h1>
        </div>
        
        <div className="flex gap-4">
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
             <button onClick={() => setModel('Weekend')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${model === 'Weekend' ? 'bg-white text-madrassah-950 shadow-md' : 'text-white/50'}`}>Wochenende</button>
             <button onClick={() => setModel('Weekday')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${model === 'Weekday' ? 'bg-white text-madrassah-950 shadow-md' : 'text-white/50'}`}>Wochentage</button>
          </div>
          
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
            <button onClick={() => setPrintMode('data')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${printMode === 'data' ? 'bg-white text-madrassah-950' : 'text-white/50'}`}>Daten</button>
            <button onClick={() => setPrintMode('empty')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${printMode === 'empty' ? 'bg-white text-madrassah-950' : 'text-white/50'}`}>Blanko</button>
          </div>
          
          <button onClick={() => window.print()} className="bg-emerald-500 text-white px-8 py-2 rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-lg hover:bg-emerald-600 transition-all"><Printer size={18} /> Liste drucken (PDF)</button>
        </div>
      </div>

      <div className="p-8 print:p-0 font-sans text-black mx-auto w-full max-w-[297mm]">
        {classesToPrint.map((currentClassName, classIdx) => {
          const classStudents = students
            .filter(s => {
              const matchesClass = s.className === currentClassName;
              const isWeekendStudent = s.lessonTimes?.includes('Sa & So');
              const isWeekdayStudent = s.lessonTimes?.includes('MO, Di, Mi, Do');
              const matchesModel = model === 'Weekend' ? isWeekendStudent : isWeekdayStudent;
              return s.status === 'active' && matchesClass && matchesModel;
            })
            .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));

          if (classStudents.length === 0 && className !== 'Alle' && className !== 'Gesamt') return null;
          if (classStudents.length === 0) return null;

          return (
            <div key={currentClassName} className={`bg-white p-12 print:p-8 shadow-2xl print:shadow-none border border-gray-200 print:border-none rounded-[3rem] print:rounded-none flex flex-col mb-20 print:mb-0 ${classIdx < classesToPrint.length - 1 ? 'page-break-after-always' : ''}`}>
              <div className="flex justify-between items-start border-b-[4px] border-black pb-6 mb-8">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-black text-white rounded-2xl shadow-xl"><LogoIcon className="w-12 h-12" /></div>
                  <div>
                    <h1 className="text-3xl font-black uppercase italic leading-none tracking-tighter">Madrassah Al-Huda Hamburg</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500 mt-2">Offizielles Präsenz-Register • Akademisches Jahr 2025/2026</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="bg-madrassah-950 text-white px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3 rounded-lg">KLASSE: {currentClassName}</div>
                  <p className="text-lg font-black italic">{monthName} {y} • MODELL: {model === 'Weekend' ? 'SA/SO' : 'MO-DO'}</p>
                </div>
              </div>

              <div className="border-2 border-black rounded-xl overflow-hidden flex-1 bg-white mb-10 shadow-sm">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black h-16">
                      <th className="p-3 w-56 border-r-2 border-black text-[9px] font-black uppercase italic">Teilnehmer Name & Kontakt</th>
                      {filteredDays.map(day => (
                        <th key={day} className="p-0 text-center border-r border-black text-[8px] font-black bg-white group overflow-hidden">
                          <div className="text-[7px] opacity-40 uppercase tracking-tighter bg-gray-50 py-1">{new Date(y, m-1, day).toLocaleString('de-DE', {weekday: 'short'}).charAt(0)}</div>
                          <div className="text-lg font-serif italic py-1">{day}</div>
                        </th>
                      ))}
                      <th className="p-1 w-14 text-center border-l-2 border-black text-[8px] font-black uppercase bg-madrassah-950 text-white italic">Σ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student, idx) => {
                      let presentCount = 0;
                      return (
                        <tr key={student.id} className={`border-b border-gray-200 h-10 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-4 py-1 border-r-2 border-black flex flex-col justify-center">
                             <span className="font-black uppercase text-[10px] truncate italic tracking-tighter leading-tight">
                                {student.lastName}, {student.firstName}
                             </span>
                             <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                {student.whatsapp || '---'}
                             </span>
                          </td>
                          {filteredDays.map(day => {
                            const status = getStatusForDay(student.id, day);
                            if (status === 'present') presentCount++;
                            return (
                              <td key={day} className="text-center border-r border-black font-black text-xl leading-none">
                                {status === 'present' && <span className="text-emerald-700">✓</span>}
                                {status === 'absent' && <span className="text-red-700 opacity-30">×</span>}
                                {status === 'excused' && <span className="text-amber-500 text-sm">E</span>}
                              </td>
                            );
                          })}
                          <td className="text-center font-black text-sm border-l-2 border-black bg-gray-100 italic">{presentCount || ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-40 mt-auto pt-10 pb-6">
                 <div className="text-center">
                    <div className="h-[1px] bg-black w-full mb-3"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-madrassah-950">Unterschrift Dozent/in</p>
                 </div>
                 <div className="text-center">
                    <div className="h-[1px] bg-black w-full mb-3"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-madrassah-950">Prüfung Schulleitung</p>
                 </div>
              </div>

              <div className="pt-6 border-t border-dotted border-gray-200 text-[8px] font-black text-gray-300 uppercase flex justify-between tracking-[0.4em]">
                 <span className="flex items-center gap-2 italic"><FileText size={10}/> Madrassah Audit Log v6.5 • Export: {model}</span>
                 <span>ID: AT-PRINT-{currentClassName}-{m}-{y}</span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .page-break-after-always { page-break-after: always !important; }
          .shadow-2xl { box-shadow: none !important; }
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>
    </div>
  );
};

export default AttendancePrintView;
