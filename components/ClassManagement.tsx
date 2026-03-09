
import React, { useState } from 'react';
import { Plus, Trash2, School, GraduationCap, Users, User as UserIcon, X, Save, RotateCcw, Info } from 'lucide-react';
import { SchoolClass, Gender, User } from '../types';

interface Props {
  classes: SchoolClass[];
  onUpdate: (classes: SchoolClass[]) => void;
  user: User;
}

const DEFAULT_CLASSES: Partial<SchoolClass>[] = [
  { name: 'J-1a', category: 'KIDS', gender: 'Junge' },
  { name: 'J-1b', category: 'KIDS', gender: 'Junge' },
  { name: 'J-2', category: 'KIDS', gender: 'Junge' },
  { name: 'J-3', category: 'KIDS', gender: 'Junge' },
  { name: 'J-4', category: 'KIDS', gender: 'Junge' },
  { name: 'J-5', category: 'KIDS', gender: 'Junge' },
  { name: 'J-6', category: 'KIDS', gender: 'Junge' },
  { name: 'J-1', category: 'ADULT', gender: 'Mann' },
  { name: 'J-2', category: 'ADULT', gender: 'Mann' },
  { name: 'J-3', category: 'ADULT', gender: 'Mann' },
  { name: 'J-4', category: 'ADULT', gender: 'Mann' },
  { name: 'J-5', category: 'ADULT', gender: 'Mann' },
  { name: 'J-6', category: 'ADULT', gender: 'Mann' },
  { name: 'J-Imam', category: 'ADULT', gender: 'Mann' },
  { name: 'J-Ijazah', category: 'ADULT', gender: 'Mann' },
  { name: 'J-Ilmiyyah', category: 'ADULT', gender: 'Mann' },
  { name: 'J-Hifz', category: 'KIDS', gender: 'Junge' },
  { name: 'M-1a', category: 'KIDS', gender: 'Mädchen' },
  { name: 'M-1b', category: 'KIDS', gender: 'Mädchen' },
  { name: 'M-2', category: 'KIDS', gender: 'Mädchen' },
  { name: 'M-3', category: 'KIDS', gender: 'Mädchen' },
  { name: 'M-4', category: 'KIDS', gender: 'Mädchen' },
  { name: 'M-5', category: 'KIDS', gender: 'Mädchen' },
  { name: 'M-6', category: 'KIDS', gender: 'Mädchen' },
  { name: 'M-1', category: 'ADULT', gender: 'Frau' },
  { name: 'M-2', category: 'ADULT', gender: 'Frau' },
  { name: 'M-3', category: 'ADULT', gender: 'Frau' },
  { name: 'M-4', category: 'ADULT', gender: 'Frau' },
  { name: 'M-5', category: 'ADULT', gender: 'Frau' },
  { name: 'M-6', category: 'ADULT', gender: 'Frau' },
  { name: 'M-Imam', category: 'ADULT', gender: 'Frau' },
  { name: 'M-Ijazah', category: 'ADULT', gender: 'Frau' },
  { name: 'M-Ilmiyyah', category: 'ADULT', gender: 'Frau' },
  { name: 'M-Hifz', category: 'KIDS', gender: 'Mädchen' },
  { name: 'Arabisch Modul 1', category: 'ADULT', gender: 'Gemischt' },
  { name: 'Arabisch Modul 2', category: 'ADULT', gender: 'Gemischt' },
  { name: 'Arabisch Modul 3', category: 'ADULT', gender: 'Gemischt' }
];

