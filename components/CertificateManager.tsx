
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, Search, School, ChevronDown, Star, ShieldCheck, 
  Info
} from 'lucide-react';
import { Student, Grade, User, UserRole } from '../types';

interface Props {
  user: User;
  students: Student[];
  grades: Grade[];
}

const CertificateManager: React.FC<Props> = ({ user, students, grades }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('Alle');

  const isAdmin = user.role === UserRole.PRINCIPAL;
  const assignedClasses = user.assignedClasses || [];

  const availableClasses = useMemo(() => {
    const classes = isAdmin 
      ? Array.from(new Set(students.map(s => s.className)))
      : assignedClasses;
    return ['Alle', ...classes.sort()];
  }, [students, isAdmin, assignedClasses]);

  const getQualification = (studentId: string) => {
    const abschlussGrades = grades.filter(g => g.studentId === studentId && g.term === 'Abschluss');
    if (abschlussGrades.length === 0) return { label: 'Keine Abschlussdaten', color: 'text-gray-400', avg: 0 };
    
    const avg = abschlussGrades.reduce((acc, curr) => acc + curr.points, 0) / abschlussGrades.length;
    
    if (avg > 32) return { label: 'Hoch Qualifiziert', color: 'text-emerald-600', avg };
    if (avg > 20) return { label: 'Mittel Qualifiziert', color: 'text-amber-600', avg };
    return { label: 'Angemessen Qualifiziert', color: 'text-indigo-600', avg };
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const isMyClass = isAdmin || assignedClasses.includes(s.className);
      const matchesFilter = classFilter === 'Alle' || s.className === classFilter;
      const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
      return isMyClass && matchesFilter && matchesSearch && s.status === 'active';
    }).sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [students, isAdmin, assignedClasses, classFilter, searchTerm]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-amber-600 pointer-events-none rotate-12"><Award size={280} /></div>
        <div className="relative z-10 flex items-center gap-8">
           <div className="bg-amber-600 p-6 rounded-[2rem] shadow-2xl text-white transform -rotate-3">
              <Award size={42} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Urkunden-Zentrum</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 italic">Abschluss-Zertifikate & Ijazat Management</p>
           </div>
        </div>
        <div className="bg-amber-50 px-8 py-5 rounded-[2.5rem] border border-amber-100 flex items-center gap-4">
           <Star size={24} className="text-amber-600 animate-pulse" />
           <p className="text-[10px] font-black uppercase text-amber-900 tracking-widest leading-relaxed">
             Nur Schüler mit vollständigen<br/>Abschlussnoten sind qualifiziert.
           </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text" 
            placeholder="Absolvent suchen..." 
            className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 rounded-[2.5rem] outline-none shadow-sm font-bold" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="relative w-full md:w-72">
           <School className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={20} />
           <select 
             value={classFilter} 
             onChange={e => setClassFilter(e.target.value)} 
             className="w-full pl-16 pr-12 py-5 bg-white border border-gray-100 rounded-[2.5rem] text-xs font-black uppercase outline-none appearance-none cursor-pointer"
           >
              {availableClasses.map(c => <option key={c} value={c}>{c === 'Alle' ? 'Alle Klassen' : `Klasse ${c}`}</option>)}
           </select>
           <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
        </div>
      </div>

      {/* Grid of Students */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredStudents.map(student => {
          const qual = getQualification(student.id);
          const hasGrades = qual.avg > 0;

          return (
            <div key={student.id} className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col overflow-hidden">
               <div className="p-8 border-b border-gray-50 flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-white shadow-lg transform group-hover:scale-110 transition-transform ${student.gender === 'Junge' || student.gender === 'Mann' ? 'bg-indigo-600' : 'bg-pink-600'}`}>
                     {student.firstName.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                     <h4 className="font-black text-xl text-madrassah-950 uppercase italic truncate">{student.firstName} {student.lastName}</h4>
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Klasse {student.className} • ID: {student.id}</p>
                  </div>
               </div>

               <div className="p-8 flex-1 space-y-6">
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 italic">
                     <p className="text-[8px] font-black uppercase text-gray-400 mb-2 tracking-widest">Status Einstufung</p>
                     <p className={`text-sm font-black uppercase ${qual.color} flex items-center gap-2`}>
                        <ShieldCheck size={16} /> {qual.label}
                     </p>
                     {hasGrades && (
                       <div className="mt-4 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${qual.avg > 32 ? 'bg-emerald-500' : qual.avg > 20 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${(qual.avg / 40) * 100}%` }}></div>
                       </div>
                     )}
                  </div>

                  <div className="space-y-3">
                     <p className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Zertifikat wählen:</p>
                     <div className="grid grid-cols-2 gap-3">
                        {['Hafiz', 'Imam', 'Alim', 'Ijazah', 'Quran-Khatam', 'Arabisch'].map(type => (
                           <Link 
                             key={type} 
                             to={`/certificate/${student.id}/${type}`}
                             className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter text-center transition-all border-2 ${hasGrades ? 'bg-white border-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-300 pointer-events-none'}`}
                           >
                              {type}
                           </Link>
                        ))}
                     </div>
                  </div>
               </div>

               {!hasGrades && (
                 <div className="px-8 pb-8 flex items-center gap-3 text-red-400 text-[9px] font-black uppercase">
                    <Info size={14} /> Keine Abschlussnoten erfasst
                 </div>
               )}
            </div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
         <div className="py-40 text-center opacity-10 flex flex-col items-center">
            <Award size={100} className="mb-6" />
            <p className="text-4xl font-black uppercase tracking-tighter italic">Keine Absolventen gefunden</p>
         </div>
      )}
    </div>
  );
};

export default CertificateManager;
