import React, { useState, useEffect } from 'react';
import { CurriculumItem } from '../types';
import { X, Save, Sparkles, BookOpen, ListOrdered, FileText, Send, Loader2 } from 'lucide-react';

interface CurriculumEditorModalProps {
  item?: Partial<CurriculumItem>;
  onClose: () => void;
  onSave: (item: Partial<CurriculumItem>) => Promise<void>;
  yearId: string;
  level: string;
  term: 'Halbjahr' | 'Abschluss';
  availableLevels: string[];
}

const CurriculumEditorModal: React.FC<CurriculumEditorModalProps> = ({
  item,
  onClose,
  onSave,
  yearId,
  level,
  term,
  availableLevels
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<CurriculumItem>>({
    yearId,
    level,
    term,
    subject: 'Quran',
    title: '',
    content: '',
    orderIndex: 0,
    status: 'draft'
  });

  const subjects = ['Quran', 'Tajweed', 'Hifz', 'Fiqh', 'Sierah', 'Arabisch', 'Arabisch Modul 1', 'Arabisch Modul 2', 'Arabisch Modul 3', 'Akhlaq', 'Hadieth', 'Usul-ul-Hadieth', 'Aqeedah', 'Usul-ul-Fiqh', 'Ilmiyyah', 'Imam', 'Ziele'];

  useEffect(() => {
    if (item) {
      setFormData(prev => ({ ...prev, ...item }));
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-madrassah-950/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden border-4 border-white/20 animate-in zoom-in-95 duration-500">
        {/* Modal Header */}
        <div className="bg-madrassah-950 p-10 md:p-14 text-white flex justify-between items-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12"><Sparkles size={200} /></div>
           <div className="relative z-10 flex items-center gap-8">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center shadow-2xl transform -rotate-6">
                 <BookOpen size={32} className="text-gold-400" />
              </div>
              <div>
                 <h3 className="text-3xl font-black uppercase italic leading-none">{item?.id ? 'Lerninhalt bearbeiten' : 'Neuer Lerninhalt'}</h3>
                 <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] mt-3 italic">{level} • {term}</p>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="relative z-10 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10"
           >
             <X size={24} />
           </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-10 md:p-14 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Subject Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2 flex items-center gap-3">
                <BookOpen size={14} /> Fach
              </label>
              <select 
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-gray-50 border-2 border-gray-50 px-8 py-5 rounded-3xl font-black uppercase text-[11px] outline-none focus:bg-white focus:border-madrassah-950 transition-all shadow-inner appearance-none cursor-pointer"
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Level Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2 flex items-center gap-3">
                <Sparkles size={14} /> Stufe / Kurs
              </label>
              <div className="flex gap-2">
                <select 
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="flex-1 bg-gray-50 border-2 border-gray-50 px-8 py-5 rounded-3xl font-black uppercase text-[11px] outline-none focus:bg-white focus:border-madrassah-950 transition-all shadow-inner appearance-none cursor-pointer"
                >
                  {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
                  <option value="NEW">+ Neue Stufe...</option>
                </select>
                {formData.level === 'NEW' && (
                  <input 
                    autoFocus
                    placeholder="Name der Stufe"
                    className="flex-1 bg-gray-50 border-2 border-madrassah-950 px-8 py-5 rounded-3xl font-black uppercase text-[11px] outline-none shadow-inner"
                    onBlur={(e) => {
                      if (e.target.value) setFormData({ ...formData, level: e.target.value });
                      else setFormData({ ...formData, level: availableLevels[0] });
                    }}
                  />
                )}
              </div>
            </div>

            {/* Order Index */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2 flex items-center gap-3">
                <ListOrdered size={14} /> Reihenfolge
              </label>
              <input 
                type="number"
                value={isNaN(formData.orderIndex || 0) ? '' : formData.orderIndex}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFormData({ ...formData, orderIndex: isNaN(val) ? 0 : val });
                }}
                className="w-full bg-gray-50 border-2 border-gray-50 px-8 py-5 rounded-3xl font-bold focus:bg-white focus:border-madrassah-950 transition-all outline-none shadow-inner"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2 flex items-center gap-3">
              <FileText size={14} /> Titel / Überschrift
            </label>
            <input 
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-50 border-2 border-gray-50 px-8 py-5 rounded-3xl font-black uppercase text-xl italic focus:bg-white focus:border-madrassah-950 transition-all outline-none shadow-inner"
              placeholder="z.B. Yassarnal Qur'an Teil 1"
            />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2 flex items-center gap-3">
              <FileText size={14} /> Detaillierter Inhalt (Punkte pro Zeile)
            </label>
            <textarea 
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full h-64 bg-gray-50 border-2 border-gray-50 p-8 rounded-[3rem] font-medium text-gray-700 leading-relaxed italic focus:bg-white focus:border-madrassah-950 transition-all outline-none shadow-inner"
              placeholder="Arabische Buchstaben erkennen&#10;Fatha, Kasra, Damma&#10;einfache Silben"
            />
          </div>

          {/* Status Selection */}
          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2 flex items-center gap-3">
              <Send size={14} /> Status
            </label>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, status: 'draft' })}
                className={`flex-1 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.status === 'draft' ? 'bg-amber-500 border-amber-400 text-white shadow-xl scale-105' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-amber-200'}`}
              >
                Entwurf
              </button>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, status: 'published' })}
                className={`flex-1 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.status === 'published' ? 'bg-emerald-600 border-emerald-500 text-white shadow-xl scale-105' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-emerald-200'}`}
              >
                Veröffentlichen
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-10 border-t border-gray-100">
            <button 
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-12 py-6 rounded-[2rem] bg-gray-100 text-gray-400 font-black uppercase text-[11px] tracking-widest hover:bg-gray-200 transition-all"
            >
              Abbrechen
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-20 py-6 rounded-[2rem] bg-madrassah-950 text-white font-black uppercase text-[11px] tracking-widest hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {isSaving ? 'Wird gespeichert...' : 'Lerninhalt speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CurriculumEditorModal;
