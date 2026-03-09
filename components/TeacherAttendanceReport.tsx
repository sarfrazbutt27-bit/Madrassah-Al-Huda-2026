
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Printer, 
  ChevronLeft, 
  UserCheck, 
  CheckCircle, 
  XCircle,
  Phone,
  TrendingUp,
  Award,
  Users,
  CheckSquare,
  Square,
  UserPlus,
  Info,
  CalendarDays,
  Sparkles,
  Calendar,
  Check,
  X,
  UserCheck2,
  Clock,
  HelpCircle,
  AlertCircle,
  Activity,
  BarChart3,
  Layers
} from 'lucide-react';
import { User, UserRole, TeacherAttendance } from '../types';
import LogoIcon from './LogoIcon';

interface TeacherAttendanceReportProps {
  user: User;
  users: User[];
  teacherAttendance: TeacherAttendance[];
}

const TeacherAttendanceReport: React.FC<TeacherAttendanceReportProps> = ({ user, users, teacherAttendance }) => {
  const navigate = useNavigate();
  const isPrincipal = user.role === UserRole.PRINCIPAL;
  const teachers = users.filter(u => u.role === UserRole.TEACHER);
  
  const initialSelection = isPrincipal 
    ? (teachers.length > 0 ? [teachers[0].id] : []) 
    : [user.id];

  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>(initialSelection);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);
  const [isMultiMode, setIsMultiMode] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => ({
    val: i + 1,
    name: new Date(0, i).toLocaleString('de-DE', { month: 'long' })
  }));

  const selectFullYear = () => {
    setStartMonth(1);
    setEndMonth(12);
  };

  const getAttendanceForTeacherAndMonth = (teacherId: string, month: number) => {
    return teacherAttendance.filter(ta => {
      const date = new Date(ta.date);
      return (
        ta.userId === teacherId &&
        date.getFullYear() === selectedYear &&
        date.getMonth() + 1 === month
      );
    });
  };

  const calculateStats = (teacherId: string, month: number) => {
    const records = getAttendanceForTeacherAndMonth(teacherId, month);
    const present = records.filter(r => r.status === 'present').length;
    const substituted = records.filter(r => r.status === 'substituted').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const total = records.length;
    const percentage = total > 0 ? Math.round(((present + substituted) / total) * 100) : 0;
    return { present, substituted, absent, total, percentage };
  };

  const getStatusColor = (percentage: number, hasRecords: boolean) => {
    if (!hasRecords) return 'bg-gray-100 text-gray-400';
    if (percentage >= 90) return 'bg-emerald-500 text-white';
    if (percentage >= 70) return 'bg-amber-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 print:pb-0 print:space-y-0">
      <div className="no-print bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
             <button onClick={() => navigate(-1)} className="p-4 text-madrassah-950 bg-gray-50 hover:bg-white rounded-2xl border border-gray-100 shadow-sm transition-all group">
               <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
             </button>
             <div>
                <h2 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter">Dienstbericht Konfiguration</h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Status & Export-Einstellungen</p>
             </div>
          </div>
          
          <div className="flex gap-4">
            {isPrincipal && (
              <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner">
                <button onClick={() => setIsMultiMode(false)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isMultiMode ? 'bg-madrassah-950 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>Einzeln</button>
                <button onClick={() => setIsMultiMode(true)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isMultiMode ? 'bg-madrassah-950 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>Sammel</button>
              </div>
            )}

            <button onClick={() => window.print()} disabled={selectedTeacherIds.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-30 transition-all hover:-translate-y-1 active:scale-95">
              <Printer size={20} /> Bericht drucken / PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end border-t border-gray-50 pt-10">
          {isPrincipal ? (
            <div className="lg:col-span-5 space-y-4">
              <label className="text-[11px] font-black uppercase text-madrassah-950 tracking-widest ml-1 flex items-center gap-2">
                <Users size={16} /> Lehrkräfte Auswahl
              </label>
              <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto p-5 bg-gray-50 rounded-3xl border border-gray-100 shadow-inner custom-scrollbar">
                {teachers.map(t => (
                  <button key={t.id} onClick={() => setSelectedTeacherIds(prev => prev.includes(t.id) ? (prev.length > 1 ? prev.filter(id => id !== t.id) : prev) : [...prev, t.id])} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${selectedTeacherIds.includes(t.id) ? 'bg-madrassah-950 text-white border-madrassah-900 shadow-md scale-[1.02]' : 'bg-white text-gray-400 border-gray-100 hover:border-madrassah-200'}`}>
                    {selectedTeacherIds.includes(t.id) ? <CheckSquare size={16} /> : <Square size={16} />} <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-5 bg-madrassah-50 p-8 rounded-[2.5rem] border border-madrassah-100 flex items-center gap-8 shadow-inner">
               <div className="w-20 h-20 bg-madrassah-950 text-white rounded-3xl flex items-center justify-center font-black text-2xl shadow-2xl rotate-3">{user.name?.charAt(0) || '?'}</div>
               <div>
                  <h4 className="text-2xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">{user.name}</h4>
                  <p className="text-[10px] font-bold text-madrassah-400 uppercase tracking-widest mt-2">Personal-Akte: {user.id}</p>
               </div>
            </div>
          )}

          <div className="lg:col-span-7 space-y-8">
             <div className="grid grid-cols-3 gap-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Berichtsjahr</label>
                   <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full px-5 py-4.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-madrassah-950 outline-none cursor-pointer focus:bg-white transition-all shadow-sm">
                       {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Von Monat</label>
                   <select value={startMonth} onChange={(e) => setStartMonth(parseInt(e.target.value))} className="w-full px-5 py-4.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-madrassah-950 outline-none cursor-pointer focus:bg-white transition-all shadow-sm">
                       {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Bis Monat</label>
                   <select value={endMonth} onChange={(e) => setEndMonth(parseInt(e.target.value))} className="w-full px-5 py-4.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-madrassah-950 outline-none cursor-pointer focus:bg-white transition-all shadow-sm">
                       {months.filter(m => m.val >= startMonth).map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                   </select>
                </div>
             </div>
             <button onClick={selectFullYear} className="w-full bg-white text-madrassah-950 py-4.5 rounded-2xl border-2 border-dashed border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-madrassah-950 hover:text-white hover:border-madrassah-950 transition-all flex items-center justify-center gap-4">
                <CalendarDays size={18} /> Gesamtes Kalenderjahr (12 Monate)
             </button>
          </div>
        </div>
      </div>

      {/* Report Pages */}
      <div className="print-area space-y-16 print:space-y-0">
        {selectedTeacherIds.map((teacherId) => {
          const teacher = users.find(t => t.id === teacherId);
          if (!teacher) return null;

          return (
            <div key={teacherId} className="report-page bg-white p-12 print:p-8 shadow-2xl print:shadow-none border border-gray-100 print:border-none rounded-[3rem] print:rounded-none font-sans overflow-hidden page-break-after-always relative min-h-[290mm] print:min-h-[270mm] flex flex-col">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b-[6px] border-black pb-10 print:pb-6 mb-12 print:mb-8">
                <div className="flex items-center gap-8 print:gap-4">
                  <div className="p-5 print:p-3 bg-black text-white rounded-[2rem] print:rounded-xl">
                    <LogoIcon className="w-16 h-16 print:w-10 print:h-10" />
                  </div>
                  <div>
                    <h1 className="text-4xl print:text-2xl font-black uppercase tracking-tighter leading-none italic">Madrassah Al-Huda Hamburg</h1>
                    <p className="text-sm print:text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500 mt-3 print:mt-1">Offizieller Dienstbericht & Präsenz-Nachweis</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs print:text-[8px] font-black uppercase tracking-[0.2em] text-madrassah-950 mb-1">Berichtsjahr</div>
                  <p className="text-5xl print:text-3xl font-black italic text-black leading-none">{selectedYear}</p>
                </div>
              </div>

              {/* Personal Info & Yearly Heatmap */}
              <div className="grid grid-cols-12 gap-8 mb-16 print:mb-6">
                 <div className="col-span-12 bg-gray-50 p-10 print:p-5 rounded-[2.5rem] print:rounded-xl border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10 print:gap-4">
                       <div className="flex items-center gap-8 print:gap-4">
                          <div className="w-20 h-20 print:w-12 print:h-12 bg-madrassah-950 text-white rounded-[1.5rem] print:rounded-lg flex items-center justify-center font-black text-3xl print:text-lg shadow-xl">{teacher.name?.charAt(0) || '?'}</div>
                          <div>
                             <span className="text-[10px] print:text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1 block">Lehrkraft / Dozent</span>
                             <h2 className="text-4xl print:text-2xl font-black text-madrassah-950 uppercase italic leading-none tracking-tighter">{teacher.name}</h2>
                             <p className="text-xs print:text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2 print:mt-1">ID: {teacher.id} • Klassen: {(teacher.assignedClasses || []).join(', ')}</p>
                          </div>
                       </div>
                       
                       {/* Compact Yearly Heatmap */}
                       <div className="flex flex-col items-end gap-3 print:gap-1.5">
                          <span className="text-[9px] print:text-[7px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={12} className="print:w-3" /> Jahres-Fokus 12 Monate</span>
                          <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 print:gap-1">
                             {months.map(m => {
                                const stats = calculateStats(teacherId, m.val);
                                const hasData = getAttendanceForTeacherAndMonth(teacherId, m.val).length > 0;
                                return (
                                   <div key={m.val} className={`w-10 h-10 print:w-7 print:h-7 rounded-lg print:rounded-md flex flex-col items-center justify-center border transition-all ${hasData ? 'shadow-sm' : 'opacity-20'} ${getStatusColor(stats.percentage, hasData)}`}>
                                      <span className="text-[6px] print:text-[5px] font-black uppercase opacity-60">{m.name.slice(0,3)}</span>
                                      {hasData ? (
                                         <span className="text-[10px] print:text-[8px] font-black italic">{stats.percentage}%</span>
                                      ) : (
                                         <X size={10} className="opacity-20 print:w-2" />
                                      )}
                                   </div>
                                );
                             })}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Legend Section */}
              <div className="mb-12 print:mb-6 flex justify-center gap-8 print:gap-4">
                 <div className="flex items-center gap-3 print:gap-2 bg-emerald-50 px-6 py-2.5 print:px-3 print:py-1 rounded-2xl print:rounded-lg border border-emerald-100 shadow-sm">
                    <div className="w-8 h-8 print:w-5 print:h-5 bg-emerald-500 rounded-lg print:rounded-md flex items-center justify-center text-white"><Check size={18} strokeWidth={4} className="print:w-3" /></div>
                    <span className="text-[9px] print:text-[7px] font-black uppercase tracking-widest text-emerald-950">Dienst</span>
                 </div>
                 <div className="flex items-center gap-3 print:gap-2 bg-amber-50 px-6 py-2.5 print:px-3 print:py-1 rounded-2xl print:rounded-lg border border-amber-100 shadow-sm">
                    <div className="w-8 h-8 print:w-5 print:h-5 bg-amber-500 rounded-lg print:rounded-md flex items-center justify-center text-white"><HelpCircle size={18} strokeWidth={3} className="print:w-3" /></div>
                    <span className="text-[9px] print:text-[7px] font-black uppercase tracking-widest text-amber-950">Vertretung</span>
                 </div>
                 <div className="flex items-center gap-3 print:gap-2 bg-red-50 px-6 py-2.5 print:px-3 print:py-1 rounded-2xl print:rounded-lg border border-red-100 shadow-sm">
                    <div className="w-8 h-8 print:w-5 print:h-5 bg-red-500 rounded-lg print:rounded-md flex items-center justify-center text-white"><X size={18} strokeWidth={4} className="print:w-3" /></div>
                    <span className="text-[9px] print:text-[7px] font-black uppercase tracking-widest text-red-950">Fehlzeit</span>
                 </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="space-y-12 print:space-y-4 flex-1">
                {months.filter(m => m.val >= startMonth && m.val <= endMonth).map(m => {
                    const records = getAttendanceForTeacherAndMonth(teacherId, m.val).sort((a,b) => a.date.localeCompare(b.date));
                    const stats = calculateStats(teacherId, m.val);
                    if (records.length === 0) return null;

                    return (
                      <div key={m.val} className="page-break-inside-avoid bg-white border border-gray-100 rounded-[3rem] print:rounded-xl p-10 print:p-4 shadow-sm relative group overflow-hidden">
                        {/* Status Line Top */}
                        <div className={`absolute top-0 left-0 w-full h-2 print:h-1 ${stats.percentage >= 90 ? 'bg-emerald-500' : stats.percentage >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}></div>

                        <div className="flex flex-col md:flex-row justify-between items-center mb-10 print:mb-4 gap-6 print:gap-2">
                           <div className="flex items-center gap-6 print:gap-3">
                              <div className="w-16 h-16 print:w-8 print:h-8 bg-madrassah-950 text-white rounded-[1.5rem] print:rounded-lg flex items-center justify-center font-black text-xl print:text-xs shadow-xl">{m.val}</div>
                              <div>
                                 <h3 className="text-3xl print:text-lg font-black uppercase italic tracking-tighter text-madrassah-950 leading-none">{m.name}</h3>
                                 <p className="text-[10px] print:text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-2 print:mt-1">{records.length} Termine</p>
                              </div>
                           </div>
                           
                           <div className="flex gap-2 print:gap-1">
                              <div className="flex flex-col items-center bg-emerald-600 text-white px-6 py-3 print:px-2 print:py-1 rounded-2xl print:rounded-lg shadow-lg shadow-emerald-100 min-w-[90px] print:min-w-[50px]">
                                 <span className="text-xl print:text-sm font-black">{stats.present}</span>
                                 <span className="text-[7px] print:text-[5px] font-black uppercase tracking-widest opacity-70">Dienst</span>
                              </div>
                              <div className="flex flex-col items-center bg-amber-500 text-white px-6 py-3 print:px-2 print:py-1 rounded-2xl print:rounded-lg shadow-lg shadow-amber-100 min-w-[90px] print:min-w-[50px]">
                                 <span className="text-xl print:text-sm font-black">{stats.substituted}</span>
                                 <span className="text-[7px] print:text-[5px] font-black uppercase tracking-widest opacity-70">Vertr.</span>
                              </div>
                              <div className="flex flex-col items-center bg-red-500 text-white px-6 py-3 print:px-2 print:py-1 rounded-2xl print:rounded-lg shadow-lg shadow-red-100 min-w-[90px] print:min-w-[50px]">
                                 <span className="text-xl print:text-sm font-black">{stats.absent}</span>
                                 <span className="text-[7px] print:text-[5px] font-black uppercase tracking-widest opacity-70">Ausfall</span>
                              </div>
                           </div>
                        </div>
                        
                        {/* Grid with visual day cells */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 print:gap-1.5">
                          {records.map((r, i) => (
                            <div key={i} className={`flex flex-col items-center justify-center p-4 print:p-2 rounded-2xl print:rounded-lg border-2 print:border transition-all relative overflow-hidden ${
                                r.status === 'present' ? 'bg-emerald-50 border-emerald-100' : 
                                r.status === 'substituted' ? 'bg-amber-50 border-amber-100' :
                                'bg-red-50 border-red-100'
                              }`}>
                              <span className="text-[8px] print:text-[6px] font-black uppercase opacity-40 mb-1">{new Date(r.date).toLocaleDateString('de-DE', { weekday: 'short' })}</span>
                              <span className="font-black text-sm print:text-[10px] text-gray-900 leading-none mb-3 print:mb-1">{new Date(r.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
                              
                              <div className={`p-1.5 print:p-1 rounded-full ${
                                r.status === 'present' ? 'bg-emerald-500 text-white' : 
                                r.status === 'substituted' ? 'bg-amber-500 text-white' : 
                                'bg-red-500 text-white'
                              }`}>
                                {r.status === 'present' && <Check size={14} strokeWidth={4} className="print:w-2 print:h-2" />}
                                {r.status === 'substituted' && <HelpCircle size={14} strokeWidth={3} className="print:w-2 print:h-2" />}
                                {r.status === 'absent' && <X size={14} strokeWidth={4} className="print:w-2 print:h-2" />}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-gray-100 pt-8 print:pt-3 mt-8 print:mt-3">
                           <div className="flex items-center gap-4 print:gap-2">
                              <span className={`text-2xl print:text-sm font-black italic tracking-tighter ${stats.percentage > 85 ? 'text-emerald-600' : 'text-amber-600'}`}>{stats.percentage}% Zuverlässigkeit</span>
                              <div className="w-40 print:w-20 h-1.5 print:h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${stats.percentage > 85 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${stats.percentage}%` }}></div>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[8px] print:text-[6px] font-black text-gray-300 uppercase tracking-[0.2em]">Madrassah Audit Log v2.6</p>
                           </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Signature Footer */}
              <div className="mt-auto pt-20 print:pt-8">
                 <div className="grid grid-cols-2 gap-40 print:gap-20 mb-16 print:mb-6">
                    <div className="text-center">
                       <div className="h-[1px] bg-black w-full mb-4 print:mb-2"></div>
                       <p className="text-[10px] print:text-[8px] font-black uppercase tracking-widest text-madrassah-950">Unterschrift Lehrkraft</p>
                       <p className="text-[8px] print:text-[6px] text-gray-400 mt-1 italic">{teacher.name}</p>
                    </div>
                    <div className="text-center">
                       <div className="h-[1px] bg-black w-full mb-4 print:mb-2"></div>
                       <p className="text-[10px] print:text-[8px] font-black uppercase tracking-widest text-madrassah-950">Prüfung & Freigabe</p>
                       <p className="text-[8px] print:text-[6px] text-gray-400 mt-1 italic">Hamburg, {new Date().toLocaleDateString('de-DE')}</p>
                    </div>
                 </div>
                 <div className="pt-8 print:pt-4 border-t border-dotted border-gray-200 flex justify-between items-center text-[7px] font-black text-gray-300 uppercase tracking-[0.4em]">
                    <span>Campus Management &copy; 2026 • DIGITAL IDENTITY VERIFIED</span>
                    <div className="flex items-center gap-4">
                       <span className="page-number-display"></span>
                       <LogoIcon className="w-6 h-6 print:w-4 print:h-4 opacity-20 grayscale" />
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 1cm; 
            counter-increment: reportPage;
          }
          body { 
            background: white !important; 
            counter-reset: reportPage;
          }
          .no-print { display: none !important; }
          .custom-scrollbar::-webkit-scrollbar { display: none; }
          .report-page { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important; 
            min-height: 275mm !important; 
            counter-increment: reportPage;
          }
          .page-number-display:after {
            content: "SEITE " counter(reportPage);
          }
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f004220; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TeacherAttendanceReport;
