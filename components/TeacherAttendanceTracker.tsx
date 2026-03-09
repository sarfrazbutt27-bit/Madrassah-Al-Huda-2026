
import React, { useState, useMemo } from 'react';
// Added Link to fix "Cannot find name 'Link'" errors on lines 116 and 118
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Printer, 
  ChevronDown, 
  ArrowLeft,
  Clock,
  Briefcase,
  HelpCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { User, UserRole, TeacherAttendance } from '../types';

interface TeacherAttendanceTrackerProps {
  user: User;
  users: User[];
  teacherAttendance: TeacherAttendance[];
  onUpdateAttendance: (attendance: TeacherAttendance[]) => void;
}

const TeacherAttendanceTracker: React.FC<TeacherAttendanceTrackerProps> = ({ 
  user, users, teacherAttendance, onUpdateAttendance 
}) => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('-').slice(0, 2).join('-'));
  const isAdmin = user.role === UserRole.PRINCIPAL;

  const teachers = useMemo(() => users.filter(u => u.role === UserRole.TEACHER).sort((a, b) => a.name.localeCompare(b.name)), [users]);

  // Hilfsfunktion für lokales Datumsformat YYYY-MM-DD
  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const datesInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const result: string[] = [];
    while (date.getMonth() === month - 1) {
      result.push(formatLocalDate(date));
      date.setDate(date.getDate() + 1);
    }
    return result;
  }, [selectedMonth]);

  const toggleAttendance = (teacherId: string, date: string, currentStatus: string | undefined) => {
    if (!isAdmin) return; // Nur Schulleiter kann ändern

    let nextStatus: string | null = null;
    if (currentStatus === undefined) nextStatus = 'present';
    else if (currentStatus === 'present') nextStatus = 'absent';
    else if (currentStatus === 'absent') nextStatus = 'substituted';
    else nextStatus = null; // Zurück zum Anfang

    const newList = [...teacherAttendance];
    const idx = newList.findIndex(a => a.userId === teacherId && a.date === date);

    if (nextStatus === null) {
      if (idx > -1) newList.splice(idx, 1);
    } else {
      if (idx > -1) newList[idx] = { ...newList[idx], status: nextStatus as any };
      else newList.push({ userId: teacherId, date, status: nextStatus as any });
    }
    onUpdateAttendance(newList);
  };

  const getStats = (teacherId: string) => {
    const records = teacherAttendance.filter(a => a.userId === teacherId && a.date.startsWith(selectedMonth));
    return {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      substituted: records.filter(r => r.status === 'substituted').length
    };
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10">
       <AlertCircle size={64} className="text-red-500 mb-4" />
       <h2 className="text-2xl font-black uppercase italic">Zugriff verweigert</h2>
       <p className="text-gray-400 mt-2">Nur die Schulleitung kann Lehrer-Anwesenheiten erfassen.</p>
       <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-madrassah-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Zurück</button>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="p-4 bg-gray-50 text-madrassah-950 rounded-2xl border border-gray-100 hover:bg-white transition-all shadow-sm group">
              <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
           </button>
           <div>
              <h2 className="text-4xl font-black text-madrassah-950 tracking-tighter italic uppercase leading-none mb-3">Lehrer-Präsenz Buch</h2>
              <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.4em] flex items-center gap-2">
                 <ShieldCheck size={14} className="text-emerald-500" /> Nur für Schulleitung editierbar
              </p>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="bg-indigo-950 text-white px-8 py-4 rounded-[2rem] flex items-center gap-4 shadow-xl">
              <Calendar size={18} className="text-indigo-300" />
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-transparent font-black uppercase text-xs outline-none cursor-pointer" />
           </div>
           <Link to="/teacher-attendance-report" className="bg-emerald-600 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl hover:bg-emerald-700 transition-all">
              <Printer size={18} /> Berichte
           </Link>
        </div>
      </div>

      {/* Legend / Info */}
      <div className="flex flex-wrap justify-center gap-8 bg-madrassah-950 p-6 rounded-[2.5rem] text-white/60">
         <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black uppercase tracking-widest">Anwesend</span></div>
         <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-[10px] font-black uppercase tracking-widest">Abwesend</span></div>
         <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-[10px] font-black uppercase tracking-widest">Vertretung</span></div>
         <div className="flex items-center gap-3 text-white"><HelpCircle size={14}/><span className="text-[10px] font-black uppercase tracking-widest italic">Klick zum Umschalten</span></div>
      </div>

      {/* Table Matrix */}
      <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                <th className="px-10 py-8 text-left sticky left-0 bg-gray-50 z-10 w-64 border-r shadow-md">Dozent / ID</th>
                <th className="px-4 py-8 text-center bg-gray-100/50 border-r">Summe</th>
                {datesInMonth.map(d => {
                  const dateObj = new Date(d);
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                  return (
                    <th key={d} className={`px-4 py-8 text-center min-w-[50px] border-r ${isWeekend ? 'bg-gray-100/30' : ''}`}>
                      <div className="text-[8px] opacity-40 font-black">{dateObj.toLocaleDateString('de-DE', { weekday: 'short' })}</div>
                      <div className="text-xl text-madrassah-950 font-black italic">{dateObj.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teachers.map(teacher => {
                const stats = getStats(teacher.id);
                return (
                  <tr key={teacher.id} className="hover:bg-indigo-50/10 transition-all group">
                    <td className="px-10 py-6 sticky left-0 bg-white z-10 border-r group shadow-md">
                       <div className="flex flex-col">
                          <span className="font-black text-sm uppercase italic text-madrassah-950 group-hover:text-indigo-700 transition-colors leading-none">{teacher.name}</span>
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-2">{teacher.teacherTitle} • {teacher.id}</span>
                       </div>
                    </td>
                    <td className="px-4 py-6 text-center border-r bg-gray-50/50">
                       <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-emerald-600">{stats.present}</span>
                          <div className="h-px bg-gray-200 w-4 mx-auto"></div>
                          <span className="text-xs font-black text-red-600">{stats.absent}</span>
                       </div>
                    </td>
                    {datesInMonth.map(d => {
                      const record = teacherAttendance.find(a => a.userId === teacher.id && a.date === d);
                      const status = record?.status;
                      const isWeekend = new Date(d).getDay() === 0 || new Date(d).getDay() === 6;

                      return (
                        <td key={d} className={`px-2 py-4 text-center border-r ${isWeekend ? 'bg-gray-100/10' : ''}`}>
                          <button 
                            onClick={() => toggleAttendance(teacher.id, d, status)}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all transform active:scale-90 shadow-sm border ${
                              status === 'present' ? 'bg-emerald-500 text-white border-emerald-600' : 
                              status === 'absent' ? 'bg-red-500 text-white border-red-600' : 
                              status === 'substituted' ? 'bg-amber-500 text-white border-amber-600' : 
                              'bg-gray-50 text-gray-200 hover:bg-white hover:border-gray-200 border-gray-100'
                            }`}
                          >
                            {status === 'present' && <CheckCircle size={18} />}
                            {status === 'absent' && <XCircle size={18} />}
                            {status === 'substituted' && <Briefcase size={18} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f004215; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f004230; }
      `}</style>
    </div>
  );
};

export default TeacherAttendanceTracker;
