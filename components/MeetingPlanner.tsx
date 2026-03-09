
import React, { useState, useMemo } from 'react';
import { 
  Video, Calendar, Plus, Users, X, Trash2, Clock, Globe, ShieldCheck, 
  Search, CheckCircle2, User as UserIcon, ArrowRight,
  Filter, UserCheck, MessageCircle, School, Settings, Info, ChevronDown,
  Radio, CalendarDays, Copy, Check
} from 'lucide-react';
import { User, Student, ScheduledMeeting, UserRole, ClassConfig } from '../types';

interface MeetingPlannerProps {
  user: User;
  meetings: ScheduledMeeting[];
  onUpdateMeetings: (m: ScheduledMeeting[]) => void;
  students: Student[];
  users: User[];
  onNotify: (n: any) => void;
  classConfigs: ClassConfig[];
}

const MeetingPlanner: React.FC<MeetingPlannerProps> = ({ 
  user, meetings, onUpdateMeetings, students, users, classConfigs 
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    type: 'CLASS_PARENT' as ScheduledMeeting['type'],
    dateTime: '',
    targetId: 'ALL',
    zoomUrl: user.zoomUrl || ''
  });

  const isAdmin = user.role === UserRole.PRINCIPAL;
  const isTeacher = user.role === UserRole.TEACHER;

  const allClasses = useMemo(() => Array.from(new Set(students.map(s => s.className))).sort(), [students]);
  const teachers = useMemo(() => users.filter(u => u.role === UserRole.TEACHER), [users]);

  // Meeting Status Logic
  const getMeetingStatus = (dateTime: string) => {
    const meetDate = new Date(dateTime).getTime();
    const now = new Date().getTime();
    const oneHour = 3600000;
    
    if (now >= meetDate && now <= (meetDate + oneHour)) return 'LIVE';
    if (now > (meetDate + oneHour)) return 'PAST';
    return 'UPCOMING';
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendWhatsApp = (m: ScheduledMeeting, isCancel: boolean = false) => {
    const date = new Date(m.dateTime).toLocaleDateString('de-DE');
    const time = new Date(m.dateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    
    let text = "";
    if (isCancel) {
      text = `*Madrassah Al-Huda Benachrichtigung*\n\nDas geplante Meeting '${m.title}' am ${date} wurde leider abgesagt. Wir bitten um Entschuldigung.`;
    } else {
      text = `*Einladung zum Online-Meeting*\n\n📌 *Thema:* ${m.title}\n📅 *Datum:* ${date}\n⏰ *Uhrzeit:* ${time} Uhr\n\n🔗 *Beitritts-Link:* ${m.zoomUrl}\n\nBitte erscheinen Sie pünktlich. Barakallahu Feekum.`;
    }

    const encodedText = encodeURIComponent(text);

    if (m.type === 'CLASS_PARENT' || m.type === 'ALL_PARENTS') {
      const config = classConfigs.find(c => c.className === m.targetId);
      if (config?.whatsappLink) {
        copyToClipboard(text, 'wa-text');
        alert("Text wurde kopiert! Bitte in die Gruppe einfügen.");
        window.open(config.whatsappLink, '_blank');
      } else {
        alert("Kein WhatsApp-Link für diese Klasse hinterlegt.");
      }
    } else if (m.type === 'INDIVIDUAL_PARENT') {
      const s = students.find(x => x.id === m.targetId);
      if (s?.whatsapp) window.open(`https://wa.me/${s.whatsapp.replace(/\D/g, '')}?text=${encodedText}`, '_blank');
    }
  };

  const handleSchedule = (e: React.FormEvent, withWhatsApp: boolean = false) => {
    e.preventDefault();
    if (!newMeeting.dateTime || !newMeeting.title || !newMeeting.zoomUrl) {
        alert("Bitte vervollständigen Sie die Angaben.");
        return;
    }
    const meeting: ScheduledMeeting = {
      ...newMeeting,
      id: `M-${Date.now().toString().slice(-5)}`,
      createdBy: user.name
    };
    onUpdateMeetings([...meetings, meeting]);
    if (withWhatsApp) sendWhatsApp(meeting);
    setShowAdd(false);
    setNewMeeting({ title: '', type: 'CLASS_PARENT', dateTime: '', targetId: 'ALL', zoomUrl: user.zoomUrl || '' });
  };

  const filteredMeetings = useMemo(() => {
    return meetings
      .filter(m => filterType === 'ALL' || m.type === filterType)
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  }, [meetings, filterType]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Dynamic Header */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 text-indigo-950 rotate-12"><Video size={280} /></div>
        
        <div className="relative z-10 flex items-center gap-8">
           <div className="w-20 h-20 bg-madrassah-950 text-white rounded-[2.25rem] flex items-center justify-center shadow-2xl rotate-3">
              <Radio size={36} className="animate-pulse" />
           </div>
           <div>
              <h2 className="text-4xl font-black text-madrassah-950 uppercase italic leading-none tracking-tighter">Sitzungsplaner</h2>
              <div className="flex gap-4 mt-4">
                 <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 italic">Professional Hub v5.0</span>
                 <span className="bg-gray-100 text-gray-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">{filteredMeetings.length} Termine gelistet</span>
              </div>
           </div>
        </div>

        <div className="flex flex-wrap gap-4 relative z-10">
           <div className="bg-gray-50 p-1.5 rounded-2xl border border-gray-100 flex items-center gap-2">
              <Filter size={16} className="text-gray-300 ml-3" />
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase outline-none pr-4 cursor-pointer"
              >
                <option value="ALL">Alle Typen</option>
                <option value="CLASS_PARENT">Klassen</option>
                <option value="STAFF">Personal</option>
                <option value="INDIVIDUAL_PARENT">Einzel</option>
              </select>
           </div>
           {(isAdmin || isTeacher) && (
              <button onClick={() => setShowAdd(true)} className="bg-madrassah-950 text-white px-10 py-5 rounded-[2.25rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-4 shadow-xl hover:bg-black transition-all hover:-translate-y-1 active:scale-95">
                 <Plus size={24} /> Neu Planen
              </button>
           )}
        </div>
      </div>

      {/* Creation Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-madrassah-950/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
           <div className="bg-white w-full max-w-5xl rounded-[4rem] p-12 shadow-2xl relative border-4 border-white animate-in zoom-in duration-300">
              <button onClick={() => setShowAdd(false)} className="absolute top-10 right-10 text-gray-300 hover:text-red-500 transition-colors">
                <X size={32} />
              </button>
              
              <div className="mb-12">
                 <h3 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter">Sitzungs-Konfiguration</h3>
                 <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest mt-4 flex items-center gap-2 italic"><Info size={14}/> Legen Sie Titel, Zeit und Zielgruppe für Ihr Meeting fest.</p>
              </div>

              <form className="space-y-12">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7 space-y-10">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Thema der Sitzung</label>
                          <input required value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 px-8 py-5 rounded-[2.5rem] font-black outline-none focus:border-indigo-500 focus:bg-white transition-all text-xl italic" placeholder="z.B. Elternabend J-1a" />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Datum & Uhrzeit</label>
                             <div className="relative">
                               <CalendarDays className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                               <input type="datetime-local" required value={newMeeting.dateTime} onChange={e => setNewMeeting({...newMeeting, dateTime: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 pl-14 pr-6 py-5 rounded-3xl font-black outline-none uppercase text-xs shadow-inner" />
                             </div>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Zoom Meeting Link</label>
                             <div className="relative">
                               <Video className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                               <input required value={newMeeting.zoomUrl} onChange={e => setNewMeeting({...newMeeting, zoomUrl: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 pl-14 pr-6 py-5 rounded-3xl font-medium text-xs text-indigo-600 shadow-inner" placeholder="https://zoom.us/j/..." />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="lg:col-span-5 space-y-10">
                       <div className="bg-gray-50/50 p-8 rounded-[3.5rem] border border-gray-100">
                          <label className="text-[10px] font-black text-madrassah-950 uppercase tracking-widest mb-6 ml-1 block">Zielgruppe / Teilnehmer</label>
                          <div className="space-y-2">
                             {[
                               { id: 'CLASS_PARENT', label: 'Schulklasse', icon: School, color: 'text-emerald-600' },
                               { id: 'STAFF', label: 'Kollegium / Team', icon: UserCheck, color: 'text-indigo-600' },
                               { id: 'INDIVIDUAL_PARENT', label: 'Einzel-Termin', icon: UserIcon, color: 'text-amber-600' },
                               { id: 'ALL_PARENTS', label: 'Gesamt-Institut', icon: Globe, color: 'text-blue-600' }
                             ].map(t => (
                               <button 
                                 key={t.id} 
                                 type="button" 
                                 onClick={() => setNewMeeting({...newMeeting, type: t.id as any, targetId: 'ALL'})} 
                                 className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${newMeeting.type === t.id ? 'bg-madrassah-950 text-white border-madrassah-950 shadow-xl' : 'bg-white text-gray-400 border-gray-50 hover:border-indigo-100'}`}
                               >
                                  <t.icon size={18} className={newMeeting.type === t.id ? 'text-white' : t.color} /> {t.label}
                               </button>
                             ))}
                          </div>
                       </div>

                       <div className="bg-indigo-950 p-8 rounded-[3.5rem] text-white">
                          <select 
                            value={newMeeting.targetId} 
                            onChange={e => setNewMeeting({...newMeeting, targetId: e.target.value})}
                            className="w-full bg-white/10 border border-white/10 px-8 py-5 rounded-3xl font-black uppercase text-[11px] outline-none appearance-none cursor-pointer text-white"
                          >
                             <option value="ALL" className="text-black">Spezifische Auswahl...</option>
                             {newMeeting.type === 'CLASS_PARENT' && allClasses.map(c => <option key={c} value={c} className="text-black">Klasse {c}</option>)}
                             {newMeeting.type === 'STAFF' && teachers.map(t => <option key={t.id} value={t.id} className="text-black">{t.name}</option>)}
                             {newMeeting.type === 'INDIVIDUAL_PARENT' && students.map(s => <option key={s.id} value={s.id} className="text-black">{s.firstName} {s.lastName}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-6 border-t border-gray-100">
                    <button onClick={(e) => handleSchedule(e, false)} className="w-full md:w-auto bg-gray-100 text-gray-500 font-black px-12 py-8 rounded-[2.5rem] uppercase text-[11px] tracking-widest hover:bg-gray-200 transition-all active:scale-95">Nur Speichern</button>
                    <button onClick={(e) => handleSchedule(e, true)} className="w-full md:w-auto bg-emerald-600 text-white font-black px-16 py-8 rounded-[3rem] shadow-2xl uppercase text-[12px] tracking-[0.3em] hover:bg-emerald-700 transition-all flex items-center justify-center gap-6 active:scale-95 group">
                       <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" /> Speichern & Benachrichtigen
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Grid: Grouped by Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMeetings.map(m => {
          const status = getMeetingStatus(m.dateTime);
          const isOwner = m.createdBy === user.name || isAdmin;

          return (
            <div key={m.id} className={`bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group relative overflow-hidden transition-all hover:shadow-2xl ${status === 'LIVE' ? 'ring-4 ring-emerald-500/20' : ''}`}>
               {status === 'LIVE' && (
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 animate-pulse"></div>
               )}
               
               <div>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                     <div className={`flex items-center gap-3 px-5 py-2 rounded-full text-[9px] font-black uppercase border shadow-sm ${
                        status === 'LIVE' ? 'bg-emerald-500 text-white border-emerald-600' :
                        status === 'PAST' ? 'bg-gray-100 text-gray-400 border-gray-200' :
                        'bg-indigo-50 text-indigo-700 border-indigo-100'
                     }`}>
                        {status === 'LIVE' ? <Radio size={14} className="animate-ping" /> : <Clock size={14}/>}
                        {status === 'LIVE' ? 'JETZT LIVE' : status === 'PAST' ? 'BEENDET' : 'ANSTEHEND'}
                     </div>
                     {isOwner && (
                        <button onClick={() => { if(window.confirm('Termin löschen?')) onUpdateMeetings(meetings.filter(x => x.id !== m.id)) }} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                           <Trash2 size={18}/>
                        </button>
                     )}
                  </div>

                  <div className="space-y-4 mb-10 relative z-10">
                     <h4 className="text-2xl font-black text-madrassah-950 italic uppercase leading-tight group-hover:text-indigo-950 transition-colors line-clamp-2">{m.title}</h4>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-indigo-600" /> {m.type.replace('_', ' ')}: {m.targetId}
                     </p>
                  </div>

                  <div className="bg-gray-50/80 p-6 rounded-[2rem] border border-gray-100 space-y-4">
                     <div className="flex items-center gap-4 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-inner border border-gray-100"><Calendar size={18} /></div>
                        <div>
                           <p className="text-madrassah-950">{new Date(m.dateTime).toLocaleDateString('de-DE')}</p>
                           <p className="text-[8px] text-gray-400">{new Date(m.dateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="mt-10 flex flex-col gap-3 relative z-10">
                  <a 
                    href={m.zoomUrl} target="_blank" rel="noopener noreferrer"
                    className={`w-full font-black py-4 rounded-[1.75rem] uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${
                      status === 'PAST' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                     <Video size={18} /> Beitreten
                  </a>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => copyToClipboard(m.zoomUrl, m.id)}
                       className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-xl text-[8px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white hover:shadow-sm transition-all border border-gray-100"
                     >
                        {copiedId === m.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12}/>} 
                        {copiedId === m.id ? 'Kopiert' : 'Link Kopieren'}
                     </button>
                     <button 
                       onClick={() => sendWhatsApp(m)}
                       className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                     >
                        <MessageCircle size={16} />
                     </button>
                  </div>
               </div>
            </div>
          );
        })}

        {filteredMeetings.length === 0 && (
           <div className="col-span-full py-40 text-center border-4 border-dashed border-gray-100 rounded-[4rem] opacity-20 flex flex-col items-center">
              <Calendar size={100} className="mb-6" />
              <p className="font-black text-4xl uppercase tracking-tighter italic leading-none">Keine Termine<br/>gefunden</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default MeetingPlanner;
