import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, Plus, Printer, Sparkles, Loader2, 
  AlertCircle, LayoutDashboard, GraduationCap,
  Calendar, X
} from 'lucide-react';
import { User, UserRole, CurriculumItem } from '../types';
import { useCurriculum } from '../hooks/useCurriculum';
import { useProgress } from '../hooks/useProgress';
import CurriculumFilters from './CurriculumFilters';
import CurriculumAccordion from './CurriculumAccordion';
import CurriculumEditorModal from './CurriculumEditorModal';
import ProgressBar from './ProgressBar';

interface CurriculumPageProps {
  user: User;
}

const CurriculumPage: React.FC<CurriculumPageProps> = ({ user }) => {
  const { 
    years, items, availableLevels, loading, error, fetchItems, 
    upsertItem, deleteItem, publishItem, createYear 
  } = useCurriculum();
  
  const { 
    progress, toggleProgress, loading: progressLoading 
  } = useProgress(user.role === UserRole.STUDENT ? user.id : undefined);

  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('J-1/M-1');
  const [selectedTerm, setSelectedTerm] = useState<'Halbjahr' | 'Abschluss'>('Halbjahr');
  const [isTeacherView, setIsTeacherView] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<CurriculumItem> | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [newYearLabel, setNewYearLabel] = useState('');

  const isAdmin = user.role === UserRole.PRINCIPAL;
  const isTeacher = user.role === UserRole.TEACHER;
  const isStudent = user.role === UserRole.STUDENT;
  const canEdit = isAdmin || isTeacher;

  // Set initial year
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      const activeYear = years.find(y => y.isActive) || years[0];
      // Use setTimeout to defer state update and avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setSelectedYear(activeYear.id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [years, selectedYear]);

  // Fetch items when year changes
  useEffect(() => {
    if (selectedYear) {
      fetchItems(selectedYear);
    }
  }, [selectedYear, fetchItems]);

  // Filter items based on level and term
  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchesLevel = i.level === selectedLevel;
      const matchesTerm = i.term === selectedTerm;
      const isVisible = isTeacherView || i.status === 'published';
      return matchesLevel && matchesTerm && isVisible;
    });
  }, [items, selectedLevel, selectedTerm, isTeacherView]);

  // Calculate progress
  const stats = useMemo(() => {
    const publishedItems = items.filter(i => i.status === 'published' && i.level === selectedLevel && i.term === selectedTerm);
    const total = publishedItems.length;
    if (total === 0) return { total: 0, completed: 0, percent: 0 };

    const completed = publishedItems.filter(i => 
      progress.find(p => p.curriculumItemId === i.id)?.isCompleted
    ).length;

    return {
      total,
      completed,
      percent: (completed / total) * 100
    };
  }, [items, progress, selectedLevel, selectedTerm]);

  const handleSaveItem = async (item: Partial<CurriculumItem>) => {
    const res = await upsertItem(item, user.id);
    if (res.success) {
      setShowEditor(false);
      setEditingItem(null);
    } else {
      alert(`Fehler beim Speichern: ${res.error}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Möchten Sie diesen Lerninhalt wirklich löschen?")) return;
    const res = await deleteItem(id, selectedYear);
    if (!res.success) {
      alert(`Fehler beim Löschen: ${res.error}`);
    }
  };

  const handlePublishItem = async (id: string) => {
    const res = await publishItem(id, selectedYear, user.id);
    if (!res.success) {
      alert(`Fehler beim Veröffentlichen: ${res.error}`);
    }
  };

  const handleCreateYear = async () => {
    if (!newYearLabel) return;
    // Basic validation for format like 2024/2025
    if (!/^\d{4}\/\d{4}$/.test(newYearLabel)) {
      alert("Bitte das Format YYYY/YYYY einhalten (z.B. 2025/2026)");
      return;
    }

    const startYear = newYearLabel.split('/')[0];
    const endYear = newYearLabel.split('/')[1];
    
    const res = await createYear(
      newYearLabel,
      `${startYear}-09-01`,
      `${endYear}-07-31`,
      user.id
    );

    if (res.success) {
      setShowYearModal(false);
      setNewYearLabel('');
      setSelectedYear(res.data.id);
    } else {
      alert(`Fehler beim Erstellen des Schuljahres: ${res.error}`);
    }
  };

  if (loading && years.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 animate-pulse">
        <Loader2 size={60} className="text-madrassah-950 animate-spin mb-6" />
        <p className="text-2xl font-black uppercase tracking-tighter italic text-madrassah-950">Lehrplan wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
      {/* Majestic Header */}
      <div className="bg-madrassah-950 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-center gap-10 no-print">
        <div className="absolute inset-0 islamic-pattern opacity-10"></div>
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] rotate-12"><BookOpen className="w-80 h-80 text-white" /></div>
        
        <div className="relative z-10 flex items-center gap-10">
           <div className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform p-5">
              <BookOpen className="w-14 h-14" />
           </div>
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <span className="bg-gold-400 text-madrassah-950 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Curriculum</span>
                 <Sparkles size={16} className="text-gold-400 animate-pulse" />
              </div>
              <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Lehrplan & Ziele</h2>
              <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 italic">Digitale Akademie Madrassah Al-Huda</p>
           </div>
        </div>

        <div className="flex gap-4 relative z-10">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-3 px-8 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-white/20 hover:-translate-y-1 transition-all"
          >
            <Printer size={18} /> Drucken / PDF
          </button>
          {canEdit && (
            <div className="flex gap-3">
              {isAdmin && (
                <button 
                  onClick={() => setShowYearModal(true)}
                  className="flex items-center gap-3 px-8 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-white/20 hover:-translate-y-1 transition-all"
                >
                  <Calendar className="w-4 h-4" /> Jahr +
                </button>
              )}
              <button 
                onClick={() => { setEditingItem(null); setShowEditor(true); }}
                className="flex items-center gap-3 px-8 py-5 bg-gold-400 text-madrassah-950 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-white hover:-translate-y-1 transition-all"
              >
                <Plus size={18} /> Neuer Punkt
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {years.length === 0 && !loading && (
        <div className="bg-amber-50 p-10 rounded-[3.5rem] border-2 border-amber-100 flex items-center gap-8 text-amber-700 no-print">
          <AlertCircle size={40} className="shrink-0" />
          <div>
            <h4 className="text-xl font-black uppercase italic leading-none mb-2">Kein Schuljahr gefunden</h4>
            <p className="text-sm font-medium">Es wurde noch kein Schuljahr (z.B. 2025/2026) in der Datenbank angelegt. Bitte führen Sie das SQL-Setup-Skript aus oder legen Sie ein Jahr manuell an.</p>
          </div>
        </div>
      )}

      <CurriculumFilters 
        years={years}
        levels={availableLevels}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        selectedTerm={selectedTerm}
        onTermChange={setSelectedTerm}
        isTeacherView={isTeacherView}
        onViewChange={setIsTeacherView}
        canEdit={canEdit}
      />

      {/* Progress Bar for Students */}
      {isStudent && stats.total > 0 && (
        <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm no-print">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <GraduationCap size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-madrassah-950 uppercase italic leading-none">Dein Lernfortschritt</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase mt-2 tracking-widest">{selectedLevel} • {selectedTerm}</p>
            </div>
          </div>
          <ProgressBar 
            progress={stats.percent} 
            label={`${stats.completed} von ${stats.total} Themen abgeschlossen`}
            size="lg"
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 p-10 rounded-[3.5rem] border-2 border-red-100 flex items-center gap-8 text-red-700">
          <AlertCircle size={40} className="shrink-0" />
          <div>
            <h4 className="text-xl font-black uppercase italic leading-none mb-2">Systemfehler</h4>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && !loading && (
        <div className="py-40 text-center flex flex-col items-center justify-center animate-in fade-in duration-1000">
          <div className="w-32 h-32 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-gray-200">
            <LayoutDashboard size={60} />
          </div>
          <h3 className="text-4xl font-black text-gray-200 uppercase italic tracking-tighter">Keine Inhalte gefunden</h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-6 italic">Wähle einen anderen Zeitraum oder Stufe</p>
        </div>
      )}

      {/* Curriculum Content */}
      <CurriculumAccordion 
        items={filteredItems}
        progress={progress}
        onToggleProgress={toggleProgress}
        onEdit={(item) => { setEditingItem(item); setShowEditor(true); }}
        onDelete={handleDeleteItem}
        onPublish={handlePublishItem}
        isTeacherView={isTeacherView}
        canEdit={canEdit}
      />

      {/* Editor Modal */}
      {showEditor && (
        <CurriculumEditorModal 
          item={editingItem || undefined}
          onClose={() => { setShowEditor(false); setEditingItem(null); }}
          onSave={handleSaveItem}
          yearId={selectedYear}
          level={selectedLevel}
          term={selectedTerm}
          availableLevels={availableLevels}
        />
      )}

      {/* Year Creation Modal */}
      {showYearModal && (
        <div className="fixed inset-0 z-[100] bg-madrassah-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[4rem] p-12 shadow-2xl relative border-4 border-white">
            <button onClick={() => setShowYearModal(false)} className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-all">
              <X size={32} />
            </button>
            
            <div className="mb-10">
              <h3 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter">Schuljahr anlegen</h3>
              <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mt-2">Erstelle ein neues Jahr bis 2035</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Bezeichnung (Format: YYYY/YYYY)</label>
                <input 
                  type="text" 
                  placeholder="z.B. 2025/2026"
                  value={newYearLabel}
                  onChange={(e) => setNewYearLabel(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 p-6 rounded-3xl font-black text-xl outline-none focus:border-madrassah-950 transition-all"
                />
              </div>

              <button 
                onClick={handleCreateYear}
                disabled={!newYearLabel}
                className="w-full bg-madrassah-950 text-white font-black py-6 rounded-3xl shadow-2xl uppercase text-[12px] tracking-[0.4em] hover:bg-black transition-all disabled:opacity-30"
              >
                Jahr erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View (Hidden on Screen) */}
      <div className="hidden print:block print-content">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black uppercase italic mb-2">Lehrplan Madrassah Al-Huda</h1>
          <p className="text-xl font-bold uppercase tracking-widest text-gray-500">
            {selectedLevel} • {selectedTerm} • Schuljahr {years.find(y => y.id === selectedYear)?.label}
          </p>
        </div>

        <div className="space-y-10">
          {['Yassarnal Quran', 'Tajweed', 'Hifz', 'Fiqh', 'Sierah', 'Arabisch', 'Arabisch Modul 1', 'Arabisch Modul 2', 'Arabisch Modul 3', 'Akhlaq', 'Hadieth', 'Usul-ul-Hadieth', 'Aqeedah', 'Usul-ul-Fiqh', 'Ilmiyyah', 'Imam', 'Ziele'].map(subject => {
            const subjectItems = filteredItems.filter(i => i.subject === subject);
            if (subjectItems.length === 0) return null;

            return (
              <div key={subject} className="break-inside-avoid">
                <h2 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 mb-6">{subject}</h2>
                <div className="space-y-6">
                  {subjectItems.map(item => (
                    <div key={item.id} className="border-l-4 border-gray-200 pl-6 py-2">
                      <h3 className="text-lg font-black uppercase italic mb-2">{item.title}</h3>
                      <div className="text-gray-700 font-medium leading-relaxed italic whitespace-pre-line">
                        {item.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 pt-10 border-t border-gray-100 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
          © {new Date().getFullYear()} Madrassah Al-Huda • Alle Rechte vorbehalten
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-content { display: block !important; }
          body { background: white !important; color: black !important; }
          .print-content { padding: 2cm; }
          .break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default CurriculumPage;
