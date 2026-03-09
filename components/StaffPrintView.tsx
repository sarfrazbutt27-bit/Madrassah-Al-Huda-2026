
import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, ShieldCheck, Briefcase, Phone, Hash, Calendar } from 'lucide-react';
import { User, Student, UserRole } from '../types';
import LogoIcon from './LogoIcon';

interface StaffPrintViewProps {
  users: User[];
  students: Student[];
}

const StaffPrintView: React.FC<StaffPrintViewProps> = ({ users, students }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filter = searchParams.get('filter') || 'Alle';

  const filteredStaff = useMemo(() => {
    return users.filter(u => {
      if (filter === 'Alle') return true;
      return u.assignedClasses?.includes(filter);
    }).sort((a, b) => (a.lastName || a.name || '').localeCompare(b.lastName || b.name || ''));
  }, [users, filter]);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white pb-20 font-sans text-black">
      {/* Control Bar */}
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all">
              <ChevronLeft size={16} /> Zurück
           </button>
           <div>
              <h1 className="text-lg font-black uppercase italic leading-none text-yellow-400">Offizielles Dienstregister</h1>
              <p className="text-[10px] font-bold text-white/50 uppercase mt-1">Gefiltert nach: {filter === 'Alle' ? 'Gesamt-Personal' : `Klasse ${filter}`}</p>
           </div>
        </div>
        <button onClick={() => window.print()} className="bg-emerald-500 text-white px-10 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-3 shadow-lg hover:scale-105 transition-all">
          <Printer size={20} /> Dienstliste drucken / PDF
        </button>
      </div>

      {/* A4 Landscape Document */}
      <div className="p-8 print:p-0 mx-auto w-full max-w-[297mm]">
        <div className="bg-white p-12 print:p-8 shadow-2xl print:shadow-none min-h-[210mm] flex flex-col border border-gray-200 print:border-none relative">
          
          {/* Header Section */}
          <div className="flex justify-between items-start border-b-[4px] border-black pb-8 mb-10">
            <div className="flex items-center gap-8">
              <div className="p-4 bg-black text-white rounded-[2rem] shadow-xl">
                 <LogoIcon className="w-16 h-16" />
              </div>
              <div>
                <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Madrassah Al-Huda Hamburg</h1>
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-gray-500 mt-3">Personal-Tableau • Akademisches Dienstjahr 2025/2026</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="bg-madrassah-950 text-white px-5 py-2 text-[10px] font-black uppercase rounded-lg mb-3">DIENSTREGISTER INTERN</div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Druckdatum: {new Date().toLocaleDateString('de-DE')} • {new Date().toLocaleTimeString('de-DE')} Uhr</p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-10 no-print">
             <div className="bg-indigo-50 border-2 border-indigo-100 p-6 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase text-indigo-400 mb-2">Erfasste Personen</p>
                <p className="text-4xl font-black text-indigo-950 italic">{filteredStaff.length}</p>
             </div>
             <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase text-emerald-400 mb-2">Dozenten / Dozentinnen</p>
                <p className="text-4xl font-black text-emerald-950 italic">{filteredStaff.filter(u => u.role === UserRole.TEACHER).length}</p>
             </div>
             <div className="bg-gray-50 border-2 border-gray-100 p-6 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Bereich / Filter</p>
                <p className="text-2xl font-black text-gray-900 uppercase italic truncate px-2">{filter}</p>
             </div>
             <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase text-amber-600 mb-2">Status</p>
                <p className="text-xl font-black text-amber-950 uppercase italic tracking-widest mt-2">AKTIV</p>
             </div>
          </div>

          {/* Main Table */}
          <div className="flex-1 border-2 border-black rounded-xl overflow-hidden mb-12">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-gray-100 uppercase font-black border-b-2 border-black h-16">
                  <th className="p-4 text-center border-r border-black w-16 italic">Nr.</th>
                  <th className="p-4 text-left border-r border-black">Personal-Name / Identität</th>
                  <th className="p-4 text-center border-r border-black w-32">Titel / Grad</th>
                  <th className="p-4 text-center border-r border-black w-40">Geburtsdatum</th>
                  <th className="p-4 text-center border-r border-black w-48">WhatsApp Kontakt</th>
                  <th className="p-4 text-left">Portfolio (Klassenzuweisung)</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((u, idx) => (
                  <tr key={u.id} className={`border-b border-black/10 h-14 italic ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>
                    <td className="p-4 text-center border-r border-black font-black text-gray-300">{idx + 1}.</td>
                    <td className="p-4 border-r border-black">
                       <div className="font-black text-sm uppercase italic text-indigo-950 leading-tight">
                         {u.firstName} {u.lastName}
                       </div>
                       <div className="text-[8px] font-mono text-gray-400 mt-1 uppercase">Sys-ID: {u.id}</div>
                    </td>
                    <td className="p-4 text-center border-r border-black">
                       <span className="bg-gray-100 px-3 py-1.5 rounded-lg font-black uppercase text-[9px] border border-gray-200">
                          {u.teacherTitle || 'Leitung'}
                       </span>
                    </td>
                    <td className="p-4 text-center border-r border-black font-bold uppercase tracking-widest">
                       {u.birthDate ? new Date(u.birthDate).toLocaleDateString('de-DE') : '---'}
                    </td>
                    <td className="p-4 text-center border-r border-black font-black text-emerald-600 uppercase tracking-tighter">
                       {u.whatsapp || '---'}
                    </td>
                    <td className="p-4">
                       <div className="flex flex-wrap gap-2">
                          {u.assignedClasses?.map(c => (
                            <span key={c} className="bg-indigo-950 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase italic shadow-sm">
                               {c}
                            </span>
                          ))}
                          {(!u.assignedClasses || u.assignedClasses.length === 0) && (
                            <span className="text-gray-300 italic">Gesamtverwaltung</span>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Institutional Signatures */}
          <div className="grid grid-cols-2 gap-40 pt-16 pb-10 mt-auto">
             <div className="text-center border-t border-black pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2 italic">Prüfung Personalabteilung</p>
                <div className="h-12 flex items-center justify-center text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600">
                  <ShieldCheck size={24} className="mr-2" /> REVIDIERT ✓
                </div>
                <p className="text-[10px] font-bold border-t border-dotted border-black/20 pt-2">Unterschrift / Datum</p>
             </div>
             <div className="text-center border-t border-black pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2 italic">Zertifizierung Institutsleitung</p>
                <div className="h-12"></div>
                <p className="text-[11px] font-black uppercase pt-2">Sarfraz Azmat Butt</p>
             </div>
          </div>

          {/* Security Footer */}
          <div className="mt-8 pt-6 text-[7px] font-black text-gray-300 uppercase tracking-[0.6em] flex justify-between border-t border-dotted border-gray-200">
             <span>Digital Human Resources &copy; 2026 • Madrassah Al-Huda Hamburg Automation</span>
             <div className="flex items-center gap-4">
                <span>REF-GEN: {new Date().getTime()}</span>
                <Briefcase size={12} className="opacity-30" />
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 1cm; }
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

export default StaffPrintView;
