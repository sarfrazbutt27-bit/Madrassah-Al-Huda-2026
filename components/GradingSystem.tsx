
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, Table as TableIcon, Search, School, ChevronDown, FileText, CheckCircle2, Sparkles, Loader2, Printer, ListOrdered, BookOpen, Check, X, Info
} from 'lucide-react';
import { Student, Grade, User, UserRole, ParticipationRecord, ClassConfig } from '../types';
import { scanGradesFromImage, scanClassGradesFromImage } from '../lib/geminiService';
import { Camera, Users } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface GradingSystemProps {
  user: User;
  students: Student[];
  subjects: string[];
  grades: Grade[];
  participation: ParticipationRecord[];
  onUpdateGrades: (grades: Grade[], itemsToSync?: Grade[]) => void;
  onUpdateParticipation: (p: ParticipationRecord[], itemsToSync?: ParticipationRecord[]) => void;
  classConfigs: ClassConfig[];
  onUpdateClassConfigs: (configs: ClassConfig[]) => void;
}

const GradeInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  className?: string;
}> = ({ value, onChange, className }) => {
  const [localValue, setLocalValue] = useState(value || '');

  // Update local value when prop changes (e.g. from sync or scan)
  React.useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  return (
    <input 
      type="text"
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        onChange(e.target.value);
      }}
      className={className}
    />
  );
};

