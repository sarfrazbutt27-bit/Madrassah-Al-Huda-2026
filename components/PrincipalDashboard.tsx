
import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Student, User, WaitlistEntry, Grade, Attendance, ClassConfig, UserRole, LibraryResource } from '../types';
import { 
  Users as UsersIcon, UserPlus as UserPlusIcon, Hourglass as HourglassIcon, 
  Euro as EuroIcon, RefreshCw as RefreshCwIcon, 
  Briefcase as BriefcaseIcon, Flame as FlameIcon,
  Award as AwardIcon, Printer as PrinterIcon, Sparkles, ChevronRight, GraduationCap as ExamIcon,
  Library
} from 'lucide-react';
import LogoIcon from './LogoIcon';

interface PrincipalDashboardProps {
  students: Student[];
  users: User[];
  waitlist: WaitlistEntry[];
  grades: Grade[];
  attendance: Attendance[];
  onSync: () => void;
  syncStatus: string;
  onDeleteStudent: (id: string) => void;
  onUpdateStudent: (student: Student) => void;
  classConfigs: ClassConfig[];
  onUpdateClassConfigs: (configs: ClassConfig[]) => void;
  libraryResources: LibraryResource[];
  isHolidayMode?: boolean;
}

const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ 
  students, users, waitlist, attendance, onSync, syncStatus, grades, libraryResources, isHolidayMode 
}) => {
  const navigate = useNavigate();
  const activeStudents = students.filter(s => s.status === 'active');
  const activeTeachersCount = users.filter(u => u.role === UserRole.TEACHER).length;
  const pendingWaitlist = waitlist.filter(w => w.status === 'pending').length;

  const graduatesCount = useMemo(() => {
    const studentWithAbschlussGrades = new Set(grades.filter(g => g.term === 'Abschluss').map(g => g.studentId));
    return studentWithAbschlussGrades.size;
  }, [grades]);

  const riskStats = useMemo(() => {
    let yellowCount = 0;
    let redCount = 0;
    activeStudents.forEach(s => {
      const absences = attendance.filter(a => a.studentId === s.id && a.status === 'absent').length;
      if (absences >= 18) redCount++;
      else if (absences >= 9) yellowCount++;
    });
    return { yellowCount, redCount };
  }, [activeStudents, attendance]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {isHolidayMode && (
        <div className="bg-amber-400 p-8 rounded-[3rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-amber-500/20 animate-bounce-subtle">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-madrassah-950">
              <Sparkles size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-madrassah-950 uppercase italic">FERIEN – Madrassah geschlossen</h3>
              <p className="text-madrassah-950/70 font-bold uppercase text-[10px] tracking-widest mt-1">Nutze deine Zeit zum Wiederholen und Üben.</p>
            </div>
          </div>
          <div className="bg-white/20 px-6 py-3 rounded-2xl border border-white/30">
            <p className="text-[10px] font-black text-madrassah-950 uppercase tracking-widest">Ferien Challenge: Wer die meisten Quiz löst, bekommt Bonuspunkte.</p>
          </div>
        </div>
      )}

      {/* Majestic Header */}
      <div className="bg-madrassah-950 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-center gap-10">
        <div className="absolute inset-0 islamic-pattern opacity-10"></div>
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] rotate-12"><LogoIcon className="w-80 h-80 text-white" /></div>
        
        <div className="relative z-10 flex items-center gap-10">
           <div className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform p-5">
              <LogoIcon className="w-14 h-14" />
           </div>
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <span className="bg-gold-400 text-madrassah-950 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Akademie Leitung</span>
                 <Sparkles size={16} className="text-gold-400 animate-pulse" />
              </div>
              <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Management Dashboard</h2>
              <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 italic">Digitale Zentrale Madrassah Al-Huda</p>
           </div>
        </div>

        <div className="flex gap-4 relative z-10">
          <Link to="/blank-registration" className="flex items-center gap-3 px-8 py-5 bg-gold-400 text-madrassah-950 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-white hover:-translate-y-1 transition-all">
            <PrinterIcon size={18} /> Blanko-Dokumente
          </Link>
          <button 
            onClick={onSync}
            className="flex items-center gap-3 px-8 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-white/20 hover:-translate-y-1 transition-all"
          >
            <RefreshCwIcon size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            {syncStatus === 'syncing' ? 'Cloud Sync...' : 'Datenabgleich'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {[
          { to: '/students', icon: UsersIcon, label: 'Schüler Aktiv', value: activeStudents.length, color: 'madrassah', trend: 'Regulär' },
          { to: '/users', icon: BriefcaseIcon, label: 'Lehrkräfte', value: activeTeachersCount, color: 'madrassah', trend: 'Aktiv' },
          { to: '/certificates', icon: AwardIcon, label: 'Absolventen', value: graduatesCount, color: 'gold', trend: 'Geprüft' },
          { to: '/waitlist', icon: HourglassIcon, label: 'Warteliste', value: waitlist.length, color: 'indigo', trend: `${pendingWaitlist} Offen` },
          { to: '/finance', icon: EuroIcon, label: 'Kassenstand', value: 'Bilanz', color: 'emerald', trend: 'Zentral' },
          { to: '/library', icon: Library, label: 'Bibliothek', value: libraryResources.length, color: 'indigo', trend: 'Lehrer' }
        ].map((card, i) => (
          <Link key={i} to={card.to} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden">
             <div className="flex justify-between items-start mb-8 relative z-10">
                <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${
                  card.color === 'madrassah' ? 'bg-madrassah-50 text-madrassah-900 group-hover:bg-madrassah-950 group-hover:text-white' :
                  card.color === 'gold' ? 'bg-gold-50 text-gold-700 group-hover:bg-gold-500 group-hover:text-white' :
                  card.color === 'indigo' ? 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-900 group-hover:text-white' :
                  'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                }`}>
                  <card.icon size={28} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  card.color === 'madrassah' ? 'border-madrassah-200 text-madrassah-600' :
                  card.color === 'gold' ? 'border-gold-200 text-gold-600' :
                  card.color === 'indigo' ? 'border-indigo-200 text-indigo-600' :
                  'border-emerald-200 text-emerald-600'
                }`}>{card.trend}</span>
             </div>
             <div className="relative z-10">
                <p className="text-5xl font-black text-madrassah-950 italic leading-none">{card.value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-4 tracking-widest">{card.label}</p>
             </div>
             <div className="absolute bottom-0 right-0 p-8 opacity-5 text-gray-900"><card.icon size={100}/></div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white rounded-[4rem] p-12 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-madrassah-950 pointer-events-none rotate-12"><FlameIcon size={300} /></div>
           <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner"><FlameIcon size={24}/></div>
              <h3 className="text-2xl font-black text-madrassah-950 uppercase italic tracking-widest">Präsenz-Monitoring</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="p-10 bg-red-50 rounded-[3rem] border-2 border-red-100 group/item hover:bg-red-600 transition-all hover:shadow-2xl">
                 <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-4 group-hover/item:text-white/80">Rote Liste (18+ Abs.)</p>
                 <div className="flex items-end justify-between">
                    <p className="text-7xl font-black text-red-700 italic group-hover/item:text-white leading-none">{riskStats.redCount}</p>
                    <Link to="/attendance" className="bg-red-100 text-red-600 p-3 rounded-2xl group-hover/item:bg-white/10 group-hover/item:text-white transition-all"><ChevronRight size={24}/></Link>
                 </div>
              </div>
              <div className="p-10 bg-gold-50 rounded-[3rem] border-2 border-gold-100 group/item hover:bg-gold-500 transition-all hover:shadow-2xl">
                 <p className="text-[10px] font-black text-gold-700 uppercase tracking-[0.3em] mb-4 group-hover/item:text-white/80">Gelbe Liste (9+ Abs.)</p>
                 <div className="flex items-end justify-between">
                    <p className="text-7xl font-black text-gold-700 italic group-hover/item:text-white leading-none">{riskStats.yellowCount}</p>
                    <Link to="/attendance" className="bg-gold-100 text-gold-700 p-3 rounded-2xl group-hover/item:bg-white/10 group-hover/item:text-white transition-all"><ChevronRight size={24}/></Link>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 bg-indigo-950 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center border-4 border-white/5 group">
           <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-0 transition-transform duration-1000 -rotate-12"><UsersIcon size={200}/></div>
           <div className="relative z-10 space-y-10">
              <div>
                 <h3 className="text-2xl font-black uppercase italic tracking-widest mb-2 text-gold-400">Schnellzugriff</h3>
                 <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest italic">Zentralverwaltung Tools</p>
              </div>
              <div className="space-y-4">
                 <Link to="/register-student" className="w-full bg-white/5 hover:bg-white/10 p-6 rounded-[2rem] transition-all border border-white/10 flex items-center justify-between group/btn">
                    <div className="flex items-center gap-5">
                       <div className="w-10 h-10 bg-gold-400 rounded-xl flex items-center justify-center text-madrassah-950 shadow-lg group-hover/btn:rotate-12 transition-transform"><UserPlusIcon size={20} /></div>
                       <span className="text-[10px] font-black uppercase tracking-widest">Neuaufnahme Kinder</span>
                    </div>
                    <ChevronRight size={18} className="text-white/20 group-hover/btn:text-gold-400 group-hover/btn:translate-x-1 transition-all" />
                 </Link>
                 <button 
                   onClick={() => navigate('/register-student?type=ADULT')}
                   className="w-full bg-white/5 hover:bg-white/10 p-6 rounded-[2rem] transition-all border border-white/10 flex items-center justify-between group/btn text-left"
                 >
                    <div className="flex items-center gap-5">
                       <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover/btn:rotate-12 transition-transform"><ExamIcon size={20} /></div>
                       <span className="text-[10px] font-black uppercase tracking-widest">Neuaufnahme Erwachsene</span>
                    </div>
                    <ChevronRight size={18} className="text-white/20 group-hover/btn:text-emerald-500 group-hover/btn:translate-x-1 transition-all" />
                 </button>
                 <Link to="/users" className="w-full bg-white/5 hover:bg-white/10 p-6 rounded-[2rem] transition-all border border-white/10 flex items-center justify-between group/btn">
                    <div className="flex items-center gap-5">
                       <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover/btn:rotate-12 transition-transform"><BriefcaseIcon size={20} /></div>
                       <span className="text-[10px] font-black uppercase tracking-widest">Lehrer-Verwaltung</span>
                    </div>
                    <ChevronRight size={18} className="text-white/20 group-hover/btn:text-indigo-500 group-hover/btn:translate-x-1 transition-all" />
                 </Link>
                 <Link to="/certificates" className="w-full bg-white/5 hover:bg-white/10 p-6 rounded-[2rem] transition-all border border-white/10 flex items-center justify-between group/btn">
                    <div className="flex items-center gap-5">
                       <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover/btn:rotate-12 transition-transform"><AwardIcon size={20} /></div>
                       <span className="text-[10px] font-black uppercase tracking-widest">Urkunden Hub</span>
                    </div>
                    <ChevronRight size={18} className="text-white/20 group-hover/btn:text-emerald-500 group-hover/btn:translate-x-1 transition-all" />
                 </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
