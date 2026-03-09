
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Search, Unlock, Lock, ChevronDown, School, Award
} from 'lucide-react';
import { Student, Grade, User, UserRole } from '../types';

interface ReportManagerProps {
  user: User;
  students: Student[];
  subjects: string[];
  grades: Grade[];
  onUpdateStudents: (students: Student[], itemsToSync?: Student[]) => void;
}

const ReportManager: React.FC<ReportManagerProps> = ({ user, students, subjects, grades, onUpdateStudents }) => {
  const navigate = useNavigate();
  const [selectedTerm, setSelectedTerm] = useState<'Halbjahr' | 'Abschluss'>('Halbjahr');
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('Alle');

  const isTeacher = user.role === UserRole.TEACHER;
  const isPrincipal = user.role === UserRole.PRINCIPAL;
  const assignedClasses = user.assignedClasses || [];

  const availableClasses = useMemo(() => {
    const classes = isPrincipal 
      ? Array.from(new Set(students.map(s => s.className)))
      : assignedClasses;
    return ['Alle', ...classes.sort()];
  }, [students, isPrincipal, assignedClasses]);

  const classStudents = useMemo(() => {
    return students.filter(s => {
      const isMyClass = isPrincipal || assignedClasses.includes(s.className);
      const matchesFilter = classFilter === 'Alle' || s.className === classFilter;
      const matchesSearch = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      return isMyClass && matchesFilter && matchesSearch && s.status === 'active';
    });
  }, [students, isPrincipal, assignedClasses, classFilter, searchTerm]);

  const getCompletionStats = (studentId: string) => {
    const studentGrades = grades.filter(g => g.studentId === studentId && g.term === selectedTerm);
    // Count subjects that have a grade (including '*' which is -1)
    const gradedCount = new Set(studentGrades.map(g => g.subject)).size;
    const totalCount = subjects.length;
    
    // A report is complete if all subjects have either a numeric grade or a '*'
    return {
      count: gradedCount,
      total: totalCount,
      isComplete: gradedCount >= totalCount && totalCount > 0,
      percentage: totalCount > 0 ? (gradedCount / totalCount) * 100 : 0
    };
  };

  const toggleRelease = (studentId: string) => {
    const stats = getCompletionStats(studentId);
    if (!stats.isComplete) {
      if (!window.confirm("Dieses Zeugnis ist unvollständig. Trotzdem für den Schüler freigeben?")) return;
    }

    let updatedStudent: Student | undefined;
    const updated = students.map(s => {
      if (s.id === studentId) {
        if (selectedTerm === 'Halbjahr') {
          updatedStudent = { ...s, reportReleasedHalbjahr: !s.reportReleasedHalbjahr };
        } else {
          updatedStudent = { ...s, reportReleasedAbschluss: !s.reportReleasedAbschluss };
        }
        return updatedStudent;
      }
      return s;
    });
    if (updatedStudent) {
      onUpdateStudents(updated, [updatedStudent]);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-8">
          <div className="bg-madrassah-950 p-6 rounded-[2rem] shadow-2xl text-white">
            <FileText size={36} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Zeugnis-Kontrolle</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 italic">
              Zentrales Management der Freigaben
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner">
            {(['Halbjahr', 'Abschluss'] as const).map(t => (
              <button key={t} onClick={() => setSelectedTerm(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTerm === t ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input type="text" placeholder="Suche..." className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 rounded-[2.5rem] outline-none shadow-sm font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative w-full md:w-72">
           <School className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={20} />
           <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full pl-16 pr-12 py-5 bg-white border border-gray-100 rounded-[2.5rem] text-xs font-black uppercase outline-none appearance-none cursor-pointer">
              {availableClasses.map(c => <option key={c} value={c}>{c === 'Alle' ? 'Alle Klassen' : `Klasse ${c}`}</option>)}
           </select>
           <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
        </div>
      </div>

      <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] border-b">
              <tr>
                <th className="px-12 py-8">Teilnehmer</th>
                <th className="px-8 py-8">Status</th>
                <th className="px-8 py-8 text-center">Freigabe</th>
                <th className="px-12 py-8 text-right">Zertifikate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {classStudents.map(student => {
                const stats = getCompletionStats(student.id);
                const isReleased = selectedTerm === 'Halbjahr' ? student.reportReleasedHalbjahr : student.reportReleasedAbschluss;

                return (
                  <tr key={student.id} className="hover:bg-madrassah-50/20 transition-all group">
                    <td className="px-12 py-8">
                      <p className="font-black text-gray-900 group-hover:text-madrassah-950 text-xl italic leading-none">{student.firstName} {student.lastName}</p>
                      <p className="text-[9px] text-gray-400 font-black uppercase mt-2">Klasse {student.className}</p>
                    </td>
                    <td className="px-8 py-8">
                       <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full transition-all duration-1000 ${stats.isComplete ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${stats.percentage}%` }}></div>
                       </div>
                    </td>
                    <td className="px-8 py-8 text-center">
                       <button onClick={() => toggleRelease(student.id)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${isReleased ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-gray-400 border-gray-200'}`}>
                         {isReleased ? <Unlock size={14} /> : <Lock size={14} />}
                       </button>
                    </td>
                    <td className="px-12 py-8 text-right">
                      {selectedTerm === 'Abschluss' && stats.isComplete ? (
                        <div className="flex justify-end gap-2">
                           {['Hafiz', 'Imam', 'Alim', 'Ijazah', 'Quran-Khatam'].map(type => (
                             <Link key={type} to={`/certificate/${student.id}/${type}`} className="p-3 bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-600 hover:text-white rounded-xl transition-all shadow-sm flex items-center gap-2 text-[8px] font-black uppercase">
                                <Award size={14} /> {type}
                             </Link>
                           ))}
                        </div>
                      ) : (
                        <Link to={`/report-card/${student.id}`} className="px-8 py-3 bg-madrassah-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Zeugnis</Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportManager;
