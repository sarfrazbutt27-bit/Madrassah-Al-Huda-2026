
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BookOpen, Plus, Search, Calendar, CheckCircle2, AlertCircle, 
  Brain, Sparkles, Loader2, Book, History, Trash2,
  Check, X, Star, RefreshCw, Eye, Play, Info, Award, FileEdit, ExternalLink, Printer, FileUp
} from 'lucide-react';
import { 
  User, Student, UserRole, HomeworkAssignment, HomeworkQuizQuestion, 
  HomeworkAttempt, HomeworkAttemptAnswer, HomeworkTeacherRating, HomeworkStatus, HomeworkReport
} from '../types';
import { generateHomeworkQuiz } from '../lib/geminiService';
import { supabase } from '../lib/supabase';

interface ArchiveResult {
  ai_assignments_archived: number;
  ai_attempts_archived: number;
  classic_homework_archived: number;
  classic_submissions_archived: number;
}

interface HomeworkSystemProps {
  user: User;
  students: Student[];
  assignments: HomeworkAssignment[];
  questions: HomeworkQuizQuestion[];
  attempts: HomeworkAttempt[];
  answers: HomeworkAttemptAnswer[];
  ratings: HomeworkTeacherRating[];
  reports: HomeworkReport[];
  onSaveAssignments: (list: HomeworkAssignment[], itemsToSync?: HomeworkAssignment[]) => Promise<boolean>;
  onSaveQuestions: (list: HomeworkQuizQuestion[], itemsToSync?: HomeworkQuizQuestion[]) => Promise<boolean>;
  onSaveAttempts: (list: HomeworkAttempt[], itemsToSync?: HomeworkAttempt[]) => Promise<boolean>;
  onSaveAnswers: (list: HomeworkAttemptAnswer[], itemsToSync?: HomeworkAttemptAnswer[]) => Promise<boolean>;
  onSaveRatings: (list: HomeworkTeacherRating[], itemsToSync?: HomeworkTeacherRating[]) => Promise<boolean>;
  onSaveReports: (list: HomeworkReport[], itemsToSync?: HomeworkReport[]) => Promise<boolean>;
  subjects: string[];
  users: User[];
}

