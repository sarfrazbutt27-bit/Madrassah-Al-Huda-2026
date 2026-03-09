
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Printer,
  Search,
  Flame,
  CalendarDays,
  Info,
  Phone,
  Lock,
  Users
} from 'lucide-react';
import { Student, Attendance, User, UserRole, TeacherAttendance } from '../types';

interface AttendanceTrackerProps {
  user: User;
  students: Student[];
  attendance: Attendance[];
  teacherAttendance: TeacherAttendance[];
  onUpdateAttendance: (attendance: Attendance[], itemsToSync?: Attendance[], itemToDelete?: Attendance) => void;
  onUpdateTeacherAttendance: (attendance: TeacherAttendance[]) => void;
  onUpdateStudent?: (student: Student) => void;
  users: User[];
  isHolidayMode?: boolean;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ 
  user, students, attendance, onUpdateAttendance, teacherAttendance, onUpdateTeacherAttendance, users, isHolidayMode
}) => {
  const navigate = useNavigate();
  const isAdmin = user.role === UserRole.PRINCIPAL;
  const isTeacher = user.role === UserRole.TEACHER;
  const isStudent = user.role === UserRole.STUDENT;
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('-').slice(0, 2).join('-'));
  const [lessonModel, setLessonModel] = useState<'Weekend' | 'Weekday'>('Weekend');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'risk'>('all');
  
  const assignedClasses = user.assignedClasses || [];
  
  // Verfügbare Klassen basierend auf Rolle
  const availableClasses = useMemo(() => {
    if (isStudent) {
      const s = students.find(s => s.id === user.id);
      return s ? [s.className] : [];
    }
    // Admin sieht alle existierenden Klassen der Schüler
    if (isAdmin) {
      const classes = Array.from(new Set(students.map(s => s.className))).filter(Boolean);
      return [...classes.sort()];
    }
    // Lehrer sieht nur seine zugewiesenen Klassen
    return [...assignedClasses.sort()];
  }, [students, isAdmin, assignedClasses, isStudent, user.id]);

  const [selectedClass, setSelectedClass] = useState<string>(
    isStudent ? (availableClasses[0] || '') : (isAdmin ? 'Alle' : (availableClasses[0] || ''))
  );

  const datesInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const result: string[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i, 12, 0, 0);
      const dayOfWeek = date.getDay(); 
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

      if (lessonModel === 'Weekend') {
        if (dayOfWeek === 6 || dayOfWeek === 0) result.push(dStr);
      } else {
        if (dayOfWeek >= 1 && dayOfWeek <= 4) result.push(dStr);
      }
    }
    return result;
  }, [selectedMonth, lessonModel]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (!s) return false;
      
      // 1. Schülersicht: Nur sich selbst
      if (isStudent) return s.id === user.id;
      
      // 2. Kursmodell Filter
      const isWeekendStudent = s.lessonTimes?.includes('Sa & So');
      const isWeekdayStudent = s.lessonTimes?.includes('MO, Di, Mi, Do');
      const matchesModel = lessonModel === 'Weekend' ? isWeekendStudent : isWeekdayStudent;
      if (!matchesModel) return false;

      // 3. Rollenbasierte Sichtbarkeit
      // Lehrer dürfen nur Schüler ihrer zugewiesenen Klassen sehen
      if (isTeacher && !assignedClasses.includes(s.className)) return false;

      // 4. Klassen-Filter
      const matchesClass = selectedClass === 'Alle' || s.className === selectedClass;
      if (!matchesClass) return false;

      // 5. Suche & Risiko
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const matchesSearch = searchTerm === '' || fullName.includes(searchTerm.toLowerCase());
      
      if (riskFilter === 'risk') {
         const abs = attendance.filter(a => a.studentId === s.id && a.status === 'absent').length;
         if (abs < 9) return false;
      }
      
      return matchesSearch && s.status === 'active';
    }).sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
  }, [students, selectedClass, searchTerm, riskFilter, attendance, isStudent, isAdmin, isTeacher, assignedClasses, user.id, lessonModel]);

  const toggleAttendance = (studentId: string, date: string, current: Attendance['status'] | undefined) => {
    if (isStudent || isHolidayMode) return; // Schüler dürfen nichts ändern, Ferienmodus sperrt alles
    
    let nextStatus: Attendance['status'] | null;
    if (current === undefined) nextStatus = 'present';
    else if (current === 'present') nextStatus = 'absent';
    else if (current === 'absent') nextStatus = 'excused';
    else nextStatus = null;

    const newList = [...attendance];
    const idx = newList.findIndex(a => a.studentId === studentId && a.date === date);
    
    let updatedRecord: Attendance;
    if (nextStatus === null) {
      const toDelete = attendance.find(a => a.studentId === studentId && a.date === date);
      if (idx > -1) newList.splice(idx, 1);
      onUpdateAttendance(newList, [], toDelete);
    } else {
      updatedRecord = { studentId, date, status: nextStatus };
      if (idx > -1) newList[idx] = updatedRecord;
      else newList.push(updatedRecord);
      onUpdateAttendance(newList, [updatedRecord]);
    }
  };

  const toggleTeacherAttendance = (userId: string, date: string, current: TeacherAttendance['status'] | undefined) => {
    if (!isAdmin || isHolidayMode) return;
    
    let nextStatus: TeacherAttendance['status'] | null;
    if (current === undefined) nextStatus = 'present';
    else if (current === 'present') nextStatus = 'absent';
    else if (current === 'absent') nextStatus = 'substituted';
    else nextStatus = null;

    const newList = [...teacherAttendance];
    const idx = newList.findIndex(a => a.userId === userId && a.date === date);
    
    if (nextStatus === null) {
      if (idx > -1) newList.splice(idx, 1);
    } else {
      const updated = { userId, date, status: nextStatus };
      if (idx > -1) newList[idx] = updated;
      else newList.push(updated);
    }
    onUpdateTeacherAttendance(newList);
  };

  const getAbsenceStatus = (studentId: string) => {
    const unexcusedCount = attendance.filter(a => a.studentId === studentId && a.status === 'absent').length;
    const excusedCount = attendance.filter(a => a.studentId === studentId && a.status === 'excused').length;
    
    if (unexcusedCount >= 18) return { type: 'red', unexcused: unexcusedCount, excused: excusedCount };
    if (unexcusedCount >= 9) return { type: 'yellow', unexcused: unexcusedCount, excused: excusedCount };
    return { type: 'none', unexcused: unexcusedCount, excused: excusedCount };
  };

  const handlePrintRedirect = () => {
    const [year, month] = selectedMonth.split('-');
    const classNameToPrint = selectedClass === 'Alle' ? 'Gesamt' : selectedClass;
    navigate(`/attendance/print/${classNameToPrint}/${month}/${year}?model=${lessonModel}`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      {isHolidayMode && (
        <div className="bg-amber-400 p-8 rounded-[3rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-amber-500/20 animate-bounce-subtle">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-madrassah-950">
              <CalendarDays size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-madrassah-950 uppercase italic">FERIEN – Madrassah geschlossen</h3>
              <p className="text-madrassah-950/70 font-bold uppercase text-[10px] tracking-widest mt-1">Keine Anwesenheitserfassung während der Ferien.</p>
            </div>
          </div>
          <div className="bg-white/20 px-6 py-3 rounded-2xl border border-white/30">
            <p className="text-[10px] font-black text-madrassah-950 uppercase tracking-widest">Genieße deine freie Zeit!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-madrassah-950 pointer-events-none rotate-12"><CalendarDays size={240} /></div>
        <div className="relative z-10">
           <h2 className="text-4xl font-black text-madrassah-950 tracking-tighter italic uppercase leading-none mb-3">
             {isStudent ? 'Meine Anwesenheit' : 'Präsenz-Kontrolle'}
           </h2>
           <div className="flex flex-wrap gap-3">
              <span className="bg-madrassah-950 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                {lessonModel === 'Weekend' ? 'Sa & So' : 'Mo - Do'}
              </span>
              {!isStudent && <span className="bg-gray-100 text-gray-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">{filteredStudents.length} Schüler</span>}
              {isAdmin && <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-200">Admin-Modus</span>}
           </div>
        </div>
        {!isStudent && (
           <div className="flex gap-4 relative z-10">
              <button onClick={() => setRiskFilter(riskFilter === 'all' ? 'risk' : 'all')} className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 border-2 ${riskFilter === 'risk' ? 'bg-red-600 text-white border-red-700 shadow-xl' : 'bg-white text-red-600 border-red-100 hover:border-red-200'}`}>
                <Flame size={18} /> {riskFilter === 'risk' ? 'Alle anzeigen' : 'Risiko-Liste'}
              </button>
              <button onClick={handlePrintRedirect} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl hover:bg-black transition-all">
                <Printer size={18} /> Druckansicht
              </button>
           </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white px-10 py-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-wrap justify-center gap-10 no-print">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white"><CheckCircle size={18}/></div>
            <span className="text-[10px] font-black uppercase text-gray-400">Anwesend</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white"><XCircle size={18}/></div>
            <span className="text-[10px] font-black uppercase text-gray-400">Abwesend</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center text-white italic font-black">E</div>
            <span className="text-[10px] font-black uppercase text-gray-400">Entschuldigt</span>
         </div>
         {isStudent ? (
           <div className="flex items-center gap-3 text-indigo-600">
              <Lock size={16}/>
              <span className="text-[9px] font-bold uppercase italic tracking-widest">Nur Lesezugriff</span>
           </div>
         ) : (
           <div className="flex items-center gap-3 opacity-30">
              <Info size={16}/>
              <span className="text-[9px] font-bold uppercase italic">Klick zum Umschalten</span>
           </div>
         )}
      </div>

      {/* Filterbar - Nur für Staff */}
      {!isStudent && (
        <div className="bg-madrassah-950 p-10 rounded-[3.5rem] shadow-2xl text-white grid grid-cols-1 md:grid-cols-4 gap-8 items-end no-print">
           <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-madrassah-300 ml-3 flex items-center gap-2"><Clock size={12}/> Kursmodell</label>
              <div className="flex bg-white/10 p-1.5 rounded-[2rem] border border-white/10">
                 <button onClick={() => setLessonModel('Weekend')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${lessonModel === 'Weekend' ? 'bg-white text-madrassah-950 shadow-2xl' : 'text-white/40 hover:text-white'}`}>Sa & So</button>
                 <button onClick={() => setLessonModel('Weekday')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${lessonModel === 'Weekday' ? 'bg-white text-madrassah-950 shadow-2xl' : 'text-white/40 hover:text-white'}`}>Mo - Do</button>
              </div>
           </div>
           <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-madrassah-300 ml-3 italic">Klasse</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-2xl p-4.5 text-[11px] font-black uppercase outline-none text-white appearance-none cursor-pointer hover:bg-white/20 transition-all">
                {isAdmin && <option value="Alle" className="text-black">Alle Klassen</option>}
                {availableClasses.map(c => <option key={c} value={c} className="text-black">Klasse {c}</option>)}
              </select>
           </div>
           <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-madrassah-300 ml-3 italic">Monat</label>
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-2xl p-4.5 text-[11px] font-black uppercase outline-none text-white cursor-pointer hover:bg-white/20 transition-all" />
           </div>
           <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input type="text" placeholder="Suchen..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-4 py-4.5 bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black uppercase outline-none focus:bg-white/20 transition-all" />
           </div>
        </div>
      )}

      {/* Matrix Tabelle */}
      <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b sticky top-0 z-30">
                <th className="px-10 py-8 text-left sticky left-0 top-0 bg-gray-50 z-40 w-80 border-r shadow-md italic">Schülername & Kontakt</th>
                {datesInMonth.map(d => {
                  const [y, m, dayNum] = d.split('-').map(Number);
                  const dateObj = new Date(y, m - 1, dayNum, 12, 0, 0); 
                  return (
                    <th key={d} className="px-4 py-8 text-center border-r min-w-[70px] bg-gray-50 sticky top-0 z-30">
                      <div className="text-[8px] opacity-40 uppercase tracking-widest">{dateObj.toLocaleDateString('de-DE', { weekday: 'short' })}</div>
                      <div className="text-2xl text-madrassah-950 font-black italic">{dateObj.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map(student => {
                const risk = getAbsenceStatus(student.id);
                return (
                  <tr key={student.id} className={`hover:bg-indigo-50/10 transition-all ${risk.type === 'red' ? 'bg-red-50/40' : risk.type === 'yellow' ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-10 py-6 sticky left-0 bg-white z-10 border-r shadow-md">
                        <div className="flex flex-col">
                          <span className={`font-black text-sm uppercase italic leading-none ${risk.type === 'red' ? 'text-red-700' : risk.type === 'yellow' ? 'text-amber-700' : 'text-madrassah-950'}`}>
                            {student.firstName} {student.lastName}
                          </span>
                          
                          <div className="flex items-center gap-2 mt-1.5">
                             <Phone size={10} className="text-emerald-500" />
                             <span className="text-[9px] font-black text-emerald-700 tracking-widest uppercase">{student.whatsapp || 'Kein Kontakt'}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">Klasse {student.className}</span>
                             {risk.unexcused > 0 && <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${risk.type === 'red' ? 'bg-red-600 text-white' : 'bg-red-400 text-white'}`}>{risk.unexcused} Fehl</span>}
                             {risk.excused > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-700">{risk.excused} Entsch.</span>}
                          </div>
                        </div>
                    </td>
                    {datesInMonth.map(d => {
                        const record = attendance.find(a => a.studentId === student.id && a.date === d);
                        const status = record?.status;

                        return (
                          <td key={d} className="px-2 py-4 text-center border-r">
                            <button 
                              onClick={() => toggleAttendance(student.id, d, status)}
                              disabled={isStudent}
                              className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all transform ${!isStudent && 'active:scale-90'} border-2 shadow-sm ${
                                status === 'present' ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-100' : 
                                status === 'absent' ? 'bg-red-500 text-white border-red-600 shadow-red-100' : 
                                status === 'excused' ? 'bg-amber-400 text-white border-amber-500 shadow-amber-100' :
                                'bg-white text-gray-200 border-gray-50 hover:border-indigo-100 hover:text-indigo-200'
                              } ${isStudent && 'cursor-default'}`}
                            >
                              {status === 'present' && <CheckCircle size={22} />}
                              {status === 'absent' && <XCircle size={22} />}
                              {status === 'excused' && <span className="text-xl font-black italic">E</span>}
                            </button>
                          </td>
                        );
                    })}
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                   <td colSpan={datesInMonth.length + 1} className="py-20 text-center opacity-10 italic font-black uppercase tracking-tighter text-2xl">Keine Daten verfügbar</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lehrer Anwesenheit (Nur Admin) */}
      {isAdmin && (
        <div className="space-y-6 mt-20">
          <div className="flex items-center gap-4 px-4">
            <Users size={24} className="text-madrassah-950" />
            <h3 className="text-2xl font-black text-madrassah-950 uppercase italic">Lehrer-Präsenz</h3>
          </div>
          <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[50vh] custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b sticky top-0 z-30">
                    <th className="px-10 py-8 text-left sticky left-0 top-0 bg-gray-50 z-40 w-80 border-r shadow-md italic">Dozent</th>
                    {datesInMonth.map(d => {
                      const [y, m, dayNum] = d.split('-').map(Number);
                      const dateObj = new Date(y, m - 1, dayNum, 12, 0, 0); 
                      return (
                        <th key={d} className="px-4 py-8 text-center border-r min-w-[70px] bg-gray-50 sticky top-0 z-30">
                          <div className="text-[8px] opacity-40 uppercase tracking-widest">{dateObj.toLocaleDateString('de-DE', { weekday: 'short' })}</div>
                          <div className="text-2xl text-madrassah-950 font-black italic">{dateObj.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.filter(u => u.role === UserRole.TEACHER).map(teacher => (
                    <tr key={teacher.id} className="hover:bg-indigo-50/10 transition-all">
                      <td className="px-10 py-6 sticky left-0 bg-white z-10 border-r shadow-md">
                        <div className="flex flex-col">
                          <span className="font-black text-sm uppercase italic text-madrassah-950">{teacher.name}</span>
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{teacher.teacherTitle}</span>
                        </div>
                      </td>
                      {datesInMonth.map(d => {
                        const record = teacherAttendance.find(a => a.userId === teacher.id && a.date === d);
                        const status = record?.status;
                        return (
                          <td key={d} className="px-2 py-4 text-center border-r">
                            <button 
                              onClick={() => toggleTeacherAttendance(teacher.id, d, status)}
                              className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all transform active:scale-90 border-2 shadow-sm ${
                                status === 'present' ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-100' : 
                                status === 'absent' ? 'bg-red-500 text-white border-red-600 shadow-red-100' : 
                                status === 'substituted' ? 'bg-amber-400 text-white border-amber-500 shadow-amber-100' :
                                'bg-white text-gray-200 border-gray-50 hover:border-indigo-100'
                              }`}
                            >
                              {status === 'present' && <CheckCircle size={22} />}
                              {status === 'absent' && <XCircle size={22} />}
                              {status === 'substituted' && <span className="text-xl font-black italic">S</span>}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
