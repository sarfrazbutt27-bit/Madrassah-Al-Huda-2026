
import React, { useState, useMemo, useRef } from 'react';
import { 
  FolderOpen, FileText, Link as LinkIcon, Trash2, 
  Plus, BookOpen, Clock, ShieldCheck, Search,
  UploadCloud, X, Loader2, FileImage, ExternalLink
} from 'lucide-react';
import { Curriculum, User, UserRole, Student } from '../types';
import { supabase } from '../lib/supabase';

interface Props {
  user: User;
  curricula: Curriculum[];
  onUpdate: (list: Curriculum[], itemsToSync?: Curriculum[], itemToDelete?: Curriculum) => void;
  students: Student[]; // To get available classes
}

const CurriculumManager: React.FC<Props> = ({ user, curricula, onUpdate, students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('Alle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newCurr, setNewCurr] = useState<Partial<Curriculum>>({
    term: 'Halbjahr',
    fileType: 'pdf'
  });

  const isAdmin = user.role === UserRole.PRINCIPAL;
  const isTeacher = user.role === UserRole.TEACHER;
  const isStudent = user.role === UserRole.STUDENT;
  const isStaff = isAdmin || isTeacher;
  const assignedClasses = useMemo(() => user.assignedClasses || [], [user.assignedClasses]);

  const student = isStudent ? students.find(s => s.id === user.id) : null;
  const studentClass = student?.className;

  const availableClasses = useMemo(() => {
    if (isStudent) return studentClass ? [studentClass] : [];
    const classes = isAdmin 
      ? Array.from(new Set(students.map(s => s.className)))
      : assignedClasses;
    return ['Alle', ...classes.sort()];
  }, [students, isAdmin, assignedClasses, isStudent, studentClass]);

  const filteredCurricula = useMemo(() => {
    return curricula.filter(c => {
      const isMyClass = isAdmin || assignedClasses.includes(c.className) || (isStudent && c.className === studentClass);
      const matchesClass = selectedClass === 'Alle' || c.className === selectedClass;
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
      return isMyClass && matchesClass && matchesSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [curricula, isAdmin, assignedClasses, isStudent, studentClass, selectedClass, searchTerm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Determine file type
      let type: 'pdf' | 'image' | 'link' = 'pdf';
      if (file.type.includes('pdf')) type = 'pdf';
      else if (file.type.startsWith('image/')) type = 'image';

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `curricula/${fileName}`;

      const { error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (error) {
        if (error.message.includes('Bucket not found')) {
          console.warn("Supabase Storage Bucket 'attachments' nicht gefunden. Erstellen Sie diesen im Supabase Dashboard.");
        }
        
        // Fallback to Data URL
        const reader = new FileReader();
        reader.onload = () => {
          setNewCurr(prev => ({ 
            ...prev, 
            fileUrl: reader.result as string, 
            fileType: type 
          }));
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      setNewCurr(prev => ({ 
        ...prev, 
        fileUrl: publicUrl, 
        fileType: type 
      }));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Fehler beim Hochladen der Datei.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = () => {
    if (!newCurr.className || !newCurr.title || !newCurr.fileUrl) {
      alert("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    const curriculum: Curriculum = {
      id: Math.random().toString(36).substring(2, 11),
      className: newCurr.className!,
      term: newCurr.term as 'Halbjahr' | 'Abschluss',
      title: newCurr.title!,
      fileUrl: newCurr.fileUrl!,
      fileType: newCurr.fileType as 'pdf' | 'image' | 'link',
      uploadedBy: user.name,
      createdAt: new Date().toISOString()
    };

    onUpdate([...curricula, curriculum], [curriculum]);
    setShowUploadModal(false);
    setNewCurr({ term: 'Halbjahr', fileType: 'pdf' });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Möchten Sie dieses Curriculum wirklich löschen?")) return;
    const itemToDelete = curricula.find(c => c.id === id);
    if (itemToDelete) {
      onUpdate(curricula.filter(c => c.id !== id), [], itemToDelete);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-indigo-600 pointer-events-none rotate-12"><FolderOpen size={280} /></div>
        <div className="relative z-10 flex items-center gap-8">
           <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-2xl text-white transform -rotate-3">
              <FolderOpen size={42} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Lehrplan-Archiv</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 italic">Curriculum & Unterrichtsmaterialien</p>
           </div>
        </div>
        {isStaff && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="bg-madrassah-950 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all flex items-center gap-3"
          >
            <Plus size={20} /> Curriculum hochladen
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text" 
            placeholder="Lehrplan suchen..." 
            className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 rounded-[2.5rem] outline-none shadow-sm font-bold" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="relative w-full md:w-72">
           <BookOpen className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={20} />
           <select 
             value={selectedClass} 
             onChange={e => setSelectedClass(e.target.value)} 
             className="w-full pl-16 pr-12 py-5 bg-white border border-gray-100 rounded-[2.5rem] text-xs font-black uppercase outline-none appearance-none cursor-pointer"
           >
              {availableClasses.map(c => <option key={c} value={c}>{c === 'Alle' ? 'Alle Klassen' : `Klasse ${c}`}</option>)}
           </select>
        </div>
      </div>

      {/* Grid of Curricula */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCurricula.map(curr => (
          <div key={curr.id} className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      {curr.fileType === 'pdf' ? <FileText size={24} /> : curr.fileType === 'link' ? <LinkIcon size={24} /> : <FolderOpen size={24} />}
                   </div>
                   <div>
                      <h4 className="font-black text-lg text-madrassah-950 uppercase italic truncate max-w-[150px]">{curr.title}</h4>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Klasse {curr.className}</p>
                   </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${curr.term === 'Halbjahr' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                   {curr.term}
                </div>
             </div>

             <div className="p-8 flex-1 space-y-6">
                <div className="flex items-center gap-3 text-gray-400 text-[9px] font-black uppercase tracking-widest">
                   <Clock size={14} /> {new Date(curr.createdAt).toLocaleDateString('de-DE')}
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-[9px] font-black uppercase tracking-widest">
                   <ShieldCheck size={14} /> Hochgeladen von: {curr.uploadedBy}
                </div>
             </div>

             <div className="p-8 pt-0 flex gap-3">
                <a 
                  href={curr.fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-center shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                   Ansehen <ExternalLink size={16} />
                </a>
                {isStaff && (
                  <button 
                    onClick={() => handleDelete(curr.id)}
                    className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                     <Trash2 size={18} />
                  </button>
                )}
             </div>
          </div>
        ))}
      </div>

      {filteredCurricula.length === 0 && (
         <div className="py-40 text-center opacity-10 flex flex-col items-center">
            <FolderOpen size={100} className="mb-6" />
            <p className="text-4xl font-black uppercase tracking-tighter italic">Keine Lehrpläne gefunden</p>
         </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] bg-madrassah-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl relative border-4 border-white">
            <h3 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter mb-8">Curriculum hochladen</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-2">Titel</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold"
                  placeholder="z.B. Lehrplan Quran 2024"
                  value={newCurr.title || ''}
                  onChange={e => setNewCurr({...newCurr, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-2">Klasse</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold"
                    value={newCurr.className || ''}
                    onChange={e => setNewCurr({...newCurr, className: e.target.value})}
                  >
                    <option value="">Wählen...</option>
                    {availableClasses.filter(c => c !== 'Alle').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-2">Zeitraum</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold"
                    value={newCurr.term || 'Halbjahr'}
                    onChange={e => setNewCurr({...newCurr, term: e.target.value as 'Halbjahr' | 'Abschluss'})}
                  >
                    <option value="Halbjahr">Halbjahr</option>
                    <option value="Abschluss">Hauptzeugnis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-2">Datei / Link</label>
                <div className="flex gap-3 mb-4">
                  {['pdf', 'image', 'link'].map(type => (
                    <button 
                      key={type}
                    onClick={() => setNewCurr({...newCurr, fileType: type as 'pdf' | 'image' | 'link', fileUrl: ''})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${newCurr.fileType === type ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {newCurr.fileType === 'link' ? (
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-100 pl-12 pr-4 py-4 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold"
                      placeholder="https://..."
                      value={newCurr.fileUrl || ''}
                      onChange={e => setNewCurr({...newCurr, fileUrl: e.target.value})}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!newCurr.fileUrl ? (
                      <div 
                        onClick={() => !isUploading && fileInputRef.current?.click()} 
                        className={`p-10 border-4 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-all ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          onChange={handleFileUpload} 
                          accept={newCurr.fileType === 'pdf' ? 'application/pdf' : 'image/*'} 
                        />
                        {isUploading ? (
                          <Loader2 size={40} className="mb-4 animate-spin text-indigo-600" />
                        ) : (
                          <UploadCloud size={40} className="mb-4" />
                        )}
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          {isUploading ? 'Wird hochgeladen...' : `${newCurr.fileType?.toUpperCase()} auswählen`}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 p-6 rounded-[2rem] flex justify-between items-center border border-emerald-100">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm">
                            {newCurr.fileType === 'pdf' ? <FileText size={20}/> : <FileImage size={20}/>}
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-800 block leading-none">Datei bereit</span>
                            <span className="text-[8px] font-bold text-emerald-600/60 uppercase mt-1 truncate max-w-[150px] block">
                              {newCurr.fileUrl.startsWith('data:') ? 'Lokal geladen' : 'Cloud Speicher'}
                            </span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setNewCurr({...newCurr, fileUrl: ''})} 
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={20}/>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleUpload}
                className="flex-1 py-4 bg-madrassah-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumManager;
