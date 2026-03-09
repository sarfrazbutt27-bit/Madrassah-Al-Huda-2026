
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Search, Video, MoreVertical, School,
  Sparkles, CheckCircle2, UserCheck, GraduationCap, Hash, Paperclip, Smile
} from 'lucide-react';
import { User as UserType, Student, Message, UserRole } from '../types';

interface ChatSystemProps {
  user: UserType;
  users: UserType[];
  students: Student[];
  messages: Message[];
  onSendMessage: (m: Message) => void;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ 
  user, users, students, messages, onSendMessage 
}) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [messages, selectedChatId]);

  const allContacts = useMemo(() => {
    const contacts = [
      ...users.map(u => ({ 
        id: u.id, 
        name: u.name || 'Unbekannt', 
        role: u.role, 
        title: u.teacherTitle, 
        info: u.role === UserRole.PRINCIPAL ? 'Schulleitung' : u.teacherTitle || 'Lehrkraft',
        status: 'online'
      })),
      ...students.map(s => ({ 
        id: s.id, 
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Schüler', 
        role: UserRole.STUDENT, 
        title: undefined, 
        info: `Klasse ${s.className}`,
        status: (s.id.charCodeAt(0) % 2 === 0) ? 'online' : 'offline'
      }))
    ];
    return contacts.filter(c => c.id !== user.id && c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [users, students, user.id, searchTerm]);

  const selectedContact = allContacts.find(c => c.id === selectedChatId);
  
  const chatMessages = useMemo(() => 
    messages.filter(m => (m.fromId === user.id && m.toId === selectedChatId) || (m.fromId === selectedChatId && m.toId === user.id))
    .filter(m => !m.isDeleted)
    .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
  , [messages, user.id, selectedChatId]);

  const handleSend = () => {
    if (!inputText.trim() || !selectedChatId) return;
    const msg: Message = {
      id: `M-${Date.now().toString().slice(-5)}`,
      fromId: user.id,
      toId: selectedChatId,
      text: inputText,
      timestamp: new Date().toISOString()
    };
    onSendMessage(msg);
    setInputText('');
  };

  const groupedContacts = useMemo(() => {
    return {
      staff: allContacts.filter(c => c.role !== UserRole.STUDENT),
      students: allContacts.filter(c => c.role === UserRole.STUDENT)
    };
  }, [allContacts]);

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-in fade-in duration-700 overflow-hidden">
      
      {/* Sidebar: Kontakte */}
      <div className="w-80 lg:w-96 flex flex-col bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden shrink-0">
        <div className="p-8 border-b bg-madrassah-950 text-white">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20"><MessageSquare size={20} /></div>
                 <h3 className="font-black uppercase text-[11px] tracking-[0.3em] italic">Campus Messenger</h3>
              </div>
              <Sparkles size={16} className="text-emerald-400 animate-pulse" />
           </div>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input 
                type="text" placeholder="Dozent oder Schüler suchen..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase outline-none focus:bg-white/10 transition-all placeholder:text-white/20" 
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar bg-gray-50/50">
           <div>
              <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] px-4 mb-4 flex items-center gap-2"><UserCheck size={12}/> Dozenten & Leitung</p>
              <div className="space-y-1">
                 {groupedContacts.staff.map(c => (
                   <button key={c.id} onClick={() => setSelectedChatId(c.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedChatId === c.id ? 'bg-madrassah-950 text-white shadow-xl translate-x-2' : 'hover:bg-white hover:shadow-sm'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border-2 ${selectedChatId === c.id ? 'bg-white/10 border-white/20' : 'bg-white border-gray-100 text-madrassah-950 shadow-inner'}`}>{c.name?.charAt(0) || '?'}</div>
                      <div className="text-left flex-1 overflow-hidden">
                         <p className="font-black text-xs truncate uppercase italic leading-tight">{c.name}</p>
                         <p className={`text-[8px] font-black uppercase mt-1 ${selectedChatId === c.id ? 'text-madrassah-300' : 'text-emerald-600'}`}>{c.info}</p>
                      </div>
                      {c.status === 'online' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
                   </button>
                 ))}
              </div>
           </div>

           <div>
              <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] px-4 mb-4 flex items-center gap-2"><GraduationCap size={12}/> Studenten & Schüler</p>
              <div className="space-y-1">
                 {groupedContacts.students.map(c => (
                   <button key={c.id} onClick={() => setSelectedChatId(c.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedChatId === c.id ? 'bg-madrassah-950 text-white shadow-xl translate-x-2' : 'hover:bg-white hover:shadow-sm'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border-2 ${selectedChatId === c.id ? 'bg-white/10 border-white/20' : 'bg-white border-gray-100 text-madrassah-950 shadow-inner'}`}>{c.name?.charAt(0) || '?'}</div>
                      <div className="text-left flex-1 overflow-hidden">
                         <p className="font-black text-xs truncate uppercase italic leading-tight">{c.name}</p>
                         <p className={`text-[8px] font-black uppercase mt-1 ${selectedChatId === c.id ? 'text-madrassah-300' : 'text-madrassah-600/60'}`}>{c.info}</p>
                      </div>
                      {c.status === 'online' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden relative">
        {selectedContact ? (
          <>
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
               <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-madrassah-950 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl transform -rotate-3 group">
                       {selectedContact.name?.charAt(0) || '?'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                  </div>
                  <div>
                     <h3 className="text-3xl font-black text-madrassah-950 italic uppercase tracking-tighter leading-none">{selectedContact.name}</h3>
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2 flex items-center gap-2"><Hash size={12}/> {selectedContact.info}</p>
                  </div>
               </div>
               <div className="flex gap-3">
                  <button className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl hover:bg-emerald-700 transition-all hover:-translate-y-1">
                     <Video size={20} /> Meeting starten
                  </button>
                  <button className="p-4 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-2xl transition-all shadow-sm"><MoreVertical size={20} /></button>
               </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 bg-gray-50/30 custom-scrollbar pattern-dots">
               {chatMessages.map(m => (
                 <div key={m.id} className={`flex items-start gap-5 ${m.fromId === user.id ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm border ${m.fromId === user.id ? 'bg-madrassah-950 text-white border-madrassah-900' : 'bg-white text-madrassah-950 border-gray-100'}`}>
                       {(m.fromId === user.id ? (user.name || 'Me') : (selectedContact.name || 'Them')).charAt(0)}
                    </div>
                    <div className={`max-w-[75%] p-6 rounded-[2.5rem] shadow-md text-sm leading-relaxed ${m.fromId === user.id ? 'bg-madrassah-950 text-white rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'}`}>
                       <p className="font-medium italic">{m.text}</p>
                       <div className={`flex items-center gap-3 mt-4 opacity-40 ${m.fromId === user.id ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[8px] font-black uppercase tracking-widest">{new Date(m.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                          {m.fromId === user.id && <CheckCircle2 size={10} className="text-emerald-400" />}
                       </div>
                    </div>
                 </div>
               ))}
               {chatMessages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <MessageSquare size={120} className="mb-6" />
                    <p className="text-3xl font-black uppercase tracking-[0.5em] italic">Beginne den Dialog</p>
                 </div>
               )}
            </div>

            <div className="p-8 bg-white border-t border-gray-100 flex items-center gap-6">
               <button className="p-4 text-gray-300 hover:text-madrassah-950 transition-colors"><Paperclip size={24}/></button>
               <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={inputText} 
                    onChange={e => setInputText(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && handleSend()} 
                    placeholder="Unterrichtsnachricht schreiben..." 
                    className="w-full pl-8 pr-16 py-6 bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] outline-none font-bold shadow-inner focus:border-madrassah-950 focus:bg-white transition-all" 
                  />
                  <button className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-amber-500 transition-colors"><Smile size={24}/></button>
               </div>
               <button onClick={handleSend} className="p-6 bg-madrassah-950 text-white rounded-3xl shadow-2xl hover:bg-black transition-all hover:scale-105 active:scale-95 group">
                  <Send size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
               </button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-5 animate-pulse">
             <School size={200} className="mb-8" />
             <p className="text-5xl font-black uppercase italic tracking-tighter">Wähle einen Kontakt</p>
          </div>
        )}
      </div>

      <style>{`
        .pattern-dots {
          background-image: radial-gradient(#3f0042 0.5px, transparent 0.5px);
          background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
};

export default ChatSystem;
