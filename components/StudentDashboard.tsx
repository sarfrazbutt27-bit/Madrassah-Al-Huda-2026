
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Book, Clock, GraduationCap, Lock, ClipboardCheck, 
  ChevronRight, User as UserIcon, MessageCircle,
  CheckCircle2, ExternalLink,
  IdCard, FolderOpen, Mic, Award, MessageSquare
} from 'lucide-react';
import { Student, User, HomeworkAssignment, HomeworkAttempt, Resource, Grade, Attendance, UserRole, ClassConfig } from '../types';
import { supabase } from '../lib/supabase';

interface StudentDashboardProps {
  user: User;
  students: Student[];
  homework: HomeworkAssignment[];
  attempts: HomeworkAttempt[];
  resources: Resource[];
  grades?: Grade[];
  attendance?: Attendance[];
  users?: User[]; 
  classConfigs: ClassConfig[];
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  user, students, homework, attempts, resources, users = [], classConfigs
}) => {
  const student = students.find(s => s.id === user.id);
  const myClass = student?.className || '';
  
  const classConfig = classConfigs.find(c => c.className === myClass);
  const waLink = classConfig?.whatsappLink;
  const qrUrl = waLink ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waLink)}` : null;

  const myHomework = homework.filter(h => h.className === myClass);
  const pendingHomework = myHomework.filter(h => !attempts.some(a => a.assignmentId === h.id && a.studentId === user.id && a.isPerfect));
  
  const classTeachers = users.filter(u => u.role === UserRole.TEACHER && u.assignedClasses?.includes(myClass));

  const [tajweedStats, setTajweedStats] = useState<{ count: number, avg: number }>({ count: 0, avg: 0 });

  useEffect(() => {
    const fetchTajweed = async () => {
      const { data } = await supabase.from('tajweed_practice').select('accuracy').eq('student_id', user.id);
      if (data && data.length > 0) {
        const avg = data.reduce((acc, curr) => acc + curr.accuracy, 0) / data.length;
        setTajweedStats({ count: data.length, avg: Math.round(avg) });
      }
    };
    fetchTajweed();
  }, [user.id]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Welcome Banner */}
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 text-madrassah-900 pointer-events-none">
          <GraduationCap size={180} />
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-madrassah-950 italic tracking-tight leading-none uppercase">Salam, {student?.firstName}</h2>
          <div className="flex gap-4 mt-4">
             <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">Klasse: {myClass}</span>
             <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Status: Aktiv</span>
          </div>
        </div>
        <div className="flex gap-3 relative z-10">
           <Link to="/attendance" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3">
              <Clock size={18} /> Meine Präsenz
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Hauptspalte */}
        <div className="lg:col-span-8 space-y-10">
           
           {/* WhatsApp & Kommunikation Info */}
           <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform"><MessageCircle size={150} /></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                 <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shrink-0">
                    {qrUrl ? (
                       <img src={qrUrl} alt="WhatsApp QR" className="w-32 h-32" />
                    ) : (
                       <div className="w-32 h-32 bg-gray-50 flex items-center justify-center text-gray-300 italic text-[10px] text-center p-4">Noch kein Gruppenlink</div>
                    )}
                 </div>
                 <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black italic uppercase leading-none mb-3">WhatsApp Klassenchat</h3>
                    <p className="text-emerald-100 text-[11px] font-medium leading-relaxed uppercase tracking-widest italic mb-6">
                       Scannt den Code oder nutzt den Button, um der offiziellen Elterngruppe für Klasse <span className="text-white font-black underline">{myClass}</span> beizutreten.
                    </p>
                    {waLink && (
                       <a href={waLink} target="_blank" className="inline-flex items-center gap-3 bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-50 transition-all active:scale-95">
                          <ExternalLink size={18} /> Jetzt Beitreten
                       </a>
                    )}
                 </div>
              </div>
           </div>

           {/* Hausaufgaben Section */}
           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-xl font-black text-madrassah-950 uppercase tracking-widest flex items-center gap-4 italic">
                    <Book size={24} className="text-indigo-600" /> Aktuelle Aufgaben
                 </h3>
                 <Link to="/homework" className="text-[10px] font-black uppercase text-gray-400 hover:text-madrassah-950 transition-colors flex items-center gap-2">Alle anzeigen <ChevronRight size={14}/></Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingHomework.length > 0 ? pendingHomework.map(h => (
                     <div key={h.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all border-l-8 border-l-indigo-600">
                        <div>
                           <div className="flex justify-between items-start mb-4">
                              <span className="text-[9px] font-black uppercase text-indigo-400">{h.subject}</span>
                              <div className="flex items-center gap-1.5 text-red-500">
                                 <Clock size={12} />
                                 <span className="text-[8px] font-black uppercase">{new Date(h.dueDate).toLocaleDateString('de-DE')}</span>
                              </div>
                           </div>
                           <h4 className="text-xl font-black text-gray-900 italic leading-tight group-hover:text-indigo-950 transition-colors">{h.title}</h4>
                        </div>
                        <Link to="/homework" className="mt-8 bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white text-center py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">Jetzt abgeben</Link>
                     </div>
                  )) : (
                     <div className="col-span-full bg-emerald-50/20 p-16 rounded-[3rem] border border-dashed border-emerald-100 text-center">
                        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                        <p className="text-emerald-800 font-black italic uppercase text-sm tracking-widest">Wunderbar! Keine offenen Hausaufgaben.</p>
                     </div>
                  )}
              </div>
           </div>
        </div>

        {/* Seitenspalte */}
        <div className="lg:col-span-4 space-y-10">
           <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Meine Dozenten</h3>
              <div className="space-y-8">
                 {classTeachers.map(teacher => (
                    <div key={teacher.id} className="space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-madrassah-950 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform -rotate-3">
                             {teacher.name?.charAt(0) || '?'}
                          </div>
                          <div>
                             <p className="font-black uppercase italic text-lg leading-none text-madrassah-950">{teacher.name}</p>
                             <p className="text-[8px] font-bold text-gray-400 uppercase mt-2 tracking-widest">{teacher.teacherTitle || 'Lehrkraft'}</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <a 
                            href={`https://wa.me/${teacher.whatsapp?.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 bg-emerald-50 text-emerald-600 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                          >
                             <MessageSquare size={14} /> WhatsApp
                          </a>
                          <button className="flex items-center justify-center gap-3 bg-gray-50 text-gray-500 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border border-gray-100 hover:bg-madrassah-950 hover:text-white transition-all">
                             <UserIcon size={14} /> Profil
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Tajweed Fortschritt</h3>
              <Link to="/tajweed-practice" className="block p-6 bg-gold-50 border border-gold-100 rounded-3xl group transition-all hover:shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-gold-600"><Mic size={80} /></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Award className="text-gold-600" size={20} />
                    </div>
                    <span className="text-xl font-black text-madrassah-950 italic">{tajweedStats.avg}%</span>
                  </div>
                  <p className="text-[10px] font-black uppercase text-madrassah-950/60 tracking-widest mb-1">Ø Genauigkeit</p>
                  <div className="w-full bg-white/50 h-1.5 rounded-full overflow-hidden mb-4">
                    <div className="bg-gold-500 h-full rounded-full" style={{ width: `${tajweedStats.avg}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-madrassah-950 uppercase">{tajweedStats.count} Übungen</span>
                    <span className="text-[9px] font-black uppercase text-gold-600 flex items-center gap-1">Üben <ChevronRight size={12} /></span>
                  </div>
                </div>
              </Link>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Leistung</h3>
              <Link to="/curriculum" className="flex items-center justify-between p-5 bg-amber-50 border border-amber-100 rounded-2xl group transition-all hover:shadow-lg">
                 <div className="flex items-center gap-4">
                    <FolderOpen size={24} className="text-amber-600" />
                    <span className="text-[10px] font-black uppercase text-madrassah-950 italic">Lehrpläne</span>
                 </div>
                 <ChevronRight size={18} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              {(() => {
                const isReleased = student?.reportReleasedHalbjahr || student?.reportReleasedAbschluss;
                if (!isReleased) {
                  return (
                    <div className="flex items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-2xl opacity-60 cursor-not-allowed">
                      <div className="flex items-center gap-4">
                        <Lock size={24} className="text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-gray-400 italic">Zeugnis einsehen</span>
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Noch nicht freigegeben</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <Link to={`/report-card/${user.id}`} className="flex items-center justify-between p-5 bg-indigo-50 border border-indigo-100 rounded-2xl group transition-all hover:shadow-lg">
                    <div className="flex items-center gap-4">
                      <ClipboardCheck size={24} className="text-indigo-600" />
                      <span className="text-[10px] font-black uppercase text-madrassah-950 italic">Zeugnis einsehen</span>
                    </div>
                    <ChevronRight size={18} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                );
              })()}
              <Link to="/id-cards" className="flex items-center justify-between p-5 bg-emerald-50 border border-emerald-100 rounded-2xl group transition-all hover:shadow-lg">
                 <div className="flex items-center gap-4">
                    <IdCard size={24} className="text-emerald-600" />
                    <span className="text-[10px] font-black uppercase text-madrassah-950 italic">Mein Ausweis</span>
                 </div>
                 <ChevronRight size={18} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
