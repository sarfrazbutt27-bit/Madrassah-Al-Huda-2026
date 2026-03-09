
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, Users, Briefcase } from 'lucide-react';
import { Student, User, UserRole } from '../types';
import LogoIcon from './LogoIcon';

interface FinancePrintViewProps {
  students: Student[];
  users: User[];
}

const FinancePrintView: React.FC<FinancePrintViewProps> = ({ students, users }) => {
  const { month } = useParams();
  const navigate = useNavigate();
  
  const selectedMonth = month || new Date().toISOString().split('T').slice(0, 2).join('-');
  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthName = new Date(parseInt(yearStr), parseInt(monthStr) - 1).toLocaleString('de-DE', { month: 'long' });

  const activeStudents = useMemo(() => students.filter(s => s.status === 'active').sort((a, b) => a.lastName.localeCompare(b.lastName)), [students]);
  const activeTeachers = useMemo(() => users.filter(u => u.role === UserRole.TEACHER).sort((a, b) => a.name.localeCompare(b.name)), [users]);

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

  const getTeacherSalary = React.useCallback((teacher: User) => {
    const title = teacher.teacherTitle;
    if (title === 'Alim' || title === 'Alima' || title === 'Imam') return 500;
    if (title === 'Quran Lehrer' || title === 'Tajweed Lehrer' || title === 'Arabisch Lehrer') return 300;
    return 200;
  }, []);

  const totals = useMemo(() => {
    const incomeExpected = activeStudents.reduce((sum, s) => sum + getStudentFee(s), 0);
    const incomeReceived = activeStudents.reduce((sum, s) => sum + (s.feesPaidMonthly?.[selectedMonth] ? getStudentFee(s) : 0), 0);
    const expensesExpected = activeTeachers.reduce((sum, t) => sum + getTeacherSalary(t), 0);
    const expensesPaid = activeTeachers.reduce((sum, t) => sum + (t.salaryPaidMonthly?.[selectedMonth] ? getTeacherSalary(t) : 0), 0);
    
    return {
      incomeExpected,
      incomeReceived,
      expensesExpected,
      expensesPaid,
      balance: incomeReceived - expensesPaid
    };
  }, [activeStudents, activeTeachers, selectedMonth, getStudentFee, getTeacherSalary]);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white pb-20">
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase"><ChevronLeft size={16} /> Zurück</button>
        <button onClick={() => window.print()} className="bg-emerald-500 text-white px-10 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-3 shadow-lg hover:scale-105 transition-all"><Printer size={20} /> Bericht als PDF / Druck</button>
      </div>

      <div className="p-8 print:p-0 mx-auto w-full max-w-[210mm] text-black">
        <div className="bg-white p-12 print:p-8 shadow-2xl print:shadow-none min-h-[297mm] flex flex-col border border-gray-200 print:border-none">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-[4px] border-black pb-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-black text-white rounded-2xl"><LogoIcon className="w-16 h-16" /></div>
              <div>
                <h1 className="text-4xl font-black uppercase italic leading-none">Madrassah Al-Huda</h1>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500 mt-2">Monatsabschlussbericht • Hamburg</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-black text-white px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3 rounded-lg">Kassenbericht Intern</div>
              <p className="text-xl font-black italic">{monthName} {yearStr}</p>
            </div>
          </div>

          {/* Finanz-Zusammenfassung */}
          <div className="grid grid-cols-3 gap-6 mb-10">
             <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase text-emerald-600 mb-2">Einnahmen (Ist)</p>
                <p className="text-3xl font-black text-emerald-950">{totals.incomeReceived.toFixed(2)} €</p>
             </div>
             <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase text-red-600 mb-2">Ausgaben (Ist)</p>
                <p className="text-3xl font-black text-red-950">{totals.expensesPaid.toFixed(2)} €</p>
             </div>
             <div className={`p-6 rounded-3xl text-center border-2 ${totals.balance >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-orange-50 border-orange-200'}`}>
                <p className="text-[10px] font-black uppercase text-indigo-600 mb-2">Saldo / Bilanz</p>
                <p className="text-3xl font-black text-indigo-950">{totals.balance.toFixed(2)} €</p>
             </div>
          </div>

          <div className="space-y-10 flex-1">
             {/* Einnahmen-Tabelle */}
             <section>
                <h3 className="text-[11px] font-black uppercase bg-gray-100 px-4 py-2 border-l-4 border-black italic mb-4 flex items-center gap-3">
                   <Users size={16}/> 1. Zahlungseingänge (Schülerbeiträge)
                </h3>
                <table className="w-full border-collapse border-2 border-black font-sans text-[10px]">
                   <thead>
                      <tr className="bg-gray-50 uppercase font-black border-b-2 border-black">
                         <th className="p-3 text-left border-r border-black">Teilnehmer</th>
                         <th className="p-3 text-center border-r border-black">Klasse</th>
                         <th className="p-3 text-right border-r border-black">Soll</th>
                         <th className="p-3 text-center">Status</th>
                      </tr>
                   </thead>
                   <tbody>
                      {activeStudents.map((s) => (
                        <tr key={s.id} className="border-b border-black/10 h-10 italic">
                           <td className="p-3 border-r border-black font-bold uppercase">{s.firstName} {s.lastName}</td>
                           <td className="p-3 border-r border-black text-center font-bold text-gray-500">{s.className}</td>
                           <td className="p-3 border-r border-black text-right font-black">{getStudentFee(s).toFixed(2)} €</td>
                           <td className="p-3 text-center">
                              {s.feesPaidMonthly?.[selectedMonth] ? 
                                <span className="text-emerald-700 font-black uppercase text-[8px]">ERHALTEN ✓</span> : 
                                <span className="text-red-500 font-black uppercase text-[8px]">OFFEN !</span>
                              }
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </section>

             {/* Ausgaben-Tabelle */}
             <section>
                <h3 className="text-[11px] font-black uppercase bg-gray-100 px-4 py-2 border-l-4 border-black italic mb-4 flex items-center gap-3">
                   <Briefcase size={16}/> 2. Personalaufwendungen (Dozentenhonorare)
                </h3>
                <table className="w-full border-collapse border-2 border-black font-sans text-[10px]">
                   <thead>
                      <tr className="bg-gray-50 uppercase font-black border-b-2 border-black">
                         <th className="p-3 text-left border-r border-black">Lehrkraft / Titel</th>
                         <th className="p-3 text-right border-r border-black">Honorar</th>
                         <th className="p-3 text-center">Status</th>
                      </tr>
                   </thead>
                   <tbody>
                      {activeTeachers.map((t) => (
                        <tr key={t.id} className="border-b border-black/10 h-12 italic">
                           <td className="p-3 border-r border-black">
                              <div className="font-bold uppercase">{t.name}</div>
                              <div className="text-[8px] text-gray-400 font-sans italic">{t.teacherTitle}</div>
                           </td>
                           <td className="p-3 border-r border-black text-right font-black">{getTeacherSalary(t).toFixed(2)} €</td>
                           <td className="p-3 text-center">
                              {t.salaryPaidMonthly?.[selectedMonth] ? 
                                <span className="text-indigo-700 font-black uppercase text-[8px]">AUSBEZAHLT ✓</span> : 
                                <span className="text-red-500 font-black uppercase text-[8px]">AUSSTEHEND</span>
                              }
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </section>
          </div>

          {/* Footer / Bestätigung */}
          <div className="grid grid-cols-2 gap-40 pt-20 pb-10">
             <div className="text-center border-t border-black pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Prüfung Buchhaltung</p>
                <p className="text-xs font-bold uppercase italic">Madrassah Al-Huda Hamburg</p>
             </div>
             <div className="text-center border-t border-black pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Freigabe Schulleitung</p>
                <p className="text-xs font-bold uppercase italic">Datum: {new Date().toLocaleDateString('de-DE')}</p>
             </div>
          </div>

          <div className="mt-auto pt-6 text-[8px] font-black text-gray-300 uppercase tracking-[0.5em] flex justify-between border-t border-dotted border-gray-200">
             <span>Digital Finance Ledger &copy; 2026 • FISCAL VERIFIED</span>
             <span>Report ID: FIN-{selectedMonth}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default FinancePrintView;
