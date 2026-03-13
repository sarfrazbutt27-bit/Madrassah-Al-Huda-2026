
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Hourglass, Trash2, X, Search, Phone, Users, 
  Send, Plus, ShieldCheck, UserCheck, FileEdit,
  User as UserIcon, Hash, MapPin, Loader2, Save, Printer, GraduationCap
} from 'lucide-react';
import { WaitlistEntry, ParticipantInfo } from '../types';

interface WaitlistManagementProps {
  waitlist: WaitlistEntry[];
  onUpdate: (list: WaitlistEntry[], itemsToSync?: WaitlistEntry[]) => void;
  onDelete: (id: string) => void;
}

const WaitlistManagement: React.FC<WaitlistManagementProps> = ({ 
  waitlist, onUpdate, onDelete
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaitlistEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State für neuen händischen Eintrag
  const [entryType, setEntryType] = useState<'FAMILY' | 'ADULT'>('FAMILY');
  const [guardianName, setGuardianName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  
  const [participants, setParticipants] = useState<ParticipantInfo[]>([
    { 
      firstName: '', 
      lastName: '', 
      gender: 'Junge', 
      birthDate: '', 
      preferredCourses: ['Quran Basis'],
      priorKnowledge: 'Keine',
      preferredDays: 'Wochenende'
    }
  ]);

  const filtered = useMemo(() => {
    return waitlist.filter(w => {
      const matchesSearch = `${w.guardianName} ${w.whatsapp}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.participants?.some(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    }).sort((a,b) => b.appliedDate.localeCompare(a.appliedDate));
  }, [waitlist, searchTerm]);

  const addParticipantRow = () => {
    setParticipants([...participants, { 
      firstName: '', 
      lastName: participants[0]?.lastName || '', 
      gender: entryType === 'FAMILY' ? 'Junge' : 'Mann', 
      birthDate: '', 
      preferredCourses: ['Quran Basis'],
      priorKnowledge: 'Keine',
      preferredDays: 'Wochenende'
    }]);
  };

  const removeParticipantRow = (idx: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== idx));
    }
  };

  const updateParticipant = (idx: number, field: keyof ParticipantInfo, value: string | string[]) => {
    const next = [...participants];
    next[idx] = { ...next[idx], [field]: value } as ParticipantInfo;
    setParticipants(next);
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsapp || participants.some(p => !p.firstName || !p.lastName)) {
      alert("Bitte füllen Sie alle erforderlichen Felder aus.");
      return;
    }

    setIsSubmitting(true);
    
    const entry: WaitlistEntry = {
      id: editingEntry ? editingEntry.id : `W-${Date.now().toString().slice(-5)}`,
      type: entryType,
      guardianName: entryType === 'ADULT' ? `${participants[0].firstName} ${participants[0].lastName}` : guardianName,
      whatsapp: whatsapp,
      address: address,
      preferredLanguage: editingEntry?.preferredLanguage || 'Deutsch',
      appliedDate: editingEntry?.appliedDate || new Date().toISOString(),
      status: editingEntry?.status || 'pending',
      paymentConfirmed: true,
      participants: participants
    };

    try {
      let newList;
      if (editingEntry) {
        newList = waitlist.map(w => w.id === editingEntry.id ? entry : w);
      } else {
        newList = [...waitlist, entry];
      }
      onUpdate(newList, [entry]);
      setShowAddModal(false);
      setEditingEntry(null);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern der Warteliste.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (entry: WaitlistEntry) => {
    setEditingEntry(entry);
    setEntryType(entry.type);
    setGuardianName(entry.guardianName);
    setWhatsapp(entry.whatsapp);
    setAddress(entry.address || '');
    setParticipants(entry.participants);
    setShowAddModal(true);
  };

  const handlePromoteToStudents = (entry: WaitlistEntry) => {
    navigate(`/register-student?waitlistId=${entry.id}`);
  };

  const resetForm = () => {
    setGuardianName('');
    setWhatsapp('');
    setAddress('');
    setParticipants([{ 
      firstName: '', 
      lastName: '', 
      gender: 'Junge', 
      birthDate: '', 
      preferredCourses: ['Quran Basis'],
      priorKnowledge: 'Keine',
      preferredDays: 'Wochenende'
    }]);
  };

  const sendInvitation = (entry: WaitlistEntry) => {
    const names = entry.participants.map(p => p.firstName).join(' & ');
    const message = `Assalamu Alaikum ${entry.guardianName},\n\nhier spricht die Schulleitung der Madrassah Al-Huda Hamburg.\n\nWir laden Sie herzlich zu einem persönlichen Einstufungsgespräch für ${entry.type === 'ADULT' ? 'Sie' : `Ihre Kinder (${names})`} ein. \n\nBitte teilen Sie uns mit, wann Sie am kommenden Wochenende Zeit hätten.\n\nBarakallahu Feekum.`;
    window.open(`https://wa.me/${entry.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    const updatedEntry: WaitlistEntry = { ...entry, status: 'invited' };
    onUpdate(waitlist.map(w => w.id === entry.id ? updatedEntry : w), [updatedEntry]);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-indigo-950 pointer-events-none rotate-12"><Hourglass size={280} /></div>
        <div className="relative z-10 flex items-center gap-8">
           <div className="w-24 h-24 bg-indigo-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3">
              <Users size={42} />
           </div>
           <div>
              <h2 className="text-5xl font-black text-madrassah-950 uppercase italic tracking-tighter">Warteliste</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" /> Vormerkungen & Interessenten
              </p>
           </div>
        </div>
        
        <div className="relative flex flex-wrap gap-4 z-10">
           <button 
             onClick={() => navigate('/waitlist/print')}
             className="bg-emerald-600 text-white px-8 py-5 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-4 shadow-xl hover:bg-black transition-all"
           >
              <Printer size={20} /> Liste drucken
           </button>
           <button onClick={() => setShowAddModal(true)} className="bg-madrassah-950 text-white px-10 py-5 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-4 shadow-xl hover:bg-black transition-all hover:-translate-y-1">
              <Plus size={24} /> Neu eintragen
           </button>
           <div className="relative w-full sm:w-64">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input type="text" placeholder="Suche..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-gray-50 rounded-[2.5rem] text-[10px] font-black uppercase shadow-inner outline-none focus:bg-white focus:border-madrassah-950 transition-all" />
           </div>
        </div>
      </div>

      {/* Interessenten Liste */}
      <div className="grid grid-cols-1 gap-10">
         {filtered.map(w => (
            <div key={w.id} className="bg-white rounded-[4rem] border border-gray-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all">
               <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-1/3 p-10 bg-indigo-950 text-white flex flex-col justify-between">
                     <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                              {w.type === 'ADULT' ? <UserIcon size={32} /> : <Users size={32} />}
                           </div>
                           <div>
                              <p className="text-[9px] font-black uppercase text-indigo-300 tracking-widest">Typ: {w.type}</p>
                              <h4 className="text-2xl font-black uppercase italic leading-tight truncate">{w.guardianName}</h4>
                           </div>
                        </div>
                        <div className="space-y-3 bg-white/5 p-6 rounded-3xl border border-white/10">
                           <div className="flex items-center gap-3 text-emerald-400 font-bold text-lg"><Phone size={18} /> {w.whatsapp}</div>
                           <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${w.status === 'pending' ? 'bg-amber-500 text-white border-amber-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>
                              <Hourglass size={12}/> {w.status === 'pending' ? 'Warteliste' : 'Eingeladen'}
                           </div>
                        </div>
                     </div>
                     <div className="mt-10 pt-6 border-t border-white/10 flex justify-between items-center text-[9px] font-black uppercase opacity-40">
                        <span>Eingang: {new Date(w.appliedDate).toLocaleDateString()}</span>
                        <Hash size={12}/>
                     </div>
                  </div>

                  <div className="flex-1 p-10 space-y-10">
                     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 px-2">
                        <h5 className="text-xl font-black text-indigo-950 uppercase italic tracking-widest flex items-center gap-4">
                           <GraduationCap size={24} className="text-indigo-600" /> Teilnehmer ({w.participants?.length || 0})
                        </h5>
                        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                           <button 
                             onClick={() => handlePromoteToStudents(w)} 
                             className="min-[400px]:col-span-2 sm:col-span-1 bg-emerald-600 text-white px-5 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                           >
                             <UserCheck size={16}/> Jetzt Aufnehmen
                           </button>
                           <button 
                             onClick={() => sendInvitation(w)} 
                             className="bg-indigo-600 text-white px-4 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                           >
                             <Send size={14}/> Einladen
                           </button>
                           <button 
                             onClick={() => openEditModal(w)} 
                             className="bg-amber-500 text-white px-4 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                           >
                             <FileEdit size={14}/> Daten ändern
                           </button>
                           <button 
                             onClick={() => { if(window.confirm('Vormerkung löschen?')) onDelete(w.id) }} 
                             className="hidden sm:flex p-2 text-gray-300 hover:text-red-500 transition-all items-center justify-center"
                           >
                             <Trash2 size={18}/>
                           </button>
                           <button 
                             onClick={() => { if(window.confirm('Vormerkung löschen?')) onDelete(w.id) }} 
                             className="sm:hidden bg-red-50 text-red-500 px-4 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"
                           >
                             <Trash2 size={14}/> Löschen
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {w.participants?.map((p, i) => (
                           <div key={i} className="flex items-center gap-5 p-5 bg-gray-50 rounded-[2.5rem] border border-gray-100 group/item hover:bg-white hover:shadow-lg transition-all">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${p.gender === 'Junge' || p.gender === 'Mann' ? 'bg-indigo-600' : 'bg-pink-600'}`}>
                                 {p.firstName?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                 <p className="font-black text-indigo-950 uppercase italic truncate">{p.firstName} {p.lastName}</p>
                                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Geb: {p.birthDate ? new Date(p.birthDate).toLocaleDateString() : '---'} • {p.preferredCourses?.[0]}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         ))}
      </div>

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-madrassah-950/80 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-[4rem] p-12 shadow-2xl relative border-4 border-white animate-in zoom-in duration-300 my-auto">
            <button onClick={() => { setShowAddModal(false); setEditingEntry(null); resetForm(); }} className="absolute top-10 right-10 text-gray-300 hover:text-red-500 transition-all"><X size={32}/></button>
            
            <div className="mb-12 border-b pb-8">
              <h3 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">
                {editingEntry ? 'Vormerkung bearbeiten' : 'Interessent manuell anlegen'}
              </h3>
              <div className="mt-8 flex bg-gray-100 p-1.5 rounded-2xl w-fit">
                <button type="button" onClick={() => { setEntryType('FAMILY'); setParticipants([{ ...participants[0], gender: 'Junge' }]); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${entryType === 'FAMILY' ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}>Familie / Kinder</button>
                <button type="button" onClick={() => { setEntryType('ADULT'); setParticipants([{ ...participants[0], gender: 'Mann' }]); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${entryType === 'ADULT' ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}>Erwachsene</button>
              </div>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-12">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <h4 className="text-sm font-black uppercase text-indigo-950 italic flex items-center gap-3"><Phone size={18} className="text-indigo-600"/> Kontakt-Informationen</h4>
                     {entryType === 'FAMILY' && (
                       <input required placeholder="Name des Vormunds" value={guardianName} onChange={e => setGuardianName(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold" />
                     )}
                     <input required placeholder="WhatsApp-Nummer" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold" />
                     <div className="relative">
                        <MapPin size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input required placeholder="Anschrift" value={address} onChange={e => setAddress(e.target.value)} className="w-full pl-14 bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold" />
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase text-indigo-950 italic flex items-center gap-3"><Users size={18} className="text-indigo-600"/> Teilnehmer ({participants.length})</h4>
                        {entryType === 'FAMILY' && (
                          <button type="button" onClick={addParticipantRow} className="text-[10px] font-black uppercase text-indigo-600 hover:underline">+ Weiteres Kind</button>
                        )}
                     </div>

                     <div className="space-y-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {participants.map((p, idx) => (
                           <div key={idx} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4 relative">
                              {participants.length > 1 && (
                                <button type="button" onClick={() => removeParticipantRow(idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                 <input required placeholder="Vorname" value={p.firstName} onChange={e => updateParticipant(idx, 'firstName', e.target.value)} className="w-full bg-white border p-3 rounded-xl font-bold text-xs" />
                                 <input required placeholder="Nachname" value={p.lastName} onChange={e => updateParticipant(idx, 'lastName', e.target.value)} className="w-full bg-white border p-3 rounded-xl font-bold text-xs" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <input required type="date" value={p.birthDate} onChange={e => updateParticipant(idx, 'birthDate', e.target.value)} className="w-full bg-white border p-3 rounded-xl font-bold text-xs" />
                                 <select value={p.gender} onChange={e => updateParticipant(idx, 'gender', e.target.value)} className="w-full bg-white border p-3 rounded-xl font-black uppercase text-[9px]">
                                    {entryType === 'FAMILY' ? (
                                      <><option value="Junge">Junge</option><option value="Mädchen">Mädchen</option></>
                                    ) : (
                                      <><option value="Mann">Mann</option><option value="Frau">Frau</option></>
                                    )}
                                 </select>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="pt-10 flex flex-col items-center border-t">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full md:auto bg-madrassah-950 text-white px-20 py-7 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 group"
                  >
                     {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24}/>} 
                     Vormerkung jetzt speichern
                  </button>
                  <p className="mt-6 text-[8px] font-black text-gray-300 uppercase italic">Digital Waitlist Management v6.1</p>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistManagement;
