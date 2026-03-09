
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LogOut, UserCheck, Users, ClipboardCheck, 
  Euro, UserPlus, Hourglass, IdCard, Briefcase, 
  QrCode, FileText, LayoutDashboard, Book, RefreshCw, FileEdit, Award, MessageSquare, FolderOpen, Brain, GraduationCap as ExamIcon,
  BookOpen, Library
} from 'lucide-react';
import { 
  User, UserRole, Student, Grade, Attendance, ClassConfig, WaitlistEntry, ParticipationRecord, TeacherAttendance, Resource, QuizResult,
  HomeworkAssignment, HomeworkQuizQuestion, HomeworkAttempt, HomeworkAttemptAnswer, HomeworkTeacherRating, HomeworkReport, LibraryResource
} from './types';
import { supabase } from './lib/supabase';
import { getFamilyId } from './lib/studentUtils';

// Components
import Login from './components/Login';
import PrincipalDashboard from './components/PrincipalDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import HomeworkSystem from './components/HomeworkSystem';
import StudentRegistration from './components/StudentRegistration';
import StudentManagement from './components/StudentManagement';
import StudentListPrintView from './components/StudentListPrintView';
import UserManagement from './components/UserManagement';
import StaffPrintView from './components/StaffPrintView';
import FinanceManagement from './components/FinanceManagement';
import FinancePrintView from './components/FinancePrintView';
import FinanceManagementYearly from './components/FinanceManagementYearly';
import AttendanceTracker from './components/AttendanceTracker';
import AttendancePrintView from './components/AttendancePrintView';
import GradingSystem from './components/GradingSystem';
import ClassGradeRegisterPrintView from './components/ClassGradeRegisterPrintView';
import PunktetabellePrintView from './components/PunktetabellePrintView';
import ReportCard from './components/ReportCard';
import ReportManager from './components/ReportManager';
import WaitlistManagement from './components/WaitlistManagement';
import WaitlistPrintView from './components/WaitlistPrintView';
import IDCardSystem from './components/IDCardSystem';
import ClassWhatsAppManager from './components/ClassWhatsAppManager';
import DataUpdateForm from './components/DataUpdateForm';
import CertificateView from './components/CertificateView';
import CertificateManager from './components/CertificateManager';
import CurriculumPage from './components/CurriculumPage';
import TheoryManager from './components/TheoryManager';
import QuranPractice from './src/components/QuranPractice';
import PrintableRegistrationForm from './components/PrintableRegistrationForm';
import PublicEnrollmentForm from './components/PublicEnrollmentForm';
import WaitlistStatusCheck from './components/WaitlistStatusCheck';
import BlankRegistrationForm from './components/BlankRegistrationForm';
import HomeworkPrintView from './components/HomeworkPrintView';
import HomeworkReportsPrintView from './components/HomeworkReportsPrintView';
import CommunicationCenter from './components/CommunicationCenter';
import LibraryManager from './components/LibraryManager';
import LogoIcon from './components/LogoIcon';

const DEFAULT_ADMIN: User = { id: "admin-fixed", name: "Sarfraz Azmat Butt", role: UserRole.PRINCIPAL, password: "admin" };

