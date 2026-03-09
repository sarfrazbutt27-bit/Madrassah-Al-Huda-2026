import React from 'react';
import { CurriculumYear } from '../types';
import { Calendar, School, Clock, UserCheck } from 'lucide-react';

interface CurriculumFiltersProps {
  years: CurriculumYear[];
  levels: string[];
  selectedYear: string;
  onYearChange: (yearId: string) => void;
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  selectedTerm: 'Halbjahr' | 'Abschluss';
  onTermChange: (term: 'Halbjahr' | 'Abschluss') => void;
  isTeacherView: boolean;
  onViewChange: (isTeacher: boolean) => void;
  canEdit: boolean;
}

const CurriculumFilters: React.FC<CurriculumFiltersProps> = ({
  years,
  levels,
  selectedYear,
  onYearChange,
  selectedLevel,
  onLevelChange,
  selectedTerm,
  onTermChange,
  isTeacherView,
  onViewChange,
  canEdit
}) => {

  return (
    <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-8 items-center justify-between no-print">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full lg:w-auto">
        {/* Year Filter */}
        <div className="relative group">
          <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-madrassah-950 transition-colors" size={18} />
          <select 
            value={selectedYear} 
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full pl-14 pr-10 py-4 bg-gray-50 border-2 border-gray-50 rounded-[2rem] text-[10px] font-black uppercase outline-none appearance-none cursor-pointer focus:bg-white focus:border-madrassah-950 transition-all shadow-inner"
          >
            {years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
          </select>
        </div>

        {/* Level Filter */}
        <div className="relative group">
          <School className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-madrassah-950 transition-colors" size={18} />
          <select 
            value={selectedLevel} 
            onChange={(e) => onLevelChange(e.target.value)}
            className="w-full pl-14 pr-10 py-4 bg-gray-50 border-2 border-gray-50 rounded-[2rem] text-[10px] font-black uppercase outline-none appearance-none cursor-pointer focus:bg-white focus:border-madrassah-950 transition-all shadow-inner"
          >
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Term Filter */}
        <div className="relative group">
          <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-madrassah-950 transition-colors" size={18} />
          <select 
            value={selectedTerm} 
            onChange={(e) => onTermChange(e.target.value as any)}
            className="w-full pl-14 pr-10 py-4 bg-gray-50 border-2 border-gray-50 rounded-[2rem] text-[10px] font-black uppercase outline-none appearance-none cursor-pointer focus:bg-white focus:border-madrassah-950 transition-all shadow-inner"
          >
            <option value="Halbjahr">Halbjahr</option>
            <option value="Abschluss">Abschluss</option>
          </select>
        </div>
      </div>

      {/* View Toggle (Teacher/Student) */}
      {canEdit && (
        <div className="flex bg-gray-50 p-1.5 rounded-[2rem] border-2 border-gray-100 shadow-inner">
          <button 
            onClick={() => onViewChange(false)}
            className={`px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${!isTeacherView ? 'bg-madrassah-950 text-white shadow-xl scale-105' : 'text-gray-400 hover:text-madrassah-950'}`}
          >
            <UserCheck size={14} /> Schüleransicht
          </button>
          <button 
            onClick={() => onViewChange(true)}
            className={`px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${isTeacherView ? 'bg-gold-400 text-madrassah-950 shadow-xl scale-105' : 'text-gray-400 hover:text-madrassah-950'}`}
          >
            <UserCheck size={14} /> Lehreransicht
          </button>
        </div>
      )}
    </div>
  );
};

export default CurriculumFilters;