const GradingSystem: React.FC<GradingSystemProps> = ({ 
  user, students, subjects, grades, participation, onUpdateGrades, onUpdateParticipation, classConfigs, onUpdateClassConfigs
}) => {
  const navigate = useNavigate();
  const isTeacher = user.role === UserRole.TEACHER;
  const isPrincipal = user.role === UserRole.PRINCIPAL;
  const assignedClasses = user.assignedClasses || [];

  const [activeTab, setActiveTab] = useState<'overview' | 'participation'>('overview');
  const [selectedTerm, setSelectedTerm] = useState<'Halbjahr' | 'Abschluss'>('Halbjahr');
  const [classFilter, setClassFilter] = useState<string>('Alle');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const [isScanningBulk, setIsScanningBulk] = useState(false);
  const [isEditingSubjects, setIsEditingSubjects] = useState(false);

  const availableClasses = useMemo(() => {
    const classes = isPrincipal 
      ? Array.from(new Set(students.map(s => s.className)))
      : assignedClasses;
    return ['Alle', ...classes.sort()];
  }, [students, isPrincipal, assignedClasses]);

  const activeSubjects = useMemo(() => {
    if (classFilter === 'Alle') return subjects;
    const config = classConfigs.find(c => c.className === classFilter);
    if (config && config.selectedSubjects && config.selectedSubjects.length > 0) {
      return config.selectedSubjects;
    }
    return subjects;
  }, [subjects, classFilter, classConfigs]);

  const classStudents = useMemo(() => {
    return students.filter(s => {
      const isMyClass = isPrincipal || assignedClasses.includes(s.className);
      const matchesFilter = classFilter === 'Alle' || s.className === classFilter;
      const matchesSearch = searchTerm === '' || `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
      return isMyClass && matchesFilter && matchesSearch && s.status === 'active';
    }).sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [students, isPrincipal, assignedClasses, classFilter, searchTerm]);

  const updateGrade = (studentId: string, subject: string, pointsVal: string) => {
    const trimmed = pointsVal.trim();
    
    // 1. Handle empty input -> remove grade
    if (trimmed === '') {
      const filtered = grades.filter(g => !(g.studentId === studentId && g.term === selectedTerm && g.subject === subject));
      onUpdateGrades(filtered);
      return;
    }

    // 2. Special marker for not participated
    if (trimmed === '*' || trimmed.endsWith('*')) {
      const newGrade: Grade = {
        studentId,
        subject,
        term: selectedTerm,
        points: -1,
        date: new Date().toISOString().split('T')[0]
      };
      const filtered = grades.filter(g => !(g.studentId === studentId && g.term === selectedTerm && g.subject === subject));
      onUpdateGrades([...filtered, newGrade], [newGrade]);
      return;
    }

    // 3. Parse number (allow decimals)
    // Replace comma with dot for international support
    const normalized = trimmed.replace(',', '.');
    const points = parseFloat(normalized);
    
    if (isNaN(points)) return;
    
    // Cap at 20
    const cappedPoints = Math.min(20, Math.max(0, points));

    const newGrade: Grade = {
      studentId,
      subject,
      term: selectedTerm,
      points: cappedPoints,
      date: new Date().toISOString().split('T')[0]
    };
    const filtered = grades.filter(g => !(g.studentId === studentId && g.term === selectedTerm && g.subject === subject));
    onUpdateGrades([...filtered, newGrade], [newGrade]);
  };

  const updateParticipation = (studentId: string, field: keyof ParticipationRecord, value: string | number) => {
    const existing = participation.find(p => p.studentId === studentId && p.term === selectedTerm) || {
      studentId, term: selectedTerm, verhalten: 'Sehr gut', vortrag: 'Sehr gut', puenktlichkeit: 'Sehr gut', zusatzpunkte: 0, remarks: ''
    };
    const updated = { ...existing, [field]: value } as ParticipationRecord;
    const newList = [...participation.filter(p => !(p.studentId === studentId && p.term === selectedTerm)), updated];
    onUpdateParticipation(newList, [updated]);
  };

  const generateAiRemark = async (student: Student) => {
    setIsGeneratingAi(student.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
      const studentGrades = grades.filter(g => g.studentId === student.id && g.term === selectedTerm);
      const pointsInfo = activeSubjects.map(s => {
        const p = studentGrades.find(g => g.subject === s)?.points || 0;
        return `${s}: ${p}/20`;
      }).join(', ');
      
      const prompt = `Du bist Lehrer an der Madrassah Al-Huda. Erstelle ein Zeugnis-Gutachten für ${student.firstName} ${student.lastName}. Noten: ${pointsInfo}. Verhalten: Sehr gut. Erstelle 3 Sätze: Würdigung, Fleiß und Ausblick.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      if (response.text) updateParticipation(student.id, 'remarks', response.text.trim());
    } catch (e) { console.error(e); } finally { setIsGeneratingAi(null); }
  };

  const handleScanGrades = async (studentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(studentId);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const mimeType = file.type;
        
        const scannedGrades = await scanGradesFromImage(base64, mimeType, activeSubjects);
        
        if (scannedGrades.length === 0) {
          alert("Keine Noten im Bild erkannt. Bitte stellen Sie sicher, dass die Tabelle gut lesbar ist.");
          setIsScanning(null);
          return;
        }

        // Update grades for this student
        const newGrades = [...grades];
        const itemsToSync: Grade[] = [];
        
        scannedGrades.forEach(sg => {
          // Find matching subject (case insensitive or fuzzy)
          // Priority 1: Exact match
          let matchedSubject = activeSubjects.find(s => s.toLowerCase() === sg.subject.toLowerCase());
          
          // Priority 2: Subject in list contains the scanned subject name (e.g. "Fiqh" matches "Fiqh II")
          if (!matchedSubject) {
            matchedSubject = activeSubjects.find(s => s.toLowerCase().includes(sg.subject.toLowerCase()));
          }
          
          // Priority 3: Scanned subject name contains the subject in list (e.g. "Fiqh II" matches "Fiqh")
          if (!matchedSubject) {
            matchedSubject = activeSubjects.find(s => sg.subject.toLowerCase().includes(s.toLowerCase()));
          }
          
          if (matchedSubject) {
            const points = Math.round(Math.min(20, Math.max(0, sg.score)));
            const newGrade: Grade = {
              studentId,
              subject: matchedSubject,
              term: selectedTerm,
              points,
              date: new Date().toISOString().split('T')[0]
            };
            // Remove existing
            const existingIdx = newGrades.findIndex(g => g.studentId === studentId && g.term === selectedTerm && g.subject === matchedSubject);
            if (existingIdx > -1) newGrades.splice(existingIdx, 1);
            newGrades.push(newGrade);
            itemsToSync.push(newGrade);
          }
        });
        
        onUpdateGrades(newGrades, itemsToSync);
        
        if (itemsToSync.length > 0) {
          const summary = itemsToSync.map(g => `${g.subject}: ${g.points}`).join(', ');
          alert(`Erfolg! ${itemsToSync.length} Noten erkannt:\n${summary}`);
        } else {
          alert("Es wurden Fächer erkannt, aber keines passte zu den Fächern in der Matrix.");
        }
        setIsScanning(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Scan error:", error);
      alert("Fehler beim Scannen des Bildes.");
      setIsScanning(null);
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  const handleBulkScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (classFilter === 'Alle') {
      alert("Bitte wählen Sie zuerst eine Klasse aus, um eine Liste zu scannen.");
      return;
    }

    setIsScanningBulk(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const mimeType = file.type;
        
        const studentNames = classStudents.map(s => `${s.firstName} ${s.lastName}`);
        const scannedResults = await scanClassGradesFromImage(base64, mimeType, activeSubjects, studentNames);
        
        if (scannedResults.length === 0) {
          alert("Keine Daten im Bild erkannt. Bitte stellen Sie sicher, dass Namen und Noten gut lesbar sind.");
          setIsScanningBulk(false);
          return;
        }

        const newGrades = [...grades];
        const itemsToSync: Grade[] = [];
        let matchedCount = 0;

        scannedResults.forEach(res => {
          // Match student
          const matchedStudent = classStudents.find(s => {
            const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
            return fullName === res.studentName.toLowerCase() || 
                   fullName.includes(res.studentName.toLowerCase()) ||
                   res.studentName.toLowerCase().includes(fullName);
          });

          // Match subject
          const matchedSubject = activeSubjects.find(s => 
            s.toLowerCase() === res.subject.toLowerCase() || 
            s.toLowerCase().includes(res.subject.toLowerCase()) ||
            res.subject.toLowerCase().includes(s.toLowerCase())
          );

          if (matchedStudent && matchedSubject) {
            const points = Math.round(Math.min(20, Math.max(0, res.score)));
            const newGrade: Grade = {
              studentId: matchedStudent.id,
              subject: matchedSubject,
              term: selectedTerm,
              points,
              date: new Date().toISOString().split('T')[0]
            };

            // Remove existing
            const existingIdx = newGrades.findIndex(g => 
              g.studentId === matchedStudent.id && 
              g.term === selectedTerm && 
              g.subject === matchedSubject
            );
            if (existingIdx > -1) newGrades.splice(existingIdx, 1);
            
            newGrades.push(newGrade);
            itemsToSync.push(newGrade);
            matchedCount++;
          }
        });

        onUpdateGrades(newGrades, itemsToSync);
        alert(`Scan abgeschlossen! ${matchedCount} Noten für ${new Set(itemsToSync.map(i => i.studentId)).size} Schüler zugeordnet.`);
        setIsScanningBulk(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Bulk scan error:", error);
      alert("Fehler beim Scannen der Liste.");
      setIsScanningBulk(false);
    } finally {
      e.target.value = '';
    }
  };

  const getPoints = (studentId: string, subj: string) => grades.find(g => g.studentId === studentId && g.term === selectedTerm && g.subject === subj)?.points;

  const getPointsDisplay = (studentId: string, subj: string) => {
    const p = getPoints(studentId, subj);
    if (p === undefined) return '';
    return p === -1 ? '*' : p.toString();
  };

  const handlePrintRegister = () => {
    if (classFilter === 'Alle') {
      alert("Bitte wählen Sie erst eine spezifische Klasse aus, um den nummerierten Dienstbericht zu drucken.");
      return;
    }
    navigate(`/grades/register/${classFilter}/${selectedTerm}`);
  };

  const handlePrintPunktetabelle = () => {
    if (classFilter === 'Alle') {
      alert("Bitte wählen Sie erst eine spezifische Klasse aus, um die Punktetabelle zu drucken.");
      return;
    }
    navigate(`/grades/punktetabelle/${classFilter}/${selectedTerm}`);
  };

  const toggleSubject = (subject: string) => {
    if (classFilter === 'Alle') return;
    
    const config = classConfigs.find(c => c.className === classFilter) || {
      className: classFilter,
      whatsappLink: '',
      selectedSubjects: [],
      updatedAt: new Date().toISOString()
    };

    const currentSubjects = config.selectedSubjects || [];
    const nextSubjects = currentSubjects.includes(subject)
      ? currentSubjects.filter(s => s !== subject)
      : [...currentSubjects, subject];

    const newConfig: ClassConfig = {
      ...config,
      selectedSubjects: nextSubjects,
      updatedAt: new Date().toISOString()
    };

    const nextConfigs = [...classConfigs.filter(c => c.className !== classFilter), newConfig];
    onUpdateClassConfigs(nextConfigs);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="bg-madrassah-950 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col xl:flex-row justify-between gap-6 md:gap-10 items-center">
         <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Award size={300} /></div>
         <div className="relative z-10 text-center xl:text-left">
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">Noten-Zentrale</h2>
            <p className="text-madrassah-300 font-bold uppercase text-[8px] md:text-[10px] tracking-[0.4em] mt-3 md:mt-4 flex items-center justify-center xl:justify-start gap-2">
               Bereich: {isTeacher ? 'Meine Klassen' : 'Gesamt-Campus'} • {selectedTerm}
            </p>
         </div>
         <div className="relative z-10 flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center">
            {classFilter !== 'Alle' && activeTab === 'overview' && (
              <div className="flex flex-wrap gap-4 justify-center">
                <button 
                  onClick={handlePrintRegister} 
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest border border-emerald-500 flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 transition-all"
                >
                  <ListOrdered size={18}/> Dienstbericht
                </button>
                <button 
                  onClick={handlePrintPunktetabelle} 
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest border border-indigo-500 flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 transition-all"
                >
                  <Printer size={18}/> Punktetabelle
                </button>
                {classFilter !== 'Alle' && (
                  <button 
                    onClick={() => setIsEditingSubjects(true)} 
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest border border-amber-400 flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <BookOpen size={18}/> Fächer wählen
                  </button>
                )}
                <label className="w-full sm:w-auto cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest border border-indigo-500 flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 transition-all">
                  {isScanningBulk ? <Loader2 size={18} className="animate-spin" /> : <Users size={18}/>}
                  Klassen-Liste scannen
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleBulkScan}
                    disabled={isScanningBulk}
                  />
                </label>
              </div>
            )}
            <div className="flex bg-white/10 p-1 rounded-2xl md:rounded-[2rem] border border-white/20 w-full sm:w-auto">
               {(['Halbjahr', 'Abschluss'] as const).map(t => (
                  <button key={t} onClick={() => setSelectedTerm(t)} className={`flex-1 sm:flex-none px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${selectedTerm === t ? 'bg-white text-madrassah-950 shadow-2xl scale-105' : 'text-white/50 hover:text-white'}`}>
                     {t}
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-center justify-between no-print">
        <div className="flex flex-col gap-2 w-full xl:w-auto">
          <div className="flex gap-2 bg-white p-2 rounded-[2.5rem] shadow-sm border">
            {[
              { id: 'overview', label: 'Matrix', icon: TableIcon },
              { id: 'participation', label: 'Gutachten', icon: FileText },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 xl:flex-none flex items-center justify-center gap-3 px-8 py-4 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === tab.id ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}><tab.icon size={16} /> {tab.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-3 px-6 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in slide-in-from-left duration-500">
            <Sparkles size={14} className="text-indigo-600 shrink-0" />
            <p className="text-[8px] font-bold text-indigo-900 uppercase tracking-widest">
              Tipp: Nutze das <Camera size={10} className="inline mx-1" /> Symbol für präzises Scannen von Notenlisten.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
           <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input type="text" placeholder="Suche..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[2rem] text-xs font-bold outline-none shadow-sm" />
           </div>
           <div className="relative flex-1 sm:w-56">
            <School className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full pl-14 pr-10 py-4 bg-white border border-gray-100 rounded-[2rem] text-[10px] font-black uppercase outline-none appearance-none cursor-pointer">
              {availableClasses.map(c => <option key={c} value={c}>{c === 'Alle' ? 'Alle Klassen' : `Klasse ${c}`}</option>)}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* SUBJECT SELECTION MODAL */}
      {isEditingSubjects && classFilter !== 'Alle' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-madrassah-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="bg-madrassah-950 p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500 p-3 rounded-2xl shadow-lg transform -rotate-3">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic leading-none">Prüfungsfächer wählen</h3>
                  <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mt-2">Klasse {classFilter}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditingSubjects(false)}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                {subjects.map(subj => {
                  const isSelected = activeSubjects.includes(subj);
                  return (
                    <button 
                      key={subj}
                      onClick={() => toggleSubject(subj)}
                      className={`p-5 rounded-2xl text-[11px] font-black uppercase text-left flex items-center justify-between transition-all border-2 ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl scale-[1.02]' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-indigo-200'}`}
                    >
                      <span className="truncate">{subj}</span>
                      {isSelected && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3 text-gray-400">
                  <Info size={16} />
                  <p className="text-[10px] font-bold uppercase italic tracking-widest">Änderungen werden sofort gespeichert.</p>
                </div>
                <button 
                  onClick={() => setIsEditingSubjects(false)}
                  className="w-full md:w-auto bg-madrassah-950 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-black transition-all shadow-xl"
                >
                  Fertig
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar relative">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b sticky top-0 z-30">
                      <th className="px-12 py-10 sticky left-0 top-0 bg-gray-50 z-40 w-80 border-r shadow-md italic">Schüler</th>
                      {activeSubjects.map(s => <th key={s} className="px-8 py-10 text-center min-w-[120px] bg-gray-50 sticky top-0 z-30">{s}</th>)}
                      <th className="px-12 py-10 text-right bg-madrassah-950 text-white font-black sticky top-0 right-0 z-40 w-32">Summe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {classStudents.map(student => {
                      const total = activeSubjects.reduce((acc, s) => {
                        const p = getPoints(student.id, s);
                        if (p === undefined || p === -1) return acc;
                        return acc + p;
                      }, 0);
                      return (
                        <tr key={student.id} className="hover:bg-madrassah-50 transition-colors group">
                          <td className="px-12 py-8 sticky left-0 bg-white z-10 border-r shadow-sm max-w-[320px]">
                             <div className="flex items-center justify-between group/cell">
                               <div>
                                 <p className="font-black text-gray-900 group-hover:text-madrassah-950 text-lg uppercase italic leading-none truncate">{student.firstName} {student.lastName}</p>
                                 <p className="text-[9px] text-gray-400 font-bold uppercase mt-2">{student.className}</p>
                               </div>
                               <div className="flex items-center gap-2">
                                 <label className="cursor-pointer p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                   {isScanning === student.id ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                   <input 
                                     type="file" 
                                     accept="image/*" 
                                     className="hidden" 
                                     onChange={(e) => handleScanGrades(student.id, e)}
                                     disabled={isScanning !== null}
                                   />
                                 </label>
                               </div>
                             </div>
                          </td>
                          {activeSubjects.map(s => (
                            <td key={s} className="px-6 py-8 text-center">
                              <GradeInput 
                                value={getPointsDisplay(student.id, s)}
                                onChange={(val) => updateGrade(student.id, s, val)}
                                className={`w-16 h-12 rounded-xl text-center font-black text-lg border-2 transition-all outline-none focus:border-indigo-500 relative z-20 ${getPoints(student.id, s) !== undefined ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                              />
                            </td>
                          ))}
                          <td className="px-12 py-8 text-right bg-gray-50 sticky right-0 z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                             <span className="text-3xl font-black text-madrassah-950 italic">{total}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-6">
              {classStudents.map(student => {
                const total = subjects.reduce((acc, s) => {
                  const p = getPoints(student.id, s);
                  if (p === undefined || p === -1) return acc;
                  return acc + p;
                }, 0);
                return (
                  <div key={student.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-black text-madrassah-950 uppercase italic leading-none">{student.firstName} {student.lastName}</h4>
                        <p className="text-[8px] font-bold text-gray-400 uppercase mt-2">Klasse {student.className}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer p-3 bg-white text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-2">
                          {isScanning === student.id ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                          <span className="text-[8px] font-black uppercase tracking-widest">Scan</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleScanGrades(student.id, e)}
                            disabled={isScanning !== null}
                          />
                        </label>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Gesamt</p>
                          <span className="text-2xl font-black text-madrassah-950 italic">{total}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                      {activeSubjects.map(s => (
                        <div key={s} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center gap-2">
                          <label className="text-[8px] font-black uppercase text-gray-400 text-center truncate w-full">{s}</label>
                          <GradeInput 
                            value={getPointsDisplay(student.id, s)}
                            onChange={(val) => updateGrade(student.id, s, val)}
                            className={`w-full h-10 rounded-xl text-center font-black text-sm border-2 transition-all outline-none focus:border-indigo-500 relative z-20 ${getPoints(student.id, s) !== undefined ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-white border-gray-100 text-gray-400'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'participation' && (
           <div className="space-y-10">
              {classStudents.map(student => {
                 const record = participation.find(p => p.studentId === student.id && p.term === selectedTerm) || { 
                   studentId: student.id, term: selectedTerm, verhalten: 'Sehr gut', vortrag: 'Sehr gut', puenktlichkeit: 'Sehr gut', zusatzpunkte: 0, remarks: '' 
                 };
                 return (
                    <div key={student.id} className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-gray-100 shadow-xl group">
                       <div className="flex flex-col xl:flex-row gap-8 md:gap-12">
                          <div className="xl:w-80 space-y-6">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-madrassah-950 text-white rounded-xl flex items-center justify-center font-black text-base md:text-lg">{student.firstName?.charAt(0) || '?'}</div>
                                <div>
                                   <h4 className="font-black text-lg md:text-xl text-madrassah-950 uppercase italic leading-none">{student.firstName} {student.lastName}</h4>
                                   <p className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase mt-1">Klasse: {student.className}</p>
                                </div>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4 bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-gray-100">
                                {['verhalten', 'puenktlichkeit', 'vortrag'].map((f) => (
                                  <div key={f}>
                                     <label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 block ml-1">{f}</label>
                                     <select className="w-full bg-white border border-gray-200 p-2 md:p-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase outline-none" value={(record as Record<string, any>)[f]} onChange={e => updateParticipation(student.id, f as keyof ParticipationRecord, e.target.value)}>
                                        <option>Sehr gut</option><option>Gut</option><option>Befriedigend</option><option>Unzureichend</option>
                                     </select>
                                  </div>
                                ))}
                             </div>
                          </div>
                          <div className="flex-1 space-y-6">
                             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h4 className="text-xs md:text-sm font-black uppercase text-indigo-950 italic">Pädagogisches Gutachten</h4>
                                <button onClick={() => generateAiRemark(student)} disabled={!!isGeneratingAi} className="w-full sm:w-auto bg-madrassah-950 text-white px-6 py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase flex items-center justify-center gap-3 shadow-lg hover:bg-black transition-all">
                                   {isGeneratingAi === student.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-emerald-400" />} KI-Vorschlag
                                </button>
                             </div>
                             <textarea 
                                value={record.remarks || ''}
                                onChange={e => updateParticipation(student.id, 'remarks', e.target.value)}
                                className="w-full h-40 bg-gray-50 border-2 border-gray-50 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] italic font-medium text-gray-700 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
                                placeholder="Persönliche Bemerkungen..."
                             />
                             <div className="flex items-center gap-2 text-emerald-600 font-black text-[8px] md:text-[9px] uppercase justify-end">
                                <CheckCircle2 size={12} /> Live-Speicherung aktiv
                             </div>
                          </div>
                       </div>
                    </div>
                 );
              })}
           </div>
        )}
      </div>
    </div>
  );
};

export default GradingSystem;
