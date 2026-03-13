
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Library, Plus, Search, FileText, Video, Image, Headset, Link as LinkIcon, 
  Trash2, ChevronDown, Folder, FolderOpen, 
  ChevronRight, Home, BookOpen, ArrowLeft, FileDown, 
  X, FileUp, Loader2, Book, Brain, Globe, Settings2
} from 'lucide-react';
import { User, UserRole, Resource, Student, Grade, QuizResult } from '../types';
import { supabase } from '../lib/supabase';
import { generateQuizFromResource } from '../lib/geminiService';
import TheoryQuiz from './TheoryQuiz';
import QuranTheoryViewer from './QuranTheoryViewer';

interface TheoryManagerProps {
  user: User;
  resources: Resource[];
  onUpdateResources: (r: Resource[], itemsToSync?: Resource[], itemToDelete?: Resource) => void;
  subjects: string[];
  students: Student[];
  onNotify: (n: { userId: string; role: UserRole; title: string; message: string; type: string }) => void;
  grades: Grade[];
  onUpdateGrades: (grades: Grade[], itemsToSync?: Grade[]) => void;
  saveQuizResult: (result: QuizResult) => Promise<boolean>;
  updateAutomatedGrade: (studentId: string, subject: string, term: 'Halbjahr' | 'Abschluss') => Promise<void>;
  calculateSubjectGrade: (studentId: string, subject: string, term: 'Halbjahr' | 'Abschluss') => { total: number, hasBonus: boolean, isMaxed: boolean };
}

