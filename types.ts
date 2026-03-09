
export enum UserRole {
  PRINCIPAL = 'PRINCIPAL',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export type TeacherTitle = 'Alim' | 'Alima' | 'Imam' | 'Quran Lehrer' | 'Tajweed Lehrer' | 'Arabisch Lehrer' | 'Aushelfer';
export type Gender = 'Junge' | 'Mädchen' | 'Mann' | 'Frau';
export type StudentStatus = 'active' | 'inactive' | 'suspended' | 'graduated' | 'removed_red_list';
export type PaymentMethod = 'Bar' | 'Überweisung';

export type RepeatType = 'OneTime' | 'Weekly' | 'Monthly';
export type SubmissionType = 'DoneOnly' | 'PhotoPDF' | 'Audio' | 'Mixed';
export type CourseType = string;

export interface SchoolClass {
  id: string;
  name: string;
  category: 'KIDS' | 'ADULT';
  gender: Gender | 'Gemischt';
  createdAt: string;
}

export interface Student {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  className: string;
  guardian: string;
  address: string;
  whatsapp: string;
  lessonTimes: string;
  registrationDate: string;
  status: StudentStatus;
  siblingsCount?: number;
  paymentMethod?: PaymentMethod;
  feesPaidMonthly?: Record<string, boolean>;
  reportReleasedHalbjahr?: boolean;
  reportReleasedAbschluss?: boolean;
  phoneError?: boolean;
  accountHolder?: string;
  iban?: string;
  birthCountry?: string;
}

export interface User {
  id: string;
  name: string; 
  role: UserRole;
  password?: string;
  email?: string;
  whatsapp?: string;
  assignedClasses?: string[];
  teacherTitle?: TeacherTitle;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: 'Lehrer' | 'Lehrerin';
  salaryPaidMonthly?: Record<string, boolean>;
  zoomUrl?: string;
}

export interface Grade {
  studentId: string;
  subject: string;
  term: 'Halbjahr' | 'Abschluss';
  points: number; // 0-20, or -1 if the subject was not participated (*)
  date: string;
}

export interface Attendance {
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
}

export interface TeacherAttendance {
  userId: string;
  date: string;
  status: 'present' | 'absent' | 'substituted';
}

export interface ParticipationRecord {
  studentId: string;
  term: 'Halbjahr' | 'Abschluss';
  verhalten: string;
  vortrag: string;
  puenktlichkeit: string;
  zusatzpunkte: number;
  remarks?: string;
}

export interface ClassConfig {
  className: string;
  whatsappLink: string;
  selectedSubjects?: string[];
  updatedAt: string;
}

export type CertificateType = 'Hafiz' | 'Imam' | 'Alim' | 'Ijazah' | 'Quran-Khatam' | 'Arabisch';

export interface ParticipantInfo {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  preferredCourses: CourseType[];
  priorKnowledge: string;
  preferredDays: string;
}

export interface WaitlistEntry {
  id: string;
  type: 'FAMILY' | 'ADULT';
  guardianName: string;
  whatsapp: string;
  email?: string;
  address?: string;
  paymentMethod?: PaymentMethod;
  preferredLanguage: string;
  appliedDate: string;
  status: 'pending' | 'invited' | 'classified' | 'rejected' | 'accepted';
  paymentConfirmed: boolean;
  participants: ParticipantInfo[];
}

export type HomeworkStatus = 'Draft' | 'Assigned' | 'InProgress' | 'Completed' | 'NeedsRepeat' | 'Expired';
export type HomeworkAssignmentType = 'Quiz' | 'Reading';

export interface HomeworkAssignment {
  id: string;
  className: string;
  subject: string;
  teacherId: string;
  title: string;
  assignmentType: HomeworkAssignmentType;
  bookUrl?: string;
  pagesFrom?: number;
  pagesTo?: number;
  dailyTargetMinutes?: number;
  maxAttempts: number;
  dueDate: string;
  status: HomeworkStatus;
  quizVersion: number;
  language?: 'arabic' | 'german' | 'mixed';
  instructions?: string;
  createdAt: string;
  errorLog?: string;
}

export interface HomeworkQuizQuestion {
  id: string;
  assignmentId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correctOption: 'A' | 'B' | 'C';
  explanation?: string;
  sourceHint?: string;
}

export interface HomeworkAttempt {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptNumber: number;
  scorePercent: number;
  isPerfect: boolean;
  timeSpentSeconds?: number;
  startedAt: string;
  completedAt?: string;
}

export interface HomeworkAttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOption: 'A' | 'B' | 'C';
  isCorrect: boolean;
  answeredAt: string;
}

