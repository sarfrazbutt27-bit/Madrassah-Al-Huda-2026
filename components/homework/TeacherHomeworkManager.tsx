
import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, PenTool, 
  Trash2, ChevronRight, 
  Calendar,
  AlertTriangle, Send, Check
} from 'lucide-react';
import { 
  User as UserType, Student, Homework, HomeworkSubmission, WhatsAppLog
} from '../../types';
import { generateId } from '../../src/utils';

interface Props {
  user: UserType;
  students: Student[];
  homework: Homework[];
  submissions: HomeworkSubmission[];
  onUpdateHomework: (h: Homework[]) => void;
  onUpdateSubmissions: (s: HomeworkSubmission[]) => void;
  whatsappLogs: WhatsAppLog[];
  onUpdateLogs: (l: WhatsAppLog[]) => void;
}

const TeacherHomeworkManager: React.FC<Props> = ({ 
  user, students, homework, submissions, onUpdateHomework, onUpdateSubmissions, 
  whatsappLogs, onUpdateLogs 
}) => {
  const [activeTab, setActiveTab] = useState<'assignments' | 'review'>('assignments');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClass, setSelectedClass] = useState(user.assignedClasses?.[0] || '');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string>('');

  const teacherClasses = user.assignedClasses || [];
  const filteredHomework = homework.filter(h => 
    teacherClasses.includes(h.classId) && 
    (searchTerm === '' || h.title.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  const [newHw, setNewHw] = useState<Partial<Homework>>(() => ({
    classId: user.assignedClasses?.[0] || '',
    subject: 'Tajweed',
    repeatType: 'OneTime',
    submissionType: 'Mixed',
    visibility: 'Everyone',
    reminderEnabled: true,
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  }));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const assignment: Homework = {
      ...newHw as Homework,
      id: generateId('H-'),
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };
    onUpdateHomework([...homework, assignment]);
    setShowCreate(false);
  };

  const handleUpdateSubmission = (sub: HomeworkSubmission, updates: Partial<HomeworkSubmission>) => {
    const updated = submissions.map(s => s.id === sub.id ? { ...s, ...updates, reviewedAt: new Date().toISOString() } : s);
    onUpdateSubmissions(updated);
  };

  const reviewStudents = useMemo(() => {
    if (!selectedHomeworkId) return [];
    const hw = homework.find(h => h.id === selectedHomeworkId);
    if (!hw) return [];
    
    return students.filter(s => s.className === hw.classId && s.status === 'active').map(s => {
      const sub = submissions.find(sub => sub.homeworkId === selectedHomeworkId && sub.studentId === s.id);
      return { student: s, submission: sub };
    });
  }, [selectedHomeworkId, students, submissions, homework]);

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-madrassah-950 text-white rounded-2xl flex items-center justify-center shadow-xl rotate-3">
              <PenTool size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter">Homework Hub</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Management & Review Panel</p>
           </div>
        </div>

        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
           <button onClick={() => setActiveTab('assignments')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'assignments' ? 'bg-madrassah-950 text-white shadow-lg' : 'text-gray-400'}`}>Assignments</button>
           <button onClick={() => setActiveTab('review')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'review' ? 'bg-madrassah-950 text-white shadow-lg' : 'text-gray-400'}`}>Review Grid</button>
        </div>
      </div>

      {activeTab === 'assignments' ? (
        <div className="space-y-6">
           <div className="flex justify-between items-center px-4">
              <div className="relative w-80">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                 <input 
                  type="text" placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold shadow-sm outline-none"
                 />
              </div>
              <button onClick={() => setShowCreate(true)} className="bg-madrassah-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl hover:bg-black transition-all">
                 <Plus size={18} /> Create Assignment
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHomework.map(h => {
                const subCount = submissions.filter(s => s.homeworkId === h.id && s.status === 'Submitted').length;
                return (
                  <div key={h.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><PenTool size={100} /></div>
                    <div className="flex justify-between items-start mb-6">
                       <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border border-indigo-100">{h.subject}</span>
                       <button onClick={() => onUpdateHomework(homework.filter(x => x.id !== h.id))} className="text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                    <h3 className="text-xl font-black text-madrassah-950 italic uppercase leading-tight mb-2 truncate">{h.title}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-6 flex items-center gap-2">
                       <Calendar size={12} /> Due: {new Date(h.dueDate).toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-emerald-600">{subCount} Submissions</span>
                          <span className="text-[8px] font-bold text-gray-300 uppercase">Class {h.classId}</span>
                       </div>
                       <button onClick={() => { setSelectedHomeworkId(h.id); setActiveTab('review'); }} className="p-3 bg-gray-50 text-gray-400 hover:bg-madrassah-950 hover:text-white rounded-xl transition-all shadow-sm">
                          <ChevronRight size={18} />
                       </button>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-3 block">Select Assignment to Review</label>
              <select 
                value={selectedHomeworkId} 
                onChange={e => setSelectedHomeworkId(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-50 p-5 rounded-3xl font-black uppercase text-[11px] outline-none focus:border-madrassah-950 shadow-inner"
              >
                 <option value="">Choose Homework...</option>
                 {filteredHomework.map(h => <option key={h.id} value={h.id}>{h.title} ({h.classId})</option>)}
              </select>
           </div>

           {selectedHomeworkId && (
             <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
                      <tr>
                         <th className="px-10 py-6">Student</th>
                         <th className="px-6 py-6">Submission</th>
                         <th className="px-6 py-6">Review & Score</th>
                         <th className="px-10 py-6 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {reviewStudents.map(({ student, submission }) => (
                        <tr key={student.id} className="hover:bg-madrassah-50/20 transition-all group">
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-black text-xs">{student.firstName?.charAt(0) || '?'}</div>
                                 <div className="text-left overflow-hidden">
                                    <p className="font-black uppercase text-sm italic leading-none truncate">{student.firstName} {student.lastName}</p>
                                    <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">ID: {student.id}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-6">
                              {submission?.submittedAt ? (
                                <div className="space-y-3">
                                   <div className="flex items-center gap-3">
                                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-emerald-100">Submitted</span>
                                      <span className="text-[8px] text-gray-300 font-bold">{new Date(submission.submittedAt).toLocaleString()}</span>
                                   </div>
                                </div>
                              ) : (
                                <span className="text-[9px] font-black text-gray-300 uppercase italic">Pending</span>
                              )}
                           </td>
                           <td className="px-6 py-6">
                              {submission ? (
                                <div className="space-y-3">
                                   <div className="flex gap-2">
                                      <button onClick={() => handleUpdateSubmission(submission, { status: 'Accepted' })} className={`p-2 rounded-lg border transition-all ${submission.status === 'Accepted' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-gray-300 border-gray-100 hover:border-emerald-500'}`}><Check size={14}/></button>
                                      <button onClick={() => handleUpdateSubmission(submission, { status: 'NeedsRevision' })} className={`p-2 rounded-lg border transition-all ${submission.status === 'NeedsRevision' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-gray-300 border-gray-100 hover:border-amber-500'}`}><AlertTriangle size={14}/></button>
                                   </div>
                                   <input 
                                    type="number" min="0" max="10" placeholder="0-10" value={submission.score || ''}
                                    onChange={e => handleUpdateSubmission(submission, { score: parseInt(e.target.value) || 0 })}
                                    className="w-16 bg-gray-50 border border-gray-100 p-2 rounded-lg text-[10px] font-black text-center"
                                   />
                                </div>
                              ) : '---'}
                           </td>
                           <td className="px-10 py-6 text-right">
                              {!submission && (
                                <button className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm border border-emerald-100">
                                   <Send size={16} />
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
    </div>
  );
};

export default TeacherHomeworkManager;
