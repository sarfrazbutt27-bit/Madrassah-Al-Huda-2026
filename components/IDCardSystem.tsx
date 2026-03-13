
import React, { useState, useMemo, useRef } from 'react';
import { 
  IdCard, Download, Search, ShieldCheck, 
  Smartphone, User as UserIcon, Loader2, Users, Printer, Baby, CreditCard, CheckSquare, Square
} from 'lucide-react';
import { User, Student, UserRole } from '../types';
import LogoIcon from './LogoIcon';
import * as htmlToImage from 'html-to-image';

interface IDCardSystemProps {
  user: User;
  users: User[];
  students: Student[];
}

const IBAN = "DE79 2004 1177 0546 3088 00";
const ACCOUNT_HOLDER = "Azmat Ullah Butt";

const IDCardSystem: React.FC<IDCardSystemProps> = ({ user, users, students }) => {
  const isStudent = user.role === UserRole.STUDENT;
  const isTeacher = user.role === UserRole.TEACHER;
  const isAdmin = user.role === UserRole.PRINCIPAL;
  const viewerAssignedClasses = useMemo(() => user.assignedClasses || [], [user.assignedClasses]);
  const currentYear = new Date().getFullYear();

  const [activeTab, setActiveTab] = useState<'teachers' | 'students' | 'parents'>(
    isStudent ? 'students' : isTeacher ? 'teachers' : 'students'
  );

  const [selectedTarget, setSelectedTarget] = useState<{ id: string, type: 'student' | 'teacher' | 'parent' } | null>(
    isStudent ? { id: user.id, type: 'student' } : isTeacher ? { id: user.id, type: 'teacher' } : null
  );
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const visibleStudents = useMemo(() => {
    return students.filter(s => {
      if (!s) return false;
      if (isStudent) return s.id === user.id;
      const isMyClass = isTeacher ? viewerAssignedClasses.includes(s.className) : true;
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                            (s.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      return s.status === 'active' && matchesSearch && isMyClass;
    });
  }, [students, isStudent, isTeacher, viewerAssignedClasses, searchTerm, user.id]);

  const visibleTeachers = useMemo(() => {
    return users.filter(u => {
      if (!u || u.role !== UserRole.TEACHER) return false;
      if (isTeacher) return u.id === user.id; 
      if (isAdmin) return (u.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return false;
    });
  }, [users, isTeacher, isAdmin, searchTerm, user.id]);

  const visibleParents = useMemo(() => {
    const parentMap = new Map<string, { familyId: string, guardian: string }>();
    visibleStudents.forEach(s => {
      if (s && s.familyId && !parentMap.has(s.familyId)) {
        parentMap.set(s.familyId, { familyId: s.familyId, guardian: s.guardian || 'Erziehungsberechtigter' });
      }
    });
    return Array.from(parentMap.values()).filter(p => p.guardian.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [visibleStudents, searchTerm]);

  const calculateFamilyTotal = (familyId: string) => {
    const familyMembers = students.filter(s => s.familyId === familyId && s.status === 'active');
    const count = familyMembers.length;
    if (count === 1) return 30;
    if (count === 2) return 50;
    return count * 20;
  };

  const exportAsPNG = async () => {
    if (!cardRef.current || isExporting || !selectedTarget) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1.0, pixelRatio: 4, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `HUDA-ID-${selectedTarget.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error(err); } finally { setIsExporting(false); }
  };

  const renderCard = (target: { id: string, type: 'student' | 'teacher' | 'parent' }) => {
    if (target.type === 'parent') {
      const familyMembers = students.filter(s => s.familyId === target.id && s.status === 'active');
      const sampleStudent = familyMembers[0];
      if (!sampleStudent) return null;
      const totalFee = calculateFamilyTotal(target.id);
      const method = sampleStudent.paymentMethod || 'Überweisung';
      
      return (
        <div ref={cardRef} className="w-[500px] h-[320px] bg-white border-[12px] border-indigo-900 rounded-[3.5rem] p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-900 rounded-bl-[7rem] flex items-center justify-center p-8 text-white shadow-lg"><LogoIcon className="w-20 h-20" /></div>
          <div className="relative z-10 flex-1">
            <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-indigo-900 opacity-40 italic">Madrassah Al-Huda Hamburg</h3>
            <div className="flex items-center gap-3 mt-2">
               <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Familien-ID {currentYear}</span>
               <span className="text-indigo-400 text-[8px] font-black uppercase">Gültig bis: 31.12.{currentYear}</span>
            </div>
            <div className="flex gap-8 mt-8">
               <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center border-2 border-indigo-100 shadow-inner"><Users size={40} className="text-indigo-400" /></div>
               <div>
                  <p className="text-[8px] font-black uppercase text-indigo-300">Sorgeberechtigte/r</p>
                  <p className="text-2xl font-black italic uppercase text-indigo-950 leading-none truncate w-52">{sampleStudent.guardian}</p>
                  
                  <div className="mt-4 flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 w-fit">
                     <Baby size={14} className="text-indigo-600" />
                     <span className="text-[10px] font-black uppercase text-indigo-900">{familyMembers.length} Registrierte Kinder</span>
                  </div>

                  <p className="text-[10px] font-black uppercase text-indigo-600 mt-2">FAM-ID: {target.id}</p>
               </div>
            </div>
          </div>
          <div className="mt-2 pt-3 border-t-2 border-dashed border-gray-200 flex flex-col gap-1 bg-gray-50 -mx-8 px-8 pb-5 rounded-b-[2.5rem]">
             <div className="flex items-center justify-between text-[7px] font-black uppercase text-indigo-500 italic mb-1">
                <div className="flex items-center gap-2">
                   <CreditCard size={10} /> Zahlungsinformation (mtl. {totalFee.toFixed(2)} €)
                </div>
                <div className="flex gap-3 text-indigo-950 pr-2">
                   <span className="flex items-center gap-1">{method === 'Bar' ? <CheckSquare size={10} /> : <Square size={10} />} Bar</span>
                   <span className="flex items-center gap-1">{method === 'Überweisung' ? <CheckSquare size={10} /> : <Square size={10} />} Überweisung</span>
                </div>
             </div>
             <div className="flex justify-between items-end">
                <div className="flex-1">
                   <p className="text-[7px] font-black uppercase text-gray-400">Kontoinhaber: {ACCOUNT_HOLDER}</p>
                   <p className="text-[12px] font-black text-indigo-950 font-mono tracking-tight">{IBAN}</p>
                </div>
                <div className="text-right bg-indigo-100 px-3 py-1 rounded-xl border border-indigo-200">
                   <p className="text-[6px] font-black uppercase text-indigo-400">Verwendungszweck</p>
                   <p className="text-[11px] font-black text-indigo-950 font-mono tracking-tighter">{target.id}</p>
                </div>
             </div>
          </div>
        </div>
      );
    }

    const targetData = target.type === 'student' ? students.find(s => s.id === target.id) : users.find(u => u && u.id === target.id);
    if (!targetData) return null;

    const displayName = target.type === 'student' ? `${(targetData as Student).firstName} ${(targetData as Student).lastName}` : (targetData as User).name;
    const isAdultStudent = target.type === 'student' && ((targetData as Student).gender === 'Mann' || (targetData as Student).gender === 'Frau');
    const method = (targetData as Student).paymentMethod || 'Überweisung';
    
    const cardColor = target.type === 'teacher' ? 'border-madrassah-950' : 'border-indigo-950';
    const bgColor = target.type === 'teacher' ? 'bg-madrassah-950' : 'bg-indigo-950';

    return (
      <div ref={cardRef} className={`w-[500px] h-[320px] bg-white border-[12px] ${cardColor} rounded-[3.5rem] p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl`}>
        <div className={`absolute top-0 right-0 w-44 h-44 ${bgColor} rounded-bl-[7rem] flex items-center justify-center p-8 text-white shadow-lg`}><LogoIcon className="w-20 h-20" /></div>
        <div className="relative z-10 flex-1">
          <h3 className={`text-[12px] font-black uppercase tracking-[0.3em] ${target.type === 'teacher' ? 'text-madrassah-950' : 'text-indigo-950'} opacity-40 italic`}>Madrassah Al-Huda Hamburg</h3>
          <div className="flex items-center gap-3 mt-2">
             <span className={`${bgColor} text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest`}>{target.type === 'teacher' ? 'Dozent' : 'Student'} {currentYear}</span>
             <span className="text-gray-400 text-[8px] font-black uppercase">Gültig bis: 31.12.{currentYear}</span>
          </div>
          <div className="flex gap-8 mt-8">
             <div className="w-28 h-28 bg-gray-100 rounded-[2rem] flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-inner">
                <UserIcon size={64} className="text-gray-300" />
             </div>
             <div className="overflow-hidden flex-1">
                <p className="text-[8px] font-black uppercase text-gray-400">Name des Inhabers</p>
                <p className="text-2xl font-black italic uppercase text-madrassah-950 leading-none truncate w-56">{displayName}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                   <div>
                      <p className="text-[7px] font-black uppercase text-gray-400">Mitglieds-ID</p>
                      <p className="text-[11px] font-black text-indigo-600 font-mono tracking-tighter">{targetData.id}</p>
                   </div>
                   <div>
                      <p className="text-[7px] font-black uppercase text-gray-400">Status</p>
                      <p className="text-[11px] font-black text-madrassah-950 uppercase italic leading-none">{target.type === 'student' ? `Klasse ${(targetData as Student).className}` : 'Akademisch'}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
        <div className="mt-2 pt-3 border-t-2 border-dashed border-gray-200 flex flex-col gap-1 bg-gray-50 -mx-8 px-8 pb-5 rounded-b-[2.5rem]">
           {isAdultStudent ? (
             <>
               <div className="flex items-center justify-between text-[7px] font-black uppercase text-indigo-500 italic mb-1">
                  <div className="flex items-center gap-2">
                     <CreditCard size={10} /> Zahlungsinformation (mtl. 30.00 €)
                  </div>
                  <div className="flex gap-3 text-indigo-950 pr-2">
                     <span className="flex items-center gap-1">{method === 'Bar' ? <CheckSquare size={10} /> : <Square size={10} />} Bar</span>
                     <span className="flex items-center gap-1">{method === 'Überweisung' ? <CheckSquare size={10} /> : <Square size={10} />} Überweisung</span>
                  </div>
               </div>
               <div className="flex justify-between items-end">
                  <div className="flex-1">
                     <p className="text-[7px] font-black uppercase text-gray-400">Kontoinhaber: {ACCOUNT_HOLDER}</p>
                     <p className="text-[12px] font-black text-indigo-950 font-mono tracking-tight">{IBAN}</p>
                  </div>
                  <div className="text-right bg-indigo-100 px-3 py-1 rounded-xl border border-indigo-200">
                     <p className="text-[6px] font-black uppercase text-indigo-400">Verwendungszweck</p>
                     <p className="text-[11px] font-black text-indigo-950 font-mono tracking-tighter">{targetData.id}</p>
                  </div>
               </div>
             </>
           ) : (
             <div className="flex justify-between items-center py-2">
                <div>
                   <p className="text-[8px] font-black uppercase text-gray-400">Ausstellungsjahr</p>
                   <p className="text-2xl font-black text-madrassah-950 italic leading-none">{currentYear}</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black uppercase text-gray-400 italic">Identität Bestätigt</p>
                   <div className="flex items-center gap-1.5 justify-end mt-1">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Verifiziert</span>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-madrassah-950 rotate-12"><IdCard size={280} /></div>
        <div className="relative z-10 flex items-center gap-10">
           <div className="w-24 h-24 bg-madrassah-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3"><Smartphone size={42} /></div>
           <div>
              <h2 className="text-5xl font-black text-madrassah-950 italic uppercase tracking-tighter leading-none">ID-Service {currentYear}</h2>
              <p className="text-gray-400 font-bold uppercase text-[12px] tracking-[0.4em] mt-4 flex items-center gap-3">Digitale Zertifikate & Campus-Ausweise</p>
           </div>
        </div>
        {!isStudent && (
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input type="text" placeholder="Suche..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-gray-50 rounded-[2rem] text-sm font-bold outline-none focus:bg-white focus:border-madrassah-950 transition-all shadow-inner" />
          </div>
        )}
      </div>

      <div className={`grid grid-cols-1 ${isStudent ? '' : 'lg:grid-cols-12'} gap-12`}>
        {!isStudent && (
          <div className="lg:col-span-5 bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden h-fit">
             <div className="p-3 border-b bg-gray-50/30 flex bg-white p-1.5 rounded-[2rem] border border-gray-100 shadow-sm mx-4 mt-4">
                <button onClick={() => { setActiveTab('teachers'); setSelectedTarget(null); }} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'teachers' ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}>Lehrer</button>
                <button onClick={() => { setActiveTab('students'); setSelectedTarget(null); }} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'students' ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}>Schüler</button>
                <button onClick={() => { setActiveTab('parents'); setSelectedTarget(null); }} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'parents' ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}>Familien</button>
             </div>
             <div className="max-h-[550px] overflow-y-auto custom-scrollbar p-6 space-y-3">
                {activeTab === 'teachers' && visibleTeachers.map(u => (
                  <button key={u.id} onClick={() => setSelectedTarget({ id: u.id, type: 'teacher' })} className={`w-full flex items-center justify-between p-5 rounded-[2.25rem] transition-all border-2 ${selectedTarget?.id === u.id && selectedTarget?.type === 'teacher' ? 'bg-madrassah-950 text-white border-madrassah-900 shadow-2xl' : 'hover:bg-gray-50 border-transparent'}`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 ${selectedTarget?.id === u.id ? 'bg-white/10' : 'bg-gray-100'}`}>{u.name?.charAt(0) || '?'}</div>
                      <div className="text-left overflow-hidden"><p className="font-black uppercase text-sm italic truncate">{u.name}</p><p className={`text-[8px] font-bold uppercase mt-1 ${selectedTarget?.id === u.id ? 'text-white/40' : 'text-gray-400'}`}>{u.id}</p></div>
                    </div>
                  </button>
                ))}
                {activeTab === 'students' && visibleStudents.map(s => (
                  <button key={s.id} onClick={() => setSelectedTarget({ id: s.id, type: 'student' })} className={`w-full flex items-center justify-between p-5 rounded-[2.25rem] transition-all border-2 ${selectedTarget?.id === s.id && selectedTarget?.type === 'student' ? 'bg-indigo-950 text-white border-indigo-900 shadow-2xl' : 'hover:bg-gray-50 border-transparent'}`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 ${s.gender === 'Junge' || s.gender === 'Mann' ? 'bg-indigo-50' : 'bg-pink-50'}`}>{s.firstName?.charAt(0) || '?'}</div>
                      <div className="text-left overflow-hidden"><p className="font-black uppercase text-sm italic truncate">{(s.firstName || '') + ' ' + (s.lastName || '')}</p><p className={`text-[8px] font-bold uppercase mt-1 ${selectedTarget?.id === s.id ? 'text-white/40' : 'text-gray-400'}`}>{s.id}</p></div>
                    </div>
                  </button>
                ))}
                {activeTab === 'parents' && visibleParents.map(p => (
                  <button key={p.familyId} onClick={() => setSelectedTarget({ id: p.familyId, type: 'parent' })} className={`w-full flex items-center justify-between p-5 rounded-[2.25rem] transition-all border-2 ${selectedTarget?.id === p.familyId && selectedTarget?.type === 'parent' ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xl' : 'hover:bg-gray-50 border-transparent'}`}>
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 bg-indigo-100 text-indigo-700">FAM</div>
                      <div className="text-left overflow-hidden"><p className="font-black uppercase text-sm italic truncate">{p.guardian}</p><p className={`text-[8px] font-bold uppercase mt-1 ${selectedTarget?.id === p.familyId ? 'text-white/40' : 'text-gray-400'}`}>{p.familyId}</p></div>
                    </div>
                  </button>
                ))}
             </div>
          </div>
        )}

        <div className={`${isStudent ? 'w-full' : 'lg:col-span-7'} flex flex-col items-center justify-center gap-12`}>
           {selectedTarget ? (
              <div className="animate-in zoom-in duration-500 flex flex-col items-center gap-10">
                 {renderCard(selectedTarget)}
                 <div className="flex gap-4">
                    <button onClick={exportAsPNG} disabled={isExporting} className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-4 shadow-xl hover:bg-black transition-all disabled:opacity-50">
                       {isExporting ? <Loader2 size={22} className="animate-spin" /> : <Download size={22} />} Bild herunterladen
                    </button>
                    <button onClick={() => window.print()} className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-4 shadow-xl hover:bg-black transition-all">
                       <Printer size={22} /> Drucken
                    </button>
                 </div>
              </div>
           ) : (
              <div className="h-96 flex flex-col items-center justify-center text-gray-300 opacity-20 italic">
                 <IdCard size={120} className="mb-6" />
                 <p className="text-3xl font-black uppercase tracking-tighter">Bitte Ziel auswählen</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default IDCardSystem;
