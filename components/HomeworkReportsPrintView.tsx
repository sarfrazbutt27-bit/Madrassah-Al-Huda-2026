
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Student, HomeworkReport, User, UserRole } from '../types';

interface HomeworkReportsPrintViewProps {
  students: Student[];
  reports: HomeworkReport[];
  currentUser: User;
}

const HomeworkReportsPrintView: React.FC<HomeworkReportsPrintViewProps> = ({ students, reports, currentUser }) => {
  const [searchParams] = useSearchParams();
  
  const filterStudent = searchParams.get('student') || '';
  const filterClass = searchParams.get('class') || '';
  const filterMonth = searchParams.get('month') || '';
  const filterYear = searchParams.get('year') || '';
  const filterStudentId = searchParams.get('studentId') || '';

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // Security: If student is logged in, they can ONLY see their own reports
      if (currentUser.role === UserRole.STUDENT && r.studentId !== currentUser.id) {
        return false;
      }
      
      // If a specific studentId was requested in URL (e.g. from HomeworkSystem), respect it
      if (filterStudentId && r.studentId !== filterStudentId) {
        return false;
      }

      const student = students.find(s => s.id === r.studentId);
      const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
      const matchesStudent = studentName.includes(filterStudent.toLowerCase());
      const matchesClass = filterClass === '' || (student && student.className === filterClass);
      
      const date = new Date(r.completedAt);
      const matchesMonth = filterMonth === '' || (date.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
      const matchesYear = filterYear === '' || date.getFullYear().toString() === filterYear;
      
      return matchesStudent && matchesClass && matchesMonth && matchesYear;
    }).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [reports, students, filterStudent, filterClass, filterMonth, filterYear, currentUser.id, currentUser.role, filterStudentId]);

  const monthName = filterMonth ? [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ][parseInt(filterMonth) - 1] : 'Alle Monate';

  return (
    <div className="p-10 bg-white min-h-screen text-black font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
          <div>
            <h1 className="text-4xl font-black uppercase italic leading-none">Hausaufgaben Berichte</h1>
            <p className="text-sm font-bold uppercase tracking-widest mt-2 text-gray-600">
              Archivierte Leistungen & Feedback
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Klasse / Zeitraum</p>
            <p className="text-xl font-black uppercase italic">{filterClass || 'Alle Klassen'} - {monthName} {filterYear}</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="border-2 border-black p-6 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Gesamtanzahl</p>
            <p className="text-3xl font-black">{filteredReports.length}</p>
          </div>
          <div className="border-2 border-black p-6 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Durchschnitt</p>
            <p className="text-3xl font-black">
              {filteredReports.length > 0 
                ? Math.round(filteredReports.reduce((acc, curr) => acc + curr.scorePercent, 0) / filteredReports.length)
                : 0}%
            </p>
          </div>
          <div className="border-2 border-black p-6 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Druckdatum</p>
            <p className="text-xl font-black">{new Date().toLocaleDateString('de-DE')}</p>
          </div>
        </div>

        {/* Table */}
        <div className="border-2 border-black rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Datum</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Schüler</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Aufgabe</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Ergebnis / Zeit</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Bewertung</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {filteredReports.map((report, idx) => {
                const student = students.find(s => s.id === report.studentId);
                return (
                  <tr key={report.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-4 text-xs font-bold">
                      {new Date(report.completedAt).toLocaleDateString('de-DE')}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-black uppercase">{student ? `${student.firstName} ${student.lastName}` : 'Unbekannt'}</p>
                      <p className="text-[10px] font-bold text-gray-500">{student?.className}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold">{report.assignmentTitle}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{report.subject}</p>
                    </td>
                    <td className="p-4 text-center font-black">
                      {report.assignmentType === 'Reading' ? (
                        <div className="flex flex-col items-center">
                          <span className="text-lg">{Math.floor((report.timeSpentSeconds || 0) / 60)} Min</span>
                          <span className="text-[8px] text-gray-400 uppercase">Lesezeit</span>
                        </div>
                      ) : (
                        <span className="text-lg">{report.scorePercent}%</span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1">{report.rating}</p>
                      {report.feedbackText && (
                        <p className="text-[10px] text-gray-500 italic leading-tight">
                          "{report.feedbackText}"
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-400 font-bold uppercase italic">
                    Keine Berichte für diesen Zeitraum gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t-2 border-gray-200 flex justify-between items-center">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Madrassah Al-Huda Portal - Hausaufgaben Archiv
          </p>
          <div className="flex gap-10">
            <div className="text-center">
              <div className="w-40 border-b border-black mb-2"></div>
              <p className="text-[10px] font-black uppercase text-gray-400">Unterschrift Lehrer</p>
            </div>
          </div>
        </div>

        {/* Print Button (Hidden on Print) */}
        <div className="mt-10 print:hidden flex justify-center">
          <button 
            onClick={() => window.print()}
            className="bg-black text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition-all shadow-2xl"
          >
            Jetzt Drucken
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white; }
          .print\\:hidden { display: none; }
        }
      `}} />
    </div>
  );
};

export default HomeworkReportsPrintView;