export interface HomeworkTeacherRating {
  id: string;
  assignmentId: string;
  studentId: string;
  rating: 'Sehr gut' | 'Gut' | 'Noch mal wiederholen';
  feedbackText?: string;
  ratedBy: string;
  ratedAt: string;
}

export interface HomeworkReport {
  id: string;
  studentId: string;
  assignmentTitle: string;
  subject: string;
  assignmentType?: HomeworkAssignmentType;
  teacherName: string;
  completedAt: string;
  scorePercent: number;
  timeSpentSeconds?: number;
  rating: string;
  feedbackText?: string;
}

export interface Homework {
  id: string;
  classId: string;
  subject: string;
  title: string;
  instructions: string;
  dueDate: string;
  repeatType: RepeatType;
  submissionType: SubmissionType;
  visibility: 'Everyone' | 'Specific';
  reminderEnabled: boolean;
  createdBy: string;
  createdAt: string;
  attachmentUrl?: string;
  attachmentType?: 'pdf' | 'image' | 'video' | 'audio' | 'file';
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  status: 'Submitted' | 'Accepted' | 'NeedsRevision' | 'Open' | 'Overdue' | 'NotSubmitted';
  submittedAt?: string;
  studentComment?: string;
  teacherComment?: string; 
  score?: number;
  reviewedAt?: string;
  fileUrl?: string;
  audioUrl?: string;
}

export interface ScheduledMeeting {
  id: string;
  title: string;
  type: 'CLASS_PARENT' | 'ALL_PARENTS' | 'INDIVIDUAL_PARENT' | 'STAFF' | 'PRINCIPAL_DIRECT';
  dateTime: string;
  targetId: string;
  zoomUrl: string;
  createdBy: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface Lesson {
  title: string;
  audioUrl: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'image' | 'audio' | 'link';
  url: string;
  bookUrl?: string;
  className: string;
  subject: string;
  uploadedBy: string;
  createdAt: string;
  quizData?: QuizQuestion[];
  quizAttempts?: Record<string, number>; // studentId -> count
  quizScores?: Record<string, number>; // studentId -> best score
  isMainBook?: boolean;
  isUnlocked?: boolean;
  lessons?: Lesson[];
  language?: 'arabic' | 'german' | 'mixed';
}

export interface QuizResult {
  id: string;
  studentId: string;
  resourceId: string;
  term: 'Halbjahr' | 'Abschluss';
  score: number;
  maxScore: number;
  completedAt: string;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: string;
  isDeleted?: boolean;
}

export interface WhatsAppLog {
  id: string;
  studentId: string;
  homeworkId: string;
  status: 'sent' | 'failed';
  timestamp: string;
}

export interface Curriculum {
  id: string;
  className: string;
  term: 'Halbjahr' | 'Abschluss';
  title: string;
  fileUrl: string;
  fileType: 'pdf' | 'image' | 'link';
  uploadedBy: string;
  createdAt: string;
}

export interface CurriculumYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CurriculumItem {
  id: string;
  yearId: string;
  subject: string;
  level: string; // 'Stufe 1', 'Stufe 2', 'Stufe 3'
  term: 'Halbjahr' | 'Abschluss';
  title: string;
  content: string;
  orderIndex: number;
  status: 'draft' | 'published';
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumProgress {
  userId: string;
  curriculumItemId: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface LibraryResource {
  id: string;
  title: string;
  url: string;
  className: string;
  description?: string;
  createdAt: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  tableName: string;
  recordId: string;
  oldData?: unknown;
  newData?: unknown;
  createdAt: string;
}

export interface QuranPracticeRecord {
  id: string;
  studentId: string;
  surahNumber: number;
  ayahNumber: number;
  practiced: boolean;
  repeatNeeded: boolean;
  practiceCount: number;
  lastPracticedAt: string;
}
