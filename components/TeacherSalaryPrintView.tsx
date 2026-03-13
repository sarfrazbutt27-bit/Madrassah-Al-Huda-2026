import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, Download, CheckCircle2, XCircle, Euro, Landmark, Briefcase } from 'lucide-react';
import { User } from '../types';
import LogoIcon from './LogoIcon';

interface TeacherSalaryPrintViewProps {
  users: User[];
}

const TeacherSalaryPrintView: React.FC<TeacherSalaryPrintViewProps> = ({ users }) => {
  const { month } = useParams();
  const navigate = useNavigate();
  
  const selectedMonth = month || new Date().toISOString().split('T').slice(0, 2).join('-');
  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthName = new Date(parseInt(yearStr), parseInt(monthStr) - 1).toLocaleString('de-DE', { month: 'long' });

  const teachers = users.filter(u => u.role === 'TEACHER').sort((a, b) => a.name.localeCompare(b.name));

  const getTeacherSalary = (teacher: User) => {
    const title = teacher.teacherTitle;
    if (title === 'Alim' || title === 'Alima' || title === 'Imam') return 500;
    if (title === 'Yassarnal Quran Lehrer' || title === 'Tajweed Lehrer' || title === 'Arabisch Lehrer') return 300;
    if (title === 'Aushelfer') return 200;
    return 300;
  };

  const totalExpected = teachers.reduce((sum, t) => sum + getTeacherSalary(t), 0);
  const totalPaid = teachers.reduce((sum, t) => sum + (t.salaryPaidMonthly?.[selectedMonth] ? getTeacherSalary(t) : 0), 0);
  const totalOpen = totalExpected - totalPaid;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white pb-10">
      {/* Controls */}
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Zurück
          </button>
          <div>
            <h1 className="text-lg font-black uppercase italic leading-none">Personal-Abrechnung Vorschau</h1>
            <p className="text-[10px] opacity-60 font-bold uppercase mt-1">{monthName} {yearStr}</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-3 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl transition-all transform hover:scale-105"
        >
          <Printer size={18} /> Auszahlungsliste drucken
        </button>
      </div>

      {/* Report Content */}
      <div className="p-8 print:p-0 font-sans text-black mx-auto w-full max-w-5xl print:max-w-none">
        <div className="bg-white p-12 print:p-8 shadow-2xl print:shadow-none min-h-[297mm] flex flex-col border border-gray-200 print:border-none">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-indigo-950 text-white rounded-2xl shadow-lg">
                 <LogoIcon className="w-14 h-14" />
              </div>
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none italic">Madrassah Al-Huda</h1>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500 mt-2">Dienstleistungs-Abrechnung Hamburg</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="bg-indigo-950 text-white px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3 rounded-lg">PERSONAL-AUSZAHLUNGSBERICHT</div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">DATUM: {new Date().toLocaleDateString('de-DE')}</p>
            </div>
          </div>

          <div className="mb-10">
             <h2 className="text-3xl font-black uppercase italic tracking-tighter text-madrassah-950 mb-2">Abrechnungszeitraum: {monthName} {yearStr}</h2>
             <div className="h-1.5 w-32 bg-indigo-500"></div>
          </div>

          {/* Summary Stats Grid */}
          <div className="grid grid-cols-3 gap-6 mb-12">
             <div className="bg-gray-50 border-2 border-black p-6 rounded-2xl flex flex-col items-center">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Honorarsumme (Soll)</p>
                <p className="text-4xl font-black italic">{totalExpected.toFixed(2)} €</p>
             </div>
             <div className="bg-indigo-50 border-2 border-indigo-600 p-6 rounded-2xl flex flex-col items-center">
                <p className="text-[10px] font-black uppercase text-indigo-600 mb-2">Bereits Ausbezahlt</p>
                <p className="text-4xl font-black text-indigo-700 italic">{totalPaid.toFixed(2)} €</p>
             </div>
             <div className="bg-red-50 border-2 border-red-600 p-6 rounded-2xl flex flex-col items-center">
                <p className="text-[10px] font-black uppercase text-red-600 mb-2">Offene Posten</p>
                <p className="text-4xl font-black text-red-700 italic">{totalOpen.toFixed(2)} €</p>
             </div>
          </div>

          {/* Main List */}
          <div className="border-2 border-black rounded-2xl overflow-hidden flex-1 mb-10">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-gray-100 uppercase font-black border-b-2 border-black">
                  <th className="p-4 text-left border-r-2 border-black">Dozent / ID</th>
                  <th className="p-4 text-center border-r-2 border-black">Qualifikation</th>
                  <th className="p-4 text-center border-r-2 border-black">Zuweisung</th>
                  <th className="p-4 text-right border-r-2 border-black">Honorar</th>
                  <th className="p-4 text-center">Auszahlungs-Status</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, idx) => {
                  const salary = getTeacherSalary(teacher);
                  const isPaid = !!teacher.salaryPaidMonthly?.[selectedMonth];
                  return (
                    <tr key={teacher.id} className={`border-b border-gray-200 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="p-4 border-r-2 border-black">
                         <div className="font-bold uppercase italic">{teacher.name}</div>
                         <div className="text-[8px] text-gray-400 mt-0.5">Personal-ID: {teacher.id}</div>
                      </td>
                      <td className="p-4 text-center border-r-2 border-black font-black uppercase text-indigo-600">{teacher.teacherTitle || 'Lehrkraft'}</td>
                      <td className="p-4 text-center border-r-2 border-black">
                         <div className="flex flex-wrap justify-center gap-1">
                            {teacher.assignedClasses?.map(c => <span key={c} className="bg-gray-100 px-1.5 py-0.5 rounded text-[7px] font-black">{c}</span>)}
                         </div>
                      </td>
                      <td className="p-4 text-right border-r-2 border-black font-black text-sm">{salary.toFixed(2)} €</td>
                      <td className="p-4 text-center">
                         {isPaid ? (
                           <span className="inline-flex items-center gap-1.5 text-emerald-700 font-black uppercase text-[9px]">
                             <CheckCircle2 size={12}/> Überwiesen
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1.5 text-red-600 font-black uppercase text-[9px]">
                             <XCircle size={12}/> Ausstehend
                           </span>
                         )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Verification Section */}
          <div className="grid grid-cols-2 gap-20 mb-16 pt-10">
             <div className="text-center">
                <div className="h-[1px] bg-black w-full mb-4"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-black">Finanzabteilung / Buchhaltung</p>
                <p className="text-[8px] text-gray-400 mt-1 italic">Freigabe zur Auszahlung</p>
             </div>
             <div className="text-center">
                <div className="h-[1px] bg-black w-full mb-4"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-black">Bestätigung Schulleitung</p>
                <p className="text-[8px] text-gray-400 mt-1 italic">Sarfraz Azmat Butt</p>
             </div>
          </div>

          {/* System Footer Area */}
          <div className="mt-auto pt-6 border-t border-dotted border-gray-200 flex justify-between items-center text-[7px] font-black text-gray-300 uppercase tracking-[0.4em]">
             <span>Madrassah Al-Huda Campus Portal &copy; 2026 • DIGITAL PAYROLL VERIFIED</span>
             <span className="flex items-center gap-4">
                ID: PR-{selectedMonth}
                <Briefcase size={10} className="grayscale opacity-20" />
             </span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0.5cm; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default TeacherSalaryPrintView;