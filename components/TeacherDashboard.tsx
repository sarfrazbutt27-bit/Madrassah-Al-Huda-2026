
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Search, Award, MonitorPlay, MessageSquare, Flame, AlertCircle, HelpCircle, UserCheck, QrCode, X, Smartphone, Maximize2, ChevronRight, FileText, Book, Library, ExternalLink
} from 'lucide-react';
import { Student, User, HomeworkAssignment, HomeworkAttempt, Grade, ParticipationRecord, ClassConfig, Attendance, LibraryResource } from '../types';

interface TeacherDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  students: Student[];
  homework: HomeworkAssignment[];
  attempts: HomeworkAttempt[];
  grades: Grade[];
  subjects: string[];
  participation: ParticipationRecord[];
  classConfigs: ClassConfig[];
  attendance: Attendance[];
  libraryResources: LibraryResource[];
  isHolidayMode?: boolean;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  user, students, classConfigs, attendance, homework, attempts, libraryResources, isHolidayMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomedQr, setZoomedQr] = useState<{ url: string, className: string } | null>(null);
  const assignedClasses = user.assignedClasses || [];
  
  const myStudents = useMemo(() => {
    return students.filter(s => 
      assignedClasses.includes(s.className) && 
      s.status === 'active' &&
      (`${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
  }, [students, assignedClasses, searchTerm]);

  const getAbsenceStatus = (studentId: string) => {
    const unexcused = attendance.filter(a => a.studentId === studentId && a.status === 'absent').length;
    if (unexcused >= 18) return { type: 'red', label: 'Rote Liste (Ausschluss)', count: unexcused, color: 'bg-red-600 text-white' };
    if (unexcused >= 9) return { type: 'yellow', label: 'Gelbe Liste (Warnung)', count: unexcused, color: 'bg-amber-400 text-amber-900' };
    return { type: 'none', label: 'Regulär', count: unexcused, color: 'bg-emerald-50 text-emerald-600' };
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {isHolidayMode && (
        <div className="bg-amber-400 p-8 rounded-[3rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-amber-500/20 animate-bounce-subtle">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-madrassah-950">
              <Users size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-madrassah-950 uppercase italic">FERIEN – Madrassah geschlossen</h3>
              <p className="text-madrassah-950/70 font-bold uppercase text-[10px] tracking-widest mt-1">Nutze deine Zeit zum Wiederholen und Üben.</p>
            </div>
          </div>
          <div className="bg-white/20 px-6 py-3 rounded-2xl border border-white/30">
            <p className="text-[10px] font-black text-madrassah-950 uppercase tracking-widest">Ferien Challenge: Wer die meisten Quiz löst, bekommt Bonuspunkte.</p>
          </div>
        </div>
      )}

      {/* Profil Header */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-madrassah-950 text-white rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-2xl rotate-3">
             {user.name?.charAt(0) || '?'}
          </div>
          <div>
            <h2 className="text-4xl font-black text-madrassah-950 italic uppercase leading-none">Salam, {user.name}</h2>
            <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.4em] mt-3">Dozent • {user.teacherTitle || 'Lehrkraft'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/attendance" className="bg-madrassah-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all">Anwesenheit prüfen</Link>
          {user.zoomUrl && (
            <a href={user.zoomUrl} target="_blank" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3">
              <MonitorPlay size={18} /> Zoom-Klassenzimmer
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           {/* QR-Band Bereich */}
           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-xl font-black text-madrassah-950 uppercase tracking-widest flex items-center gap-4 italic">
                    <QrCode size={24} className="text-indigo-600" /> WhatsApp Schnellzugriff
                 </h3>
                 <Link to="/whatsapp-qr" className="text-[10px] font-black uppercase text-gray-400 hover:text-madrassah-950 transition-colors flex items-center gap-2">Links verwalten <ChevronRight size={14}/></Link>
              </div>
              
              <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                 {assignedClasses.length > 0 ? assignedClasses.map(className => {
                    const config = classConfigs.find(cc => cc.className === className);
                    const waLink = config?.whatsappLink;
                    const qrUrl = waLink ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(waLink)}` : null;

                    return (
                       <div key={className} 
                         onClick={() => qrUrl && setZoomedQr({ url: qrUrl, className })}
                         className={`min-w-[240px] p-6 rounded-[2.5rem] shadow-sm border transition-all cursor-pointer group hover:shadow-xl hover:-translate-y-1 ${qrUrl ? 'bg-indigo-950 text-white border-indigo-900' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                       >
                          <div className="flex justify-between items-center mb-4">
                             <span className="text-[10px] font-black uppercase tracking-widest">Klasse {className}</span>
                             {qrUrl ? <Smartphone size={16} className="text-emerald-400" /> : <AlertCircle size={16} />}
                          </div>
                          <div className="aspect-square bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden mb-4">
                             {qrUrl ? (
                                <>
                                   <div className="absolute inset-0 bg-indigo-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                      <Maximize2 className="text-white" size={32} />
                                   </div>
                                   <img src={qrUrl} alt={`QR ${className}`} className="w-24 h-24 brightness-100" />
                                </>
                             ) : (
                                <p className="text-[8px] font-black uppercase p-4 text-center">Kein Link hinterlegt</p>
                             )}
                          </div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-center italic opacity-60">Zum Vergrößern klicken</p>
                       </div>
                    );
                 }) : (
                    <div className="w-full bg-gray-50 border-2 border-dashed border-gray-200 p-8 rounded-[2.5rem] text-center italic text-gray-400">
                       Keine zugewiesenen Klassen für QR-Codes.
                    </div>
                 )}
              </div>
           </div>

           {/* Schülerliste */}
           <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/20">
                 <div className="flex items-center gap-4">
                    <Users size={28} className="text-madrassah-950" />
                    <h3 className="text-2xl font-black text-madrassah-950 uppercase italic">Klassen-Übersicht</h3>
                 </div>
                 <div className="relative w-full md:w-80">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      placeholder="Name suchen..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none shadow-sm" 
                    />
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b">
                       <tr>
                          <th className="px-10 py-6">Teilnehmer</th>
                          <th className="px-6 py-6 text-center">Status / Präsenz</th>
                          <th className="px-6 py-6">Elternkontakt</th>
                          <th className="px-10 py-6 text-right">Optionen</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {myStudents.map(student => {
                          const risk = getAbsenceStatus(student.id);
                          return (
                            <tr key={student.id} className={`hover:bg-madrassah-50/20 transition-all ${risk.type === 'red' ? 'bg-red-50/30' : risk.type === 'yellow' ? 'bg-amber-50/30' : ''}`}>
                               <td className="px-10 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-lg ${student.gender === 'Junge' || student.gender === 'Mann' ? 'bg-indigo-600' : 'bg-pink-600'}`}>
                                        {student.firstName?.charAt(0) || '?'}
                                     </div>
                                     <div>
                                        <p className="font-black text-gray-900 uppercase italic leading-none">{student.firstName} {student.lastName}</p>
                                        <p className="text-[8px] font-black text-gray-400 uppercase mt-1">Klasse {student.className}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-6 text-center">
                                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${risk.color}`}>
                                     {risk.type === 'red' ? <AlertCircle size={14}/> : risk.type === 'yellow' ? <Flame size={14}/> : <UserCheck size={14}/>}
                                     {risk.label} ({risk.count})
                                  </div>
                               </td>
                               <td className="px-6 py-6">
                                  <a href={`https://wa.me/${(student.whatsapp || '').replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-2 text-emerald-600 font-black text-[10px] hover:underline uppercase italic">
                                     <MessageSquare size={12}/> {student.whatsapp}
                                  </a>
                               </td>
                               <td className="px-10 py-6 text-right">
                                  <div className="flex justify-end gap-2">
                                     <Link to={`/certificates`} className="p-3 bg-white border border-amber-100 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-sm" title="Urkunden">
                                        <Award size={18} />
                                     </Link>
                                     <Link to={`/report-card/${student.id}`} className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-madrassah-950 rounded-xl transition-all shadow-sm" title="Zeugnis">
                                        <FileText size={18} />
                                     </Link>
                                  </div>
                               </td>
                            </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-10">
           <div className="bg-indigo-950 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><HelpCircle size={150}/></div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4 italic">Regeln für Dozenten</h4>
              <ul className="space-y-6">
                 <li className="flex gap-4 items-start">
                    <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-lg"><Flame size={12}/></div>
                    <p className="text-[10px] font-medium leading-relaxed italic opacity-80">Ab 9 unentschuldigten Fehltagen (Gelbe Liste) muss ein Gespräch mit den Eltern initiiert werden.</p>
                 </li>
                 <li className="flex gap-4 items-start">
                    <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-lg"><AlertCircle size={12}/></div>
                    <p className="text-[10px] font-medium leading-relaxed italic opacity-80">Ab 18 unentschuldigten Fehltagen (Rote Liste) droht laut Hausordnung der Platzverlust.</p>
                 </li>
              </ul>
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <Book size={20} />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-madrassah-950">Hausaufgaben Status</h4>
              </div>
              <div className="space-y-4">
                {homework.filter(h => h.teacherId === user.id).slice(0, 3).map(h => {
                  const classStudents = students.filter(s => s.className === h.className).length;
                  const completedCount = students.filter(s => s.className === h.className && attempts.some(a => a.assignmentId === h.id && a.studentId === s.id && a.isPerfect)).length;
                  return (
                    <div key={h.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase text-gray-400 truncate max-w-[120px]">{h.title}</span>
                        <span className="text-[8px] font-bold text-indigo-600">{completedCount}/{classStudents}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 transition-all duration-500" 
                          style={{ width: `${(completedCount / (classStudents || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {homework.filter(h => h.teacherId === user.id).length === 0 && (
                  <p className="text-[10px] text-gray-400 italic">Keine aktiven Hausaufgaben.</p>
                )}
                <Link to="/homework" className="block text-center text-[9px] font-black uppercase text-indigo-600 hover:underline pt-2">Alle Hausaufgaben verwalten</Link>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Library size={20} />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-madrassah-950">Lehrer-Bibliothek</h4>
              </div>
              <div className="space-y-4">
                {libraryResources.filter(r => assignedClasses.includes(r.className)).slice(0, 3).map(r => (
                  <div key={r.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center group/lib">
                    <div className="overflow-hidden">
                      <p className="text-[9px] font-black uppercase text-madrassah-950 truncate">{r.title}</p>
                      <p className="text-[7px] font-bold text-gray-400 uppercase italic">Klasse {r.className}</p>
                    </div>
                    <a 
                      href={r.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
                {libraryResources.filter(r => assignedClasses.includes(r.className)).length === 0 && (
                  <p className="text-[10px] text-gray-400 italic">Keine Materialien für Ihre Klassen hinterlegt.</p>
                )}
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-madrassah-950">Schnell-Link-Check</h4>
               </div>
               <p className="text-[11px] text-gray-500 italic leading-relaxed">
                  Klicken Sie auf ein QR-Vorschaubild links, um es Schülern oder Eltern vor Ort zum Scannen groß zu präsentieren.
               </p>
            </div>
        </div>
      </div>

      {/* QR Zoom Modal */}
      {zoomedQr && (
         <div className="fixed inset-0 z-[100] bg-madrassah-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl relative border-4 border-white animate-in zoom-in duration-500">
               <button onClick={() => setZoomedQr(null)} className="absolute -top-4 -right-4 w-12 h-12 bg-white text-madrassah-950 rounded-full flex items-center justify-center shadow-2xl hover:bg-red-50 hover:text-white transition-all">
                  <X size={24} />
               </button>
               
               <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-3 bg-indigo-50 text-indigo-700 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 mb-6">
                     <Smartphone size={16} className="animate-pulse" /> Einladungs-QR
                  </div>
                  <h3 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter">Klasse {zoomedQr.className}</h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2 italic">WhatsApp Gruppenbeitritt</p>
               </div>

               <div className="bg-gray-50 p-8 rounded-[3rem] border-2 border-dashed border-gray-200">
                  <img src={zoomedQr.url} alt="Large QR" className="w-full aspect-square bg-white p-6 rounded-3xl shadow-2xl border border-gray-100" />
               </div>

               <div className="mt-10 flex flex-col items-center gap-4">
                  <p className="text-[11px] text-gray-500 font-medium italic text-center leading-relaxed">
                     Lassen Sie diesen Code von Eltern oder Schülern scannen,<br/>um sie direkt in die Klassengruppe einzuladen.
                  </p>
                  <button onClick={() => setZoomedQr(null)} className="mt-4 px-12 py-4 bg-madrassah-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all">Schließen</button>
               </div>
            </div>
         </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;