const TheoryManager: React.FC<TheoryManagerProps> = ({ 
  user, 
  resources, 
  onUpdateResources, 
  subjects, 
  students, 
  onNotify, 
  grades, 
  onUpdateGrades,
  saveQuizResult,
  updateAutomatedGrade,
  calculateSubjectGrade
}) => {
  const isTeacher = user.role === UserRole.TEACHER;
  const isPrincipal = user.role === UserRole.PRINCIPAL;
  const isStudent = user.role === UserRole.STUDENT;
  const canManage = isTeacher || isPrincipal;
  const navigate = useNavigate();
  const location = useLocation();
  const isExamMode = location.pathname === '/exams';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPath, setCurrentPath] = useState<{ className: string | null; subject: string | null }>({
    className: null,
    subject: null
  });

  const [showAddForm, setShowAddForm] = useState(() => {
    return localStorage.getItem('theory_show_add_modal') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('theory_show_add_modal', showAddForm.toString());
  }, [showAddForm]);
  const [activeQuizResource, setActiveQuizResource] = useState<Resource | null>(null);
  const hasRestored = useRef(false);

  // Restore active resource from localStorage once resources are loaded
  useEffect(() => {
    if (!hasRestored.current && resources.length > 0) {
      const savedId = localStorage.getItem('theory_active_res_id');
      if (savedId && !activeQuizResource) {
        const found = resources.find(r => r.id === savedId);
        if (found) {
          setActiveQuizResource(found);
        }
      }
      hasRestored.current = true;
    }
  }, [resources, activeQuizResource]);

  // Update active resource if resources list changes (to keep reference fresh)
  useEffect(() => {
    if (activeQuizResource) {
      const updated = resources.find(r => r.id === activeQuizResource.id);
      if (updated) setActiveQuizResource(updated);
    }
  }, [resources, activeQuizResource]);

  useEffect(() => {
    if (activeQuizResource) {
      localStorage.setItem('theory_active_res_id', activeQuizResource.id);
    } else {
      localStorage.removeItem('theory_active_res_id');
    }
  }, [activeQuizResource]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<string | null>(null);

  const [newRes, setNewRes] = useState<{
    title: string;
    type: Resource['type'];
    url: string;
    className: string;
    subject: string;
    isMainBook: boolean;
    language: 'arabic' | 'german' | 'mixed';
    lessons: { title: string; audioUrl: string }[];
  }>(() => {
    const saved = localStorage.getItem('theory_add_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse theory draft", e);
      }
    }
    return { 
      title: '', 
      type: 'pdf', 
      url: '', 
      className: 'Alle', 
      subject: subjects[0],
      isMainBook: false,
      language: 'mixed',
      lessons: []
    };
  });

  // Save draft to localStorage whenever it changes
  useEffect(() => {
    if (showAddForm) {
      localStorage.setItem('theory_add_draft', JSON.stringify(newRes));
    }
  }, [newRes, showAddForm]);

  useEffect(() => {
    if (!localStorage.getItem('theory_add_draft')) {
      setNewRes(prev => ({
        ...prev,
        className: currentPath.className || 'Alle',
        subject: currentPath.subject || subjects[0]
      }));
    }
  }, [currentPath, subjects]);

  const myClass = isStudent ? students.find(s => s.id === user.id)?.className : null;
  const assignedClasses = useMemo(() => user.assignedClasses || [], [user.assignedClasses]);

  const accessibleResources = useMemo(() => {
    return resources.filter(r => {
      if (isPrincipal) return true;
      if (isTeacher) return assignedClasses.includes(r.className) || r.className === 'Alle';
      if (isStudent) {
        // Students only see resources assigned to their class AND unlocked by teacher
        const isAssigned = r.className === myClass || r.className === 'Alle';
        const isUnlocked = r.isUnlocked;
        
        // If in exam mode, only show main books
        if (isExamMode) {
          return isAssigned && isUnlocked && r.isMainBook;
        }
        
        return isAssigned && isUnlocked;
      }
      return false;
    });
  }, [resources, isPrincipal, isTeacher, isStudent, assignedClasses, myClass, isExamMode]);

  const classFolders = useMemo(() => {
    const classes = Array.from(new Set(accessibleResources.map(r => r.className)));
    if (!classes.includes('Alle')) classes.push('Alle');
    return classes.sort();
  }, [accessibleResources]);

  const subjectFoldersInClass = useMemo(() => {
    if (!currentPath.className) return [];
    const filesInClass = accessibleResources.filter(r => r.className === currentPath.className);
    return Array.from(new Set(filesInClass.map(r => r.subject))).sort();
  }, [accessibleResources, currentPath.className]);

  const displayedFiles = useMemo(() => {
    return accessibleResources.filter(r => {
      const matchesPath = r.className === currentPath.className && r.subject === currentPath.subject;
      const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesPath && matchesSearch;
    });
  }, [accessibleResources, currentPath, searchTerm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Determine file type
      let type: Resource['type'] = 'file' as any;
      if (file.type.includes('pdf')) type = 'pdf';
      else if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `resources/${fileName}`;

      if (!supabase.storage) {
        throw new Error("Supabase Storage ist nicht konfiguriert.");
      }

      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (error) {
        console.warn("Supabase Storage Upload failed, falling back to Data URL:", error.message);
        
        // Fallback to Data URL
        const reader = new FileReader();
        reader.onprogress = (data) => {
          if (data.lengthComputable) {
            setUploadProgress(Math.round((data.loaded / data.total) * 100));
          }
        };
        reader.onload = () => {
          setNewRes(prev => ({
            ...prev,
            title: file.name.split('.')[0],
            url: reader.result as string,
            type: type
          }));
          setUploadProgress(100);
          setIsUploading(false);
        };
        reader.onerror = () => {
          alert("Fehler beim Lesen der Datei.");
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
        return; // Don't run finally yet, reader.onload will handle it
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      setNewRes(prev => ({
        ...prev,
        title: file.name.split('.')[0],
        url: publicUrl,
        type: type
      }));
      setUploadProgress(100);
      setIsUploading(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(`Fehler beim Hochladen: ${err.message || 'Unbekannter Fehler'}`);
      setIsUploading(false);
    }
  };

  const handlePreGenerateQuiz = async (resource: Resource) => {
    if (isGeneratingQuiz) return;
    
    setIsGeneratingQuiz(resource.id);
    try {
      const questions = await generateQuizFromResource(
        resource.title,
        resource.url,
        resource.type,
        10, // Default to 10 for pre-generation
        'Halbjahr', // Default term
        'normal',
        resource.language
      );
      
      if (questions && questions.length > 0) {
        const updatedResource = {
          ...resource,
          quizData: questions
        };
        onUpdateResources(resources.map(r => r.id === resource.id ? updatedResource : r), [updatedResource]);
        alert(`KI-Quiz erfolgreich für "${resource.title}" generiert (${questions.length} Fragen).`);
      } else {
        throw new Error("Keine Fragen generiert.");
      }
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      alert(`Fehler bei der Quiz-Generierung: ${err.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsGeneratingQuiz(null);
    }
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    const res: Resource = {
      ...newRes,
      id: `R-${Date.now().toString().slice(-5)}`,
      uploadedBy: user.name,
      createdAt: new Date().toISOString()
    };
    
    onUpdateResources([...resources, res], [res]);
    setShowAddForm(false);
    localStorage.removeItem('theory_add_draft');
    setNewRes({ 
      title: '', 
      type: 'pdf', 
      url: '', 
      className: currentPath.className || 'Alle', 
      subject: currentPath.subject || subjects[0],
      isMainBook: false,
      language: 'mixed',
      lessons: []
    });
    setUploadProgress(0);
  };

  const getIcon = (type: Resource['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-500" />;
      case 'video': return <Video className="text-blue-500" />;
      case 'image': return <Image className="text-emerald-500" />;
      case 'audio': return <Headset className="text-amber-500" />;
      case 'link': return <LinkIcon className="text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      {activeQuizResource ? (
        <div className={(activeQuizResource.subject === 'Yassarnal Quran' || activeQuizResource.subject === 'Quran' || activeQuizResource.subject === "Qur'an") ? "max-w-7xl mx-auto" : "max-w-4xl mx-auto"}>
          {(activeQuizResource.subject === 'Yassarnal Quran' || activeQuizResource.subject === 'Quran' || activeQuizResource.subject === "Qur'an") ? (
            <QuranTheoryViewer 
              user={user}
              resource={activeQuizResource}
              onClose={() => {
                localStorage.removeItem('theory_active_res_id');
                setActiveQuizResource(null);
              }} 
              canEdit={canManage}
              onUpdateResource={(updated) => {
                onUpdateResources(resources.map(r => r.id === updated.id ? updated : r), [updated]);
                setActiveQuizResource(updated);
              }}
            />
          ) : (
            <TheoryQuiz 
              user={user}
              resource={activeQuizResource} 
              onClose={() => {
                localStorage.removeItem('theory_active_res_id');
                setActiveQuizResource(null);
              }} 
              onUpdateResource={(updated) => {
                onUpdateResources(resources.map(r => r.id === updated.id ? updated : r), [updated]);
                setActiveQuizResource(updated);
              }}
              grades={grades}
              onUpdateGrades={onUpdateGrades}
              saveQuizResult={saveQuizResult}
              updateAutomatedGrade={updateAutomatedGrade}
              calculateSubjectGrade={calculateSubjectGrade}
            />
          )}
        </div>
      ) : (
        <>
          {/* Header */}
      <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-madrassah-950 pointer-events-none rotate-12">
           <Library size={240} />
        </div>
        <div className="relative z-10 flex items-center gap-8">
           <div className="w-20 h-20 bg-madrassah-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3">
              <Library size={36} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-madrassah-950 italic uppercase tracking-tighter leading-none">
                {isExamMode ? 'Prüfungs-Zentrale' : 'Bibliothek'}
              </h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 italic">
                {isExamMode ? 'Offizielle Tests & Hauptbücher' : 'Material hochladen & verwalten'}
              </p>
           </div>
        </div>
        
        <div className="flex gap-4 relative z-10">
           <button 
             onClick={() => {
               if (!currentPath.className && !currentPath.subject) {
                 navigate('/');
               } else if (currentPath.subject) {
                 setCurrentPath({ ...currentPath, subject: null });
               } else {
                 setCurrentPath({ className: null, subject: null });
               }
             }}
             className="bg-gray-100 text-gray-500 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-gray-200 transition-all"
           >
             <ArrowLeft size={18} /> {!currentPath.className && !currentPath.subject ? 'Dashboard' : 'Zurück'}
           </button>
           <div className="relative w-full md:w-64">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text" 
                placeholder="Inhalt suchen..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white transition-all shadow-inner" 
              />
           </div>
           {canManage && (
             <div className="flex gap-2">
               <button onClick={() => setShowAddForm(true)} className="bg-madrassah-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl hover:bg-black transition-all hover:-translate-y-1">
                  <Plus size={18} /> Datei vom Gerät
               </button>
             </div>
           )}
        </div>
      </div>

      {/* Navigation Breadcrumbs */}
      <div className="bg-white px-8 py-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 text-[10px] font-black uppercase tracking-widest overflow-x-auto no-scrollbar">
         <button onClick={() => setCurrentPath({ className: null, subject: null })} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${!currentPath.className ? 'bg-madrassah-950 text-white shadow-md' : 'text-gray-400 hover:text-madrassah-950'}`}>
            <Home size={14} /> Root
         </button>
         {currentPath.className && (
            <>
               <ChevronRight size={14} className="text-gray-300" />
               <button onClick={() => setCurrentPath({ ...currentPath, subject: null })} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${currentPath.className && !currentPath.subject ? 'bg-indigo-950 text-white shadow-md' : 'text-gray-400 hover:text-indigo-950'}`}>
                  <Folder size={14} /> Klasse {currentPath.className === 'Alle' ? 'Gemeinsam' : currentPath.className}
               </button>
            </>
         )}
         {currentPath.subject && (
            <>
               <ChevronRight size={14} className="text-gray-300" />
               <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white shadow-md">
                  <BookOpen size={14} /> {currentPath.subject}
               </button>
            </>
         )}
      </div>

      {/* Folder & File Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
         {!currentPath.className && classFolders.map(c => (
            <button 
              key={c} 
              onClick={() => setCurrentPath({ className: c, subject: null })}
              className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center justify-center gap-6 group relative overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-full h-1.5 bg-madrassah-950 transform -translate-y-full group-hover:translate-y-0 transition-transform"></div>
               <div className="w-24 h-24 bg-madrassah-50 text-madrassah-950 rounded-[2.5rem] flex items-center justify-center shadow-inner group-hover:bg-madrassah-950 group-hover:text-white transition-all duration-500">
                  <Folder size={48} className="group-hover:hidden" />
                  <FolderOpen size={48} className="hidden group-hover:block" />
               </div>
               <div className="text-center">
                  <h4 className="font-black text-lg text-madrassah-950 uppercase italic leading-none">{c === 'Alle' ? 'Gemeinsam' : `Klasse ${c}`}</h4>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-2">Öffnen</p>
               </div>
            </button>
         ))}

         {currentPath.className && !currentPath.subject && (
            <>
               <button onClick={() => setCurrentPath({ className: null, subject: null })} className="bg-gray-50 p-10 rounded-[3.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-madrassah-950 hover:border-madrassah-200 transition-all">
                  <ArrowLeft size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Zurück</span>
               </button>
               {Array.from(new Set([...subjects, ...subjectFoldersInClass])).map(s => (
                  <button 
                    key={s} 
                    onClick={() => setCurrentPath({ ...currentPath, subject: s })}
                    className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center justify-center gap-6 group"
                  >
                     <div className="w-24 h-24 bg-indigo-50 text-indigo-950 rounded-[2.5rem] flex items-center justify-center shadow-inner group-hover:bg-indigo-950 group-hover:text-white transition-all duration-500">
                        <BookOpen size={42} />
                     </div>
                     <div className="text-center">
                        <h4 className="font-black text-lg text-indigo-950 uppercase italic leading-none">{s}</h4>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-2">Dateien</p>
                     </div>
                  </button>
               ))}
            </>
         )}

         {currentPath.className && currentPath.subject && (
            <>
               <button onClick={() => setCurrentPath({ ...currentPath, subject: null })} className="bg-gray-50 p-8 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-madrassah-950 hover:border-madrassah-200 transition-all">
                  <ArrowLeft size={24} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Alle Fächer</span>
               </button>

               {displayedFiles.map(r => (
                  <div key={r.id} className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-2xl transition-all flex flex-col">
                     <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
                        <div className="group-hover:scale-110 transition-transform duration-700">
                           {React.cloneElement(getIcon(r.type) as React.ReactElement<any>, { size: 64, strokeWidth: 1.5 })}
                        </div>
                        <div className="absolute top-4 right-4 flex gap-2">
                           {canManage && (
                             <button 
                               onClick={() => onUpdateResources(resources.map(x => x.id === r.id ? { ...x, isUnlocked: !x.isUnlocked } : x), [{ ...r, isUnlocked: !r.isUnlocked }])}
                               className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${r.isUnlocked ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/90 text-gray-400 border-gray-100'}`}
                             >
                               {r.isUnlocked ? 'Freigeschaltet' : 'Gesperrt'}
                             </button>
                           )}
                           <span className="bg-white/90 backdrop-blur-sm text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">{r.type}</span>
                        </div>
                        {(canManage || r.uploadedBy === user.name) && (
                           <button onClick={() => onUpdateResources(resources.filter(x => x.id !== r.id), [], r)} className="absolute bottom-4 right-4 p-3 bg-white text-gray-300 hover:text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                              <Trash2 size={16} />
                           </button>
                        )}
                     </div>
                     <div className="p-8 flex-1 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                           {r.isMainBook && (
                              <span className="bg-indigo-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Hauptbuch</span>
                           )}
                           <h4 className="font-black text-madrassah-950 uppercase italic text-sm leading-tight line-clamp-2">{r.title}</h4>
                        </div>
                        <div className="flex flex-col gap-3">
                           <a href={r.url} target="_blank" className="w-full bg-madrassah-950 text-white font-black py-4 rounded-2xl shadow-lg text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
                              <FileDown size={14} /> Download
                           </a>
                           <button 
                             onClick={() => setActiveQuizResource(r)}
                             className="w-full bg-indigo-50 text-indigo-600 font-black py-4 rounded-2xl border border-indigo-100 text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all"
                           >
                              <Brain size={14} /> Quiz starten
                           </button>
                           {canManage && (
                             <button 
                               onClick={() => handlePreGenerateQuiz(r)}
                               disabled={isGeneratingQuiz === r.id}
                               className={`w-full font-black py-4 rounded-2xl border text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                 r.quizData && r.quizData.length > 0 
                                   ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                                   : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                               }`}
                             >
                               {isGeneratingQuiz === r.id ? (
                                 <Loader2 size={14} className="animate-spin" />
                               ) : (
                                 <Settings2 size={14} />
                               )}
                               {r.quizData && r.quizData.length > 0 ? 'KI Quiz aktualisieren' : 'KI Quiz generieren'}
                             </button>
                           )}
                           <p className="text-[7px] text-gray-300 font-bold uppercase text-center">{new Date(r.createdAt).toLocaleDateString('de-DE')}</p>
                        </div>
                     </div>
                  </div>
               ))}
            </>
         )}
      </div>

      {/* Add Modal with File Input */}
      {showAddForm && (
         <div className="fixed inset-0 z-50 bg-madrassah-950/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] md:rounded-[4rem] p-8 md:p-12 shadow-2xl relative border-4 border-white max-h-[90vh] overflow-y-auto custom-scrollbar">
               <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 md:top-10 md:right-10 text-gray-300 hover:text-red-500 transition-all z-10"><X size={32}/></button>
                              <div className="mb-10">
                  <h3 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter">Medium hinzufügen</h3>
                  <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mt-2">Vom Gerät auswählen oder Link eingeben</p>
                </div>

                <form onSubmit={handleAddResource} className="space-y-8">
                  {/* Link Input */}
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Web-Link / URL (Optional)</label>
                     <div className="flex gap-4">
                        <div className="relative flex-1">
                           <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                           <input 
                              type="url" 
                              placeholder="https://..." 
                              value={newRes.type === 'link' ? newRes.url : ''} 
                              onChange={e => setNewRes({...newRes, url: e.target.value, type: 'link'})} 
                              className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold outline-none focus:border-indigo-600 transition-all" 
                           />
                        </div>
                        {newRes.type === 'link' && newRes.url && (
                           <button type="button" onClick={() => setNewRes({...newRes, url: '', type: 'pdf'})} className="p-5 bg-red-50 text-red-500 rounded-3xl hover:bg-red-100 transition-all">
                              <X size={20} />
                           </button>
                        )}
                     </div>
                  </div>

                  <div className="relative py-4 flex items-center">
                     <div className="flex-grow border-t border-gray-100"></div>
                     <span className="flex-shrink mx-4 text-[8px] font-black text-gray-300 uppercase tracking-widest">ODER DATEI HOCHLADEN</span>
                     <div className="flex-grow border-t border-gray-100"></div>
                  </div>

                  {/* File Upload Zone */}
                  {!newRes.url || newRes.type !== 'link' ? (
                    !newRes.url ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-4 border-dashed border-gray-100 rounded-[3rem] p-12 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                      >
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="application/pdf,image/*,video/*,audio/*" />
                        {isUploading ? (
                          <div className="text-center space-y-4">
                             <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto" />
                             <p className="font-black text-xs uppercase text-indigo-950">Wird geladen: {uploadProgress}%</p>
                          </div>
                        ) : (
                          <>
                             <div className="w-16 h-16 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                <FileUp size={32} />
                             </div>
                             <div className="text-center">
                                <p className="text-[11px] font-black uppercase text-gray-400 group-hover:text-indigo-950">Datei vom Gerät wählen</p>
                                <p className="text-[8px] font-bold text-gray-300 mt-2">PDF, Bilder, Audio, Video (Max 50MB)</p>
                             </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[3rem] flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-xl">
                               {getIcon(newRes.type)}
                            </div>
                            <div>
                               <p className="text-xs font-black text-emerald-950 uppercase truncate max-w-[200px]">{newRes.title}</p>
                               <p className="text-[8px] font-bold text-emerald-600 uppercase">Bereit zum Speichern</p>
                            </div>
                         </div>
                         <button type="button" onClick={() => setNewRes({...newRes, url: '', type: 'pdf'})} className="text-gray-400 hover:text-red-500"><Trash2 size={20}/></button>
                      </div>
                    )
                  ) : null}

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Bezeichnung</label>
                     <input required value={newRes.title} onChange={e => setNewRes({...newRes, title: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 px-8 py-5 rounded-3xl font-bold outline-none focus:border-madrassah-950 transition-all" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Klasse</label>
                         <select className="w-full bg-gray-50 border-2 border-gray-100 px-6 py-5 rounded-3xl font-black uppercase text-[10px]" value={newRes.className} onChange={e => setNewRes({...newRes, className: e.target.value})}>
                            <option value="Alle">Gesamte Schule</option>
                            {(isPrincipal ? Array.from(new Set(students.map(s => s.className))) : assignedClasses).map(c => <option key={c} value={c}>Klasse {c}</option>)}
                         </select>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Fachbereich</label>
                         <select className="w-full bg-gray-50 border-2 border-gray-100 px-6 py-5 rounded-3xl font-black uppercase text-[10px]" value={newRes.subject} onChange={e => setNewRes({...newRes, subject: e.target.value})}>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>
                   </div>

                    {/* Main Book & Language Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${newRes.isMainBook ? 'bg-indigo-600 text-white' : 'bg-white text-gray-300'}`}>
                                <Book size={20} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-indigo-950">Hauptbuch</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase">Prüfungsrelevant</p>
                             </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setNewRes({...newRes, isMainBook: !newRes.isMainBook})}
                            className={`w-12 h-6 rounded-full transition-all relative ${newRes.isMainBook ? 'bg-indigo-600' : 'bg-gray-200'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newRes.isMainBook ? 'right-1' : 'left-1'}`}></div>
                          </button>
                       </div>

                       <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                                <Globe size={20} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-amber-950">Quiz-Sprache</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase">Inhaltssprache</p>
                             </div>
                          </div>
                          <select 
                            value={newRes.language} 
                            onChange={e => setNewRes({...newRes, language: e.target.value as any})}
                            className="bg-white border-2 border-amber-100 rounded-xl px-3 py-1.5 text-[9px] font-black uppercase outline-none focus:border-amber-500"
                          >
                             <option value="mixed">Gemischt</option>
                             <option value="arabic">Arabisch</option>
                             <option value="german">Deutsch</option>
                          </select>
                       </div>
                    </div>
                   {/* Quran Lessons Section */}
                  {(newRes.subject === 'Yassarnal Quran' || newRes.subject === 'Quran' || newRes.subject === "Qur'an") && (
                    <div className="space-y-6 bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-emerald-600">
                             <Headset size={20} />
                             <h4 className="text-[10px] font-black uppercase tracking-widest">Audio Lektionen</h4>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setNewRes({...newRes, lessons: [...newRes.lessons, { title: '', audioUrl: '' }]})}
                            className="text-emerald-600 hover:text-emerald-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                          >
                             <Plus size={14} /> Lektion hinzufügen
                          </button>
                       </div>

                       <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                          {newRes.lessons.length === 0 && (
                            <p className="text-[9px] text-gray-400 font-bold uppercase text-center py-4 italic">Noch keine Lektionen hinzugefügt</p>
                          )}
                          {newRes.lessons.map((lesson, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-white rounded-2xl border border-emerald-100 relative group">
                               <input 
                                 placeholder="Titel (z.B. Lektion 1)" 
                                 value={lesson.title}
                                 onChange={e => {
                                   const updated = [...newRes.lessons];
                                   updated[idx].title = e.target.value;
                                   setNewRes({...newRes, lessons: updated});
                                 }}
                                 className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-[10px] font-bold outline-none focus:border-emerald-500"
                               />
                               <input 
                                 placeholder="Audio URL (Dropbox/Drive Link)" 
                                 value={lesson.audioUrl}
                                 onChange={e => {
                                   const updated = [...newRes.lessons];
                                   updated[idx].audioUrl = e.target.value;
                                   setNewRes({...newRes, lessons: updated});
                                 }}
                                 className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-[10px] font-bold outline-none focus:border-emerald-500"
                               />
                               <button 
                                 type="button"
                                 onClick={() => {
                                   const updated = newRes.lessons.filter((_, i) => i !== idx);
                                   setNewRes({...newRes, lessons: updated});
                                 }}
                                 className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                               >
                                  <X size={12} />
                               </button>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <button type="submit" disabled={!newRes.url} className="w-full bg-madrassah-950 text-white font-black py-8 rounded-[2.5rem] shadow-2xl uppercase text-[12px] tracking-[0.4em] hover:bg-black transition-all disabled:opacity-30">
                     Medium in Bibliothek sichern
                  </button>
               </form>
            </div>
         </div>
      )}
        </>
      )}
    </div>
  );
};

export default TheoryManager;
