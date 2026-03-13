import React, { useState } from 'react';
import { CurriculumItem, CurriculumProgress } from '../types';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Edit3, Trash2, Send, Clock, Sparkles } from 'lucide-react';

interface CurriculumAccordionProps {
  items: CurriculumItem[];
  progress: CurriculumProgress[];
  onToggleProgress: (itemId: string, isCompleted: boolean) => void;
  onEdit?: (item: CurriculumItem) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  isTeacherView: boolean;
  canEdit: boolean;
}

const CurriculumAccordion: React.FC<CurriculumAccordionProps> = ({
  items,
  progress,
  onToggleProgress,
  onEdit,
  onDelete,
  onPublish,
  isTeacherView,
  canEdit
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const subjects = ['Yassarnal Quran', 'Tajweed', 'Hifz', 'Fiqh', 'Sierah', 'Arabisch', 'Arabisch Modul 1', 'Arabisch Modul 2', 'Arabisch Modul 3', 'Akhlaq', 'Hadieth', 'Usul-ul-Hadieth', 'Aqeedah', 'Usul-ul-Fiqh', 'Ilmiyyah', 'Imam', 'Ziele'];

  const toggleExpand = (id: string) => {
    const next = new Set(expandedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedItems(next);
  };

  const isCompleted = (itemId: string) => progress.find(p => p.curriculumItemId === itemId)?.isCompleted;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {subjects.map((subject) => {
        const subjectItems = items.filter(i => i.subject === subject);
        if (subjectItems.length === 0) return null;

        return (
          <div key={subject} className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
            {/* Subject Header */}
            <div className="bg-gray-50/50 p-10 border-b border-gray-100 flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-madrassah-950 pointer-events-none rotate-12"><Sparkles size={120} /></div>
               <div className="relative z-10 flex items-center gap-6">
                  <div className="w-12 h-12 bg-madrassah-950 text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                     <Sparkles size={24} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-madrassah-950 uppercase italic tracking-widest">{subject}</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase mt-2 tracking-widest">{subjectItems.length} Lerninhalte</p>
                  </div>
               </div>
            </div>

            {/* Items List */}
            <div className="p-10 space-y-6">
              {subjectItems.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                const completed = isCompleted(item.id);

                return (
                  <div key={item.id} className={`rounded-[2.5rem] border-2 transition-all duration-500 ${isExpanded ? 'border-madrassah-950 bg-white shadow-2xl' : 'border-gray-50 bg-gray-50/30 hover:border-gray-200'}`}>
                    {/* Item Header */}
                    <div 
                      onClick={() => toggleExpand(item.id)}
                      className="p-8 flex items-center justify-between cursor-pointer group/item"
                    >
                      <div className="flex items-center gap-6 flex-1">
                        {!isTeacherView && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleProgress(item.id, !completed);
                            }}
                            className={`p-3 rounded-xl transition-all transform hover:scale-110 ${completed ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-gray-300 border border-gray-100 hover:text-emerald-500 hover:border-emerald-200 shadow-sm'}`}
                          >
                            {completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>
                        )}
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className={`font-black uppercase italic tracking-tight transition-colors ${isExpanded ? 'text-madrassah-950 text-xl' : 'text-gray-600 group-hover/item:text-madrassah-950'}`}>
                              {item.title}
                            </h4>
                            {item.status === 'draft' && isTeacherView && (
                              <span className="bg-amber-100 text-amber-600 px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-200">Entwurf</span>
                            )}
                          </div>
                          {completed && !isTeacherView && (
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                              <CheckCircle2 size={10} /> Abgeschlossen
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {isTeacherView && canEdit && (
                          <div className="flex items-center gap-2 transition-opacity">
                            {item.status === 'draft' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onPublish?.(item.id); }}
                                className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title="Veröffentlichen"
                              >
                                <Send size={16} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}
                              className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                              title="Bearbeiten"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}
                              className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Löschen"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        <div className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-madrassah-950 text-white' : 'text-gray-300'}`}>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>

                    {/* Item Content */}
                    {isExpanded && (
                      <div className="px-8 pb-10 pt-4 border-t border-gray-50 animate-in slide-in-from-top-2 duration-300">
                        <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100">
                          <div className="prose prose-sm max-w-none text-gray-600 font-medium leading-relaxed italic">
                            {item.content?.split('\n').map((line, i) => (
                              <p key={i} className="mb-4 flex items-start gap-3">
                                <span className="w-1.5 h-1.5 bg-madrassah-950 rounded-full mt-2 shrink-0"></span>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                        
                        {isTeacherView && (
                          <div className="mt-8 flex items-center justify-between px-4">
                            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
                              <Clock size={12} />
                              <span>Zuletzt geändert: {new Date(item.updatedAt).toLocaleDateString('de-DE')}</span>
                            </div>
                            {item.publishedAt && (
                              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                <CheckCircle2 size={12} />
                                <span>Veröffentlicht am: {new Date(item.publishedAt).toLocaleDateString('de-DE')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CurriculumAccordion;
