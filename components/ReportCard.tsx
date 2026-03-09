
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, ChevronLeft, Sparkles, Loader2, Lock, Info, 
  ShieldCheck, Languages, ArrowRightLeft, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Student, Grade, ParticipationRecord, User, UserRole, ClassConfig } from '../types';
import { GoogleGenAI } from "@google/genai";
import LogoIcon from './LogoIcon';

interface ReportCardProps {
  user: User;
  students: Student[];
  subjects: string[];
  grades: Grade[];
  participation: ParticipationRecord[];
  onUpdateParticipation: (p: ParticipationRecord[], itemsToSync?: ParticipationRecord[]) => void;
  classConfigs: ClassConfig[];
}

// Verfügbare Sprachen
const LANGUAGES = [
  { id: 'de', name: 'Deutsch', rtl: false },
  { id: 'ar', name: 'Arabisch (العربية)', rtl: true },
  { id: 'ur', name: 'Urdu (اردو)', rtl: true },
  { id: 'tr', name: 'Türkisch (Türkçe)', rtl: false },
  { id: 'fa', name: 'Farsi (فارسی)', rtl: true },
  { id: 'da', name: 'Dari (دری)', rtl: true }
];

const ReportCard: React.FC<ReportCardProps> = ({ user, students, subjects, grades, participation, classConfigs }) => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [reportType, setReportType] = useState<'Halbjahr' | 'Abschluss'>('Halbjahr');
  const [targetLang, setTargetLang] = useState(LANGUAGES[0]);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // State für übersetzte Inhalte
  const [translatedData, setTranslatedData] = useState<{
    title?: string;
    labels?: Record<string, string>;
    subjects?: Record<string, string>;
    remarks?: string;
    values?: Record<string, string>;
  } | null>(null);

  const [printScale, setPrintScale] = useState<number>(1);
  const reportRef = useRef<HTMLDivElement>(null);

  const isStaff = user.role === UserRole.TEACHER || user.role === UserRole.PRINCIPAL;
  const isStudent = user.role === UserRole.STUDENT;
  const student = students.find(s => s.id === studentId);

  const classSubjects = useMemo(() => {
    if (!student) return subjects;
    const config = classConfigs.find(c => c.className === student.className);
    if (config && config.selectedSubjects && config.selectedSubjects.length > 0) {
      return config.selectedSubjects;
    }
    return subjects;
  }, [subjects, student, classConfigs]);

  // Filter subjects that have grades for this student and term
  const activeSubjects = useMemo(() => {
    return classSubjects.filter(subj => {
      if (reportType === 'Halbjahr') {
        return grades.some(g => g.studentId === studentId && g.subject === subj && g.term === 'Halbjahr');
      } else {
        // For annual report, show if it has grades in either term
        return grades.some(g => g.studentId === studentId && g.subject === subj);
      }
    });
  }, [classSubjects, grades, studentId, reportType]);

  const { leftSubjects, rightSubjects } = useMemo(() => {
    const mid = Math.ceil(activeSubjects.length / 2);
    return {
      leftSubjects: activeSubjects.slice(0, mid),
      rightSubjects: activeSubjects.slice(mid)
    };
  }, [activeSubjects]);

  // --- SICHERHEITS-CHECK ---
  const isMyReport = user.id === studentId;
  const isReleased = reportType === 'Halbjahr' ? student?.reportReleasedHalbjahr : student?.reportReleasedAbschluss;

  const currentParticipation = useMemo(() => {
    return participation.find(p => p.studentId === studentId && p.term === reportType) || {
      studentId: studentId!,
      term: reportType,
      verhalten: 'Sehr gut', 
      vortrag: 'Sehr gut',
      puenktlichkeit: 'Sehr gut', 
      zusatzpunkte: 0,
      remarks: 'Der Teilnehmer zeigt stetiges Engagement und eine vorbildliche Akhlaq im Unterricht.'
    };
  }, [participation, studentId, reportType]);

  useEffect(() => {
    const handleAfterPrint = () => setPrintScale(1);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Wenn ein Schüler versucht, ein fremdes Zeugnis zu sehen oder ein nicht freigegebenes
  if (isStudent && (!isMyReport || !isReleased)) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-12 space-y-8 animate-in fade-in duration-500">
        <div className="w-32 h-32 bg-red-50 text-red-600 rounded-[3.5rem] flex items-center justify-center border-4 border-white shadow-2xl shadow-red-200/50 animate-pulse">
           <Lock size={56} />
        </div>
        <div className="space-y-4 max-w-lg">
           <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter">Zugriff gesperrt</h2>
           <p className="text-gray-500 font-medium text-lg leading-relaxed italic">
             {!isMyReport 
               ? "Du kannst nur dein eigenes Zeugnis einsehen. Der Zugriff auf fremde Datensätze ist untersagt." 
               : "Dein Zeugnis wurde noch nicht von deiner Lehrkraft zur Ansicht freigegeben. Bitte habe noch etwas Geduld."}
           </p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="px-12 py-5 bg-madrassah-950 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-black transition-all active:scale-95"
        >
           Zurück zum Dashboard
        </button>
      </div>
    );
  }

  const getGermanGrade = (points: number, max: number) => {
    if (points < 0) return "*";
    if (max === 0) return "-";
    const perc = (points / max) * 100;
    if (perc >= 92) return "1";
    if (perc >= 81) return "2";
    if (perc >= 67) return "3";
    if (perc >= 50) return "4";
    if (perc >= 30) return "5";
    return "6";
  };

  const getPointsForTerm = (subj: string, term: 'Halbjahr' | 'Abschluss') => 
    grades.find(g => g.studentId === studentId && g.term === term && g.subject === subj)?.points || 0;

  const handleTranslate = async () => {
    if (targetLang.id === 'de') {
      setTranslatedData(null);
      return;
    }

    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || process.env['GOOGLE_API_KEY'] || '' });
      
      const prompt = `Du bist ein professioneller Übersetzer für akademische und islamische Zeugnisse.
      Übersetze das folgende Zeugnis von Deutsch in die Sprache: ${targetLang.name}.
      
      Struktur des Zeugnisses:
      - Titel: ${reportType === 'Halbjahr' ? 'Halbjahres-Zeugnis' : 'Akademisches Jahreszeugnis'}
      - Labels: Name, Klasse, Geburtsdatum, Status, Aktiv, Institutsleitung, Datum der Ausstellung, Gutachten, Teilnehmer, Lehrgang / Klasse, GEB-DATUM, STATUS, Leistungsbewertung, Fachbereich, Pkt, Note, Verhalten, Pünktlichkeit, Mitarbeit, Pädagogisches Gutachten, OFFIZIELLES ZEUGNIS
      - Fächer: ${activeSubjects.join(', ')}
      - Bewertungswerte: Sehr gut, Gut, Befriedigend, Ausreichend, Mangelhaft, Ungenügend
      - Pädagogisches Gutachten: "${currentParticipation.remarks}"
      
      Antworte STRENG in folgendem JSON-Format:
      {
        "title": "Übersetzter Titel",
        "labels": { 
          "Name": "...", 
          "Klasse": "...", 
          "Geburtsdatum": "...", 
          "Status": "...", 
          "Aktiv": "...", 
          "Leitung": "...", 
          "Datum": "...", 
          "Gutachten": "...",
          "Teilnehmer": "...",
          "Fachbereich": "...",
          "Pkt": "...",
          "Note": "...",
          "Verhalten": "...",
          "Pünktlichkeit": "...",
          "Mitarbeit": "...",
          "OFFIZIELLES ZEUGNIS": "...",
          "Leistungsbewertung": "..."
        },
        "subjects": { ${activeSubjects.map(s => `"${s}": "..."`).join(', ')} },
        "values": { 
          "Sehr gut": "...", 
          "Gut": "...", 
          "Befriedigend": "...", 
          "Ausreichend": "...", 
          "Mangelhaft": "...", 
          "Ungenügend": "..." 
        },
        "remarks": "Übersetzter Text des Gutachtens"
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const result = JSON.parse(response.text || '{}');
      setTranslatedData(result);
    } catch (error) {
      console.error("Translation Error:", error);
      alert("Übersetzung fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePrint = () => {
    if (!reportRef.current) return;

    // Reset scale first to measure real height
    setPrintScale(1);
    
    // Small delay to allow React to render with scale 1 if it was different
    setTimeout(() => {
      const element = reportRef.current;
      if (!element) return;

      const contentHeight = element.scrollHeight;
      // A4 height is 297mm. At 96 DPI, that's ~1123px.
      // With 25mm top and 20mm bottom margin, we have ~252mm available height (~952px).
      const availableHeightPx = 952; 

      if (contentHeight > availableHeightPx) {
        // Calculate required scale to fit on 1 page
        const requiredScale = availableHeightPx / contentHeight;
        
        // Only scale if it's within the 88% - 90% range (as requested, but we'll allow up to 88% to be safe)
        // If it's even longer, we disable scaling and let it break across pages.
        if (requiredScale >= 0.88) {
          setPrintScale(requiredScale);
        } else {
          setPrintScale(1); // Fallback to multi-page
        }
      } else {
        setPrintScale(1);
      }

      // Trigger print
      window.print();
    }, 100);
  };

  if (!student) return <div className="p-20 text-center font-black uppercase text-red-500">Datensatz nicht gefunden.</div>;

  const isRtl = targetLang.rtl;

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white pb-32 font-sans no-scrollbar">
      {/* Control Panel */}
      <div className="no-print max-w-[210mm] mx-auto flex flex-col items-center py-8 gap-6 px-4">
        <div className="w-full flex justify-between items-center">
           <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-madrassah-950 font-black uppercase text-[10px] tracking-widest bg-white px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all shadow-sm border border-gray-100">
             <ChevronLeft size={18} /> Zurück
           </button>
           
           <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
              <button onClick={() => { setReportType('Halbjahr'); setTranslatedData(null); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'Halbjahr' ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}>Halbjahr</button>
              <button onClick={() => { setReportType('Abschluss'); setTranslatedData(null); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'Abschluss' ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}>Hauptzeugnis</button>
           </div>

           <button onClick={handlePrint} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 shadow-xl hover:bg-emerald-700 transition-all">
             <Printer size={20} /> Drucken
           </button>
        </div>

        {/* Sprach-Selector Hub */}
        <div className="w-full bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Languages size={20}/></div>
              <div>
                 <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Sprachoptionen</p>
                 <h4 className="text-sm font-black uppercase italic text-madrassah-950">Zeugnis übersetzen</h4>
              </div>
           </div>

           <div className="flex flex-wrap justify-center gap-2">
              {LANGUAGES.map(l => (
                <button 
                  key={l.id} 
                  onClick={() => { setTargetLang(l); if(l.id === 'de') setTranslatedData(null); }}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${targetLang.id === l.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                   {l.name}
                </button>
              ))}
           </div>

           <button 
             onClick={handleTranslate}
             disabled={isTranslating || targetLang.id === 'de'}
             className="bg-madrassah-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl hover:bg-black transition-all disabled:opacity-30 group"
           >
              {isTranslating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />}
              {isTranslating ? 'Übersetze...' : 'KI-Übersetzung'}
           </button>
        </div>
      </div>

      {/* Official Certificate Template - Fixed A4 Dimensions */}
      <div 
        className="mx-auto w-full max-w-[210mm] print:max-w-none print:w-[210mm] print-container" 
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{ '--print-scale': printScale } as React.CSSProperties}
      >
        <div 
          ref={reportRef}
          className="bg-white p-[15mm] print:p-0 border-[6px] border-black relative text-black leading-tight shadow-2xl print:shadow-none min-h-[297mm] flex flex-col overflow-visible report-content"
        >
          
          {/* Wasserzeichen */}
          <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none">
             <LogoIcon className="w-[160mm] h-[160mm] transform rotate-12" />
          </div>

          <div className="border-[2px] border-black p-8 print:p-6 flex-1 flex flex-col relative z-10">
            
            {/* Header */}
            <div className={`flex justify-between items-start mb-10 border-b-[4px] border-black pb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-20 h-20 p-2 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                   <LogoIcon className="w-14 h-14" />
                </div>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <div className="text-3xl font-black uppercase tracking-tight font-serif leading-none">مدرسة الهدى</div>
                  <div className="text-xl font-black uppercase tracking-[0.1em] mt-1">MADRASSAH AL HUDA</div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mt-1 italic">Akademie für Islamische Bildung Hamburg</p>
                </div>
              </div>
              <div className={isRtl ? 'text-left' : 'text-right'}>
                 <div className="bg-black text-white px-4 py-1.5 text-[10px] font-black uppercase rounded-lg mb-2">
                    {translatedData?.labels?.['OFFIZIELLES ZEUGNIS'] || 'OFFIZIELLES ZEUGNIS'}
                 </div>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">STAMM-ID: {student.id}</p>
              </div>
            </div>

            <h1 className="text-center text-4xl font-black mb-10 italic uppercase tracking-tighter leading-none underline underline-offset-[12px] decoration-[3px]">
              {translatedData?.title || (reportType === 'Halbjahr' ? 'Halbjahres-Zeugnis' : 'Akademisches Jahreszeugnis')}
            </h1>

            {/* Student Info */}
            <div className="grid grid-cols-2 border-2 border-black mb-8 font-sans">
              <div className={`border-black p-4 bg-gray-50/30 ${isRtl ? 'border-l-2' : 'border-r-2'}`}>
                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">{translatedData?.labels?.['Name'] || 'Teilnehmer'}</p>
                <p className="font-black text-2xl uppercase italic tracking-tight leading-none">{student.firstName} {student.lastName}</p>
              </div>
              <div className="p-4">
                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">{translatedData?.labels?.['Klasse'] || 'Lehrgang / Klasse'}</p>
                <p className="font-black text-2xl uppercase tracking-widest leading-none">{student.className}</p>
              </div>
              <div className="p-3 border-t-2 border-black col-span-2 flex justify-between items-center text-[10px] font-bold">
                <span>{translatedData?.labels?.['Geburtsdatum'] || 'GEB-DATUM'}: {new Date(student.birthDate).toLocaleDateString('de-DE')}</span>
                <span className="flex items-center gap-2">
                   <ShieldCheck size={12} className="text-emerald-600" /> 
                   {translatedData?.labels?.['Status'] || 'STATUS'}: {translatedData?.labels?.['Aktiv'] || 'AKTIV'}
                </span>
              </div>
            </div>

            {/* Grades Tables */}
            <div className="mb-8 grid grid-cols-2 gap-4">
               {[leftSubjects, rightSubjects].map((columnSubjects, colIdx) => (
                 <div key={colIdx} className="border-2 border-black overflow-hidden rounded-xl h-fit">
                    <div className="bg-black text-white text-center py-2 font-black uppercase tracking-[0.3em] text-[8px]">
                       {translatedData?.labels?.['Leistungsbewertung'] || 'Leistungsbewertung'}
                    </div>
                    <table className="w-full text-sm border-collapse">
                       <thead>
                          <tr className="bg-gray-100 border-b-2 border-black text-[8px] uppercase font-black">
                             <th className={`p-2 text-left border-black italic ${isRtl ? 'border-l-2 text-right' : 'border-r-2 text-left'}`}>
                                {translatedData?.labels?.['Fachbereich'] || 'Fachbereich'}
                             </th>
                             <th className={`p-2 text-center border-black ${isRtl ? 'border-l-2' : 'border-r-2'}`}>
                                {translatedData?.labels?.['Pkt'] || 'Pkt'}
                             </th>
                             <th className={`p-2 ${isRtl ? 'text-left pl-4' : 'text-right pr-4'}`}>
                                {translatedData?.labels?.['Note'] || 'Note'}
                             </th>
                          </tr>
                       </thead>
                       <tbody>
                         {columnSubjects.map(subj => {
                           const ptsH = getPointsForTerm(subj, 'Halbjahr');
                           const ptsA = getPointsForTerm(subj, 'Abschluss');
                           
                           let totalPoints: number | string;
                           let maxPossible: number;

                           if (reportType === 'Halbjahr') {
                             totalPoints = ptsH;
                             maxPossible = 20;
                           } else {
                             if (ptsH === -1 && ptsA === -1) {
                               totalPoints = -1;
                             } else {
                               totalPoints = (ptsH === -1 ? 0 : ptsH) + (ptsA === -1 ? 0 : ptsA);
                             }
                             maxPossible = 40;
                           }

                           const displaySubj = translatedData?.subjects?.[subj] || subj;

                           return (
                             <tr key={subj} className="border-b border-black/10 last:border-0 h-9">
                               <td className={`p-2 font-black uppercase italic text-[10px] border-black ${isRtl ? 'border-l-2 text-right' : 'border-r-2 text-left'}`}>
                                  {displaySubj}
                               </td>
                               <td className={`p-2 text-center font-black text-base border-black whitespace-nowrap ${isRtl ? 'border-l-2' : 'border-r-2'}`}>
                                  {totalPoints === -1 ? '*' : totalPoints} <span className="text-[8px] text-gray-300">/ {maxPossible}</span>
                               </td>
                               <td className={`p-2 font-black text-base italic text-madrassah-950 whitespace-nowrap ${isRtl ? 'text-left pl-4' : 'text-right pr-4'}`}>
                                  {getGermanGrade(typeof totalPoints === 'number' ? totalPoints : 0, maxPossible)}
                               </td>
                             </tr>
                           );
                         })}
                         {/* Fill empty rows to keep tables same height if needed */}
                         {columnSubjects.length < Math.max(leftSubjects.length, rightSubjects.length) && (
                           <tr className="h-9">
                             <td colSpan={3}></td>
                           </tr>
                         )}
                       </tbody>
                    </table>
                 </div>
               ))}
            </div>

            {/* Social Competence */}
            <div className="mb-8 border-2 border-black overflow-hidden rounded-xl bg-gray-50/20">
               <div className="p-6 grid grid-cols-3 gap-6 text-center">
                  <div>
                    <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">
                       {translatedData?.labels?.['Verhalten'] || 'Verhalten'}
                    </span>
                    <span className="font-black text-lg uppercase italic text-emerald-700 leading-none">
                       {translatedData?.values?.[currentParticipation.verhalten] || currentParticipation.verhalten}
                    </span>
                  </div>
                  <div className="border-x border-black/10">
                    <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">
                       {translatedData?.labels?.['Pünktlichkeit'] || 'Pünktlichkeit'}
                    </span>
                    <span className="font-black text-lg uppercase italic text-emerald-700 leading-none">
                       {translatedData?.values?.[currentParticipation.puenktlichkeit] || currentParticipation.puenktlichkeit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">
                       {translatedData?.labels?.['Mitarbeit'] || 'Mitarbeit'}
                    </span>
                    <span className="font-black text-lg uppercase italic text-emerald-700 leading-none">
                       {translatedData?.values?.[currentParticipation.vortrag] || currentParticipation.vortrag}
                    </span>
                  </div>
               </div>
            </div>

            {/* Remarks */}
            <div className="border-2 border-black mb-10 flex-1 flex flex-col rounded-xl overflow-hidden shadow-inner min-h-[120px]">
               <div className="bg-gray-100 border-b-2 border-black px-4 py-2 font-black uppercase text-[9px] tracking-[0.2em] flex items-center gap-2">
                  <Info size={12} className="text-indigo-600" /> 
                  {translatedData?.labels?.['Gutachten'] || 'Pädagogisches Gutachten'}
               </div>
               <div className={`p-6 flex-1 italic leading-relaxed text-lg font-serif text-gray-800 bg-white ${isRtl ? 'text-right' : 'text-left'}`}>
                  "{translatedData?.remarks || currentParticipation.remarks}"
               </div>
            </div>

            {/* Footer Signatures */}
            <div className={`grid grid-cols-2 gap-24 pt-12 pb-6 mt-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
               <div className="text-center">
                  <div className="h-[1.5px] bg-black w-full mb-3"></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                     {translatedData?.labels?.['Leitung'] || 'Institutsleitung'}
                  </p>
                  <p className="text-[8px] font-bold text-gray-400 italic">Sarfraz Azmat Butt</p>
               </div>
               <div className="text-center">
                  <div className="h-[1.5px] bg-black w-full mb-3"></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                     {translatedData?.labels?.['Datum'] || 'Datum der Ausstellung'}
                  </p>
                  <p className="text-lg font-black italic">{new Date().toLocaleDateString('de-DE')}</p>
               </div>
            </div>

            {/* Bottom Bar */}
            <div className={`pt-4 border-t border-dotted border-gray-200 flex justify-between items-center text-[7px] font-black text-gray-300 uppercase tracking-[0.4em] ${isRtl ? 'flex-row-reverse' : ''}`}>
               <span>Campus Ledger v4.5 • OFFICIAL TRANSCRIPT</span>
               <div className="flex items-center gap-4">
                  <span>REF: {student.id}-{reportType === 'Halbjahr' ? 'H1' : 'FY'}</span>
                  <LogoIcon className="w-6 h-6 opacity-20" />
               </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0;
          }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            margin: 0;
            padding: 0;
          }
          .no-print { display: none !important; }
          
          .print-container {
            width: 210mm !important;
            height: 297mm !important;
            position: relative;
            margin: 0 auto !important;
            padding: 0 !important;
            page-break-after: always;
          }

          .report-content {
            border: 6px solid black !important;
            padding: 10mm !important;
            transform: scale(var(--print-scale, 1));
            transform-origin: top center;
            width: 210mm !important;
            min-height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
          }

          /* Table repeat header and avoid row breaks */
          table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          
          /* Ensure content doesn't get cut off */
          .flex-1 { flex: 1 1 auto !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportCard;
