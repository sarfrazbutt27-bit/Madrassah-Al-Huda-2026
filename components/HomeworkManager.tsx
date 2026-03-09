
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Clock, FileText, CheckCircle, Search, 
  Trash2, X, CheckCircle2, 
  Save, Download, 
  Sparkles, Loader2, ChevronRight, PenTool, 
  UploadCloud, Info, Youtube
} from 'lucide-react';
import { User, UserRole, Student, Homework, HomeworkSubmission } from '../types';
import { GoogleGenAI } from "@google/genai";
import StudentHomeworkList from './homework/StudentHomeworkList';

interface HomeworkManagerProps {
  user: User;
  students: Student[];
  homework: Homework[];
  submissions: HomeworkSubmission[];
  onUpdateHomework: (h: Homework[], itemsToSync?: Homework[]) => void;
  onUpdateSubmissions: (s: HomeworkSubmission[], itemsToSync?: HomeworkSubmission[]) => void;
  subjects: string[];
  onNotify: (n: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }) => void;
  isHolidayMode?: boolean;
}

const HomeworkManager: React.FC<HomeworkManagerProps> = (props) => {
  const { user, students, homework, submissions, onUpdateHomework, onUpdateSubmissions, subjects, isHolidayMode } = props;
  const navigate = useNavigate();
  const isTeacher = user.role === UserRole.TEACHER;
  const isPrincipal = user.role === UserRole.PRINCIPAL;
  const isStudent = user.role === UserRole.STUDENT;
  
  const assignedClasses = user.assignedClasses || [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeView, setActiveView] = useState<'assignments' | 'review'>('assignments');
  const [showForm, setShowForm] = useState(false);
  const [selectedHwId, setSelectedHwId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // State für das Korrektur-Overlay
  const [correctionTarget, setCorrectionTarget] = useState<{student: Student, submission: HomeworkSubmission} | null>(null);
  const [selectedRating, setSelectedRating] = useState<'Sehr gut' | 'Gut' | 'Nicht gut' | 'Wiederholen'>('Sehr gut');

  const [newHw, setNewHw] = useState({ 
    title: '', description: '', subject: subjects[0], dueDate: '', className: assignedClasses[0] || '',
    attachmentUrl: '', attachmentType: 'file' as Homework['attachmentType'], videoUrl: ''
  });

  const currentHwSubmissions = useMemo(() => {
    if (!selectedHwId) return [];
    const hw = homework.find(h => h.id === selectedHwId);
    if (!hw) return [];
    return students
      .filter(s => s.className === hw.classId && s.status === 'active')
      .map(s => ({
        student: s,
        submission: submissions.find(sub => sub.homeworkId === selectedHwId && sub.studentId === s.id)
      }))
      .sort((a,b) => a.student.lastName.localeCompare(b.student.lastName));
  }, [selectedHwId, homework, students, submissions]);

  if (isStudent) {
    return (
      <StudentHomeworkList 
        user={user} 
        students={students} 
        homework={homework} 
        submissions={submissions} 
        onUpdateSubmissions={onUpdateSubmissions} 
      />
    );
  }

  const filteredHomework = homework.filter(h => isPrincipal || assignedClasses.includes(h.classId));

  const updateSubmissionStatus = (subId: string, status: HomeworkSubmission['status'], score?: number, comment?: string) => {
    let updatedSub: HomeworkSubmission | undefined;
    const updated = submissions.map(s => {
      if (s.id === subId) {
        updatedSub = { 
          ...s, 
          status, 
          score: score !== undefined ? score : s.score,
          teacherComment: comment !== undefined ? comment : s.teacherComment,
          reviewedAt: new Date().toISOString() 
        };
        return updatedSub;
      }
      return s;
    });
    if (updatedSub) {
      onUpdateSubmissions(updated, [updatedSub]);
    }
  };

  const handleAiVideoLink = async () => {
    if (!newHw.title || !newHw.subject) {
      alert("Bitte erst Titel und Fach eingeben.");
      return;
    }
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `Du bist ein Bildungs-Assistent. Finde einen passenden, lehrreichen Video-Link (YouTube) für das Thema: "${newHw.title}" im Fach "${newHw.subject}". 
      Antworte AUSSCHLIESSLICH mit der URL. 
      Falls kein direktes Video gefunden wird, gib einen YouTube-Suchlink zurück.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ parts: [{ text: prompt }] }]
      });
      const text = response.text;
      if (text) {
        setNewHw(prev => ({ ...prev, videoUrl: text.trim() }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiFeedback = async () => {
    if (!correctionTarget) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `Du bist ein motivierender Lehrer. Schreibe ein kurzes, herzliches Feedback (max. 2 Sätze) für den Schüler ${correctionTarget.student.firstName}. 
      Bewertung: "${selectedRating}". 
      Fach: ${newHw.subject}. 
      Das Feedback soll auf Deutsch sein, das Kind loben oder konstruktiv zur Verbesserung anregen.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ parts: [{ text: prompt }] }]
      });
      
      if (response.text && correctionTarget.submission) {
        updateSubmissionStatus(correctionTarget.submission.id, correctionTarget.submission.status, undefined, response.text.trim());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let type: Homework['attachmentType'] = 'file';
      if (file.type.includes('pdf')) type = 'pdf';
      else if (file.type.startsWith('image/')) type = 'image';
      setNewHw({ ...newHw, attachmentUrl: reader.result as string, attachmentType: type });
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const assignment: Homework = {
      id: `H-${Date.now().toString().slice(-5)}`,
      classId: newHw.className,
      subject: newHw.subject,
      title: newHw.title,
      instructions: `${newHw.description}${newHw.videoUrl ? `\n\nVideo-Link: ${newHw.videoUrl}` : ''}`,
      dueDate: newHw.dueDate,
      repeatType: 'OneTime',
      submissionType: 'Mixed',
      visibility: 'Everyone',
      reminderEnabled: true,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      attachmentUrl: newHw.attachmentUrl || undefined,
      attachmentType: newHw.attachmentType
    };
    onUpdateHomework([...homework, assignment], [assignment]);
    setShowForm(false);
    setNewHw({ title: '', description: '', subject: subjects[0], dueDate: '', className: assignedClasses[0] || '', attachmentUrl: '', attachmentType: 'file', videoUrl: '' });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-8">
          <div className="w-20 h-20 bg-madrassah-950 text-white rounded-[2.25rem] flex items-center justify-center shadow-2xl rotate-3"><PenTool size={36} /></div>
          <div>
            <h2 className="text-4xl font-black text-madrassah-950 italic uppercase leading-none">Hausaufgaben Hub</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">Interaktives Lern-Management</p>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              <button onClick={() => setActiveView('assignments')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'assignments' ? 'bg-madrassah-950 text-white shadow-lg' : 'text-gray-400'}`}>Übersicht</button>
              <button onClick={() => setActiveView('review')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'review' ? 'bg-madrassah-950 text-white shadow-lg' : 'text-gray-400'}`}>Korrektur</button>
           </div>
           {!isHolidayMode ? (
             <button onClick={() => setShowForm(!showForm)} className="bg-madrassah-950 text-white px-10 py-5 rounded-[2.25rem] font-black uppercase text-[11px] shadow-xl hover:bg-black transition-all">
                {showForm ? 'Abbrechen' : 'Neue Aufgabe'}
             </button>
           ) : (
             <div className="bg-amber-100 text-amber-700 px-8 py-5 rounded-[2.25rem] font-black uppercase text-[9px] border border-amber-200 flex items-center gap-2">
               <Clock size={14} /> Ferien-Modus: Keine neuen Aufgaben
             </div>
           )}
        </div>
      </div>

      {activeView === 'assignments' && (
        <div className="space-y-10">
          {showForm && (
            <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-2xl animate-in slide-in-from-top-4">
               <form onSubmit={handleCreate} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <input required placeholder="Titel der Hausaufgabe" className="w-full bg-gray-50 border p-6 rounded-3xl font-black uppercase italic text-sm" value={newHw.title} onChange={e => setNewHw({...newHw, title: e.target.value})} />
                        <textarea required placeholder="Detaillierte Anweisungen..." rows={6} className="w-full bg-gray-50 border p-6 rounded-3xl font-medium text-sm italic" value={newHw.description} onChange={e => setNewHw({...newHw, description: e.target.value})} />
                        
                        <div className="space-y-4">
                           <div className="flex justify-between items-center px-2">
                              <label className="text-[10px] font-black uppercase text-gray-400">Video-Lernmaterial (Link)</label>
                              <button type="button" onClick={handleAiVideoLink} disabled={isAiLoading} className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2 hover:underline">
                                 {isAiLoading ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} KI Video suchen
                              </button>
                           </div>
                           <div className="relative">
                              <Youtube className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500" size={20} />
                              <input placeholder="https://youtube.com/..." className="w-full bg-gray-50 border pl-14 pr-6 py-5 rounded-3xl text-xs font-bold" value={newHw.videoUrl} onChange={e => setNewHw({...newHw, videoUrl: e.target.value})} />
                           </div>
                        </div>
                     </div>
                     
                     <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Abgabetermin</label>
                              <input type="date" required className="w-full bg-gray-50 border p-5 rounded-2xl font-bold" value={newHw.dueDate} onChange={e => setNewHw({...newHw, dueDate: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Klasse</label>
                              <select className="w-full bg-gray-50 border p-5 rounded-2xl font-black uppercase text-[10px]" value={newHw.className} onChange={e => setNewHw({...newHw, className: e.target.value})}>
                                 {assignedClasses.map(c => <option key={c} value={c}>Klasse {c}</option>)}
                              </select>
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Universal-Upload (Bilder/PDF)</label>
                           {!newHw.attachmentUrl ? (
                              <div onClick={() => fileInputRef.current?.click()} className="p-16 border-4 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-all">
                                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileAttachment} accept="image/*,application/pdf" />
                                 <UploadCloud size={48} className="mb-4" />
                                 <p className="text-[10px] font-black uppercase tracking-widest">Datei auswählen</p>
                              </div>
                           ) : (
                              <div className="bg-emerald-50 p-8 rounded-[2.5rem] flex justify-between items-center border border-emerald-100">
                                 <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm"><CheckCircle size={20}/></div>
                                    <span className="text-[10px] font-black uppercase text-emerald-800">Material bereit</span>
                                 </div>
                                 <button type="button" onClick={() => setNewHw({...newHw, attachmentUrl: ''})} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X size={20}/></button>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
                  <button type="submit" className="w-full bg-madrassah-950 text-white py-6 rounded-[2.25rem] font-black uppercase text-xs shadow-xl hover:bg-black transition-all flex items-center justify-center gap-4">
                     <Save size={20} /> Aufgabe für Klasse {newHw.className} veröffentlichen
                  </button>
               </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHomework.map(h => {
              const subCount = submissions.filter(s => s.homeworkId === h.id).length;
              return (
                <div key={h.id} className="bg-white rounded-[3.5rem] border border-gray-100 p-10 flex flex-col justify-between group hover:shadow-2xl transition-all border-l-8 border-l-madrassah-950">
                   <div>
                      <div className="flex justify-between items-start mb-6">
                         <span className="bg-madrassah-50 text-madrassah-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase">{h.subject}</span>
                         <button onClick={() => onUpdateHomework(homework.filter(x => x.id !== h.id))} className="text-gray-200 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                      <h4 className="text-2xl font-black text-madrassah-950 italic uppercase leading-tight mb-4">{h.title}</h4>
                      <p className="text-[11px] text-gray-500 italic mb-8 line-clamp-3 leading-relaxed">{h.instructions}</p>
                   </div>
                   <div className="mt-6 space-y-4">
                     <div className="flex items-center gap-3 text-[9px] font-black uppercase text-red-500">
                        <Clock size={14} /> Abgabe: {new Date(h.dueDate).toLocaleDateString()}
                     </div>
                     <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-emerald-600">{subCount} Abgaben</span>
                           <span className="text-[8px] font-bold text-gray-400 uppercase">Klasse {h.classId}</span>
                        </div>
                        <button onClick={() => { setSelectedHwId(h.id); setActiveView('review'); }} className="p-3 bg-gray-50 text-madrassah-950 rounded-xl hover:bg-madrassah-950 hover:text-white transition-all"><ChevronRight size={18}/></button>
                     </div>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {activeView === 'review' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-3 mb-3 block">Aktuelle Korrektur-Auswahl</label>
              <select 
                value={selectedHwId || ''} 
                onChange={e => setSelectedHwId(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 p-6 rounded-[2rem] font-black uppercase text-xs outline-none focus:border-madrassah-950 shadow-inner"
              >
                 <option value="">Wähle eine Hausaufgabe...</option>
                 {filteredHomework.map(h => <option key={h.id} value={h.id}>{h.title} ({h.classId})</option>)}
              </select>
           </div>

           {selectedHwId && (
             <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
                      <tr>
                         <th className="px-10 py-8">Teilnehmer</th>
                         <th className="px-6 py-8 text-center">Status</th>
                         <th className="px-6 py-8 text-center">Abgabe-Inhalt</th>
                         <th className="px-10 py-8 text-right">Aktion</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {currentHwSubmissions.map(({student, submission}) => (
                         <tr key={student.id} className="hover:bg-madrassah-50/20 transition-all group">
                            <td className="px-10 py-6">
                               <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md ${student.gender === 'Junge' ? 'bg-indigo-600' : 'bg-pink-600'}`}>{student.firstName.charAt(0)}</div>
                                  <p className="font-black uppercase italic text-sm text-madrassah-950">{student.firstName} {student.lastName}</p>
                               </div>
                            </td>
                            <td className="px-6 py-6 text-center">
                               {submission ? (
                                 <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase border ${submission.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                    {submission.status}
                                 </span>
                               ) : (
                                 <span className="text-[8px] font-black text-gray-300 uppercase italic">Ausstehend</span>
                               )}
                            </td>
                            <td className="px-6 py-6 text-center">
                               {submission?.fileUrl ? <div className="text-emerald-500 flex justify-center items-center gap-2 text-[9px] font-black uppercase"><CheckCircle size={18}/> Datei vorhanden</div> : <div className="text-gray-200 flex justify-center"><X size={20}/></div>}
                            </td>
                            <td className="px-10 py-6 text-right">
                               {submission ? (
                                  <button 
                                    onClick={() => { setCorrectionTarget({student, submission}); setSelectedRating(submission.status === 'Accepted' ? 'Sehr gut' : 'Gut'); }}
                                    className="p-4 bg-white border border-gray-100 text-gray-400 hover:text-madrassah-950 hover:shadow-xl rounded-2xl transition-all shadow-sm flex items-center gap-3 ml-auto font-black uppercase text-[10px] tracking-widest"
                                  >
                                     <PenTool size={18}/> Bearbeiten
                                  </button>
                               ) : (
                                  <button className="p-4 bg-gray-50 text-gray-200 rounded-2xl cursor-not-allowed ml-auto">
                                     <PenTool size={18}/>
                                  </button>
                               )}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}
        </div>
      )}

      {/* Korrektur-Overlay (Modal) */}
      {correctionTarget && (
        <div className="fixed inset-0 z-[100] bg-madrassah-950/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
           <div className="bg-white w-full max-w-6xl rounded-[4rem] flex flex-col lg:flex-row overflow-hidden shadow-2xl relative border-4 border-white animate-in zoom-in duration-300 my-auto">
              <button onClick={() => setCorrectionTarget(null)} className="absolute top-8 right-8 z-50 p-4 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-2xl transition-all"><X size={32}/></button>
              
              {/* Linke Seite: Media Preview */}
              <div className="lg:w-2/3 bg-gray-900 flex flex-col relative min-h-[500px]">
                 <div className="absolute top-8 left-8 z-20 flex bg-black/40 backdrop-blur-md p-4 rounded-2xl items-center gap-4 border border-white/10">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg">{correctionTarget.student.firstName.charAt(0)}</div>
                    <div>
                       <p className="text-white font-black uppercase italic text-xs leading-none">{correctionTarget.student.firstName} {correctionTarget.student.lastName}</p>
                       <p className="text-emerald-400 text-[8px] font-black uppercase mt-1 tracking-widest">Klasse {correctionTarget.student.className} • Hausaufgabe prüfen</p>
                    </div>
                 </div>

                 <div className="flex-1 flex items-center justify-center p-12">
                    {correctionTarget.submission.fileUrl ? (
                       <div className="w-full h-full flex items-center justify-center">
                          {correctionTarget.submission.fileUrl.startsWith('data:image/') ? (
                             <img src={correctionTarget.submission.fileUrl} alt="Abgabe" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" />
                          ) : (
                             <div className="bg-white/5 border-2 border-white/10 p-20 rounded-[3rem] flex flex-col items-center gap-6 text-white text-center">
                                <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/20"><FileText size={48}/></div>
                                <div>
                                   <h4 className="text-2xl font-black uppercase italic">Dokumentation</h4>
                                   <p className="text-gray-400 text-sm mt-2 font-medium">Diese Datei muss heruntergeladen werden.</p>
                                </div>
                                <a href={correctionTarget.submission.fileUrl} download={`HUDA-HW-${correctionTarget.student.lastName}.pdf`} className="bg-white text-gray-900 px-12 py-5 rounded-[1.75rem] font-black uppercase text-xs shadow-xl flex items-center gap-3">
                                   <Download size={20}/> Datei öffnen
                                </a>
                             </div>
                          )}
                       </div>
                    ) : (
                       <div className="text-center text-white/20 italic">
                          <Info size={100} className="mx-auto mb-6" />
                          <p className="text-3xl font-black uppercase tracking-tighter">Nur Text-Abgabe</p>
                       </div>
                    )}
                 </div>
              </div>

              {/* Rechte Seite: Korrektur-Formular */}
              <div className="lg:w-1/3 p-12 space-y-12 bg-white flex flex-col overflow-y-auto">
                 <div className="space-y-6">
                    <h3 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter border-b pb-6">Bewertung</h3>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 italic text-gray-600 text-sm leading-relaxed shadow-inner">
                       <p className="text-[10px] font-black uppercase text-indigo-600 mb-3">Notiz des Schülers:</p>
                       "{correctionTarget.submission.studentComment || 'Kein Text hinterlegt.'}"
                    </div>
                 </div>

                 <div className="space-y-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Qualität auswählen</label>
                       <div className="grid grid-cols-2 gap-3">
                          {(['Sehr gut', 'Gut', 'Nicht gut', 'Wiederholen'] as const).map(val => (
                             <button 
                                key={val} 
                                onClick={() => setSelectedRating(val)} 
                                className={`py-4 rounded-xl font-black text-[10px] uppercase transition-all border-2 ${selectedRating === val ? 'bg-madrassah-950 text-white border-madrassah-950 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-100'}`}
                             >
                                {val}
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center px-2">
                          <label className="text-[10px] font-black uppercase text-gray-400">Feedback an Schüler</label>
                          <button onClick={handleAiFeedback} disabled={isAiLoading} className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2 hover:underline">
                             {isAiLoading ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} KI Text formulieren
                          </button>
                       </div>
                       <textarea 
                        className="w-full bg-gray-50 border-2 border-gray-100 p-6 rounded-3xl font-medium text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner min-h-[150px]" 
                        placeholder="Dein Feedback..." 
                        value={correctionTarget.submission.teacherComment || ''}
                        onChange={e => updateSubmissionStatus(correctionTarget.submission.id, correctionTarget.submission.status, undefined, e.target.value)}
                       />
                    </div>
                 </div>

                 <div className="mt-auto pt-10 border-t space-y-4">
                    <button 
                      onClick={() => { updateSubmissionStatus(correctionTarget.submission.id, 'Accepted'); setCorrectionTarget(null); }}
                      className="w-full bg-emerald-600 text-white py-6 rounded-[2.25rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4"
                    >
                       <CheckCircle2 size={24} /> Speichern & Abschließen
                    </button>
                    {selectedRating === 'Wiederholen' && (
                      <button 
                        onClick={() => { updateSubmissionStatus(correctionTarget.submission.id, 'NeedsRevision'); setCorrectionTarget(null); }}
                        className="w-full bg-amber-500 text-white py-4 rounded-[2.25rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-4"
                      >
                         <RotateCcw size={18} /> Zur Revision schicken
                      </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const RotateCcw: React.FC<{size?: number}> = ({size = 18}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);

export default HomeworkManager;