const ClassManagement: React.FC<Props> = ({ classes, onUpdate }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newCategory, setNewCategory] = useState<'KIDS' | 'ADULT'>('KIDS');
  const [newGender, setNewGender] = useState<Gender | 'Gemischt'>('Junge');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    
    if (classes.some(c => c.name.toLowerCase() === newClassName.trim().toLowerCase())) {
      alert("Eine Klasse mit diesem Namen existiert bereits.");
      return;
    }

    const newClass: SchoolClass = {
      id: `C-${Date.now().toString().slice(-5)}`,
      name: newClassName.trim(),
      category: newCategory,
      gender: newGender,
      createdAt: new Date().toISOString()
    };

    onUpdate([...classes, newClass]);
    setNewClassName('');
    setShowAdd(false);
  };

  const restoreDefaults = () => {
    if (window.confirm("Möchten Sie die Standard-Klassenstruktur wiederherstellen? Bestehende eigene Klassen bleiben erhalten.")) {
      const existingNames = classes.map(c => c.name.toLowerCase());
      const toAdd = DEFAULT_CLASSES
        .filter(d => !existingNames.includes(d.name!.toLowerCase()))
        .map(d => ({
          id: `C-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          name: d.name!,
          category: d.category as 'KIDS' | 'ADULT',
          gender: d.gender as Gender | 'Gemischt',
          createdAt: new Date().toISOString()
        }));
      onUpdate([...classes, ...toAdd]);
    }
  };

  const removeClass = (id: string, name: string) => {
    if (window.confirm(`Möchten Sie die Klasse ${name} wirklich löschen?`)) {
      onUpdate(classes.filter(c => c.id !== id));
    }
  };

  const grouped = {
    KIDS: classes.filter(c => c.category === 'KIDS'),
    ADULT: classes.filter(c => c.category === 'ADULT')
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-indigo-950 rotate-12"><School size={280} /></div>
        <div className="relative z-10 flex items-center gap-8">
          <div className="bg-indigo-950 p-6 rounded-[2rem] shadow-2xl text-white transform -rotate-3">
             <School size={42} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter">Klassen-Setup</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 italic">Strukturierung & Kapazitätsplanung</p>
          </div>
        </div>
        <div className="flex gap-4 relative z-10">
           <button onClick={restoreDefaults} className="bg-white text-gray-500 border-2 border-gray-100 px-8 py-5 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-gray-50 transition-all">
              <RotateCcw size={18} /> Standards laden
           </button>
           <button onClick={() => setShowAdd(true)} className="bg-madrassah-950 text-white px-10 py-5 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-4 shadow-xl hover:bg-black transition-all hover:-translate-y-1">
              <Plus size={24} /> Neue Klasse
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         {/* Kinder Sektion */}
         <div className="space-y-8">
            <h3 className="text-xl font-black text-indigo-950 uppercase italic tracking-widest flex items-center gap-4 px-4">
               <Users size={24} className="text-indigo-600" /> Kinder & Jugendliche
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {grouped.KIDS.length > 0 ? grouped.KIDS.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${c.gender === 'Junge' ? 'bg-indigo-600' : c.gender === 'Mädchen' ? 'bg-pink-600' : 'bg-gray-400'}`}>
                           {c.name.charAt(0)}
                        </div>
                        <div>
                           <p className="font-black text-madrassah-950 uppercase italic leading-none">{c.name}</p>
                           <p className="text-[8px] font-bold text-gray-400 uppercase mt-2">{c.gender}</p>
                        </div>
                     </div>
                     <button onClick={() => removeClass(c.id, c.name)} className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                     </button>
                  </div>
               )) : (
                 <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-200 rounded-[3rem] text-gray-400 italic text-sm">Keine Kinderklassen definiert</div>
               )}
            </div>
         </div>

         {/* Erwachsene Sektion */}
         <div className="space-y-8">
            <h3 className="text-xl font-black text-emerald-950 uppercase italic tracking-widest flex items-center gap-4 px-4">
               <GraduationCap size={24} className="text-emerald-600" /> Erwachsenenbildung
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {grouped.ADULT.length > 0 ? grouped.ADULT.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all border-l-8 border-l-emerald-600">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center font-black text-emerald-700 shadow-inner`}>
                           <UserIcon size={24}/>
                        </div>
                        <div>
                           <p className="font-black text-madrassah-950 uppercase italic leading-none">{c.name}</p>
                           <p className="text-[8px] font-bold text-emerald-600 uppercase mt-2">{c.gender}</p>
                        </div>
                     </div>
                     <button onClick={() => removeClass(c.id, c.name)} className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                     </button>
                  </div>
               )) : (
                <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-200 rounded-[3rem] text-gray-400 italic text-sm">Keine Erwachsenenkurse definiert</div>
               )}
            </div>
         </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 p-10 rounded-[3.5rem] border border-indigo-100 flex items-start gap-8">
         <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl"><Info size={32}/></div>
         <div>
            <h4 className="text-lg font-black uppercase text-indigo-950 italic mb-2">Hinweis zur Verwaltung</h4>
            <p className="text-sm text-indigo-800/70 leading-relaxed font-medium italic">
               Hier erstellte Klassen erscheinen sofort in der Schüler-Anmeldung, im Lehrer-Management und in der WhatsApp-Zentrale. 
               Verwenden Sie eindeutige Namen, um die Zuordnung in Berichten zu erleichtern.
            </p>
         </div>
      </div>

      {/* Creation Modal */}
      {showAdd && (
         <div className="fixed inset-0 z-[100] bg-madrassah-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl relative border-4 border-white animate-in zoom-in">
               <button onClick={() => setShowAdd(false)} className="absolute top-10 right-10 text-gray-300 hover:text-red-500 transition-all"><X size={32}/></button>
               
               <div className="mb-10 text-center">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[1.75rem] flex items-center justify-center mx-auto mb-6 shadow-inner"><Plus size={36}/></div>
                  <h3 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter">Klasse hinzufügen</h3>
                  <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mt-2">Erweiterung des Kursangebots</p>
               </div>

               <form onSubmit={handleAdd} className="space-y-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Klassen-Bezeichnung</label>
                     <input required autoFocus value={newClassName} onChange={e => setNewClassName(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-black uppercase text-sm outline-none focus:border-madrassah-950 shadow-inner" placeholder="z.B. J-1a oder Erw-Akhlaq" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Kategorie</label>
                        <select value={newCategory} onChange={e => {
                           const cat = e.target.value as 'KIDS' | 'ADULT';
                           setNewCategory(cat);
                           setNewGender(cat === 'KIDS' ? 'Junge' : 'Mann');
                        }} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-black uppercase text-[10px] outline-none">
                           <option value="KIDS">Kinder/Jugend</option>
                           <option value="ADULT">Erwachsene</option>
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Gruppe</label>
                        <select value={newGender} onChange={e => setNewGender(e.target.value as Gender | 'Gemischt')} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-black uppercase text-[10px] outline-none">
                           {newCategory === 'KIDS' ? (
                              <><option value="Junge">Jungen</option><option value="Mädchen">Mädchen</option><option value="Gemischt">Gemischt</option></>
                           ) : (
                              <><option value="Mann">Männer</option><option value="Frau">Frauen</option><option value="Gemischt">Gemischt</option></>
                           )}
                        </select>
                     </div>
                  </div>

                  <button type="submit" className="w-full bg-madrassah-950 text-white font-black py-7 rounded-[2.5rem] shadow-2xl uppercase text-[12px] tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-4">
                     <Save size={20} /> Klasse jetzt aktivieren
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default ClassManagement;
