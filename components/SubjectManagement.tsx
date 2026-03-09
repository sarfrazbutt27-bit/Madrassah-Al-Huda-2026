
import React, { useState } from 'react';
import { Plus, Trash2, Layers, BookOpen, Award } from 'lucide-react';

interface Props {
  subjects: string[];
  onUpdate: (subjects: string[]) => void;
}

const SubjectManagement: React.FC<Props> = ({ subjects, onUpdate }) => {
  const [newSubject, setNewSubject] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || subjects.includes(newSubject.trim())) return;
    onUpdate([...subjects, newSubject.trim()]);
    setNewSubject('');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-8">
          <div className="bg-indigo-950 p-6 rounded-[2rem] shadow-2xl text-white"><Layers size={42} /></div>
          <div>
            <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter">Fachbereiche</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">Akademisches Portfolio & Lehrplan</p>
          </div>
        </div>
        <div className="bg-emerald-50 px-8 py-5 rounded-[2.5rem] border border-emerald-100 flex items-center gap-6 text-emerald-950">
           <Award className="text-emerald-600" size={32} />
           <p className="text-3xl font-black italic">{subjects.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 bg-white p-10 rounded-[3.5rem] border shadow-xl h-fit">
           <h3 className="text-2xl font-black text-madrassah-950 uppercase italic mb-8 flex items-center gap-4"><Plus size={28} className="text-emerald-500" /> Neu anlegen</h3>
           <form onSubmit={handleAdd} className="space-y-6">
              <input required value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-50 px-6 py-5 rounded-2xl font-bold focus:border-madrassah-950 outline-none" placeholder="z.B. Tajweed II" />
              <button type="submit" className="w-full bg-madrassah-950 text-white font-black py-6 rounded-2xl shadow-xl uppercase text-[11px] tracking-widest hover:bg-black transition-all">Fach hinzufügen</button>
           </form>
        </div>

        <div className="lg:col-span-8 bg-white rounded-[4rem] shadow-sm border overflow-hidden">
           <div className="p-10 border-b bg-gray-50/20 flex items-center gap-4"><BookOpen size={28} className="text-indigo-600" /><h3 className="text-2xl font-black text-madrassah-950 uppercase italic">Aktueller Lehrplan</h3></div>
           <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              {subjects.map((s, idx) => (
                <div key={idx} className="bg-white border border-gray-100 p-8 rounded-3xl flex justify-between items-center group hover:shadow-2xl transition-all">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-lg">{idx + 1}</div>
                      <span className="font-black text-xl text-madrassah-950 uppercase italic leading-none">{s}</span>
                   </div>
                   <button onClick={() => onUpdate(subjects.filter(x => x !== s))} className="p-3 text-gray-200 hover:text-red-500 transition-all"><Trash2 size={20} /></button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectManagement;