const NavLinkItem: React.FC<{ to: string, icon: React.ReactNode, label: string, special?: boolean }> = ({ to, icon, label, special }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-500 group relative ${
        isActive 
          ? (special ? 'bg-amber-500 text-white shadow-lg' : 'bg-gold-400 text-madrassah-950 shadow-lg shadow-gold-400/20 scale-[1.02]')
          : (special ? 'text-amber-500 hover:bg-amber-500/10' : 'text-white hover:bg-white/10 hover:text-gold-400')
      }`}
    >
      {isActive && (
        <div className={`absolute left-0 w-1.5 h-6 rounded-r-full ${special ? 'bg-white' : 'bg-madrassah-950'}`}></div>
      )}
      <span className={`${isActive ? (special ? 'text-white' : 'text-madrassah-950') : (special ? 'text-amber-500' : 'text-white group-hover:scale-110 group-hover:text-gold-400')} transition-transform duration-300`}>
        {icon}
      </span>
      <span className={`text-[13px] font-black uppercase tracking-tight ${isActive ? (special ? 'text-white' : 'text-madrassah-950') : (special ? 'text-amber-500' : 'text-white group-hover:text-gold-400')}`}>
        {label}
      </span>
    </Link>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('huda_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [dbStudents, setDbStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([DEFAULT_ADMIN]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [tAttendance, setTAttendance] = useState<TeacherAttendance[]>([]);
  const [subjects] = useState<string[]>(['Quran', 'Tajweed', 'Hifz', 'Fiqh', 'Sierah', 'Arabisch', 'Arabisch Modul 1', 'Arabisch Modul 1', 'Arabisch Modul 3', 'Akhlaq', 'Hadieth', 'Usul-ul-Hadieth', 'Aqeedah', 'Usul-ul-Fiqh']);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [classConfigs, setClassConfigs] = useState<ClassConfig[]>([]);
  const [participation, setParticipation] = useState<ParticipationRecord[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [hwAssignments, setHwAssignments] = useState<HomeworkAssignment[]>([]);
  const [hwQuizQuestions, setHwQuizQuestions] = useState<HomeworkQuizQuestion[]>([]);
  const [hwAttempts, setHwAttempts] = useState<HomeworkAttempt[]>([]);
  const [hwAttemptAnswers, setHwAttemptAnswers] = useState<HomeworkAttemptAnswer[]>([]);
  const [hwTeacherRatings, setHwTeacherRatings] = useState<HomeworkTeacherRating[]>([]);
  const [hwReports, setHwReports] = useState<HomeworkReport[]>([]);
  const [libraryResources, setLibraryResources] = useState<LibraryResource[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const syncStatusRef = useRef(syncStatus);
  useEffect(() => { syncStatusRef.current = syncStatus; }, [syncStatus]);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchAllData = useCallback(async (quiet = false) => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      if (!quiet) alert("Supabase Zugangsdaten fehlen! Bitte setzen Sie VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in den AI Studio Umgebungsvariablen.");
      setSyncStatus('error');
      return;
    }
    if (!quiet && syncStatusRef.current === 'error') {
      if (!window.confirm("Es gab einen Fehler beim Speichern. Wenn Sie jetzt aktualisieren, könnten ungespeicherte Daten verloren gehen. Trotzdem fortfahren?")) return;
    }
    setSyncStatus('syncing');
    
    const timeoutPromise = new Promise<unknown>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout beim Laden der Daten")), 30000)
    );

    try {
      const fetchPromise = Promise.allSettled([
        supabase.from('students').select('*'),
        supabase.from('users').select('*'),
        supabase.from('grades').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('teacher_attendance').select('*'),
        supabase.from('waitlist').select('*'),
        supabase.from('class_configs').select('*'),
        supabase.from('participation_records').select('*'),
        supabase.from('resources').select('*'),
        supabase.from('homework_assignments').select('*'),
        supabase.from('homework_quiz_questions').select('*'),
        supabase.from('homework_attempts').select('*'),
        supabase.from('homework_attempt_answers').select('*'),
        supabase.from('homework_teacher_ratings').select('*'),
        supabase.from('homework_reports').select('*'),
        supabase.from('library_resources').select('*')
      ]);

      const results = (await Promise.race([fetchPromise, timeoutPromise])) as PromiseSettledResult<{ data: any; error: any }>[];

      const getData = (index: number) => {
        const res = results[index];
        if (res.status === 'fulfilled') {
          if (res.value.error) {
            console.error(`Error fetching index ${index}:`, res.value.error);
            return null;
          }
          return res.value.data;
        }
        return null;
      };

      const studentsData = getData(0);
      const usersDb = getData(1);
      const gradesDb = getData(2);
      const attendanceDb = getData(3);
      const tAttendanceDb = getData(4);
      const waitlistDb = getData(5);
      const configDb = getData(6);
      const partDb = getData(7);
      const resDb = getData(8);
      const hwAssignmentsDb = getData(9);
      const hwQuizQuestionsDb = getData(10);
      const hwAttemptsDb = getData(11);
      const hwAttemptAnswersDb = getData(12);
      const hwTeacherRatingsDb = getData(13);
      const hwReportsDb = getData(14);
      const libraryDb = getData(15);

      if (studentsData) setDbStudents(studentsData.map((s: Record<string, any>) => ({
        ...s,
        firstName: s.first_name,
        lastName: s.last_name,
        familyId: s.family_id,
        feesPaidMonthly: s.fees_paid_monthly || {},
        birthDate: s.birth_date,
        registrationDate: s.registration_date,
        className: s.class_name,
        lessonTimes: s.lesson_times,
        reportReleasedHalbjahr: s.report_released_halbjahr,
        reportReleasedAbschluss: s.report_released_abschluss,
        siblingsCount: s.siblings_count,
        paymentMethod: s.payment_method,
        accountHolder: s.account_holder,
        iban: s.iban
      })));
      
      if (usersDb) setUsers([DEFAULT_ADMIN, ...usersDb.filter((u: Record<string, any>) => u.id !== DEFAULT_ADMIN.id).map((u: Record<string, any>) => ({
        ...u,
        assignedClasses: u.assigned_classes,
        teacherTitle: u.teacher_title,
        firstName: u.first_name,
        lastName: u.last_name,
        birthDate: u.birth_date,
        salaryPaidMonthly: u.salary_paid_monthly || {},
        zoomUrl: u.zoom_url
      }))]);

      if (gradesDb) setGrades(gradesDb.map((g: Record<string, any>) => ({
        studentId: g.student_id,
        subject: g.subject,
        term: g.term,
        points: g.points,
        date: g.date
      })));

      if (attendanceDb) setAttendance(attendanceDb.map((a: Record<string, any>) => ({
        studentId: a.student_id,
        date: a.date,
        status: a.status || 'present'
      })));

      if (tAttendanceDb) setTAttendance(tAttendanceDb.map((t: Record<string, any>) => ({
        userId: t.user_id,
        date: t.date,
        status: t.status
      })));

      if (waitlistDb) setWaitlist(waitlistDb.map((w: Record<string, any>) => ({
        ...w,
        guardianName: w.guardian_name,
        preferredLanguage: w.preferred_language,
        appliedDate: w.applied_date,
        status: w.status,
        paymentConfirmed: w.payment_confirmed,
        paymentMethod: w.payment_method,
        participants: w.participants || []
      })));

      if (configDb) setClassConfigs(configDb.map((c: Record<string, any>) => ({
        className: c.class_name,
        whatsappLink: c.whatsapp_link,
        selectedSubjects: c.selected_subjects || [],
        updatedAt: c.updated_at
      })));

      if (partDb) setParticipation(partDb.map((p: Record<string, any>) => ({
        studentId: p.student_id,
        term: p.term,
        verhalten: p.verhalten,
        vortrag: p.vortrag,
        puenktlichkeit: p.puenktlichkeit,
        zusatzpunkte: p.zusatzpunkte,
        remarks: p.remarks
      })));




      if (resDb) setResources(resDb.map((r: Record<string, any>) => ({
        ...r,
        className: r.class_name,
        bookUrl: r.book_url,
        uploadedBy: r.uploaded_by,
        createdAt: r.created_at,
        quizData: r.quiz_data,
        lessons: r.lessons || [],
        quizAttempts: r.quiz_attempts || {},
        isMainBook: r.is_main_book,
        isUnlocked: r.is_unlocked,
        language: r.language || 'mixed'
      })));

      if (hwAssignmentsDb) setHwAssignments(hwAssignmentsDb.map((h: Record<string, any>) => ({
        id: h.id,
        className: h.class_name,
        subject: h.subject,
        teacherId: h.teacher_id,
        title: h.title,
        bookUrl: h.book_url,
        pagesFrom: h.pages_from,
        pagesTo: h.pages_to,
        maxAttempts: h.max_attempts,
        dailyTargetMinutes: h.daily_target_minutes,
        assignmentType: h.assignment_type || 'Quiz',
        dueDate: h.due_date,
        status: h.status,
        quizVersion: h.quiz_version,
        language: h.language || 'mixed',
        instructions: h.instructions || '',
        createdAt: h.created_at,
        errorLog: h.error_log
      })));

      if (hwQuizQuestionsDb) setHwQuizQuestions(hwQuizQuestionsDb.map((q: Record<string, any>) => ({
        id: q.id,
        assignmentId: q.assignment_id,
        questionText: q.question_text,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        correctOption: q.correct_option,
        explanation: q.explanation,
        sourceHint: q.source_hint
      })));

      if (hwAttemptsDb) setHwAttempts(hwAttemptsDb.map((a: Record<string, any>) => ({
        id: a.id,
        assignmentId: a.assignment_id,
        studentId: a.student_id,
        attemptNumber: a.attempt_number,
        scorePercent: a.score_percent,
        isPerfect: a.is_perfect,
        timeSpentSeconds: a.time_spent_seconds,
        startedAt: a.started_at,
        completedAt: a.completed_at
      })));

      if (hwAttemptAnswersDb) setHwAttemptAnswers(hwAttemptAnswersDb.map((a: Record<string, any>) => ({
        id: a.id,
        attemptId: a.attempt_id,
        questionId: a.question_id,
        selectedOption: a.selected_option,
        isCorrect: a.is_correct,
        answeredAt: a.answered_at
      })));

      if (hwTeacherRatingsDb) setHwTeacherRatings(hwTeacherRatingsDb.map((r: Record<string, any>) => ({
        id: r.id,
        assignmentId: r.assignment_id,
        studentId: r.student_id,
        rating: r.rating,
        feedbackText: r.feedback_text,
        ratedBy: r.rated_by,
        ratedAt: r.rated_at
      })));

      if (hwReportsDb) setHwReports(hwReportsDb.map((r: Record<string, any>) => ({
        id: r.id,
        studentId: r.student_id,
        assignmentTitle: r.assignment_title,
        subject: r.subject,
        teacherName: r.teacher_name,
        completedAt: r.completed_at,
        scorePercent: r.score_percent,
        assignmentType: r.assignment_type || 'Quiz',
        timeSpentSeconds: r.time_spent_seconds,
        rating: r.rating,
        feedbackText: r.feedback_text
      })));
      
      if (libraryDb) setLibraryResources(libraryDb.map((r: Record<string, any>) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        className: r.class_name,
        description: r.description,
        createdAt: r.created_at,
        createdBy: r.created_by
      })));

      const { data: qResults } = await supabase.from('quiz_results').select('*');
      if (qResults) setQuizResults(qResults.map(q => ({
        id: q.id,
        studentId: q.student_id,
        resourceId: q.resource_id,
        term: q.term || 'Halbjahr',
        score: q.score,
        maxScore: q.max_score,
        completedAt: q.completed_at
      })));

      setSyncStatus('idle');
      setLastSync(new Date().toLocaleTimeString('de-DE'));
    } catch (error: unknown) {
      console.error("Fetch error:", error);
      setSyncStatus('error');
      if (!quiet) alert(`Fehler beim Laden der Daten: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [syncStatusRef]);

  useEffect(() => {
    const init = async () => {
      await fetchAllData(true);
    };
    init();
  }, [fetchAllData]);



  const syncToSupabase = useCallback(async (table: string, items: unknown[], onConflict?: string) => {
    if (items.length === 0) return true;
    
    // Create a timeout promise to prevent hanging forever
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout: Der Cloud-Abgleich dauert zu lange. Bitte prüfen Sie Ihre Internetverbindung.")), 30000); // 30s timeout
    });

    try {
      const syncPromise = (async () => {
        const { error } = await supabase.from(table).upsert(items, onConflict ? { onConflict } : undefined);
        if (error) {
          console.error(`Supabase Error in ${table}:`, error);
          if (error.code === '42P01') {
             alert(`Kritischer Fehler: Die Tabelle "${table}" wurde in Supabase nicht gefunden. Haben Sie das SQL-Skript im Supabase SQL Editor ausgeführt?`);
          } else if (error.code === 'PGRST111') {
             alert("Supabase Fehler: API Key oder URL ist ungültig. Bitte prüfen Sie die Umgebungsvariablen in AI Studio.");
          } else if (error.code === '23502') {
             alert(`Datenbank-Struktur veraltet: Die Tabelle "${table}" erwartet ein Feld, das in der aktuellen App-Version nicht mehr existiert. Bitte führen Sie das SQL-Fix-Skript aus.`);
          } else if (error.code === '42703') {
             alert(`Datenbank-Fehler: Eine Spalte in der Tabelle "${table}" wurde nicht gefunden. Haben Sie das neueste SQL-Skript (inkl. "lessons" Spalte) in Supabase ausgeführt?`);
          } else {
             alert(`Fehler beim Speichern in Tabelle "${table}": ${error.message}`);
          }
          return false;
        }
        return true;
      })();

      return await Promise.race([syncPromise, timeoutPromise]);
    } catch (e: unknown) {
      console.error(`Exception in syncToSupabase (${table}):`, e);
      alert(e instanceof Error ? e.message : "Unbekannter Fehler beim Cloud-Abgleich.");
      return false;
    }
  }, []);


  const saveResources = async (list: Resource[], itemsToSync?: Resource[], itemToDelete?: Resource) => {
    setResources(list);
    setSyncStatus('syncing');
    
    try {
      if (itemToDelete) {
        const { error } = await supabase.from('resources').delete().eq('id', itemToDelete.id);
        if (error) {
          console.error("Fehler beim Löschen der Ressource:", error);
          setSyncStatus('error');
          return false;
        }
      }

      const toSync = itemsToSync || list;
      if (toSync.length > 0) {
        const result = await syncToSupabase('resources', toSync.map(r => ({
          id: r.id,
          title: r.title,
          type: r.type,
          url: r.url,
          book_url: r.bookUrl,
          class_name: r.className,
          subject: r.subject,
          uploaded_by: r.uploadedBy,
          created_at: r.createdAt,
          quiz_data: r.quizData || [],
          lessons: r.lessons || [],
          quiz_attempts: r.quizAttempts || {},
          is_main_book: r.isMainBook || false,
          is_unlocked: r.isUnlocked || false,
          language: r.language || 'mixed'
        })), 'id');

        if (!result) {
          setSyncStatus('error');
          return false;
        }
      }

      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
      return true;
    } catch (e) {
      console.error("saveResources error:", e);
      setSyncStatus('error');
      return false;
    }
  };

  const saveQuizResult = async (result: QuizResult) => {
    setQuizResults(prev => [...prev.filter(r => r.id !== result.id), result]);
    setSyncStatus('syncing');
    const success = await syncToSupabase('quiz_results', [{
      id: result.id,
      student_id: result.studentId,
      resource_id: result.resourceId,
      term: result.term,
      score: result.score,
      max_score: result.maxScore,
      completed_at: result.completedAt
    }]);
    
    if (success) {
      setSyncStatus('idle');
      
      // AUTOMATION: Recalculate and update the grade in the Zeugnis
      const resource = resources.find(r => r.id === result.resourceId);
      if (resource) {
        // We need to know which term this result belongs to. 
        // Since QuizResult doesn't have term, we'll assume the current term or fetch it.
        // For simplicity, let's update for both terms if needed, or just Halbjahr as default.
        // Actually, TheoryQuiz should probably pass the term.
      }
    } else {
      setSyncStatus('error');
    }
    return success;
  };

  const updateAutomatedGrade = async (studentId: string, subject: string, term: 'Halbjahr' | 'Abschluss') => {
    const { total } = calculateSubjectGrade(studentId, subject, term);
    
    const newGrade: Grade = {
      studentId,
      subject,
      term,
      points: total,
      date: new Date().toISOString().split('T')[0]
    };

    const filtered = grades.filter(g => !(g.studentId === studentId && g.subject === subject && g.term === term));
    await saveGrades([...filtered, newGrade], [newGrade]);
  };

  const calculateSubjectGrade = (studentId: string, subject: string, term: 'Halbjahr' | 'Abschluss') => {
    // Find the Main Book for this subject
    const mainBook = resources.find(r => r.subject === subject && r.isMainBook);
    
    // Find Main Book result for this specific term
    let baseScore = 0;
    if (mainBook) {
      const mainResult = quizResults.find(r => r.studentId === studentId && r.resourceId === mainBook.id && r.term === term);
      if (mainResult) {
        // Scale score to 20 points
        baseScore = Math.round((mainResult.score / mainResult.maxScore) * 20);
      }
    }

    // Find all other quiz results for this subject (Voluntary books) for this term
    const voluntaryResults = quizResults.filter(r => 
      r.studentId === studentId && 
      r.term === term &&
      r.resourceId !== mainBook?.id &&
      resources.find(res => res.id === r.resourceId && res.subject === subject)
    );

    // Calculate bonus: each passed voluntary quiz adds some points?
    // User said: "bis zum höchstens 5 punkte auf stocken"
    // Let's say each voluntary quiz passed (score > 50%) adds 1 point, up to 5.
    let bonus = 0;
    voluntaryResults.forEach(r => {
      if (r.score / r.maxScore >= 0.5) {
        bonus += 1;
      }
    });
    bonus = Math.min(5, bonus);

    const total = Math.min(20, baseScore + bonus);
    return { total, hasBonus: bonus > 0, isMaxed: baseScore === 20 && bonus > 0 };
  };

  const handleLogout = () => {
    localStorage.removeItem('huda_user');
    setCurrentUser(null);
  };

  const isAdminUser = currentUser?.role === UserRole.PRINCIPAL;
  const isTeacherUser = currentUser?.role === UserRole.TEACHER;
  const isStudentUser = currentUser?.role === UserRole.STUDENT;

  // --- SICHERES LÖSCHEN ---

  const handleDeleteStudent = async (id: string) => {
    setDbStudents(prev => prev.filter(s => s.id !== id));
    
    // Delete related records first to avoid foreign key constraint errors
    await supabase.from('attendance').delete().eq('student_id', id);
    await supabase.from('grades').delete().eq('student_id', id);
    await supabase.from('participation_records').delete().eq('student_id', id);
    await supabase.from('homework_submissions').delete().eq('student_id', id);
    await supabase.from('quiz_results').delete().eq('student_id', id);
    
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      console.error("Fehler beim Löschen des Schülers:", error);
      fetchAllData(true); // Liste bei Fehler wiederherstellen
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === "admin-fixed") return;
    setUsers(prev => prev.filter(u => u.id !== id));
    
    // Delete related records first
    await supabase.from('teacher_attendance').delete().eq('user_id', id);
    // Note: We might want to keep homework but it might cause issues if created_by is a foreign key
    // For now, let's assume we want to clean up.
    
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error("Fehler beim Löschen des Benutzers:", error);
      fetchAllData(true);
    }
  };


  // --- SPEICHERN ---

  const saveStudents = async (list: Student[], itemsToSync?: Student[]) => {
    // Apply family grouping logic to all students being saved
    const processedList = list.map(s => ({
      ...s,
      familyId: getFamilyId(s)
    }));
    
    const processedToSync = (itemsToSync || list).map(s => ({
      ...s,
      familyId: getFamilyId(s)
    }));

    setDbStudents(processedList);
    setSyncStatus('syncing');
    
    const result = await syncToSupabase('students', processedToSync.map(s => {
      // Validierung des Geburtsdatums, um SQL-Fehler zu vermeiden
      let validBirthDate = s.birthDate;
      if (validBirthDate && !/^\d{4}-\d{2}-\d{2}$/.test(validBirthDate)) {
        console.warn(`Ungültiges Geburtsdatum für ${s.firstName}: ${validBirthDate}. Setze auf Standard.`);
        validBirthDate = '2000-01-01'; 
      }

      return {
        id: s.id,
        family_id: s.familyId,
        first_name: s.firstName,
        last_name: s.lastName,
        gender: s.gender,
        birth_date: validBirthDate,
        class_name: s.className,
        guardian: s.guardian,
        address: s.address,
        whatsapp: s.whatsapp,
        lesson_times: s.lessonTimes,
        registration_date: s.registrationDate,
        status: s.status,
        fees_paid_monthly: s.feesPaidMonthly || {},
        report_released_halbjahr: s.reportReleasedHalbjahr || false,
        report_released_abschluss: s.reportReleasedAbschluss || false,
        siblings_count: s.siblingsCount,
        payment_method: s.paymentMethod,
        account_holder: s.accountHolder,
        iban: s.iban
      };
    }), 'id');
    
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
      alert("Fehler beim Speichern in der Cloud. Bitte prüfen Sie Ihre Internetverbindung.");
    }
    return result;
  };

  const saveUsers = async (list: User[], itemsToSync?: User[]) => {
    setUsers(list);
    setSyncStatus('syncing');
    const toSync = (itemsToSync || list).filter(u => u.id !== "admin-fixed");
    const result = await syncToSupabase('users', toSync.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      password: u.password,
      whatsapp: u.whatsapp,
      assigned_classes: u.assignedClasses,
      teacher_title: u.teacherTitle,
      first_name: u.firstName,
      last_name: u.lastName,
      birth_date: u.birthDate,
      gender: u.gender,
      salary_paid_monthly: u.salaryPaidMonthly || {},
      zoom_url: u.zoomUrl
    })), 'id');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  };

  const saveAttendance = async (list: Attendance[], itemsToSync?: Attendance[], itemToDelete?: Attendance) => {
    setAttendance(list);
    setSyncStatus('syncing');
    
    if (itemToDelete) {
      const { error } = await supabase.from('attendance')
        .delete()
        .eq('student_id', itemToDelete.studentId)
        .eq('date', itemToDelete.date);
      if (error) {
        console.error("Fehler beim Löschen der Anwesenheit:", error);
        setSyncStatus('error');
        return false;
      }
    }

    if (itemsToSync && itemsToSync.length > 0) {
      const result = await syncToSupabase('attendance', itemsToSync.map(a => ({
        student_id: a.studentId,
        date: a.date,
        status: a.status
      })), 'student_id,date');
      
      if (!result) {
        setSyncStatus('error');
        return false;
      }
    }

    setLastSync(new Date().toLocaleTimeString('de-DE'));
    setSyncStatus('idle');
    return true;
  };

  const saveGrades = async (list: Grade[], itemsToSync?: Grade[]) => {
    setGrades(list);
    setSyncStatus('syncing');
    const toSync = itemsToSync || list;
    const result = await syncToSupabase('grades', toSync.map(g => ({
      student_id: g.studentId,
      subject: g.subject,
      term: g.term,
      points: g.points,
      date: g.date
    })), 'student_id,subject,term');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  };

  const saveWaitlist = async (list: WaitlistEntry[], itemsToSync?: WaitlistEntry[]) => {
    setWaitlist(list);
    setSyncStatus('syncing');
    const toSync = itemsToSync || list;
    const result = await syncToSupabase('waitlist', toSync.map(w => ({
      id: w.id,
      type: w.type,
      guardian_name: w.guardianName,
      whatsapp: w.whatsapp,
      email: w.email,
      address: w.address,
      preferred_language: w.preferredLanguage,
      applied_date: w.appliedDate,
      status: w.status,
      payment_confirmed: w.paymentConfirmed,
      payment_method: w.paymentMethod,
      participants: w.participants
    })), 'id');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  };


  const saveHwAssignments = useCallback(async (list: HomeworkAssignment[], itemsToSync?: HomeworkAssignment[]) => {
    setHwAssignments(list);
    setSyncStatus('syncing');
    const toSync = itemsToSync || list;
    const result = await syncToSupabase('homework_assignments', toSync.map(h => ({
      id: h.id,
      class_name: h.className || 'Alle',
      subject: h.subject || 'Allgemein',
      teacher_id: h.teacherId,
      title: h.title || 'Unbenannt',
      book_url: h.bookUrl || '',
      pages_from: h.pagesFrom || 1,
      pages_to: h.pagesTo || 1,
      max_attempts: h.maxAttempts || 5,
      daily_target_minutes: h.dailyTargetMinutes || 0,
      assignment_type: h.assignmentType || 'Quiz',
      due_date: h.dueDate,
      status: h.status || 'Draft',
      quiz_version: h.quizVersion || 1,
      language: h.language || 'mixed',
      instructions: h.instructions || '',
      created_at: h.createdAt || new Date().toISOString(),
      error_log: h.errorLog
    })), 'id');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  }, [syncToSupabase]);

  const saveHwQuizQuestions = useCallback(async (list: HomeworkQuizQuestion[], itemsToSync?: HomeworkQuizQuestion[]) => {
    setHwQuizQuestions(list);
    setSyncStatus('syncing');
    const toSync = itemsToSync || list;
    const result = await syncToSupabase('homework_quiz_questions', toSync.map(q => ({
      id: q.id,
      assignment_id: q.assignmentId,
      question_text: q.questionText,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      correct_option: q.correctOption,
      explanation: q.explanation,
      source_hint: q.sourceHint
    })), 'id');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  }, [syncToSupabase]);

  const saveHwAttempts = async (list: HomeworkAttempt[], itemsToSync?: HomeworkAttempt[]) => {
    setHwAttempts(list);
    setSyncStatus('syncing');
    const toSync = itemsToSync || list;
    const result = await syncToSupabase('homework_attempts', toSync.map(a => ({
      id: a.id,
      assignment_id: a.assignmentId,
      student_id: a.studentId,
      attempt_number: a.attemptNumber,
      score_percent: a.scorePercent,
      is_perfect: a.isPerfect,
      time_spent_seconds: a.timeSpentSeconds || 0,
      started_at: a.startedAt,
      completed_at: a.completedAt
    })), 'id');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  };

  const saveHwAttemptAnswers = async (list: HomeworkAttemptAnswer[], itemsToSync?: HomeworkAttemptAnswer[]) => {
    setHwAttemptAnswers(list);
    setSyncStatus('syncing');
    const toSync = itemsToSync || list;
    const result = await syncToSupabase('homework_attempt_answers', toSync.map(a => ({
      id: a.id,
      attempt_id: a.attemptId,
      question_id: a.questionId,
      selected_option: a.selectedOption,
      is_correct: a.isCorrect,
      answered_at: a.answeredAt
    })), 'id');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  };

  const saveHwTeacherRatings = async (list: HomeworkTeacherRating[], itemsToSync?: HomeworkTeacherRating[]) => {
    setHwTeacherRatings(list);
    setSyncStatus('syncing');
    const toSync = itemsToSync || list;
    const result = await syncToSupabase('homework_teacher_ratings', toSync.map(r => ({
      id: r.id,
      assignment_id: r.assignmentId,
      student_id: r.studentId,
      rating: r.rating,
      feedback_text: r.feedbackText,
      rated_by: r.ratedBy,
      rated_at: r.ratedAt
    })), 'id');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  };

  const saveHwReports = async (list: HomeworkReport[], itemsToSync?: HomeworkReport[]) => {
    setHwReports(list);
    setSyncStatus('syncing');
    const toSync = itemsToSync || list;
    const result = await syncToSupabase('homework_reports', toSync.map(r => ({
      id: r.id,
      student_id: r.studentId,
      assignment_title: r.assignmentTitle,
      subject: r.subject,
      teacher_name: r.teacherName,
      completed_at: r.completedAt,
      score_percent: r.scorePercent,
      assignment_type: r.assignmentType || 'Quiz',
      time_spent_seconds: r.timeSpentSeconds || 0,
      rating: r.rating,
      feedback_text: r.feedbackText
    })), 'id');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  };

  const saveClassConfigs = async (list: ClassConfig[], itemsToSync?: ClassConfig[]) => {
    setClassConfigs(list);
    setSyncStatus('syncing');
    const toSync = itemsToSync || list;
    const result = await syncToSupabase('class_configs', toSync.map(c => ({
      class_name: c.className,
      whatsapp_link: c.whatsappLink,
      selected_subjects: c.selectedSubjects || [],
      updated_at: c.updatedAt
    })), 'class_name');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  };

  const saveLibraryResources = async (list: LibraryResource[]) => {
    setLibraryResources(list);
    setSyncStatus('syncing');
    const result = await syncToSupabase('library_resources', list.map(r => ({
      id: r.id,
      title: r.title,
      url: r.url,
      class_name: r.className,
      description: r.description,
      created_at: r.createdAt,
      created_by: r.createdBy
    })), 'id');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  };

  const saveTeacherAttendance = async (list: TeacherAttendance[], itemsToSync?: TeacherAttendance[], itemToDelete?: TeacherAttendance) => {
    setTAttendance(list);
    setSyncStatus('syncing');

    if (itemToDelete) {
      const { error } = await supabase.from('teacher_attendance')
        .delete()
        .eq('user_id', itemToDelete.userId)
        .eq('date', itemToDelete.date);
      if (error) {
        console.error("Fehler beim Löschen der Lehrer-Anwesenheit:", error);
        setSyncStatus('error');
        return false;
      }
    }

    const toSync = itemsToSync || list;
    if (toSync.length > 0) {
      const result = await syncToSupabase('teacher_attendance', toSync.map(ta => ({
        user_id: ta.userId,
        date: ta.date,
        status: ta.status
      })), 'user_id,date');
      
      if (!result) {
        setSyncStatus('error');
        return false;
      }
    }

    setLastSync(new Date().toLocaleTimeString('de-DE'));
    setSyncStatus('idle');
    return true;
  };

  const saveParticipation = async (list: ParticipationRecord[], itemsToSync?: ParticipationRecord[]) => {
    setParticipation(list);
    setSyncStatus('syncing');
    const toSync = itemsToSync || list;
    const result = await syncToSupabase('participation_records', toSync.map(pr => ({
      student_id: pr.studentId,
      term: pr.term,
      verhalten: pr.verhalten,
      vortrag: pr.vortrag,
      puenktlichkeit: pr.puenktlichkeit,
      zusatzpunkte: pr.zusatzpunkte,
      remarks: pr.remarks
    })), 'student_id,term');
    if (result) {
      setLastSync(new Date().toLocaleTimeString('de-DE'));
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }
    return result;
  };

  // Seed the requested assignment if it doesn't exist
  useEffect(() => {
    const seedAssignment = async () => {
      // Wait for initial load
      if (syncStatus === 'idle' && hwAssignments.length > 0 && !hwAssignments.find(a => a.title === 'Introduction to Fiqh Al-Malaikah')) {
        const assignmentId = crypto.randomUUID();
        const nextMonday = '2026-03-09';
        
        const newAssignment: HomeworkAssignment = {
          id: assignmentId,
          title: 'Introduction to Fiqh Al-Malaikah',
          className: 'J-Imam',
          subject: 'Fiqh',
          assignmentType: 'Quiz',
          dueDate: nextMonday,
          status: 'Assigned',
          teacherId: DEFAULT_ADMIN.id,
          createdAt: new Date().toISOString(),
          maxAttempts: 5,
          dailyTargetMinutes: 30,
          quizVersion: 1,
          language: 'mixed'
        };

        const questions: HomeworkQuizQuestion[] = [
          { id: crypto.randomUUID(), assignmentId, questionText: "Woraus wurden die Engel (Malaikah) erschaffen?", optionA: "Feuer", optionB: "Licht (Noor)", optionC: "Erde", correctOption: "B", explanation: "Engel wurden aus Licht erschaffen, während Jinn aus Feuer und Menschen aus Erde erschaffen wurden.", sourceHint: "Allgemeines Fiqh-Wissen" },
          { id: crypto.randomUUID(), assignmentId, questionText: "Besitzen Engel einen freien Willen wie Menschen?", optionA: "Ja", optionB: "Nein, sie gehorchen Allah stets", optionC: "Nur die Erzengel", correctOption: "B", explanation: "Engel haben keinen freien Willen; sie führen die Befehle Allahs ohne Zögern aus.", sourceHint: "Sure At-Tahrim 66:6" },
          { id: crypto.randomUUID(), assignmentId, questionText: "Welcher Engel ist für die Übermittlung der Offenbarung (Wahy) zuständig?", optionA: "Mikail", optionB: "Israfil", optionC: "Jibreel", correctOption: "C", explanation: "Jibreel (Gabriel) ist der Engel der Offenbarung.", sourceHint: "Allgemeines Fiqh-Wissen" },
          { id: crypto.randomUUID(), assignmentId, questionText: "Welcher Engel ist für den Regen und die Versorgung (Rizq) verantwortlich?", optionA: "Mikail", optionB: "Malik", optionC: "Azrael", correctOption: "A", explanation: "Mikail ist für Naturphänomene wie Regen und Pflanzenwachstum zuständig.", sourceHint: "Allgemeines Fiqh-Wissen" },
          { id: crypto.randomUUID(), assignmentId, questionText: "Wie heißt der Engel, der am Tag des Jüngsten Gerichts in das Horn (Sur) blasen wird?", optionA: "Jibreel", optionB: "Israfil", optionC: "Munkar", correctOption: "B", explanation: "Israfil wird zweimal in das Horn blasen: einmal zum Ende der Welt und einmal zur Auferstehung.", sourceHint: "Allgemeines Fiqh-Wissen" },
          { id: crypto.randomUUID(), assignmentId, questionText: "Wie werden die beiden Engel genannt, die die Taten der Menschen aufzeichnen?", optionA: "Munkar & Nakir", optionB: "Harut & Marut", optionC: "Kiraman Katibin", correctOption: "C", explanation: "Die 'edlen Schreiber' zeichnen jede gute und schlechte Tat auf.", sourceHint: "Sure Al-Infitar 82:10-11" },
          { id: crypto.randomUUID(), assignmentId, questionText: "Welche Engel befragen den Verstorbenen im Grab?", optionA: "Munkar & Nakir", optionB: "Jibreel & Mikail", optionC: "Malik & Ridwan", correctOption: "A", explanation: "Munkar und Nakir stellen im Grab die drei Fragen: Wer ist dein Herr? Was ist deine Religion? Wer ist dein Prophet?", sourceHint: "Hadith-Literatur" },
          { id: crypto.randomUUID(), assignmentId, questionText: "Wer ist der Wächter des Paradieses (Jannah)?", optionA: "Malik", optionB: "Ridwan", optionC: "Israfil", correctOption: "B", explanation: "Ridwan ist der Name des Hauptwächters des Paradieses.", sourceHint: "Islamische Tradition" },
          { id: crypto.randomUUID(), assignmentId, questionText: "Wer ist der Wächter der Hölle (Jahannam)?", optionA: "Malik", optionB: "Iblis", optionC: "Munkar", correctOption: "A", explanation: "Malik ist der Engel, der über die Hölle wacht.", sourceHint: "Sure Az-Zukhruf 43:77" },
          { id: crypto.randomUUID(), assignmentId, questionText: "Gibt es Engel, die die Menschen beschützen?", optionA: "Nein", optionB: "Ja, die Al-Mu'aqqibat", optionC: "Nur Propheten haben Schutzengel", correctOption: "B", explanation: "Es gibt Engel, die den Menschen von vorne und hinten auf Befehl Allahs beschützen.", sourceHint: "Sure Ar-Ra'd 13:11" }
        ];

        await saveHwAssignments([...hwAssignments, newAssignment], [newAssignment]);
        await saveHwQuizQuestions([...hwQuizQuestions, ...questions], questions);
      }
    };
    
    seedAssignment();
  }, [syncStatus, hwAssignments, hwQuizQuestions, saveHwAssignments, saveHwQuizQuestions]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/portal" element={
          <div className="min-h-screen bg-[#fafafa] islamic-pattern p-6 md:p-12">
            <DataUpdateForm students={dbStudents} onUpdateStudents={(list) => saveStudents(dbStudents.map(s => list.find(l => l.id === s.id) || s), list)} isPublic />
          </div>
        } />
        <Route path="/enroll" element={<PublicEnrollmentForm onAdd={(entry: WaitlistEntry) => saveWaitlist([...waitlist, entry])} waitlist={waitlist} />} />
        <Route path="/status" element={<WaitlistStatusCheck waitlist={waitlist} />} />

        {!currentUser ? (
          <Route path="*" element={<Login onLogin={(u) => { setCurrentUser(u); localStorage.setItem('huda_user', JSON.stringify(u)); }} />} />
        ) : (
          <Route path="*" element={
            <div className="min-h-screen bg-madrassah-950 flex flex-col md:flex-row font-sans">
              <aside className="no-print w-full md:w-72 bg-madrassah-950 text-white flex flex-col shrink-0 border-r border-white/5 h-screen sticky top-0 overflow-y-auto custom-scrollbar relative">
                <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none"></div>
                <div className="p-8 border-b border-white/10 flex flex-col items-center bg-madrassah-950 sticky top-0 z-20 shadow-lg shadow-black/20">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 p-3 text-madrassah-950 shadow-2xl shadow-black/40">
                      <LogoIcon className="w-10 h-10" />
                   </div>
                   <h1 className="text-gold-400 font-black tracking-tighter uppercase italic text-xl text-center">Madrassah Al-Huda</h1>
                   <p className="text-white font-bold uppercase text-[8px] tracking-[0.4em] mt-2 italic">Zentralverwaltung</p>
                </div>
                
                <nav className="flex-1 px-4 py-6 space-y-8 relative z-10">
                  <div className="space-y-1">
                    <p className="text-gold-400 text-[10px] font-black uppercase tracking-widest px-4 mb-2">Übersicht</p>
                    <NavLinkItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-gold-400 text-[10px] font-black uppercase tracking-widest px-4 mb-2">Lehre & Noten</p>
                    <NavLinkItem to="/attendance" icon={<UserCheck size={18} />} label="Anwesenheit" />
                    <NavLinkItem to="/homework" icon={<Book size={18} />} label="Hausaufgaben" />
                    {!isStudentUser && <NavLinkItem to="/grades" icon={<ClipboardCheck size={18} />} label="Noten-Matrix" />}
                    <NavLinkItem to="/reports" icon={<FileText size={18} />} label="Zeugnis-Zentrale" />
                    {!isStudentUser && <NavLinkItem to="/certificates" icon={<Award size={18} />} label="Urkunden-Hub" special={true} />}
                    <NavLinkItem to="/curriculum" icon={<FolderOpen size={18} />} label="Lehrplan" />
                    <NavLinkItem to="/quran-practice" icon={<BookOpen size={18} />} label="Quran Üben" />
                    {!isStudentUser && <NavLinkItem to="/theory-manage" icon={<Book size={18} />} label="Theorie-Verwaltung" />}
                    {isStudentUser && <NavLinkItem to="/theory" icon={<Brain size={18} />} label="Theorie & Üben" />}
                    {isStudentUser && <NavLinkItem to="/exams" icon={<ExamIcon size={18} />} label="Prüfungen" />}
                  </div>

                  <div className="space-y-1">
                    <p className="text-gold-400 text-[10px] font-black uppercase tracking-widest px-4 mb-2">Management</p>
                    {isAdminUser && <NavLinkItem to="/students" icon={<Users size={18} />} label="Schüler-Liste" />}
                    {isAdminUser && <NavLinkItem to="/register-student" icon={<UserPlus size={18} />} label="Neuaufnahme" />}
                    {isAdminUser && <NavLinkItem to="/waitlist" icon={<Hourglass size={18} />} label="Warteliste" />}
                    <NavLinkItem to="/id-cards" icon={<IdCard size={18} />} label="ID-Ausweise" />
                    {isAdminUser && <NavLinkItem to="/library" icon={<Library size={18} />} label="Lehrer-Bibliothek" />}
                    {isAdminUser && <NavLinkItem to="/communication" icon={<MessageSquare size={18} />} label="Info-Zentrale" />}
                  </div>

                  {!isStudentUser && (
                    <div className="space-y-1">
                      <p className="text-gold-400 text-[10px] font-black uppercase tracking-widest px-4 mb-2">Konfig</p>
                      <NavLinkItem to="/whatsapp-qr" icon={<QrCode size={18} />} label="WhatsApp-QR" />
                      <NavLinkItem to="/update-data" icon={<FileEdit size={18} />} label="Daten-Portal" />
                    </div>
                  )}

                  {isAdminUser && (
                    <div className="space-y-1">
                      <p className="text-gold-400 text-[10px] font-black uppercase tracking-widest px-4 mb-2">Personal</p>
                      <NavLinkItem to="/users" icon={<Briefcase size={18} />} label="Personalakte" />
                      <NavLinkItem to="/finance" icon={<Euro size={18} />} label="Buchhaltung" />
                    </div>
                  )}
                </nav>

                <div className="p-6 border-t border-white/5 mt-auto flex flex-col gap-4 relative z-10 bg-madrassah-950/80 backdrop-blur-md">
                  <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${syncStatus === 'idle' ? 'bg-emerald-50 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : syncStatus === 'syncing' ? 'bg-gold-50 animate-pulse' : 'bg-red-50 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Cloud</span>
                     </div>
                     <span className="text-[8px] font-bold text-white/50 uppercase">{lastSync || '--:--'}</span>
                  </div>

                  <button onClick={() => fetchAllData(false)} className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-white/5 text-white text-[10px] font-black uppercase border border-white/10 hover:bg-white/10 hover:text-gold-400 transition-all">
                    <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} /> Cloud Abgleich
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-red-600/10 text-red-500 text-[10px] font-black uppercase border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-600/10">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </aside>

              <main className="flex-1 overflow-y-auto bg-[#fafafa] md:rounded-l-[4rem] shadow-2xl relative z-10 islamic-pattern">
                <div className="p-6 md:p-12 min-h-screen">
                  <Routes>
                    <Route path="/" element={
                      isAdminUser ? (
                        <PrincipalDashboard students={dbStudents} users={users} waitlist={waitlist} grades={grades} attendance={attendance} onSync={() => fetchAllData(false)} syncStatus={syncStatus} onDeleteStudent={handleDeleteStudent} onUpdateStudent={(s)=>saveStudents(dbStudents.map(x=>x.id===s.id?s:x), [s])} classConfigs={classConfigs} onUpdateClassConfigs={saveClassConfigs} libraryResources={libraryResources} />
                      ) : isTeacherUser ? (
                        <TeacherDashboard 
                          user={currentUser!} 
                          students={dbStudents} 
                          subjects={subjects} 
                          onUpdateUser={(u) => saveUsers(users.map(x => x.id === u.id ? u : x), [u])} 
                          homework={hwAssignments} 
                          attempts={hwAttempts} 
                          grades={grades} 
                          participation={participation} 
                          classConfigs={classConfigs} 
                          attendance={attendance} 
                          libraryResources={libraryResources}
                        />
                      ) : (
                        <StudentDashboard 
                          user={currentUser!} 
                          students={dbStudents} 
                          homework={hwAssignments} 
                          attempts={hwAttempts} 
                          resources={[]} 
                          classConfigs={classConfigs} 
                          users={users} 
                        />
                      )
                    } />
                    <Route path="/students" element={isAdminUser ? <StudentManagement students={dbStudents} onDelete={handleDeleteStudent} onUpdateStudents={saveStudents} /> : <Navigate to="/" />} />
                    <Route path="/register-student" element={isAdminUser ? (
                      <StudentRegistration 
                        students={dbStudents} 
                        waitlist={waitlist} 
                        onRegisterBulk={(list) => saveStudents([...dbStudents, ...list], list)} 
                        onRemoveWaitlistEntry={(id) => saveWaitlist(waitlist.filter(w => w.id !== id))}
                      />
                    ) : <Navigate to="/" />} />
                    <Route path="/edit-student/:studentId" element={isAdminUser ? (
                      <StudentRegistration 
                        students={dbStudents} 
                        waitlist={waitlist} 
                        onUpdate={(s)=>saveStudents(dbStudents.map(x=>x.id===s.id?s:x), [s])} 
                        onRemoveWaitlistEntry={(id) => saveWaitlist(waitlist.filter(w => w.id !== id))}
                      />
                    ) : <Navigate to="/" />} />
                    <Route path="/print-registration/:studentId" element={isAdminUser ? <PrintableRegistrationForm students={dbStudents} /> : <Navigate to="/" />} />
                    <Route path="/blank-registration" element={isAdminUser ? <BlankRegistrationForm /> : <Navigate to="/" />} />
                    <Route path="/students/print" element={isAdminUser ? <StudentListPrintView students={dbStudents} /> : <Navigate to="/" />} />
                    <Route path="/attendance" element={<AttendanceTracker user={currentUser!} students={dbStudents} attendance={attendance} onUpdateAttendance={saveAttendance} teacherAttendance={tAttendance} onUpdateTeacherAttendance={saveTeacherAttendance} users={users} />} />
                    <Route path="/attendance/print/:className/:month/:year" element={<AttendancePrintView students={dbStudents} attendance={attendance} />} />
                    <Route path="/homework" element={
                      <HomeworkSystem 
                        user={currentUser!} 
                        students={dbStudents} 
                        assignments={hwAssignments} 
                        questions={hwQuizQuestions} 
                        attempts={hwAttempts} 
                        answers={hwAttemptAnswers} 
                        ratings={hwTeacherRatings}
                        onSaveAssignments={saveHwAssignments}
                        onSaveQuestions={saveHwQuizQuestions}
                        onSaveAttempts={saveHwAttempts}
                        onSaveAnswers={saveHwAttemptAnswers}
                        onSaveRatings={saveHwTeacherRatings}
                        onSaveReports={saveHwReports}
                        reports={hwReports}
                        subjects={subjects}
                        users={users}
                      />
                    } />
                    <Route path="/homework/print/:homeworkId" element={<HomeworkPrintView students={dbStudents} homework={hwAssignments} attempts={hwAttempts} ratings={hwTeacherRatings} users={users} />} />
                    <Route path="/homework/reports/print" element={<HomeworkReportsPrintView students={dbStudents} reports={hwReports} currentUser={currentUser!} />} />
                    <Route path="/grades" element={isStudentUser ? <Navigate to="/" /> : <GradingSystem user={currentUser!} students={dbStudents} subjects={subjects} grades={grades} participation={participation} onUpdateGrades={saveGrades} onUpdateParticipation={saveParticipation} classConfigs={classConfigs} onUpdateClassConfigs={saveClassConfigs} />} />
                    <Route path="/grades/register/:className/:term" element={<ClassGradeRegisterPrintView students={dbStudents} grades={grades} subjects={subjects} classConfigs={classConfigs} />} />
                    <Route path="/grades/punktetabelle/:className/:term" element={<PunktetabellePrintView students={dbStudents} grades={grades} classConfigs={classConfigs} user={currentUser!} />} />
                    <Route path="/reports" element={isStudentUser ? <Navigate to="/" /> : <ReportManager user={currentUser!} students={dbStudents} subjects={subjects} grades={grades} onUpdateStudents={saveStudents} />} />
                    <Route path="/report-card/:studentId" element={<ReportCard user={currentUser!} students={dbStudents} subjects={subjects} grades={grades} participation={participation} onUpdateParticipation={saveParticipation} classConfigs={classConfigs} />} />
                    <Route path="/certificate/:studentId/:type" element={<CertificateView students={dbStudents} grades={grades} user={currentUser!} />} />
                    <Route path="/certificates" element={isStudentUser ? <Navigate to="/" /> : <CertificateManager user={currentUser!} students={dbStudents} grades={grades} />} />
                    <Route path="/waitlist" element={isAdminUser ? <WaitlistManagement waitlist={waitlist} onUpdate={saveWaitlist} /> : <Navigate to="/" />} />
                    <Route path="/waitlist/print" element={isAdminUser ? <WaitlistPrintView waitlist={waitlist} /> : <Navigate to="/" />} />
                    <Route path="/finance" element={isAdminUser ? <FinanceManagement students={dbStudents} users={users} onUpdateStudents={saveStudents} onUpdateUsers={saveUsers} /> : <Navigate to="/" />} />
                    <Route path="/finance/report/:month" element={isAdminUser ? <FinancePrintView students={dbStudents} users={users} /> : <Navigate to="/" />} />
                    <Route path="/finance/yearly/:year" element={isAdminUser ? <FinanceManagementYearly students={dbStudents} users={users} /> : <Navigate to="/" />} />
                    <Route path="/users" element={isAdminUser ? <UserManagement users={users} onUpdate={saveUsers} onDelete={handleDeleteUser} /> : <Navigate to="/" />} />
                    <Route path="/users/print" element={isAdminUser ? <StaffPrintView users={users} students={dbStudents} /> : <Navigate to="/" />} />
                    <Route path="/id-cards" element={<IDCardSystem user={currentUser!} users={users} students={dbStudents} />} />
                    <Route path="/library" element={isAdminUser ? <LibraryManager resources={libraryResources} onUpdateResources={saveLibraryResources} classes={Array.from(new Set(dbStudents.map(s => s.className)))} user={currentUser!} /> : <Navigate to="/" />} />
                    <Route path="/communication" element={isAdminUser ? <CommunicationCenter students={dbStudents} /> : <Navigate to="/" />} />
                    <Route path="/update-data" element={<DataUpdateForm students={dbStudents} onUpdateStudents={(list) => saveStudents(dbStudents.map(s => list.find(l => l.id === s.id) || s), list)} />} />
                    <Route path="/whatsapp-qr" element={!isStudentUser ? <ClassWhatsAppManager classConfigs={classConfigs} onUpdate={saveClassConfigs} user={currentUser!} /> : <Navigate to="/" />} />
                    <Route path="/curriculum" element={<CurriculumPage user={currentUser!} />} />
                    <Route path="/quran-practice" element={<QuranPractice currentUser={currentUser!} students={dbStudents} />} />
                    <Route path="/theory-manage" element={!isStudentUser ? <TheoryManager user={currentUser!} resources={resources} onUpdateResources={saveResources} subjects={subjects} students={dbStudents} onNotify={()=>{}} grades={grades} onUpdateGrades={saveGrades} saveQuizResult={saveQuizResult} updateAutomatedGrade={updateAutomatedGrade} calculateSubjectGrade={calculateSubjectGrade} /> : <Navigate to="/" />} />
                    <Route path="/theory" element={<TheoryManager user={currentUser!} resources={resources} onUpdateResources={saveResources} subjects={subjects} students={dbStudents} onNotify={()=>{}} grades={grades} onUpdateGrades={saveGrades} saveQuizResult={saveQuizResult} updateAutomatedGrade={updateAutomatedGrade} calculateSubjectGrade={calculateSubjectGrade} />} />
                    <Route path="/exams" element={<TheoryManager user={currentUser!} resources={resources} onUpdateResources={saveResources} subjects={subjects} students={dbStudents} onNotify={()=>{}} grades={grades} onUpdateGrades={saveGrades} saveQuizResult={saveQuizResult} updateAutomatedGrade={updateAutomatedGrade} calculateSubjectGrade={calculateSubjectGrade} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </main>
            </div>
          } />
        )}
      </Routes>
    </HashRouter>
  );
};

export default App;
