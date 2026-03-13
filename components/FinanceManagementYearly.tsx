
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Euro, ChevronLeft, 
  Sparkles, Loader2, Printer, Landmark
} from 'lucide-react';
import { Student, User, UserRole } from '../types';
import { GoogleGenAI } from "@google/genai";
import LogoIcon from './LogoIcon';

interface FinanceManagementYearlyProps {
  students: Student[];
  users: User[];
}

const FinanceManagementYearly: React.FC<FinanceManagementYearlyProps> = ({ students, users }) => {
  const { year } = useParams();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(parseInt(year || String(new Date().getFullYear())));
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const months = useMemo(() => [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ], []);

  const activeStudents = useMemo(() => students.filter(s => s.status === 'active'), [students]);

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
    if (title === 'Yassarnal Quran Lehrer' || title === 'Tajweed Lehrer' || title === 'Arabisch Lehrer') return 300;
    return 200;
  }, []);

  const yearlyStats = useMemo(() => {
    const monthlyData = months.map((monthName, index) => {
      const monthKey = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
      
      let income = 0;
      let expectedIncome = 0;
      activeStudents.forEach(s => {
        const fee = getStudentFee(s);
        expectedIncome += fee;
        if (s.feesPaidMonthly?.[monthKey]) income += fee;
      });

      let expenses = 0;
      let expectedExpenses = 0;
      users.filter(u => u.role === UserRole.TEACHER).forEach(u => {
        const salary = getTeacherSalary(u);
        expectedExpenses += salary;
        if (u.salaryPaidMonthly?.[monthKey]) expenses += salary;
      });

      return {
        month: monthName,
        income,
        expectedIncome,
        expenses,
        expectedExpenses,
        balance: income - expenses
      };
    });

    const totalIncome = monthlyData.reduce((acc, m) => acc + m.income, 0);
    const totalExpectedIncome = monthlyData.reduce((acc, m) => acc + m.expectedIncome, 0);
    const totalExpenses = monthlyData.reduce((acc, m) => acc + m.expenses, 0);
    const totalExpectedExpenses = monthlyData.reduce((acc, m) => acc + m.expectedExpenses, 0);

    return { 
      monthlyData, 
      totalIncome, 
      totalExpectedIncome, 
      totalExpenses, 
      totalExpectedExpenses,
      netBalance: totalIncome - totalExpenses 
    };
  }, [activeStudents, users, selectedYear, getStudentFee, getTeacherSalary, months]);

  const generateAiAudit = async () => {
    setIsGeneratingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const statsSummary = yearlyStats.monthlyData.map(m => `${m.month}: In ${m.income}€, Out ${m.expenses}€`).join('\n');
      const prompt = `Analysiere den Jahresabschluss für Madrassah Al-Huda für ${selectedYear}.
      Gesamtumsatz: ${yearlyStats.totalIncome}€ (Soll: ${yearlyStats.totalExpectedIncome}€).
      Personalkosten: ${yearlyStats.totalExpenses}€ (Soll: ${yearlyStats.totalExpectedExpenses}€).
      Erstelle ein kurzes, professionelles Audit-Resümee (3-4 Sätze) zur finanziellen Stabilität und Zahlungsquote auf Deutsch.`;

      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      if (response.text) setAiAnalysis(response.text.trim());
    } catch (e) {
      setAiAnalysis("KI-Finanzanalyse derzeit nicht möglich.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-700">
      <div className="no-print flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 gap-6">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="p-4 bg-gray-50 text-madrassah-950 rounded-2xl hover:bg-white transition-all shadow-sm">
             <ChevronLeft size={24} />
           </button>
           <div>
              <h2 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Jahresbilanz {selectedYear}</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] mt-1 tracking-widest italic">Zentraler Kassenabschluss</p>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="bg-gray-100 p-1.5 rounded-2xl flex border border-gray-200">
              {[2025, 2026, 2027].map(y => (
                <button key={y} onClick={() => setSelectedYear(y)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${selectedYear === y ? 'bg-madrassah-950 text-white shadow-lg' : 'text-gray-400 hover:text-madrassah-950'}`}>
                  {y}
                </button>
              ))}
           </div>
           {!aiAnalysis && (
             <button onClick={generateAiAudit} disabled={isGeneratingAi} className="bg-purple-50 text-purple-700 px-8 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 border border-purple-100 hover:bg-purple-100 transition-all">
                {isGeneratingAi ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} KI-Audit
             </button>
           )}
           <button onClick={() => window.print()} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-emerald-700">
              <Printer size={20} /> Drucken
           </button>
        </div>
      </div>

      <div className="bg-white p-[15mm] print:p-8 rounded-[4rem] shadow-2xl print:shadow-none min-h-[297mm] flex flex-col border border-gray-200 print:border-none font-sans relative">
        
        <div className="flex justify-between items-start border-b-[6px] border-black pb-10 mb-12">
          <div className="flex items-center gap-8">
            <div className="p-5 bg-black text-white rounded-[2.5rem] shadow-xl">
               <LogoIcon className="w-16 h-16" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter leading-none italic">Madrassah Al-Huda</h1>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500 mt-3">Akademie-Jahresabschluss • Hamburg</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-black text-white px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] mb-4 rounded-xl">FINANZJAHR {selectedYear}</div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">Bericht generiert: {new Date().toLocaleDateString('de-DE')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-16">
          <div className="bg-emerald-50 border-2 border-emerald-100 p-10 rounded-[3.5rem] text-center">
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-4">Einnahmen (Netto)</p>
            <h3 className="text-5xl font-black text-emerald-950 italic">{yearlyStats.totalIncome.toFixed(2)} €</h3>
            <p className="text-[8px] font-bold text-emerald-700/60 mt-4 uppercase italic">Prognose: {yearlyStats.totalExpectedIncome.toFixed(2)} €</p>
          </div>

          <div className="bg-red-50 border-2 border-red-100 p-10 rounded-[3.5rem] text-center">
            <p className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-4">Personalausgaben</p>
            <h3 className="text-5xl font-black text-red-950 italic">{yearlyStats.totalExpenses.toFixed(2)} €</h3>
            <p className="text-[8px] font-bold text-red-700/60 mt-4 uppercase italic">Dozenten Honorare</p>
          </div>

          <div className={`p-10 rounded-[3.5rem] border-2 text-center flex flex-col justify-center ${yearlyStats.netBalance >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-4">Jahresergebnis</p>
            <h3 className={`text-4xl font-black italic ${yearlyStats.netBalance >= 0 ? 'text-indigo-950' : 'text-orange-950'}`}>{yearlyStats.netBalance.toFixed(2)} €</h3>
          </div>
        </div>

        {aiAnalysis && (
           <div className="mb-16 bg-purple-50/50 border-2 border-dashed border-purple-200 p-10 rounded-[3.5rem] relative overflow-hidden italic">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-purple-950"><Sparkles size={100}/></div>
              <h3 className="text-sm font-black uppercase text-purple-900 tracking-widest mb-6 not-italic flex items-center gap-3">
                <Sparkles size={18} /> Ökonomisches Audit (Gemini 3 Pro)
              </h3>
              <p className="text-xl font-medium text-purple-950 leading-relaxed">"{aiAnalysis}"</p>
           </div>
        )}

        <div className="flex-1 border-2 border-black rounded-[3rem] overflow-hidden mb-12 bg-white">
           <table className="w-full text-[11px] border-collapse">
              <thead>
                 <tr className="bg-gray-100 uppercase font-black border-b-2 border-black text-gray-500">
                    <th className="p-6 text-left border-r-2 border-black">Abrechnungsmonat</th>
                    <th className="p-6 text-right border-r-2 border-black">Einnahmen</th>
                    <th className="p-6 text-right border-r-2 border-black">Ausgaben</th>
                    <th className="p-6 text-right">Monatssaldo</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {yearlyStats.monthlyData.map((m) => (
                    <tr key={m.month} className="h-12 italic group hover:bg-gray-50">
                       <td className="p-6 border-r-2 border-black font-black uppercase text-madrassah-950">{m.month}</td>
                       <td className="p-6 text-right border-r-2 border-black font-bold">{m.income.toFixed(2)} €</td>
                       <td className="p-6 text-right border-r-2 border-black font-bold text-red-600">-{m.expenses.toFixed(2)} €</td>
                       <td className={`p-6 text-right font-black ${m.balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {m.balance >= 0 ? '+' : ''}{m.balance.toFixed(2)} €
                       </td>
                    </tr>
                 ))}
                 <tr className="bg-madrassah-950 text-white font-black h-20">
                    <td className="p-8 border-r-2 border-white/20 uppercase italic text-xl">SUMME GESAMTJAHR</td>
                    <td className="p-8 text-right border-r-2 border-white/20 text-2xl">{yearlyStats.totalIncome.toFixed(2)} €</td>
                    <td className="p-8 text-right border-r-2 border-white/20 text-2xl text-red-400">-{yearlyStats.totalExpenses.toFixed(2)} €</td>
                    <td className="p-8 text-right text-4xl italic">{yearlyStats.netBalance.toFixed(2)} €</td>
                 </tr>
              </tbody>
           </table>
        </div>

        <div className="grid grid-cols-2 gap-32 pt-16 mt-auto">
           <div className="text-center">
              <div className="h-[1px] bg-black w-full mb-4"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-madrassah-950 italic">Finanzprüfung / Buchhaltung</p>
           </div>
           <div className="text-center">
              <div className="h-[1px] bg-black w-full mb-4"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-madrassah-950 italic">Zertifizierung Vorstand</p>
              <p className="text-[8px] font-bold text-gray-400 mt-2">Sarfraz Azmat Butt</p>
           </div>
        </div>

        <div className="pt-10 border-t border-dotted border-gray-200 flex justify-between items-center text-[7px] font-black text-gray-300 uppercase tracking-[0.5em]">
           <span>MADRASSAH AL-HUDA &copy; 2026 • FISCAL IDENTITY VERIFIED • HASH: {selectedYear}</span>
           <div className="flex items-center gap-4">
              <Landmark size={12} className="opacity-30" />
              <span>ANNUAL-AUDIT-FY{selectedYear}</span>
           </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .shadow-2xl { box-shadow: none !important; }
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>
    </div>
  );
};

export default FinanceManagementYearly;
