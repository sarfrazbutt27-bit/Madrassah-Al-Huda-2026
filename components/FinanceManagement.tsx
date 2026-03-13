
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Euro, Calendar, CreditCard, Search, Printer, Users, TrendingUp, TrendingDown, Briefcase, BarChart3 } from 'lucide-react';
import { Student, User as UserType, UserRole } from '../types';

interface FinanceManagementProps {
  students: Student[];
  users: UserType[];
  onUpdateStudents: (s: Student[], itemsToSync?: Student[]) => void;
  onUpdateUsers: (u: UserType[]) => void;
}

const FinanceManagement: React.FC<FinanceManagementProps> = ({ students, users, onUpdateStudents, onUpdateUsers }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [selectedMonth, setSelectedMonth] = useState(() => {
     const now = new Date();
     return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchTerm, setSearchTerm] = useState('');

  const activeStudents = useMemo(() => students.filter(s => s.status === 'active'), [students]);
  const activeTeachers = useMemo(() => users.filter(u => u && u.role === UserRole.TEACHER), [users]);
  
  const getStudentFee = React.useCallback((student: Student) => {
    if (!student || !student.className) return 0;
    
    // Special class "Ilmiya" always 100€
    if (student.className.toLowerCase().includes('ilmiya')) return 100;

    const familyMembers = activeStudents.filter(s => s.familyId === student.familyId);
    const count = familyMembers.length;
    
    if (count === 1) return 30;
    if (count === 2) return 25; // 50 total for family of 2
    return 20; // 20 each for family of 3 or more
  }, [activeStudents]);

  const getTeacherSalary = React.useCallback((teacher: UserType) => {
    if (!teacher) return 0;
    const title = teacher.teacherTitle;
    if (title === 'Alim' || title === 'Alima' || title === 'Imam') return 500;
    if (title === 'Yassarnal Quran Lehrer' || title === 'Tajweed Lehrer' || title === 'Arabisch Lehrer') return 300;
    return 200;
  }, []);

  const groupedStudents = useMemo(() => {
    const list = activeStudents.filter(s => {
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const matchSearch = fullName.includes(searchTerm.toLowerCase());
      const matchId = s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFam = s.familyId.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch || matchId || matchFam;
    });

    return list.sort((a, b) => {
      if (a.familyId !== b.familyId) return a.familyId.localeCompare(b.familyId);
      return (a.lastName || '').localeCompare(b.lastName || '');
    });
  }, [activeStudents, searchTerm]);

  const filteredTeachers = useMemo(() => {
    return activeTeachers.filter(u => u && (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [activeTeachers, searchTerm]);

  const stats = useMemo(() => {
    let incomeExpected = 0;
    let incomeReceived = 0;
    activeStudents.forEach(s => {
      const fee = getStudentFee(s);
      incomeExpected += fee;
      if (s.feesPaidMonthly?.[selectedMonth]) incomeReceived += fee;
    });

    let expensesPaid = 0;
    activeTeachers.forEach(t => {
      if (t.salaryPaidMonthly?.[selectedMonth]) expensesPaid += getTeacherSalary(t);
    });

    return { incomeExpected, incomeReceived, expensesPaid, balance: incomeReceived - expensesPaid };
  }, [activeStudents, activeTeachers, selectedMonth, getStudentFee, getTeacherSalary]);

  const toggleStudentPayment = (studentId: string) => {
    let updatedStudent: Student | undefined;
    const updated = students.map(s => {
      if (s.id === studentId) {
        const currentPaid = !!s.feesPaidMonthly?.[selectedMonth];
        updatedStudent = { ...s, feesPaidMonthly: { ...(s.feesPaidMonthly || {}), [selectedMonth]: !currentPaid } };
        return updatedStudent;
      }
      return s;
    });
    if (updatedStudent) {
      onUpdateStudents(updated, [updatedStudent]);
    }
  };

  const toggleTeacherPayment = (teacherId: string) => {
    const updated = users.map(u => {
      if (u.id === teacherId) {
        const currentPaid = !!u.salaryPaidMonthly?.[selectedMonth];
        return { ...u, salaryPaidMonthly: { ...(u.salaryPaidMonthly || {}), [selectedMonth]: !currentPaid } };
      }
      return u;
    });
    onUpdateUsers(updated);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-emerald-950 rotate-12"><Euro size={280} /></div>
        <div className="relative z-10 flex items-center gap-10">
          <div className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-2xl text-white transform -rotate-3">
             <CreditCard size={48} />
          </div>
          <div>
            <h2 className="text-5xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Finanzbuchung</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] mt-4 tracking-[0.4em] italic">Campus Budget-Verwaltung & Monitoring</p>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap gap-4 no-print">
           <button 
             onClick={() => navigate(`/finance/yearly/${selectedMonth.split('-')[0]}`)}
             className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] shadow-2xl flex items-center gap-3 hover:bg-black transition-all"
           >
              <BarChart3 size={20}/> Jahresabschluss
           </button>
           <div className="bg-gray-50 border border-gray-100 px-8 py-4 rounded-3xl flex items-center gap-4 shadow-inner">
              <Calendar className="text-emerald-600" size={20} />
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent font-black text-madrassah-950 outline-none uppercase text-xs cursor-pointer" />
           </div>
           <button onClick={() => navigate(`/finance/report/${selectedMonth}`)} className="bg-madrassah-950 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] shadow-2xl flex items-center gap-3 hover:bg-black transition-all">
              <Printer size={20}/> Monatsbericht
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-600"><TrendingUp size={100}/></div>
            <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Einnahmen (Ist)</p>
            <h3 className="text-5xl font-black text-emerald-600 italic">{stats.incomeReceived.toFixed(2)} €</h3>
            <p className="text-[8px] font-bold text-gray-300 uppercase mt-4 italic">Erwartet (Soll): {stats.incomeExpected.toFixed(2)} €</p>
         </div>
         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-red-600"><TrendingDown size={100}/></div>
            <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Honorare (Ist)</p>
            <h3 className="text-5xl font-black text-red-600 italic">{stats.expensesPaid.toFixed(2)} €</h3>
         </div>
         <div className={`p-10 rounded-[3.5rem] border-4 shadow-sm text-center flex flex-col justify-center ${stats.balance >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-[10px] font-black uppercase mb-4 tracking-widest ${stats.balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>Bilanz</p>
            <h3 className={`text-5xl font-black italic ${stats.balance >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>{stats.balance.toFixed(2)} €</h3>
         </div>
      </div>

      <div className="bg-white rounded-[4.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-10 border-b flex flex-col md:flex-row justify-between items-center bg-gray-50/20 gap-8">
           <div className="flex gap-4 p-1.5 bg-white rounded-[2rem] border border-gray-100 shadow-sm no-print">
              <button onClick={() => setActiveTab('students')} className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'students' ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}><Users size={16} /> Schüler-Beiträge</button>
              <button onClick={() => setActiveTab('teachers')} className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'teachers' ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}><Briefcase size={16} /> Lehrer-Honorare</button>
           </div>
           <div className="relative flex-1 w-full max-w-md no-print">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input type="text" placeholder="Suche..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-white border-2 border-gray-100 rounded-[2.5rem] outline-none font-bold text-sm shadow-sm" />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] border-b">
              <tr>
                <th className="px-12 py-10">Name / Familie</th>
                <th className="px-8 py-10 text-center">Modell / Rabatt</th>
                <th className="px-8 py-10 text-center">Monatsbeitrag</th>
                <th className="px-12 py-10 text-right no-print">Zahlungseingang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeTab === 'students' ? (
                groupedStudents.map((student) => {
                  const fee = getStudentFee(student);
                  const isPaid = !!student.feesPaidMonthly?.[selectedMonth];
                  return (
                    <tr key={student.id} className="hover:bg-emerald-50/10 transition-all">
                      <td className="px-12 py-8">
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${student.gender === 'Junge' || student.gender === 'Mann' ? 'bg-indigo-50 text-indigo-700' : 'bg-pink-50 text-pink-700'}`}>
                               {student.firstName.charAt(0)}
                            </div>
                            <div>
                               <p className="font-black text-gray-900 text-xl uppercase italic leading-none">{student.firstName} {student.lastName}</p>
                               <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">ID: {student.id} • FAM: {student.familyId}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-8 text-center">
                         <span className="bg-gray-50 text-gray-400 px-4 py-1.5 rounded-xl text-[8px] font-black uppercase border border-gray-100">Regulär</span>
                      </td>
                      <td className="px-8 py-8 text-center font-black text-3xl italic text-madrassah-950">{fee.toFixed(2)} €</td>
                      <td className="px-12 py-8 text-right no-print">
                         <button onClick={() => toggleStudentPayment(student.id)} className={`px-10 py-4 rounded-[2.5rem] font-black uppercase text-[10px] shadow-xl transition-all ${isPaid ? 'bg-emerald-600 text-white' : 'bg-white text-red-500 border-2 hover:bg-red-50'}`}>
                            {isPaid ? 'BEZAHLT ✓' : 'OFFEN !'}
                         </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                filteredTeachers.map((teacher) => {
                  const salary = getTeacherSalary(teacher);
                  const isPaid = !!teacher.salaryPaidMonthly?.[selectedMonth];
                  return (
                    <tr key={teacher.id} className="hover:bg-indigo-50/10">
                       <td className="px-12 py-8">
                          <p className="font-black uppercase italic text-lg text-madrassah-950 leading-none">{teacher.name}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Personal-ID: {teacher.id}</p>
                       </td>
                       <td className="px-8 py-8 text-center">
                          <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-[8px] font-black uppercase border border-indigo-100">{teacher.teacherTitle}</span>
                       </td>
                       <td className="px-8 py-8 text-center font-black text-3xl italic">{salary.toFixed(2)} €</td>
                       <td className="px-12 py-8 text-right no-print">
                          <button onClick={() => toggleTeacherPayment(teacher.id)} className={`px-10 py-4 rounded-[2.5rem] font-black uppercase text-[10px] shadow-xl transition-all ${isPaid ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-400 border-2 hover:bg-indigo-50'}`}>
                             {isPaid ? 'AUSBEZAHLT ✓' : 'BUCHEN'}
                          </button>
                       </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceManagement;
