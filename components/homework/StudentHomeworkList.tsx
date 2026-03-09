
import React, { useState, useRef } from 'react';
import { 
  FileText, Image as ImageIcon, Camera,
  Loader2, Youtube,
  Check, X, Clock, Upload, Star, Plus
} from 'lucide-react';
import { User, Student, Homework, HomeworkSubmission } from '../../types';
import { generateId } from '../../src/utils';

interface Props {
  user: User;
  students: Student[];
  homework: Homework[];
  submissions: HomeworkSubmission[];
  onUpdateSubmissions: (s: HomeworkSubmission[], itemsToSync?: HomeworkSubmission[]) => void;
}

const StudentHomeworkList: React.FC<Props> = ({ user, students, homework, submissions, onUpdateSubmissions }) => {
  const student = students.find(s => s.id === user.id);
  const myClass = student?.className || '';
  const myHomework = homework.filter(h => h.classId === myClass).sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  const [activeId, setActiveId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'file'>('file');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      if (file.type.startsWith('image/')) setFileType('image');
      else if (file.type.includes('pdf')) setFileType('pdf');
      else setFileType('file');
    }
  };

  const handleSubmit = async (hwId: string) => {
    if (!selectedFile && !comment.trim()) return;
    
    setIsUploading(true);
    for (let i = 0; i <= 100; i += 20) {
      setUploadProgress(i);
      await new Promise(r => setTimeout(r, 100));
    }

    const sub: HomeworkSubmission = {
      id: generateId('S-'),
      homeworkId: hwId,
      studentId: user.id,
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      studentComment: comment,
      fileUrl: previewUrl || undefined
    };

    const nextSubmissions = [...submissions.filter(s => !(s.homeworkId === hwId && s.studentId === user.id)), sub];
    onUpdateSubmissions(nextSubmissions, [sub]);
    
    setActiveId(null);
    setComment('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUploading(false);
    setUploadProgress(0);
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-madrassah-950 italic uppercase tracking-tighter leading-none mb-4">Meine Hausaufgaben</h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">Übersicht & Abgabeportal</p>
        </div>
        <div className="bg-indigo-50 px-8 py-5 rounded-[2rem] border border-indigo-100 flex items-center gap-6">
           <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><Upload size={24} /></div>
           <p className="text-[10px] font-black uppercase text-indigo-950 leading-relaxed">
             Du kannst Fotos deiner Arbeit<br/>oder PDF Dokumente hochladen.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {myHomework.map(h => {
          const sub = submissions.find(s => s.homeworkId === h.id && s.studentId === user.id);
          const isOverdue = new Date(h.dueDate) < new Date() && !sub;
          const hasVideo = h.instructions.includes('Video-Link:');
          const videoLink = hasVideo ? h.instructions.split('Video-Link:')[1].trim() : null;
          const pureInstructions = hasVideo ? h.instructions.split('Video-Link:')[0].trim() : h.instructions;

          return (
            <div key={h.id} className={`bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all relative overflow-hidden ${sub?.status === 'Accepted' ? 'border-l-8 border-l-emerald-500' : isOverdue ? 'border-l-8 border-l-red-500' : 'border-l-8 border-l-indigo-600'}`}>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <span className="bg-indigo-50 text-indigo-700 px-5 py-2 rounded-2xl text-[10px] font-black uppercase border border-indigo-100">{h.subject}</span>
                  <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                    <Clock size={16}/> Bis: {new Date(h.dueDate).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-madrassah-950 italic uppercase leading-tight mb-4">{h.title}</h3>
                <p className="text-sm text-gray-500 italic mb-6 leading-relaxed italic line-clamp-4">{pureInstructions}</p>
                
                <div className="space-y-3 mb-10">
                   {videoLink && (
                      <a href={videoLink} target="_blank" className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-700 hover:bg-red-100 transition-all shadow-sm">
                         <Youtube size={24} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Lern-Video anschauen</span>
                      </a>
                   )}
                   {h.attachmentUrl && (
                      <a href={h.attachmentUrl} target="_blank" download className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-all shadow-sm">
                         <FileText size={24} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Material vom Lehrer</span>
                      </a>
                   )}
                </div>
              </div>

              <div className="mt-auto relative z-10">
                {sub ? (
                  <div className="space-y-4">
                    <div className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 ${sub.status === 'Accepted' ? 'bg-emerald-500' : 'bg-indigo-500'} text-white rounded-2xl flex items-center justify-center shadow-lg`}><Check size={24} /></div>
                             <div>
                                <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">{sub.status === 'Accepted' ? 'Korrigiert' : 'Eingereicht'}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(sub.submittedAt!).toLocaleDateString('de-DE')}</p>
                             </div>
                          </div>
                          {sub.score !== undefined && (
                             <div className="text-right">
                                <p className="text-3xl font-black italic text-indigo-950 leading-none">{sub.score}/10</p>
                                <p className="text-[7px] font-black text-gray-300 uppercase mt-1">Bewertung</p>
                             </div>
                          )}
                       </div>
                    </div>
                    {sub.teacherComment && (
                       <div className="bg-indigo-950 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Star size={60}/></div>
                          <p className="text-[9px] font-black uppercase text-indigo-300 mb-2 italic">Feedback vom Lehrer:</p>
                          <p className="text-sm font-medium italic leading-relaxed">"{sub.teacherComment}"</p>
                       </div>
                    )}
                    {sub.status === 'NeedsRevision' && (
                       <button onClick={() => setActiveId(h.id)} className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all">Revision einreichen</button>
                    )}
                  </div>
                ) : activeId === h.id ? (
                  <div className="space-y-6 animate-in zoom-in duration-300 bg-gray-50 p-8 rounded-[3rem] border border-gray-200 shadow-inner">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Deine Nachricht</label>
                       <textarea 
                        className="w-full bg-white border-2 border-gray-100 p-6 rounded-3xl font-medium text-sm outline-none focus:border-indigo-500 transition-all shadow-inner" 
                        placeholder="Schreibe hier etwas zu deiner Lösung..." 
                        rows={3}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                       />
                    </div>
                    
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Foto oder PDF hochladen</label>
                       {!selectedFile ? (
                         <div 
                           onClick={() => fileInputRef.current?.click()}
                           className="border-4 border-dashed border-gray-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-6 bg-white hover:border-indigo-400 transition-all cursor-pointer group"
                         >
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                               <Camera size={32} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-950 text-center">Datei auswählen</p>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
                         </div>
                       ) : (
                         <div className="p-6 bg-white rounded-[2rem] border-2 border-indigo-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-5 overflow-hidden">
                               <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                                  {fileType === 'image' && previewUrl ? <img src={previewUrl} className="w-full h-full object-cover rounded-xl" /> : <FileText size={24} className="text-indigo-400"/>}
                               </div>
                               <p className="text-xs font-black uppercase truncate text-indigo-950">{selectedFile.name}</p>
                            </div>
                            <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><X size={20}/></button>
                         </div>
                       )}
                    </div>

                    {isUploading && (
                       <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                       </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => handleSubmit(h.id)} 
                        disabled={isUploading || (!selectedFile && !comment.trim())}
                        className="flex-1 bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all disabled:opacity-50"
                      >
                         {isUploading ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'Jetzt abgeben'}
                      </button>
                      <button onClick={() => setActiveId(null)} className="p-6 bg-white text-gray-400 rounded-[2rem] border border-gray-100 hover:text-red-500 transition-all shadow-sm"><X size={24}/></button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setActiveId(h.id)} className={`w-full text-white py-6 rounded-[2.25rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 ${isOverdue ? 'bg-red-600' : 'bg-madrassah-950'}`}>
                    <Plus size={20} /> Hausaufgabe bearbeiten
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentHomeworkList;
