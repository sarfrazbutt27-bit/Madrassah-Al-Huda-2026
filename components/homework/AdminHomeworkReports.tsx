
import React, { useMemo, useState } from 'react';
import { 
  ClipboardList, PieChart, BarChart3, TrendingUp, TrendingDown, 
  Users, Search, Download, Calendar, ArrowRight, ShieldAlert,
  ChevronRight, Euro, PenTool, CheckCircle2, AlertTriangle, Printer
} from 'lucide-react';
import { Student, Homework, HomeworkSubmission } from '../../types';

interface Props {
  students: Student[];
  homework: Homework[];
  submissions: HomeworkSubmission[];
}

const AdminHomeworkReports: React.FC<Props> = ({ students, homework, submissions }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('-').slice(0, 2).join('-'));
  const [classFilter, setClassFilter] = useState('Alle');

  const allClasses = useMemo(() => {
    const classes = Array.from(new Set(students.map(s => s.className)));
    return ['Alle', ...classes.sort()];
  }, [students]);

  const reportData = useMemo(() => {
    const relevantHw = homework.filter(h => 
      (classFilter === 'Alle' || h.classId === classFilter) && 
      h.createdAt.startsWith(selectedMonth)
    );

    const stats = relevantHw.map(h => {
      const classSize = students.filter(s => s.className === h.classId && s.status === 'active').length;
      const subCount = submissions.filter(s => s.homeworkId === h.id && s.status !== 'Open' && s.status !== 'Overdue').length;
      const rate = classSize > 0 ? (subCount / classSize) * 100 : 0;
      return { ...h, subCount, classSize, rate };
    });

    const avgRate = stats.length > 0 ? stats.reduce((acc, s) => acc + s.rate, 0) / stats.length : 0;
    
    // Students with repeated missing submissions (simplified mock logic)
    const atRisk = students.filter(s => {
      const studentSubs = submissions.filter(sub => sub.studentId === s.id);
      const missing = studentSubs.filter(sub => sub.status === 'Overdue' || sub.status === 'NotSubmitted').length;
      return missing >= 3;
    });

    return { stats, avgRate, atRisk };
  }, [homework, submissions, students, selectedMonth, classFilter]);

  const exportCSV = () => {
    const headers = ["Class", "Subject", "Title", "Date", "Submission Rate"];
    const rows = reportData.stats.map(s => [s.classId, s.subject, s.title, s.createdAt.split('T')[0], `${s.rate.toFixed(1)}%`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `HW-Report-${selectedMonth}.csv`;
    link.click();
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-indigo-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><ClipboardList size={300} /></div>
        <div className="relative z-10 flex items-center gap-10">
           <div className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] flex items-center justify-center shadow-2xl transform -rotate-3">
              <BarChart3 size={48} className="text-emerald-400" />
           </div>
           <div>
              <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">HW Analytics</h2>
              <p className="text-indigo-200/60 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 flex items-center gap-2">
                 <TrendingUp size={14} /> Global Performance Tracking
              </p>
           </div>
        </div>
        
        <div className="flex gap-4 relative z-10">
           <div className="bg-white/10 px-6 py-4 rounded-2xl flex items-center gap-3 border border-white/10">
              <Calendar className="text-emerald-400" size={18} />
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-transparent font-black uppercase text-xs outline-none cursor-pointer" />
           </div>
           <button onClick={exportCSV} className="bg-emerald-600 text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-700 transition-all">
              <Download size={18} /> Export CSV
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm text-center group hover:shadow-xl transition-all">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Submission Rate</p>
            <h3 className="text-5xl font-black text-emerald-600 italic leading-none">{reportData.avgRate.toFixed(1)}%</h3>
            <div className="w-24 h-1 bg-gray-50 mx-auto mt-6 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${reportData.avgRate}%` }}></div></div>
         </div>
         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm text-center group hover:shadow-xl transition-all">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Active Tasks</p>
            <h3 className="text-5xl font-black text-madrassah-950 italic leading-none">{reportData.stats.length}</h3>
            <p className="text-[8px] font-bold text-gray-300 uppercase mt-4 italic">Assignments this month</p>
         </div>
         <div className="bg-red-50 border-2 border-red-100 p-10 rounded-[3.5rem] shadow-sm text-center group hover:shadow-xl transition-all">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 mb-4">At Risk Students</p>
            <h3 className="text-5xl font-black text-red-700 italic leading-none">{reportData.atRisk.length}</h3>
            <p className="text-[8px] font-bold text-red-400 uppercase mt-4 italic">3+ missing assignments</p>
         </div>
      </div>

      <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-10 border-b bg-gray-50/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <h3 className="text-2xl font-black text-madrassah-950 uppercase italic tracking-tighter">Detailed Task Log</h3>
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="bg-white border border-gray-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase outline-none cursor-pointer shadow-sm">
               {allClasses.map(c => <option key={c} value={c}>{c === 'Alle' ? 'All Classes' : `Class ${c}`}</option>)}
            </select>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <tr>
                     <th className="px-10 py-6">Assignment</th>
                     <th className="px-6 py-6">Class</th>
                     <th className="px-6 py-6">Submissions</th>
                     <th className="px-6 py-6">Trend</th>
                     <th className="px-10 py-6 text-right">Details</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {reportData.stats.map(s => (
                    <tr key={s.id} className="hover:bg-madrassah-50/20 transition-all">
                       <td className="px-10 py-6">
                          <p className="font-black text-madrassah-950 uppercase italic text-sm">{s.title}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{s.subject}</p>
                       </td>
                       <td className="px-6 py-6 font-black text-xs text-indigo-600">CLASS {s.classId}</td>
                       <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                             <span className="font-black text-sm">{s.subCount}/{s.classSize}</span>
                             <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full ${s.rate > 80 ? 'bg-emerald-500' : s.rate > 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.rate}%` }}></div>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-6">
                          {s.rate > 85 ? <TrendingUp className="text-emerald-500" /> : <TrendingDown className="text-red-400" />}
                       </td>
                       <td className="px-10 py-6 text-right">
                          <button className="p-3 bg-gray-50 text-gray-400 hover:text-madrassah-950 rounded-xl transition-all shadow-sm">
                             <ChevronRight size={18} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default AdminHomeworkReports;
