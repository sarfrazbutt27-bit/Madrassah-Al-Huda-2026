
import React, { useState, useMemo } from 'react';
import { User, UserRole, TeacherTitle } from '../types';
import { generateId } from '../src/utils';
import { 
  UserPlus, Trash2, Pencil, Users, Phone, Save, X, Calendar, Briefcase, Settings, School, ChevronDown, Filter, Lock, Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserManagementProps {
  users: User[];
  onUpdate: (users: User[], itemsToSync?: User[]) => void;
  onDelete: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdate, onDelete }) => {
  const navigate = useNavigate();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [classFilter, setClassFilter] = useState('Alle');
  const [activeTab] = useState<'users' | 'settings'>('users');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    username: '',
    email: '',
    password: '',
    whatsapp: '',
    role: UserRole.TEACHER,
    title: 'Quran Lehrer' as TeacherTitle,
    gender: 'Lehrer' as 'Lehrer' | 'Lehrerin',
    selectedClasses: [] as string[]
  });

  const teacherTitles: TeacherTitle[] = [
    'Alim', 'Alima', 'Imam', 'Quran Lehrer', 'Tajweed Lehrer', 'Arabisch Lehrer', 'Aushelfer'
  ];

  const staticClasses = [
    'J-1', 'J-2', 'J-3', 'J-4', 'J-5', 'J-6', 'J-1a', 'J-1b', 'J-Imam', 'J-Ijazah', 'J-Ilmiyyah', 'J-Hifz',
    'M-1', 'M-2', 'M-3', 'M-4', 'M-5', 'M-6', 'M-1a', 'M-1b', 'M-Imam', 'M-Ijazah', 'M-Ilmiyyah', 'M-Hifz',
    'Arabisch Modul 1', 'Arabisch Modul 2', 'Arabisch Modul 3'
  ];

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (classFilter === 'Alle') return true;
      return u.assignedClasses?.includes(classFilter);
    }).sort((a, b) => (a.lastName || a.name || '').localeCompare(b.lastName || b.name || ''));
  }, [users, classFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.firstName) return;

    const newId = editingUserId || generateId('L-');
    const userData: User = {
      id: newId,
      name: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      birthDate: formData.birthDate,
      password: formData.password,
      whatsapp: formData.whatsapp,
      role: formData.role,
      gender: formData.role === UserRole.TEACHER ? formData.gender : undefined,
      teacherTitle: formData.role === UserRole.TEACHER ? formData.title : undefined,
      assignedClasses: formData.role === UserRole.TEACHER ? formData.selectedClasses : []
    };

    if (editingUserId) {
      onUpdate(users.map(u => u.id === editingUserId ? userData : u), [userData]);
    } else {
      onUpdate([...users, userData], [userData]);
    }
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', birthDate: '', username: '', email: '', password: '', 
      whatsapp: '', role: UserRole.TEACHER, title: 'Quran Lehrer', 
      gender: 'Lehrer', selectedClasses: []
    });
    setEditingUserId(null);
  };

  const handleEdit = (u: User) => {
    setEditingUserId(u.id);
    setFormData({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      birthDate: u.birthDate || '',
      username: u.name,
      email: (u as Record<string, any>).email || '',
      password: u.password || '',
      whatsapp: u.whatsapp || '',
      role: u.role,
      title: u.teacherTitle || 'Quran Lehrer',
      gender: (u.gender as 'Lehrer' | 'Lehrerin') || 'Lehrer',
      selectedClasses: u.assignedClasses || []
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 text-madrassah-950 pointer-events-none rotate-12">
          <Briefcase size={240} />
        </div>
        <div className="relative z-10 flex items-center gap-8">
           <div className="bg-madrassah-950 p-6 rounded-[2rem] shadow-2xl">
             <Settings className="text-white" size={32} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">System-Verwaltung</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">Personal & Accounts</p>
           </div>
        </div>
        {!showForm && (
          <div className="flex gap-4 relative z-10">
            <button 
              onClick={() => navigate(`/users/print?filter=${classFilter}`)}
              className="bg-emerald-600 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-4 shadow-xl hover:bg-black transition-all"
            >
              <Printer size={20} /> Dienstliste drucken
            </button>
            <button 
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-madrassah-950 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-4 shadow-xl hover:bg-black transition-all"
            >
              <UserPlus size={20} /> Neuaufnahme
            </button>
          </div>
        )}
      </div>

      {activeTab === 'users' && !showForm && (
        <div className="flex flex-col lg:flex-row gap-6 items-center">
           <div className="relative w-full lg:w-72">
              <School className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={20} />
              <select 
                value={classFilter} 
                onChange={e => setClassFilter(e.target.value)}
                className="w-full pl-16 pr-12 py-5 bg-white border-2 border-gray-100 rounded-[2.5rem] text-xs font-black uppercase outline-none appearance-none cursor-pointer shadow-sm focus:border-madrassah-950 transition-all"
              >
                <option value="Alle">Alle Lehrkräfte</option>
                {staticClasses.map(c => <option key={c} value={c}>Lehrer Klasse {c}</option>)}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
           </div>
           <div className="bg-indigo-50 text-indigo-700 px-6 py-4 rounded-3xl flex items-center gap-3 border border-indigo-100">
              <Filter size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{filteredUsers.length} Personen gefunden</span>
           </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-2xl border-4 border-madrassah-50 animate-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-12 border-b border-gray-100 pb-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-madrassah-100 text-madrassah-950 rounded-2xl flex items-center justify-center">
                   {editingUserId ? <Pencil size={28} /> : <UserPlus size={28} />}
                </div>
                <h3 className="text-3xl font-black text-madrassah-950 uppercase italic">
                  {editingUserId ? 'Personalakte bearbeiten' : 'Neuaufnahme Personal'}
                </h3>
             </div>
             <button onClick={() => { setShowForm(false); setEditingUserId(null); }} className="p-4 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                <X size={24} />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Vorname</label>
                <input 
                  required 
                  value={formData.firstName || ''} 
                  onChange={e => setFormData({...formData, firstName: e.target.value})} 
                  className="w-full bg-gray-50 border-2 border-gray-50 px-8 py-5 rounded-3xl font-bold focus:bg-white focus:border-madrassah-950 transition-all outline-none" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nachname</label>
                <input 
                  required 
                  value={formData.lastName || ''} 
                  onChange={e => setFormData({...formData, lastName: e.target.value})} 
                  className="w-full bg-gray-50 border-2 border-gray-50 px-8 py-5 rounded-3xl font-bold focus:bg-white focus:border-madrassah-950 transition-all outline-none" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Geburtsdatum</label>
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input 
                    type="date" 
                    required 
                    value={formData.birthDate || ''} 
                    onChange={e => setFormData({...formData, birthDate: e.target.value})} 
                    className="w-full bg-gray-50 border-2 border-gray-50 pl-16 pr-8 py-5 rounded-3xl font-bold focus:bg-white focus:border-madrassah-950 transition-all outline-none" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 border-t border-gray-50 pt-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Benutzername (Login)</label>
                <input 
                  required 
                  value={formData.username || ''} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  className="w-full bg-gray-50 border-2 border-gray-50 px-8 py-5 rounded-3xl font-bold focus:bg-white focus:border-madrassah-950 transition-all outline-none" 
                  placeholder="z.B. a.butt" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Passwort</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input 
                    required 
                    value={formData.password || ''} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className="w-full bg-gray-50 border-2 border-gray-50 pl-16 pr-8 py-5 rounded-3xl font-bold focus:bg-white focus:border-madrassah-950 transition-all outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 pl-16 pr-8 py-5 rounded-3xl font-bold focus:bg-white focus:border-madrassah-950 transition-all outline-none" placeholder="+49 1..." />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Rolle</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full bg-gray-50 border-2 border-gray-100 px-8 py-5 rounded-3xl font-black uppercase text-[11px] outline-none">
                  <option value={UserRole.TEACHER}>Lehrer / Dozent</option>
                  <option value={UserRole.PRINCIPAL}>Schulleitung / Admin</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Titel</label>
                <select value={formData.title} onChange={e => setFormData({...formData, title: e.target.value as any})} className="w-full bg-gray-50 border-2 border-gray-100 px-8 py-5 rounded-3xl font-black uppercase text-[11px] outline-none">
                  {teacherTitles.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Anrede</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full bg-gray-50 border-2 border-gray-100 px-8 py-5 rounded-3xl font-black uppercase text-[11px] outline-none">
                   <option value="Lehrer">Lehrer (m)</option>
                   <option value="Lehrerin">Lehrerin (w)</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
               <label className="text-[11px] font-black uppercase text-madrassah-950 tracking-[0.3em] flex items-center gap-3 border-b border-gray-100 pb-4">
                 <Users size={20} /> Klassen-Zuweisung (Portfolio)
               </label>
               <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4 bg-gray-50 rounded-3xl border-2 border-gray-100 shadow-inner">
                  {staticClasses.map(c => (
                    <button 
                      key={c} 
                      type="button" 
                      onClick={() => {
                        const next = formData.selectedClasses.includes(c) 
                          ? formData.selectedClasses.filter(x => x !== c) 
                          : [...formData.selectedClasses, c];
                        setFormData({...formData, selectedClasses: next});
                      }} 
                      className={`px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${formData.selectedClasses.includes(c) ? 'bg-madrassah-950 text-white border-madrassah-950 shadow-lg' : 'bg-white text-gray-400 border-gray-100'}`}
                    >
                      {c}
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex justify-center pt-8">
              <button type="submit" className="bg-emerald-600 text-white px-24 py-8 rounded-[3rem] font-black uppercase text-[13px] tracking-[0.4em] shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-6">
                <Save size={24} /> {editingUserId ? 'Änderungen speichern' : 'Account jetzt aktivieren'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-10 border-b flex justify-between items-center bg-gray-50/20">
             <h3 className="text-2xl font-black text-madrassah-950 uppercase italic tracking-tighter flex items-center gap-4">
               <Users size={32} className="text-indigo-600" /> Aktives Personal
             </h3>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filteredUsers.length} Mitarbeiter</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] border-b">
                <tr>
                  <th className="px-12 py-8">Name / Stammdaten</th>
                  <th className="px-10 py-8">Rolle & Titel</th>
                  <th className="px-10 py-8">Login / PW</th>
                  <th className="px-10 py-8">Portfolio</th>
                  <th className="px-12 py-8 text-right">Optionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-madrassah-50/20 group transition-all">
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-6">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${u.role === UserRole.PRINCIPAL ? 'bg-indigo-950 text-white border-indigo-900 shadow-xl' : 'bg-white text-madrassah-950 border-gray-100 shadow-inner'}`}>
                            {u.firstName?.charAt(0) || u.name?.charAt(0) || '?'}
                         </div>
                         <div>
                            <p className="font-black text-gray-900 uppercase italic text-xl leading-none">{u.firstName} {u.lastName}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase mt-2 tracking-widest">
                              Geb: {u.birthDate ? new Date(u.birthDate).toLocaleDateString('de-DE') : '---'}
                            </p>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="space-y-1">
                          <span className={`px-4 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${u.role === UserRole.PRINCIPAL ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                             {u.role === UserRole.PRINCIPAL ? 'Admin' : 'Dozent'}
                          </span>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">{u.teacherTitle}</p>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="text-[10px] font-bold space-y-1">
                          <p>User: <span className="text-madrassah-950">{u.name}</span></p>
                          <p>Pass: <span className="text-gray-400">{u.password}</span></p>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {u.assignedClasses?.map(c => <span key={c} className="bg-gray-100 text-gray-500 px-2 py-1 rounded-lg text-[8px] font-black border border-gray-200">{c}</span>)}
                       </div>
                    </td>
                    <td className="px-12 py-8 text-right">
                       <div className="flex justify-end gap-3 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(u)} className="p-4 bg-gray-50 text-gray-400 hover:text-amber-600 rounded-2xl transition-all shadow-sm"><Pencil size={18} /></button>
                          <button onClick={() => { if(window.confirm('Account unwiderruflich löschen?')) onDelete(u.id) }} className="p-4 bg-gray-50 text-gray-400 hover:text-red-600 rounded-2xl transition-all shadow-sm"><Trash2 size={18} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