const HomeworkSystem: React.FC<HomeworkSystemProps> = ({
  user, students, assignments, questions, attempts, answers, ratings, reports,
  onSaveAssignments, onSaveQuestions, onSaveAttempts, onSaveAnswers, onSaveRatings, onSaveReports, subjects, users
}) => {
  const isTeacher = user.role === UserRole.TEACHER || user.role === UserRole.PRINCIPAL;
  const isStudent = user.role === UserRole.STUDENT;
  
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'monitor' | 'do' | 'reports'>('list');
  const [selectedAssignment, setSelectedAssignment] = useState<HomeworkAssignment | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileType, setFileType] = useState<string>('pdf');
  
  // Create Assignment State
  const [newAssignment, setNewAssignment] = useState<Partial<HomeworkAssignment>>({
    title: '',
    className: '',
    subject: '',
    assignmentType: 'Quiz',
    bookUrl: '',
    pagesFrom: 1,
    pagesTo: 10,
    dailyTargetMinutes: 30,
    maxAttempts: 5,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Draft',
    quizVersion: 1,
    language: 'mixed',
    instructions: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<Partial<HomeworkQuizQuestion>[]>([]);

  // Student Quiz State
  const [currentAttempt, setCurrentAttempt] = useState<Partial<HomeworkAttempt> | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, 'A' | 'B' | 'C'>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; perfect: boolean } | null>(null);
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const readingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (readingStartTime) {
      readingTimerRef.current = setInterval(() => {
        setReadingSeconds(Math.floor((Date.now() - readingStartTime) / 1000));
      }, 1000);
    } else {
      if (readingTimerRef.current) clearInterval(readingTimerRef.current);
    }
    return () => {
      if (readingTimerRef.current) clearInterval(readingTimerRef.current);
    };
  }, [readingStartTime]);

  // Reports Filter State
  const [reportFilterStudent, setReportFilterStudent] = useState('');
  const [reportFilterClass, setReportFilterClass] = useState('');
  const [reportFilterMonth, setReportFilterMonth] = useState('');
  const [reportFilterYear, setReportFilterYear] = useState(new Date().getFullYear().toString());

  // Archive State
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveFilters, setArchiveFilters] = useState({
    class_id: '',
    subject: '',
    student_id: '',
    date_from: '',
    date_to: ''
  });
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveResult, setArchiveResult] = useState<ArchiveResult | null>(null);

  const handleArchiveHistory = async () => {
    if (!window.confirm("Sind Sie sicher? Alle gefilterten Hausaufgaben und Abgaben werden archiviert und sind im normalen Betrieb nicht mehr sichtbar.")) {
      return;
    }

    setIsArchiving(true);
    setArchiveResult(null);

    try {
      const { data, error } = await supabase.rpc('clear_homework_history', {
        p_filters: archiveFilters,
        p_archived_by: user.name
      });

      if (error) throw error;
      setArchiveResult(data);
      alert("Archivierung erfolgreich abgeschlossen!");
      
      // Trigger a global data refresh to clear archived items from local state
      // We can't call fetchAllData directly here, but we can suggest it or 
      // the user can click the refresh button. 
      // Actually, we should probably reload the page or use a custom event.
      window.location.reload(); 
    } catch (err) {
      console.error("Archive Error:", err);
      alert(`Fehler bei der Archivierung: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsArchiving(false);
    }
  };

  // Filtered Data
  const filteredAssignments = useMemo(() => {
    if (isTeacher) {
      return assignments.filter(a => 
        user.role === UserRole.PRINCIPAL || 
        a.teacherId === user.id || 
        user.assignedClasses?.includes(a.className)
      );
    }
    
    // For students, use their assigned classes from the user object or look up in students array
    const student = students.find(s => s.id === user.id);
    const studentClass = (student?.className || (user.assignedClasses && user.assignedClasses[0]) || '').trim().toLowerCase();

    return assignments.filter(a => {
      const assignmentClass = (a.className || '').trim().toLowerCase();
      const isMatch = assignmentClass === studentClass || 
                      assignmentClass === 'alle' || 
                      user.assignedClasses?.some(c => (c || '').trim().toLowerCase() === assignmentClass);
      
      return isMatch && a.status !== 'Draft';
    });
  }, [assignments, user, students, isTeacher]);

  const handleCreateAssignment = async (stayOnPage = false) => {
    console.log("Creating/Updating assignment...", { newAssignment, selectedClasses });
    if (!newAssignment.title || (selectedClasses.length === 0 && !isEditing) || !newAssignment.subject) {
      alert("Bitte füllen Sie alle Pflichtfelder aus (Titel, Klassen, Fach).");
      return;
    }

    if (isEditing && newAssignment.id) {
      const updatedAssignments = assignments.map(a => a.id === newAssignment.id ? { ...a, ...newAssignment } as HomeworkAssignment : a);
      
      // If new questions were generated during edit, replace existing ones
      const newQuestionsForAssignment: HomeworkQuizQuestion[] = [];
      const trulyNewQuestions = previewQuestions.filter(q => !q.id);
      
      if (trulyNewQuestions.length > 0) {
        // Delete old questions for this assignment
        const otherQuestions = questions.filter(q => q.assignmentId !== newAssignment.id);
        
        newQuestionsForAssignment.push(...trulyNewQuestions.map(q => ({
          ...q,
          id: crypto.randomUUID(),
          assignmentId: newAssignment.id!
        })) as HomeworkQuizQuestion[]);
        
        // Update status to Assigned if it was Draft
        const assignmentToUpdate = updatedAssignments.find(a => a.id === newAssignment.id);
        if (assignmentToUpdate && assignmentToUpdate.status === 'Draft') {
          assignmentToUpdate.status = 'Assigned';
        }
        
        // Save with replaced questions
        const success = await onSaveAssignments(updatedAssignments, [{ ...newAssignment, status: (trulyNewQuestions.length > 0 || newAssignment.status === 'Assigned') ? 'Assigned' : 'Draft', language: newAssignment.language || 'mixed' } as HomeworkAssignment]);
        if (success) {
          await onSaveQuestions([...otherQuestions, ...newQuestionsForAssignment], newQuestionsForAssignment);
          alert("Hausaufgabe aktualisiert!");
          setActiveTab('list');
          setIsEditing(false);
          setPreviewQuestions([]);
          setNewAssignment({
            title: '',
            className: '',
            subject: '',
            bookUrl: '',
            pagesFrom: 1,
            pagesTo: 10,
            maxAttempts: 5,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Draft',
            quizVersion: 1,
            instructions: ''
          });
        }
        return;
      }

      const success = await onSaveAssignments(updatedAssignments, [{ ...newAssignment, language: newAssignment.language || 'mixed' } as HomeworkAssignment]);
      
      if (success) {
        if (newQuestionsForAssignment.length > 0) {
          await onSaveQuestions([...questions, ...newQuestionsForAssignment], newQuestionsForAssignment);
        }
        alert("Hausaufgabe aktualisiert!");
        setActiveTab('list');
        setIsEditing(false);
        setPreviewQuestions([]);
        setNewAssignment({
          title: '',
          className: '',
          subject: '',
          bookUrl: '',
          pagesFrom: 1,
          pagesTo: 10,
          maxAttempts: 5,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Draft',
          quizVersion: 1,
          instructions: ''
        });
      }
      return;
    }

    if (!isEditing && newAssignment.assignmentType === 'Quiz' && previewQuestions.length === 0) {
      if (!window.confirm("Sie haben noch kein KI-Quiz generiert. Die Aufgabe wird als 'Entwurf' gespeichert und ist für Schüler noch nicht sichtbar. Fortfahren?")) {
        return;
      }
    }

    const newAssignments: HomeworkAssignment[] = [];
    const allNewQuestions: HomeworkQuizQuestion[] = [];

    for (const className of selectedClasses) {
      const id = crypto.randomUUID();
      const assignment: HomeworkAssignment = {
        ...newAssignment as HomeworkAssignment,
        id,
        className,
        teacherId: user.id,
        createdAt: new Date().toISOString(),
        status: (previewQuestions.length > 0 || newAssignment.assignmentType === 'Reading') ? 'Assigned' : 'Draft',
        language: newAssignment.language || 'mixed'
      };
      newAssignments.push(assignment);

      if (previewQuestions.length > 0) {
        const qList = previewQuestions.map((q) => ({
          ...q,
          id: crypto.randomUUID(),
          assignmentId: id
        })) as HomeworkQuizQuestion[];
        allNewQuestions.push(...qList);
      }
    }

    console.log("Saving to database...", newAssignments.length, "assignments");
    try {
      const success = await onSaveAssignments([...assignments, ...newAssignments], newAssignments);
      if (success) {
        if (allNewQuestions.length > 0) {
          console.log("Saving questions...", allNewQuestions.length);
          await onSaveQuestions([...questions, ...allNewQuestions], allNewQuestions);
        }
        console.log("Save successful");
        if (stayOnPage) {
          setNewAssignment({
            ...newAssignment,
            title: '',
          });
          setPreviewQuestions([]);
          alert("Hausaufgaben für " + selectedClasses.join(', ') + " erstellt!");
        } else {
          setActiveTab('list');
          setNewAssignment({
            title: '',
            className: '',
            subject: '',
            assignmentType: 'Quiz',
            bookUrl: '',
            pagesFrom: 1,
            pagesTo: 10,
            dailyTargetMinutes: 30,
            maxAttempts: 5,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Draft',
            quizVersion: 1
          });
          setSelectedClasses([]);
          setPreviewQuestions([]);
        }
      } else {
        alert("Fehler beim Speichern der Hausaufgaben. Bitte prüfen Sie Ihre Verbindung.");
      }
    } catch (error) {
      console.error("Critical save error:", error);
      alert("Ein kritischer Fehler ist beim Speichern aufgetreten.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Determine file type
      let type = 'file';
      if (file.type.includes('pdf')) type = 'pdf';
      else if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      
      setFileType(type);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `homework_sources/${fileName}`;

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
          setNewAssignment(prev => ({
            ...prev,
            bookUrl: reader.result as string
          }));
          setUploadProgress(100);
          setIsUploading(false);
        };
        reader.onerror = () => {
          alert("Fehler beim Lesen der Datei.");
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      setNewAssignment(prev => ({
        ...prev,
        bookUrl: publicUrl
      }));
      setUploadProgress(100);
      setIsUploading(false);
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Fehler beim Hochladen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      setIsUploading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!newAssignment.bookUrl || !newAssignment.pagesFrom || !newAssignment.pagesTo) {
      alert("Bitte geben Sie Buch-URL und Seitenbereich an.");
      return;
    }
    setIsGenerating(true);
    try {
      const generated = await generateHomeworkQuiz(
        newAssignment.bookUrl,
        newAssignment.pagesFrom || 1,
        newAssignment.pagesTo || 10,
        newAssignment.subject || 'Allgemein',
        newAssignment.language,
        fileType
      );
      
      if (generated.length === 0) {
        throw new Error("Die KI konnte keine Fragen aus dieser Quelle extrahieren. Mögliche Ursachen:\n1. Die URL ist nicht öffentlich zugänglich.\n2. Der Seitenbereich enthält zu wenig Text.\n3. Die Webseite blockiert automatisierte Zugriffe.\n\nTipp: Versuchen Sie einen anderen Seitenbereich oder prüfen Sie, ob der Link direkt zu einem PDF führt.");
      }
      
      setPreviewQuestions(generated);
    } catch (error) {
      console.error("Quiz generation error:", error);
      const errorMsg = error instanceof Error ? error.message : "";
      alert(errorMsg || "Fehler bei der Quiz-Generierung. Bitte prüfen Sie die URL oder versuchen Sie es erneut.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuizForExisting = async (assignment: HomeworkAssignment) => {
    if (!assignment.bookUrl || !assignment.pagesFrom || !assignment.pagesTo) {
      alert("Bitte geben Sie Buch-URL und Seitenbereich an.");
      return;
    }
    setIsGenerating(true);
    try {
      const generated = await generateHomeworkQuiz(
        assignment.bookUrl,
        assignment.pagesFrom || 1,
        assignment.pagesTo || 10,
        assignment.subject || 'Allgemein',
        assignment.language,
        assignment.bookUrl.startsWith('data:image') ? 'image' : 'pdf'
      );
      
      if (generated.length === 0) {
        throw new Error("Die KI konnte keine Fragen aus dieser Quelle extrahieren.");
      }
      
      const newQuestions = generated.map(q => ({
        ...q,
        id: crypto.randomUUID(),
        assignmentId: assignment.id
      })) as HomeworkQuizQuestion[];
      
      // Replace old questions
      const otherQuestions = questions.filter(q => q.assignmentId !== assignment.id);
      await onSaveQuestions([...otherQuestions, ...newQuestions], newQuestions);
      alert(`KI-Quiz für "${assignment.title}" erfolgreich aktualisiert (${newQuestions.length} Fragen).`);
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      alert(error.message || "Fehler bei der Quiz-Generierung.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm("Möchten Sie diese Hausaufgabe wirklich löschen? Alle Abgaben und Fragen werden ebenfalls entfernt.")) return;
    
    const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
    const success = await onSaveAssignments(updatedAssignments, [{ id: assignmentId, status: 'Deleted' } as any]);
    if (success) {
      alert("Hausaufgabe gelöscht.");
    }
  };

  const handleArchiveAssignment = async (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    if (!window.confirm(`Möchten Sie "${assignment.title}" archivieren? Es werden individuelle Berichte für alle Schüler erstellt und die Originaldaten gelöscht, um Speicherplatz zu sparen.`)) return;

    const teacher = users.find(u => u.id === assignment.teacherId);
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Lehrer";

    const newReports: HomeworkReport[] = [];
    const assignmentAttempts = attempts.filter(a => a.assignmentId === assignmentId);
    const assignmentRatings = ratings.filter(r => r.assignmentId === assignmentId);

    // Get all students in the class
    const classStudents = students.filter(s => s.className === assignment.className);

    for (const student of classStudents) {
      const studentAttempts = assignmentAttempts.filter(a => a.studentId === student.id);
      const studentRating = assignmentRatings.find(r => r.studentId === student.id);

      if (studentAttempts.length > 0 || studentRating) {
        const bestAttempt = [...studentAttempts].sort((a, b) => b.scorePercent - a.scorePercent)[0];
        
        newReports.push({
          id: crypto.randomUUID(),
          studentId: student.id,
          assignmentTitle: assignment.title,
          subject: assignment.subject,
          assignmentType: assignment.assignmentType,
          teacherName: teacherName,
          completedAt: bestAttempt?.completedAt || new Date().toISOString(),
          scorePercent: bestAttempt?.scorePercent || 0,
          timeSpentSeconds: assignment.assignmentType === 'Reading' 
            ? studentAttempts.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0)
            : undefined,
          rating: studentRating?.rating || 'Nicht bewertet',
          feedbackText: studentRating?.feedbackText
        });
      }
    }

    // Save reports
    const reportsSuccess = await onSaveReports([...reports, ...newReports], newReports);
    if (reportsSuccess) {
      // Delete assignment and related data
      const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
      await onSaveAssignments(updatedAssignments, [{ id: assignmentId, status: 'Deleted' } as any]);
      alert(`${newReports.length} Berichte erstellt. Hausaufgabe archiviert und gelöscht.`);
    } else {
      alert("Fehler beim Erstellen der Berichte. Archivierung abgebrochen.");
    }
  };

  const handleEditAssignment = (assignment: HomeworkAssignment) => {
    setNewAssignment(assignment);
    setSelectedClasses([assignment.className]);
    setIsEditing(true);
    setActiveTab('create');
    
    // Load existing questions into preview
    const existingQuestions = questions.filter(q => q.assignmentId === assignment.id);
    setPreviewQuestions(existingQuestions);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Möchten Sie diesen Bericht wirklich löschen?")) return;
    const updatedReports = reports.filter(r => r.id !== reportId);
    const success = await onSaveReports(updatedReports, [{ id: reportId, status: 'Deleted' } as any]);
    if (success) {
      alert("Bericht gelöscht.");
    }
  };

  const handleStartAttempt = (assignment: HomeworkAssignment) => {
    const studentAttempts = attempts.filter(a => a.assignmentId === assignment.id && a.studentId === user.id);
    if (assignment.assignmentType === 'Quiz' && studentAttempts.length >= assignment.maxAttempts) {
      alert("Maximale Versuche erreicht.");
      return;
    }

    setSelectedAssignment(assignment);
    
    if (assignment.assignmentType === 'Reading') {
      setReadingStartTime(Date.now());
      setReadingSeconds(0);
      if (assignment.bookUrl) {
        window.open(assignment.bookUrl, '_blank');
      }
    }

    setCurrentAttempt({
      id: crypto.randomUUID(),
      assignmentId: assignment.id,
      studentId: user.id,
      attemptNumber: studentAttempts.length + 1,
      startedAt: new Date().toISOString()
    });
    setCurrentQuestionIndex(0);
    setStudentAnswers({});
    setQuizResult(null);
    setActiveTab('do');
  };

  const handleFinishReading = async () => {
    if (!currentAttempt || !selectedAssignment) return;
    
    const timeSpent = readingSeconds;
    const isGoalMet = timeSpent >= (selectedAssignment.dailyTargetMinutes || 0) * 60;
    
    const finalAttempt: HomeworkAttempt = {
      ...currentAttempt as HomeworkAttempt,
      completedAt: new Date().toISOString(),
      scorePercent: isGoalMet ? 100 : Math.min(Math.round((timeSpent / ((selectedAssignment.dailyTargetMinutes || 1) * 60)) * 100), 99),
      isPerfect: isGoalMet,
      timeSpentSeconds: timeSpent
    };

    const success = await onSaveAttempts([...attempts, finalAttempt], [finalAttempt]);
    if (success) {
      setQuizResult({ score: finalAttempt.scorePercent, perfect: finalAttempt.isPerfect });
      setReadingStartTime(null);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedAssignment || !currentAttempt) return;

    const assignmentQuestions = questions.filter(q => q.assignmentId === selectedAssignment.id);
    let correctCount = 0;
    const answerList: HomeworkAttemptAnswer[] = [];

    assignmentQuestions.forEach(q => {
      const selected = studentAnswers[q.id];
      const isCorrect = selected === q.correctOption;
      if (isCorrect) correctCount++;
      
      answerList.push({
        id: crypto.randomUUID(),
        attemptId: currentAttempt.id!,
        questionId: q.id,
        selectedOption: selected,
        isCorrect,
        answeredAt: new Date().toISOString()
      });
    });

    const scorePercent = Math.round((correctCount / assignmentQuestions.length) * 100);
    const isPerfect = scorePercent === 100;

    const attempt: HomeworkAttempt = {
      ...currentAttempt as HomeworkAttempt,
      scorePercent,
      isPerfect,
      completedAt: new Date().toISOString()
    };

    await onSaveAttempts([...attempts, attempt], [attempt]);
    await onSaveAnswers([...answers, ...answerList], answerList);
    
    setQuizResult({ score: scorePercent, perfect: isPerfect });

    // Update Assignment Status if perfect or max attempts
    if (isPerfect) {
      // In a real app, we might update a per-student status table
      // For now, we'll just show it in the UI
    }
  };

  const handleRateStudent = async (assignmentId: string, studentId: string, rating: HomeworkTeacherRating['rating']) => {
    const newRating: HomeworkTeacherRating = {
      id: crypto.randomUUID(),
      assignmentId,
      studentId,
      rating,
      ratedBy: user.id,
      ratedAt: new Date().toISOString()
    };

    const updatedRatings = [...ratings.filter(r => r.assignmentId !== assignmentId || r.studentId !== studentId), newRating];
    await onSaveRatings(updatedRatings, [newRating]);
    
    // If "Noch mal wiederholen", we could reset status or notify
    if (rating === 'Noch mal wiederholen') {
      // Logic to allow more attempts or reset
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="bg-madrassah-950 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-amber-500 p-4 rounded-3xl shadow-lg transform -rotate-3">
              <BookOpen size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase italic leading-none">Hausaufgaben</h1>
              <p className="text-xs md:text-sm font-bold text-amber-200 uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                <Sparkles size={14} /> KI-gestütztes Lernsystem
              </p>
            </div>
          </div>
          
          {isTeacher && activeTab === 'list' && (
            <div className="flex gap-4">
              <button 
                onClick={() => setShowArchiveModal(true)}
                className="bg-white/10 hover:bg-red-500/20 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border border-white/10 flex items-center gap-3"
              >
                <History size={18} /> History löschen
              </button>
              <button 
                onClick={() => setActiveTab('create')}
                className="bg-white text-madrassah-950 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-xl flex items-center gap-3"
              >
                <Plus size={18} /> Neue Aufgabe
              </button>
            </div>
          )}
          
          {activeTab !== 'list' && (
            <button 
              onClick={() => {
                setActiveTab('list');
                setSelectedAssignment(null);
                setQuizResult(null);
              }}
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border border-white/10"
            >
              Zurück zur Übersicht
            </button>
          )}
        </div>
      </div>

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-[100] bg-madrassah-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 shadow-2xl relative border-4 border-white overflow-y-auto max-h-[90vh]">
            <button onClick={() => { setShowArchiveModal(false); setArchiveResult(null); }} className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-all">
              <X size={32} />
            </button>
            
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <History size={24} />
                </div>
                <h3 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Hausaufgaben-History archivieren</h3>
              </div>
              <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest italic">Bereinigen Sie alte Daten sicher durch Soft-Delete</p>
            </div>

            {!archiveResult ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Klasse filtern</label>
                    <select 
                      value={archiveFilters.class_id}
                      onChange={e => setArchiveFilters({...archiveFilters, class_id: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold text-xs outline-none focus:border-madrassah-950"
                    >
                      <option value="">Alle Klassen</option>
                      {Array.from(new Set(students.map(s => s.className))).sort().map(c => (
                        <option key={c} value={c}>Klasse {c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Fach filtern</label>
                    <select 
                      value={archiveFilters.subject}
                      onChange={e => setArchiveFilters({...archiveFilters, subject: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold text-xs outline-none focus:border-madrassah-950"
                    >
                      <option value="">Alle Fächer</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Von Datum</label>
                    <input 
                      type="date"
                      value={archiveFilters.date_from}
                      onChange={e => setArchiveFilters({...archiveFilters, date_from: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold text-xs outline-none focus:border-madrassah-950"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Bis Datum</label>
                    <input 
                      type="date"
                      value={archiveFilters.date_to}
                      onChange={e => setArchiveFilters({...archiveFilters, date_to: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold text-xs outline-none focus:border-madrassah-950"
                    />
                  </div>
                </div>

                <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 flex items-start gap-6">
                  <AlertCircle className="text-red-500 shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="text-sm font-black uppercase text-red-900 mb-2">Wichtiger Hinweis</h4>
                    <p className="text-xs text-red-700 font-medium leading-relaxed">
                      Die Daten werden nicht endgültig gelöscht, sondern archiviert. Sie sind im Dashboard nicht mehr sichtbar, können aber bei Bedarf von einem Administrator wiederhergestellt werden.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleArchiveHistory}
                  disabled={isArchiving}
                  className="w-full bg-madrassah-950 text-white font-black py-6 rounded-3xl shadow-2xl uppercase text-[12px] tracking-[0.4em] hover:bg-red-600 transition-all disabled:opacity-30 flex items-center justify-center gap-4"
                >
                  {isArchiving ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                  Ich bestätige endgültig archivieren
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-in zoom-in-95">
                <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100 text-center">
                  <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Check size={40} />
                  </div>
                  <h4 className="text-2xl font-black text-emerald-950 uppercase italic mb-4">Archivierung abgeschlossen</h4>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-white/50 p-4 rounded-2xl">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">KI Aufgaben</p>
                      <p className="text-xl font-black text-emerald-600">{archiveResult.ai_assignments_archived}</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">KI Abgaben</p>
                      <p className="text-xl font-black text-emerald-600">{archiveResult.ai_attempts_archived}</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Klassische Aufgaben</p>
                      <p className="text-xl font-black text-emerald-600">{archiveResult.classic_homework_archived}</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Klassische Abgaben</p>
                      <p className="text-xl font-black text-emerald-600">{archiveResult.classic_submissions_archived}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-madrassah-950 text-white font-black py-6 rounded-3xl shadow-2xl uppercase text-[12px] tracking-[0.4em] hover:bg-black transition-all"
                >
                  Dashboard neu laden
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABS FOR TEACHER */}
      {isTeacher && (activeTab === 'list' || activeTab === 'monitor' || activeTab === 'reports') && (
        <div className="flex gap-4 p-2 bg-gray-100 rounded-3xl w-fit mx-auto">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'list' ? 'bg-white text-madrassah-950 shadow-md' : 'text-gray-500 hover:text-madrassah-950'}`}
          >
            Aufgaben
          </button>
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'monitor' ? 'bg-white text-madrassah-950 shadow-md' : 'text-gray-500 hover:text-madrassah-950'}`}
          >
            Überwachung
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'reports' ? 'bg-white text-madrassah-950 shadow-md' : 'text-gray-500 hover:text-madrassah-950'}`}
          >
            Berichte
          </button>
        </div>
      )}

      {/* TABS FOR STUDENT */}
      {isStudent && (activeTab === 'list' || activeTab === 'reports') && (
        <div className="flex gap-4 p-2 bg-gray-100 rounded-3xl w-fit mx-auto">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'list' ? 'bg-white text-madrassah-950 shadow-md' : 'text-gray-500 hover:text-madrassah-950'}`}
          >
            Aktuelle Aufgaben
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'reports' ? 'bg-white text-madrassah-950 shadow-md' : 'text-gray-500 hover:text-madrassah-950'}`}
          >
            Meine Berichte
          </button>
        </div>
      )}

      {/* LIST VIEW */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.length === 0 ? (
            <div className="col-span-full bg-white p-20 rounded-[3rem] text-center border-4 border-dashed border-gray-100">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Book size={32} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-black uppercase text-gray-400">Keine Hausaufgaben gefunden</h3>
              <p className="text-gray-400 text-sm mt-2">Erstellen Sie Ihre erste Aufgabe mit KI-Quiz!</p>
            </div>
          ) : (
            filteredAssignments.map(assignment => {
              const studentAttempts = attempts.filter(a => a.assignmentId === assignment.id && a.studentId === user.id);
              const bestAttempt = studentAttempts.sort((a, b) => b.scorePercent - a.scorePercent)[0];
              const rating = ratings.find(r => r.assignmentId === assignment.id && r.studentId === user.id);
              
              return (
                <div key={assignment.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-2">
                      <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {assignment.subject}
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${assignment.assignmentType === 'Reading' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {assignment.assignmentType === 'Reading' ? 'Lese-Aufgabe' : 'KI-Quiz'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isTeacher && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditAssignment(assignment); }}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Bearbeiten"
                          >
                            <FileEdit size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleArchiveAssignment(assignment.id); }}
                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Archivieren & Löschen"
                          >
                            <History size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assignment.id); }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Löschen"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        assignment.status === 'Assigned' ? 'bg-emerald-50 text-emerald-600' : 
                        assignment.status === 'Completed' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {assignment.status}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black uppercase mb-4 group-hover:text-indigo-600 transition-colors">{assignment.title}</h3>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-gray-500 text-xs font-bold">
                      <Calendar size={14} /> Fällig: {new Date(assignment.dueDate).toLocaleDateString('de-DE')}
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 text-xs font-bold">
                      <Book size={14} /> S. {assignment.pagesFrom} - {assignment.pagesTo}
                    </div>
                    {isStudent && (
                      <div className="flex items-center gap-3 text-gray-500 text-xs font-bold">
                        <RefreshCw size={14} /> Versuche: {studentAttempts.length} / {assignment.maxAttempts}
                      </div>
                    )}
                  </div>

                  {isStudent && (
                    <div className="mt-auto space-y-4">
                      {bestAttempt && (
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-gray-400">Bester Score</span>
                          <span className={`text-sm font-black ${bestAttempt.isPerfect ? 'text-emerald-600' : 'text-indigo-600'}`}>
                            {bestAttempt.scorePercent}%
                          </span>
                        </div>
                      )}
                      
                      {rating && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 ${
                          rating.rating === 'Sehr gut' ? 'bg-emerald-50 text-emerald-700' :
                          rating.rating === 'Gut' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          <Star size={16} fill="currentColor" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{rating.rating}</span>
                        </div>
                      )}

                      <button 
                        disabled={assignment.assignmentType === 'Quiz' && (studentAttempts.length >= assignment.maxAttempts || bestAttempt?.isPerfect)}
                        onClick={() => handleStartAttempt(assignment)}
                        className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 ${
                          bestAttempt?.isPerfect 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'
                        } disabled:opacity-50`}
                      >
                        {bestAttempt?.isPerfect ? <CheckCircle2 size={18} /> : (assignment.assignmentType === 'Reading' ? <BookOpen size={18} /> : <Brain size={18} />)}
                        {bestAttempt?.isPerfect ? 'Abgeschlossen' : (assignment.assignmentType === 'Reading' ? 'Lesen starten' : (studentAttempts.length > 0 ? 'Quiz wiederholen' : 'Quiz starten'))}
                      </button>
                    </div>
                  )}

                  {isTeacher && (
                    <div className="mt-auto pt-6 border-t border-gray-50 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-gray-400">Klasse</span>
                            <span className="text-xs font-black text-indigo-600">{assignment.className}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-gray-400">Fragen</span>
                            <span className="text-xs font-black text-indigo-600">{questions.filter(q => q.assignmentId === assignment.id).length}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {assignment.assignmentType === 'Quiz' && (
                            <>
                              <button 
                                onClick={() => handleGenerateQuizForExisting(assignment)}
                                disabled={isGenerating}
                                className={`p-3 rounded-xl transition-all border ${
                                  questions.some(q => q.assignmentId === assignment.id)
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                                    : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                                }`}
                                title={questions.some(q => q.assignmentId === assignment.id) ? "KI Quiz aktualisieren" : "KI Quiz generieren"}
                              >
                                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                              </button>
                              <button 
                                onClick={() => {
                                  const qList = questions.filter(q => q.assignmentId === assignment.id);
                                  if (qList.length > 0) {
                                    setPreviewQuestions(qList);
                                    alert(`Vorschau: ${qList.length} Fragen geladen. Scrollen Sie nach unten, um sie zu sehen.`);
                                  } else {
                                    alert("Keine Fragen für dieses Quiz gefunden.");
                                  }
                                }}
                                className="bg-indigo-50 text-indigo-600 p-3 rounded-xl hover:bg-indigo-100 transition-all"
                                title="Fragen ansehen"
                              >
                                <Eye size={16} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setActiveTab('monitor');
                            }}
                            className="bg-madrassah-950 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-lg flex items-center gap-2"
                          >
                            <Play size={14} /> Monitor
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <button 
                          onClick={() => window.open(`/#/homework/print/${assignment.id}`, '_blank')}
                          className="text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-2"
                        >
                          <Printer size={14} /> Bericht drucken
                        </button>
                        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">ID: {assignment.id.substring(0, 8)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CREATE VIEW */}
      {activeTab === 'create' && (
        <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-madrassah-950 p-10 text-white">
            <h2 className="text-2xl font-black uppercase italic">{isEditing ? 'Hausaufgabe bearbeiten' : 'Neue Hausaufgabe erstellen'}</h2>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-2">{isEditing ? 'Passen Sie die Details der Aufgabe an' : 'Konfigurieren Sie die Aufgabe und lassen Sie das Quiz generieren'}</p>
          </div>
          
          <div className="p-12 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Aufgabentyp</label>
                <div className="flex gap-4">
                  {['Quiz', 'Reading'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewAssignment({...newAssignment, assignmentType: t as any})}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${newAssignment.assignmentType === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-indigo-200'}`}
                    >
                      {t === 'Quiz' ? 'KI Quiz' : 'Lese-Aufgabe'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Titel der Aufgabe</label>
                <input 
                  type="text"
                  value={newAssignment.title}
                  onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                  placeholder="z.B. Sierah - Die Auswanderung"
                />
              </div>
              
              {!isEditing && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Klassen (Mehrfachauswahl möglich)</label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(students.map(s => s.className))).sort().map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          if (selectedClasses.includes(c)) {
                            setSelectedClasses(selectedClasses.filter(x => x !== c));
                          } else {
                            setSelectedClasses([...selectedClasses, c]);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedClasses.includes(c) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-indigo-200'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {selectedClasses.length === 0 && (
                    <p className="text-[9px] text-red-400 font-bold uppercase ml-2">Bitte mindestens eine Klasse wählen</p>
                  ) || (
                    <p className="text-[9px] text-emerald-500 font-bold uppercase ml-2">{selectedClasses.length} Klassen ausgewählt</p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Fach</label>
                <select 
                  value={newAssignment.subject}
                  onChange={e => setNewAssignment({...newAssignment, subject: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all appearance-none"
                >
                  <option value="">Fach wählen...</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Fällig am</label>
                <input 
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Quiz-Sprache</label>
                <select 
                  value={newAssignment.language}
                  onChange={e => setNewAssignment({...newAssignment, language: e.target.value as any})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all appearance-none"
                >
                  <option value="mixed">Gemischt (Deutsch/Arabisch)</option>
                  <option value="arabic">Nur Arabisch</option>
                  <option value="german">Nur Deutsch</option>
                </select>
              </div>

              {newAssignment.assignmentType === 'Reading' && (
                <>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Link zum Buch / Dokument</label>
                    <input 
                      type="url"
                      value={newAssignment.bookUrl}
                      onChange={e => setNewAssignment({...newAssignment, bookUrl: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Tägliches Leseziel (Minuten)</label>
                    <input 
                      type="number"
                      value={newAssignment.dailyTargetMinutes || 0}
                      onChange={e => setNewAssignment({...newAssignment, dailyTargetMinutes: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Von Seite</label>
                    <input 
                      type="number"
                      value={newAssignment.pagesFrom || 0}
                      onChange={e => setNewAssignment({...newAssignment, pagesFrom: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Bis Seite (Ziel)</label>
                    <input 
                      type="number"
                      value={newAssignment.pagesTo || 0}
                      onChange={e => setNewAssignment({...newAssignment, pagesTo: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </>
              )}
            </div>

            {/* AI QUIZ GENERATOR - Show if type is Quiz */}
            {newAssignment.assignmentType === 'Quiz' && (
              <>
                <div className="bg-indigo-50 p-8 rounded-[2rem] border-2 border-indigo-100 space-y-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="bg-indigo-600 p-2 rounded-xl">
                      <Book size={20} className="text-white" />
                    </div>
                    <h3 className="text-lg font-black uppercase text-indigo-900">Buch & Quiz-Quelle</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-2">Buch URL (PDF oder Webseite)</label>
                      <input 
                        type="url"
                        value={newAssignment.bookUrl}
                        onChange={e => {
                          setNewAssignment({...newAssignment, bookUrl: e.target.value});
                          setFileType('pdf'); // Default to pdf for URLs
                        }}
                        className="w-full bg-white border-2 border-indigo-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                        placeholder="https://example.com/buch.pdf"
                      />
                    </div>

                    <div className="relative py-2 flex items-center">
                      <div className="flex-grow border-t border-indigo-100"></div>
                      <span className="flex-shrink mx-4 text-[8px] font-black text-indigo-300 uppercase tracking-widest">ODER DATEI HOCHLADEN</span>
                      <div className="flex-grow border-t border-indigo-100"></div>
                    </div>

                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group ${newAssignment.bookUrl?.startsWith('data:') || newAssignment.bookUrl?.includes('attachments') ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-indigo-100 hover:bg-indigo-100/50 hover:border-indigo-300'}`}
                    >
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="application/pdf,image/*" />
                      {isUploading ? (
                        <div className="text-center space-y-2">
                          <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto" />
                          <p className="font-black text-[10px] uppercase text-indigo-950">Wird geladen: {uploadProgress}%</p>
                        </div>
                      ) : (
                        <>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner ${newAssignment.bookUrl?.startsWith('data:') || newAssignment.bookUrl?.includes('attachments') ? 'bg-emerald-500 text-white' : 'bg-indigo-50 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                            <FileUp size={20} />
                          </div>
                          <div className="text-center">
                            <p className={`text-[10px] font-black uppercase ${newAssignment.bookUrl?.startsWith('data:') || newAssignment.bookUrl?.includes('attachments') ? 'text-emerald-900' : 'text-indigo-400 group-hover:text-indigo-950'}`}>
                              {newAssignment.bookUrl?.startsWith('data:') || newAssignment.bookUrl?.includes('attachments') ? 'Datei bereit' : 'Datei vom Gerät wählen'}
                            </p>
                            <p className="text-[8px] font-bold text-indigo-300 mt-1">PDF oder Bild (Max 50MB)</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-2">Von Seite</label>
                  <input 
                    type="number"
                    value={newAssignment.pagesFrom || 0}
                    onChange={e => setNewAssignment({...newAssignment, pagesFrom: parseInt(e.target.value) || 0})}
                    className="w-full bg-white border-2 border-indigo-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-2">Bis Seite</label>
                  <input 
                    type="number"
                    value={newAssignment.pagesTo || 0}
                    onChange={e => setNewAssignment({...newAssignment, pagesTo: parseInt(e.target.value) || 0})}
                    className="w-full bg-white border-2 border-indigo-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating}
                  className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-4"
                >
                  {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  {isGenerating ? 'KI generiert Quiz...' : 'KI-Quiz generieren'}
                </button>
              </div>
            </div>
          </>)}

            <div className="pt-10 border-t border-gray-100 flex justify-end gap-6">
              <button 
                onClick={() => setActiveTab('list')}
                className="px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-400 hover:text-gray-600 transition-all"
              >
                Abbrechen
              </button>
              <div className="flex flex-col md:flex-row gap-4">
                {!isEditing && (
                  <button 
                    onClick={() => handleCreateAssignment(true)}
                    className="bg-white text-madrassah-950 border-2 border-madrassah-950 px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Erstellen & Weitere
                  </button>
                )}
                <button 
                  onClick={() => handleCreateAssignment(false)}
                  className="bg-madrassah-950 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-2xl"
                >
                  {isEditing ? 'Änderungen speichern' : 'Aufgabe freigeben'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MONITOR VIEW */}
      {activeTab === 'monitor' && selectedAssignment && (
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                <h2 className="text-2xl font-black uppercase italic">{selectedAssignment.title}</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Monitoring für Klasse {selectedAssignment.className}</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex gap-4">
                  <div className="bg-indigo-50 p-4 rounded-2xl text-center min-w-[100px]">
                    <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Schüler</p>
                    <p className="text-xl font-black text-indigo-600">{students.filter(s => s.className === selectedAssignment.className).length}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl text-center min-w-[100px]">
                    <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Erledigt</p>
                    <p className="text-xl font-black text-emerald-600">
                      {students.filter(s => s.className === selectedAssignment.className).filter(s => attempts.some(a => a.assignmentId === selectedAssignment.id && a.studentId === s.id && a.isPerfect)).length}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(`/#/homework/print/${selectedAssignment.id}`, '_blank')}
                  className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2"
                >
                  <Printer size={16} /> Bericht drucken
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Schüler</th>
                    <th className="text-left py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {selectedAssignment.assignmentType === 'Reading' ? 'Sitzungen' : 'Versuche'}
                    </th>
                    <th className="text-left py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {selectedAssignment.assignmentType === 'Reading' ? 'Gesamtzeit' : 'Bester Score'}
                    </th>
                    <th className="text-left py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                    <th className="text-right py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Bewertung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.filter(s => s.className === selectedAssignment.className).map(student => {
                    const studentAttempts = attempts.filter(a => a.assignmentId === selectedAssignment.id && a.studentId === student.id);
                    const bestAttempt = studentAttempts.sort((a, b) => b.scorePercent - a.scorePercent)[0];
                    const rating = ratings.find(r => r.assignmentId === selectedAssignment.id && r.studentId === student.id);
                    
                    return (
                      <tr key={student.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="py-6">
                          <p className="text-sm font-black uppercase">{student.firstName} {student.lastName}</p>
                        </td>
                        <td className="py-6">
                          <div className="flex gap-1">
                            {selectedAssignment.assignmentType === 'Reading' ? (
                              <div className="flex items-center gap-2">
                                <div className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg text-[10px] font-black">
                                  {studentAttempts.length}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Sitzungen</span>
                              </div>
                            ) : (
                              Array.from({length: selectedAssignment.maxAttempts}).map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i < studentAttempts.length ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-6">
                          {selectedAssignment.assignmentType === 'Reading' ? (
                            <div className="flex flex-col">
                              <span className={`text-sm font-black ${bestAttempt?.isPerfect ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {Math.floor(studentAttempts.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0) / 60)} Min
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">
                                Ziel: {selectedAssignment.dailyTargetMinutes} Min
                              </span>
                            </div>
                          ) : (
                            <span className={`text-sm font-black ${bestAttempt?.isPerfect ? 'text-emerald-600' : 'text-gray-900'}`}>
                              {bestAttempt ? `${bestAttempt.scorePercent}%` : '--'}
                            </span>
                          )}
                        </td>
                        <td className="py-6">
                          {bestAttempt?.isPerfect ? (
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">Erledigt</span>
                          ) : studentAttempts.length >= selectedAssignment.maxAttempts ? (
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">Max Versuche</span>
                          ) : (
                            <span className="bg-gray-50 text-gray-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase">Offen</span>
                          )}
                        </td>
                        <td className="py-6 text-right">
                          <div className="flex justify-end gap-2">
                            {['Sehr gut', 'Gut', 'Noch mal wiederholen'].map(r => (
                              <button 
                                key={r}
                                onClick={() => handleRateStudent(selectedAssignment.id, student.id, r as any)}
                                className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                                  rating?.rating === r 
                                    ? (r === 'Sehr gut' ? 'bg-emerald-600 text-white' : r === 'Gut' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white')
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DO VIEW (STUDENT QUIZ OR READING) */}
      {activeTab === 'do' && selectedAssignment && currentAttempt && (
        <div className="max-w-3xl mx-auto space-y-8">
          {!quizResult ? (
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-madrassah-950 p-8 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black uppercase italic">{selectedAssignment.title}</h2>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">
                    {selectedAssignment.assignmentType === 'Quiz' 
                      ? `Versuch ${currentAttempt.attemptNumber} von ${selectedAssignment.maxAttempts}`
                      : `Lese-Sitzung #${currentAttempt.attemptNumber}`}
                  </p>
                </div>
                {selectedAssignment.assignmentType === 'Quiz' && (
                  <div className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Frage {currentQuestionIndex + 1} / {questions.filter(q => q.assignmentId === selectedAssignment.id).length}
                  </div>
                )}
              </div>

              <div className="p-12">
                {selectedAssignment.assignmentType === 'Reading' ? (
                  <div className="space-y-10 text-center">
                    <div className="bg-indigo-50 p-10 rounded-[3rem] border-2 border-indigo-100 flex flex-col items-center gap-6">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl">
                        <BookOpen className="text-indigo-600" size={40} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase italic text-indigo-950">Lese-Modus Aktiv</h3>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-2">
                          Ziel: {selectedAssignment.dailyTargetMinutes} Minuten üben
                        </p>
                        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">
                          Seiten: {selectedAssignment.pagesFrom} bis {selectedAssignment.pagesTo}
                        </p>
                      </div>
                      
                      <div className="text-5xl font-black font-mono text-indigo-600 tracking-tighter">
                        {Math.floor(readingSeconds / 60).toString().padStart(2, '0')}:{(readingSeconds % 60).toString().padStart(2, '0')}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button 
                        onClick={() => selectedAssignment.bookUrl && window.open(selectedAssignment.bookUrl, '_blank')}
                        className="p-6 bg-white border-2 border-gray-100 rounded-2xl flex items-center gap-4 hover:border-indigo-200 transition-all text-left"
                      >
                        <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                          <ExternalLink size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase text-gray-400">Buch öffnen</p>
                          <p className="text-sm font-bold truncate">{selectedAssignment.bookUrl}</p>
                        </div>
                      </button>
                      
                      <button 
                        onClick={handleFinishReading}
                        className="p-6 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                      >
                        <Check size={24} />
                        <span className="font-black uppercase tracking-widest text-xs">Lesen beenden</span>
                      </button>
                    </div>
                    
                    <p className="text-[10px] text-gray-400 font-bold uppercase italic">
                      Hinweis: Der Timer läuft im Hintergrund weiter. Klicken Sie auf "Lesen beenden", wenn Sie fertig sind.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const assignmentQuestions = questions.filter(q => q.assignmentId === selectedAssignment.id);
                    const q = assignmentQuestions[currentQuestionIndex];
                    if (!q) return null;

                    return (
                      <div className="space-y-10">
                        <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-gray-100">
                          <h3 className="text-xl font-bold leading-relaxed">{q.questionText}</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {['A', 'B', 'C'].map(opt => {
                            const isSelected = studentAnswers[q.id] === opt;
                            return (
                              <button 
                                key={opt}
                                onClick={() => setStudentAnswers({...studentAnswers, [q.id]: opt as any})}
                                className={`p-6 rounded-2xl text-left flex items-center gap-6 transition-all border-2 ${
                                  isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl scale-[1.02]' : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
                                  {opt}
                                </div>
                                <span className="text-sm font-bold">{(q as any)[`option${opt}`]}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="pt-10 flex justify-between items-center">
                          <button 
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                            className="px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            Zurück
                          </button>
                          
                          {currentQuestionIndex < assignmentQuestions.length - 1 ? (
                            <button 
                              disabled={!studentAnswers[q.id]}
                              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                              className="bg-madrassah-950 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
                            >
                              Nächste Frage
                            </button>
                          ) : (
                            <button 
                              disabled={Object.keys(studentAnswers).length < assignmentQuestions.length}
                              onClick={handleSubmitQuiz}
                              className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-50"
                            >
                              Quiz abgeben
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] shadow-2xl p-16 text-center border border-gray-100 animate-in zoom-in-95 duration-500">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-10 ${quizResult.perfect ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {quizResult.perfect ? <CheckCircle2 size={64} /> : <Award size={64} />}
              </div>
              
              <h2 className="text-4xl font-black uppercase italic mb-4">
                {selectedAssignment.assignmentType === 'Reading' 
                  ? (quizResult.perfect ? 'Ziel erreicht!' : 'Sitzung beendet')
                  : (quizResult.perfect ? 'Hervorragend!' : 'Gut gemacht!')}
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest mb-10">
                {selectedAssignment.assignmentType === 'Reading'
                  ? `Du hast ${Math.floor(readingSeconds / 60)} Minuten und ${readingSeconds % 60} Sekunden geübt.`
                  : `Du hast ${quizResult.score}% der Fragen richtig beantwortet.`}
              </p>

              <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="bg-gray-50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-2">
                    {selectedAssignment.assignmentType === 'Reading' ? 'Sitzung' : 'Versuch'}
                  </p>
                  <p className="text-2xl font-black text-gray-900">{currentAttempt.attemptNumber}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Ergebnis</p>
                  <p className={`text-2xl font-black ${quizResult.perfect ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {selectedAssignment.assignmentType === 'Reading' 
                      ? (quizResult.perfect ? 'ZIEL ERREICHT' : 'TEILWEISE')
                      : `${quizResult.score}%`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {!quizResult.perfect && currentAttempt.attemptNumber! < selectedAssignment.maxAttempts && (
                  <button 
                    onClick={() => handleStartAttempt(selectedAssignment)}
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    <RefreshCw size={18} /> Nochmal versuchen
                  </button>
                )}
                <button 
                  onClick={() => {
                    setActiveTab('list');
                    setSelectedAssignment(null);
                    setQuizResult(null);
                  }}
                  className="w-full bg-madrassah-950 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl"
                >
                  Zurück zur Übersicht
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REPORTS VIEW */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-3 text-madrassah-950">
                <History className="text-amber-500" /> Archivierte Berichte
              </h2>
              
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                {isTeacher && (
                  <>
                    <div className="relative flex-1 md:flex-none">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text"
                        placeholder="Schüler suchen..."
                        value={reportFilterStudent}
                        onChange={e => setReportFilterStudent(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-bold focus:border-indigo-500 outline-none transition-all w-full"
                      />
                    </div>

                    <select 
                      value={reportFilterClass}
                      onChange={e => setReportFilterClass(e.target.value)}
                      className="px-6 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-bold focus:border-indigo-500 outline-none transition-all appearance-none"
                    >
                      <option value="">Alle Klassen</option>
                      {Array.from(new Set(students.map(s => s.className))).filter(Boolean).sort().map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </>
                )}
                
                <select 
                  value={reportFilterMonth}
                  onChange={e => setReportFilterMonth(e.target.value)}
                  className="px-6 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-bold focus:border-indigo-500 outline-none transition-all appearance-none"
                >
                  <option value="">Alle Monate</option>
                  {['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'].map((m, i) => (
                    <option key={m} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                  ))}
                </select>

                <select 
                  value={reportFilterYear}
                  onChange={e => setReportFilterYear(e.target.value)}
                  className="px-6 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-bold focus:border-indigo-500 outline-none transition-all appearance-none"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>

                <button 
                  onClick={() => {
                    const params = new URLSearchParams({
                      student: isStudent ? (students.find(s => s.id === user.id)?.firstName + ' ' + students.find(s => s.id === user.id)?.lastName) : reportFilterStudent,
                      class: isStudent ? (students.find(s => s.id === user.id)?.className || '') : reportFilterClass,
                      month: reportFilterMonth,
                      year: reportFilterYear,
                      studentId: isStudent ? user.id : ''
                    });
                    window.open(`/#/homework/reports/print?${params.toString()}`, '_blank');
                  }}
                  className="bg-madrassah-950 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2"
                >
                  <Eye size={16} /> Drucken
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Datum</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Aufgabe</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Fach</th>
                    {isTeacher && <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Schüler</th>}
                    <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Ergebnis</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Bewertung</th>
                    {isTeacher && <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Aktionen</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reports
                    .filter(r => {
                      const student = students.find(s => s.id === r.studentId);
                      const matchesUser = user.role === UserRole.PRINCIPAL || 
                                          r.studentId === user.id || 
                                          (isTeacher && student && user.assignedClasses?.includes(student.className));
                      
                      const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
                      const matchesStudent = studentName.includes(reportFilterStudent.toLowerCase());
                      const matchesClass = reportFilterClass === '' || (student && student.className === reportFilterClass);
                      
                      const date = new Date(r.completedAt);
                      const matchesMonth = reportFilterMonth === '' || (date.getMonth() + 1).toString().padStart(2, '0') === reportFilterMonth;
                      const matchesYear = reportFilterYear === '' || date.getFullYear().toString() === reportFilterYear;
                      
                      return matchesUser && matchesStudent && matchesClass && matchesMonth && matchesYear;
                    })
                    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                    .map(report => {
                      const student = students.find(s => s.id === report.studentId);
                      return (
                        <tr key={report.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 text-xs font-bold text-gray-500">
                            {new Date(report.completedAt).toLocaleDateString('de-DE')}
                          </td>
                          <td className="py-4">
                            <p className="text-sm font-black text-madrassah-950">{report.assignmentTitle}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">von {report.teacherName}</p>
                              {report.assignmentType === 'Reading' && report.timeSpentSeconds && (
                                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                  {Math.floor(report.timeSpentSeconds / 60)} Min
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                              {report.subject}
                            </span>
                          </td>
                          {isTeacher && (
                            <td className="py-4">
                              <p className="text-sm font-bold text-gray-900">{student ? `${student.firstName} ${student.lastName}` : 'Unbekannt'}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{student?.className}</p>
                            </td>
                          )}
                          <td className="py-4 text-center">
                            <span className={`text-sm font-black ${report.scorePercent >= 80 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                              {report.scorePercent}%
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${
                                report.rating === 'Sehr gut' ? 'text-emerald-600' : 
                                report.rating === 'Gut' ? 'text-blue-600' : 'text-amber-600'
                              }`}>
                                {report.rating}
                              </span>
                              {report.feedbackText && (
                                <p className="text-[10px] text-gray-400 italic line-clamp-1 group-hover:line-clamp-none transition-all">
                                  "{report.feedbackText}"
                                </p>
                              )}
                            </div>
                          </td>
                          {isTeacher && (
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => handleDeleteReport(report.id)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Bericht löschen"
                              >
                                <X size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  {reports.filter(r => {
                    const student = students.find(s => s.id === r.studentId);
                    const matchesUser = user.role === UserRole.PRINCIPAL || 
                                        r.studentId === user.id || 
                                        (isTeacher && student && user.assignedClasses?.includes(student.className));
                    
                    const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
                    const matchesStudent = studentName.includes(reportFilterStudent.toLowerCase());
                    const date = new Date(r.completedAt);
                    const matchesMonth = reportFilterMonth === '' || (date.getMonth() + 1).toString().padStart(2, '0') === reportFilterMonth;
                    const matchesYear = reportFilterYear === '' || date.getFullYear().toString() === reportFilterYear;
                    return matchesUser && matchesStudent && matchesMonth && matchesYear;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={isTeacher ? 7 : 5} className="py-12 text-center text-gray-400 italic text-sm">
                        Keine Berichte für die gewählten Filter gefunden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* GLOBAL QUIZ PREVIEW (Visible when questions are loaded) */}
      {previewQuestions.length > 0 && (
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between border-b border-gray-50 pb-6">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase italic text-gray-900">Quiz Vorschau</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{previewQuestions.length} Fragen geladen</p>
              </div>
            </div>
            <button 
              onClick={() => setPreviewQuestions([])} 
              className="bg-red-50 text-red-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
            >
              Schließen
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
            {previewQuestions.map((q, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 hover:border-indigo-200 transition-all group">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm border border-gray-100">
                    {i+1}
                  </div>
                  <p className="text-base font-bold text-gray-900 leading-relaxed">{q.questionText}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['A', 'B', 'C'].map(opt => (
                    <div key={opt} className={`p-4 rounded-2xl text-xs font-bold border-2 transition-all ${q.correctOption === opt ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100' : 'bg-white border-gray-100 text-gray-500'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${q.correctOption === opt ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {opt}
                        </span>
                        <span>{(q as any)[`option${opt}`]}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {q.explanation && (
                  <div className="mt-6 pt-6 border-t border-gray-100 flex items-start gap-3">
                    <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
                      <Info size={14} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 leading-relaxed italic">
                      <span className="font-black uppercase tracking-widest mr-2">Erklärung:</span>
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="bg-indigo-50 p-6 rounded-2xl flex items-center justify-center gap-4">
            <Sparkles size={20} className="text-indigo-600" />
            <p className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Diese Fragen wurden von der KI generiert und sind bereit zur Veröffentlichung.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkSystem;
