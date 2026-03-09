
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  Save, 
  UserPlus, 
  GraduationCap, 
  Users,
  ShieldCheck,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  ClipboardPaste,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Student, Gender, PaymentMethod, User, WaitlistEntry } from '../types';
import { getFamilyId } from '../lib/studentUtils';

interface StudentRegistrationProps {
  students: Student[];
  waitlist?: WaitlistEntry[];
  onRegisterBulk?: (students: Student[]) => Promise<boolean>;
  onUpdate?: (student: Student) => Promise<boolean>;
  onRemoveWaitlistEntry?: (id: string) => void;
}

interface ParticipantForm {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  className: string;
  lessonTimes: string;
}

const StudentRegistration: React.FC<StudentRegistrationProps> = ({ 
  students, 
  waitlist = [], 
  onRegisterBulk, 
  onUpdate, 
  onRemoveWaitlistEntry
}) => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const waitlistId = searchParams.get('waitlistId');
  const initialType = searchParams.get('type') === 'ADULT' ? 'ADULT' : 'KIDS';
  
  const isEditMode = !!studentId;
  const currentYear = new Date().getFullYear();
  
  const lessonOptions = useMemo(() => [
    'Sa & So 11:00 bis 14:00 Uhr',
    'Mo bis Do 17:00 bis 19:30 Uhr'
  ], []);

  const kidsJClasses = ['J-1a', 'J-1b', 'J-2', 'J-3', 'J-4', 'J-5', 'J-6', 'J-Hifz'];
  const kidsMClasses = ['M-1a', 'M-1b', 'M-2', 'M-3', 'M-4', 'M-5', 'M-6', 'M-Hifz'];
  const adultJClasses = ['J-1', 'J-2', 'J-3', 'J-4', 'J-5', 'J-6', 'J-1a', 'J-1b', 'J-Imam', 'J-Ijazah', 'J-Ilmiyyah', 'Arabisch Modul 1', 'Arabisch Modul 2', 'Arabisch Modul 3'];
  const adultMClasses = ['M-1', 'M-2', 'M-3', 'M-4', 'M-5', 'M-6', 'M-1a', 'M-1b', 'M-Imam', 'M-Ijazah', 'M-Ilmiyyah', 'Arabisch Modul 1', 'Arabisch Modul 2', 'Arabisch Modul 3'];

  const getFilteredClasses = (pGender: Gender, type: 'KIDS' | 'ADULT') => {
    if (type === 'KIDS') {
      return (pGender === 'Junge' || pGender === 'Mann') ? kidsJClasses : kidsMClasses;
    } else {
      return (pGender === 'Junge' || pGender === 'Mann') ? adultJClasses : adultMClasses;
    }
  };

  const [regMode, setRegMode] = useState<'SINGLE' | 'IMPORT'>('SINGLE');
  const [regType, setRegType] = useState<'KIDS' | 'ADULT'>(initialType);
  const [lastTypeParam, setLastTypeParam] = useState<string | null>(searchParams.get('type'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<Student[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [bulkClass, setBulkClass] = useState(initialType === 'KIDS' ? 'J-1a' : 'J-1');
  const [bulkLessonTimes, setBulkLessonTimes] = useState(lessonOptions[0]);

  // Geteilte Daten für die ganze Familie/Anmeldung
  const [sharedData, setSharedData] = useState({
    guardian: '',
    address: '',
    whatsapp: '',
    paymentMethod: 'Bar' as PaymentMethod,
  });

  // Liste der Teilnehmer für Einzelaufnahme
  const [participants, setParticipants] = useState<ParticipantForm[]>([{
    firstName: '',
    lastName: '',
    gender: initialType === 'KIDS' ? 'Junge' : 'Mann',
    birthDate: '',
    className: initialType === 'KIDS' ? 'J-1a' : 'J-Imam',
    lessonTimes: lessonOptions[0]
  }]);

  useEffect(() => {
    if (!isEditMode) {
      const typeParam = searchParams.get('type');
      if (typeParam !== lastTypeParam) {
        const type = typeParam === 'ADULT' ? 'ADULT' : 'KIDS';
        Promise.resolve().then(() => {
          setRegType(type);
          setRegMode('SINGLE');
          setLastTypeParam(typeParam);
          setParticipants([{
            firstName: '',
            lastName: '',
            gender: type === 'KIDS' ? 'Junge' : 'Mann',
            birthDate: '',
            className: type === 'KIDS' ? 'J-1a' : 'J-Imam',
            lessonTimes: lessonOptions[0]
          }]);
          setSharedData({
            guardian: '',
            address: '',
            whatsapp: '',
            paymentMethod: 'Bar',
          });
        });
      }
    }
  }, [searchParams, isEditMode, lastTypeParam, lessonOptions]);

  useEffect(() => {
    if (isEditMode) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        Promise.resolve().then(() => {
          setSharedData({
            guardian: student.guardian || '',
            address: student.address || '',
            whatsapp: student.whatsapp || '',
            paymentMethod: student.paymentMethod || 'Bar',
          });
          setParticipants([{
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            gender: student.gender || 'Junge',
            birthDate: student.birthDate || '',
            className: student.className || '',
            lessonTimes: student.lessonTimes || lessonOptions[0]
          }]);
          setRegType(student.gender === 'Mann' || student.gender === 'Frau' ? 'ADULT' : 'KIDS');
        });
      }
    } else if (waitlistId && waitlist.length > 0) {
      const entry = waitlist.find(w => w.id === waitlistId);
      if (entry) {
        Promise.resolve().then(() => {
          setSharedData({
            guardian: entry.guardianName || '',
            address: entry.address || '',
            whatsapp: entry.whatsapp || '',
            paymentMethod: 'Bar',
          });
          setParticipants(entry.participants.map(p => ({
            firstName: p.firstName,
            lastName: p.lastName,
            gender: p.gender,
            birthDate: p.birthDate,
            className: p.preferredCourses[0] || (p.gender === 'Junge' || p.gender === 'Mann' ? 'J-1a' : 'M-1a'),
            lessonTimes: lessonOptions[0]
          })));
          setRegType(entry.type === 'ADULT' ? 'ADULT' : 'KIDS');
        });
      }
    }
  }, [isEditMode, studentId, students, waitlistId, waitlist, lessonOptions]);

  const handleRegTypeChange = (type: 'KIDS' | 'ADULT') => {
    setRegType(type);
    setBulkClass(type === 'KIDS' ? 'J-1a' : 'J-1');
    setParticipants(prev => prev.map((p: ParticipantForm) => {
      let newGender: Gender = p.gender;
      if (type === 'KIDS') {
        if (p.gender === 'Mann') newGender = 'Junge';
        if (p.gender === 'Frau') newGender = 'Mädchen';
      } else {
        if (p.gender === 'Junge') newGender = 'Mann';
        if (p.gender === 'Mädchen') newGender = 'Frau';
      }
      const available = getFilteredClasses(newGender, type);
      return { 
        ...p, 
        gender: newGender,
        className: available.includes(p.className) ? p.className : (available[0] || p.className)
      };
    }));
  };

  // --- IMPORT LOGIK ---
  const handleProcessImport = () => {
    if (!importText.trim()) return;

    const rows = importText.split('\n').filter(line => line.trim() !== '');
    const parsedStudents: Student[] = rows.map((row, idx) => {
      // Trennung durch Tab (Excel/Google Sheets Standard beim Kopieren) oder Semikolon
      const columns = row.split(/\t|;/).map(c => c.trim());
      
      // MAPPING: Vorname | Nachname | Geburtsdatum | Klasse | Vormund
      const fName = columns[0] || 'Unbekannt';
      const lName = columns[1] || '***';
      const bDate = columns[2] || '2000-01-01';
      const cName = columns[3] || 'Klasse-Fehlt';
      const guard = columns[4] || '***';

      const isFemale = cName.startsWith('M-') || cName.toLowerCase().includes('mädchen') || cName.toLowerCase().includes('frau');
      const gender: Gender = isFemale 
        ? (regType === 'ADULT' ? 'Frau' : 'Mädchen') 
        : (regType === 'ADULT' ? 'Mann' : 'Junge');

      // Validierung des Datumsformats (YYYY-MM-DD)
      let finalBDate = bDate;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(bDate)) {
        // Falls das Datum kein Datum ist (z.B. ein Name), setzen wir einen Platzhalter
        finalBDate = '2000-01-01';
      }

      const tempStudent: Student = {
        id: `S-${Date.now().toString().slice(-4)}-${idx}`,
        familyId: '', // Placeholder
        firstName: fName,
        lastName: lName,
        gender: gender,
        birthDate: finalBDate,
        className: cName,
        guardian: guard,
        address: '***',
        whatsapp: '***',
        lessonTimes: lessonOptions[0],
        registrationDate: new Date().toISOString(),
        status: 'active',
        feesPaidMonthly: {}
      };

      return {
        ...tempStudent,
        familyId: getFamilyId(tempStudent)
      };
    });

    setImportPreview(parsedStudents);
    setSelectedIndices([]);
  };

  const handleSaveImport = async () => {
    if (importPreview.length === 0) return;
    setIsSubmitting(true);
    if (onRegisterBulk) {
      const success = await onRegisterBulk(importPreview);
      if (success) {
        if (waitlistId && onRemoveWaitlistEntry) {
          onRemoveWaitlistEntry(waitlistId);
        }
        navigate('/students');
      }
    }
    setIsSubmitting(false);
  };

  const updateImportStudent = (index: number, field: keyof Student, value: string | Gender) => {
    const next = [...importPreview];
    const updatedStudent = { ...next[index], [field]: value };
    
    // If class name changes, try to update gender automatically if it's a standard class
    if (field === 'className') {
      const isFemale = value.startsWith('M-') || value.toLowerCase().includes('mädchen') || value.toLowerCase().includes('frau');
      updatedStudent.gender = isFemale 
        ? (regType === 'ADULT' ? 'Frau' : 'Mädchen') 
        : (regType === 'ADULT' ? 'Mann' : 'Junge');
    }

    // Recalculate familyId if grouping fields change
    if (field === 'lastName' || field === 'guardian' || field === 'whatsapp') {
      updatedStudent.familyId = getFamilyId(updatedStudent);
    }

    if (field === 'gender') {
      const available = getFilteredClasses(value as Gender, regType);
      if (!available.includes(updatedStudent.className)) {
        updatedStudent.className = available[0] || updatedStudent.className;
      }
    }

    next[index] = updatedStudent;
    setImportPreview(next);
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIndices.length === importPreview.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(importPreview.map((_, i) => i));
    }
  };

  const applyBulkClass = () => {
    if (selectedIndices.length === 0) return;
    const next = [...importPreview];
    selectedIndices.forEach(idx => {
      next[idx].className = bulkClass;
      const isFemale = bulkClass.startsWith('M-') || bulkClass.toLowerCase().includes('mädchen') || bulkClass.toLowerCase().includes('frau');
      next[idx].gender = isFemale 
        ? (regType === 'ADULT' ? 'Frau' : 'Mädchen') 
        : (regType === 'ADULT' ? 'Mann' : 'Junge');
    });
    setImportPreview(next);
  };

  const applyBulkLessonTimes = () => {
    if (selectedIndices.length === 0) return;
    const next = [...importPreview];
    selectedIndices.forEach(idx => {
      next[idx].lessonTimes = bulkLessonTimes;
    });
    setImportPreview(next);
  };

  const deleteSelected = () => {
    if (selectedIndices.length === 0) return;
    if (window.confirm(`${selectedIndices.length} Schüler wirklich aus der Liste entfernen?`)) {
      setImportPreview(prev => prev.filter((_, i) => !selectedIndices.includes(i)));
      setSelectedIndices([]);
    }
  };

  // --- EINZELAUFNAHME LOGIK ---
  const addParticipant = () => {
    if (regType === 'ADULT') return;
    setParticipants([...participants, {
      firstName: '',
      lastName: participants[0]?.lastName || '',
      gender: 'Junge',
      birthDate: '',
      className: 'J-1a',
      lessonTimes: lessonOptions[0]
    }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, field: keyof ParticipantForm, value: string | Gender) => {
    const next = [...participants];
    next[index] = { ...next[index], [field]: value } as ParticipantForm;
    if (field === 'gender') {
      const available = getFilteredClasses(value as Gender, regType);
      if (available.length > 0) next[index].className = available[0];
    }
    
    // For adults, sync guardian name with first/last name
    if (regType === 'ADULT' && (field === 'firstName' || field === 'lastName')) {
      const updatedP = next[index];
      setSharedData(prev => ({
        ...prev,
        guardian: `${updatedP.firstName} ${updatedP.lastName}`.trim()
      }));
    }
    
    setParticipants(next);
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const entriesToSave: Student[] = participants.map((p, index) => {
      const tempStudent: Student = {
        ...sharedData,
        ...p,
        id: (isEditMode && index === 0) ? studentId! : `S-${currentYear.toString().slice(-2)}-${Math.floor(1000 + Math.random() * 8999)}`,
        familyId: '', // Placeholder
        status: 'active',
        registrationDate: new Date().toISOString(),
        feesPaidMonthly: {}
      };
      return {
        ...tempStudent,
        familyId: getFamilyId(tempStudent)
      };
    });

    if (isEditMode && onUpdate) await onUpdate(entriesToSave[0]);
    else if (onRegisterBulk) {
      const success = await onRegisterBulk(entriesToSave);
      if (success && waitlistId && onRemoveWaitlistEntry) {
        onRemoveWaitlistEntry(waitlistId);
      }
    }
    
    navigate('/students');
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-700">
      {/* Modus Umschalter */}
      <div className="flex items-center justify-between mb-8 px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-madrassah-950 font-bold uppercase text-[10px] tracking-widest hover:bg-white p-3 rounded-2xl transition-all">
          <ArrowLeft size={16} /> Abbrechen
        </button>
        
        <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-[2rem] border border-gray-100 shadow-sm">
           <button onClick={() => setRegMode('SINGLE')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${regMode === 'SINGLE' ? 'bg-madrassah-950 text-white shadow-lg' : 'text-gray-400'}`}>Manuelle Aufnahme</button>
           {!isEditMode && (
             <button onClick={() => setRegMode('IMPORT')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${regMode === 'IMPORT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>Listen-Import (Google Sheets)</button>
           )}
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Sichere Verbindung</span>
        </div>
      </div>

      {regMode === 'SINGLE' ? (
        <>
          <div className="bg-madrassah-950 p-12 text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden mb-10 border-4 border-white/10">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><GraduationCap size={200} /></div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">{isEditMode ? 'Stammdaten korrigieren' : (regType === 'KIDS' ? 'Neuaufnahme Kinder' : 'Neuaufnahme Erwachsene')}</h2>
            <div className="flex bg-white/10 p-1 rounded-2xl w-fit mt-6">
               <button type="button" onClick={() => handleRegTypeChange('KIDS')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${regType === 'KIDS' ? 'bg-white text-madrassah-950 shadow-lg' : 'text-white/40'}`}>Kinder</button>
               <button type="button" onClick={() => handleRegTypeChange('ADULT')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${regType === 'ADULT' ? 'bg-white text-madrassah-950 shadow-lg' : 'text-white/40'}`}>Erwachsene</button>
            </div>
          </div>

          <form onSubmit={handleSubmitSingle} className="space-y-10">
            <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-xl border border-gray-100 space-y-12">
               <h3 className="text-xl font-black uppercase text-madrassah-950 italic flex items-center gap-4"><Users size={24} className="text-indigo-600" /> 1. Kontakt- & Vertragsdaten</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {regType === 'KIDS' && (
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Vormund</label>
                       <input required value={sharedData.guardian} onChange={e => setSharedData({...sharedData, guardian: e.target.value})} className="w-full bg-gray-50 border-2 p-5 rounded-3xl font-bold outline-none focus:border-madrassah-950 shadow-inner" placeholder="Vorname Nachname" />
                    </div>
                  )}
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-1">WhatsApp Kontakt</label>
                     <input required value={sharedData.whatsapp} onChange={e => setSharedData({...sharedData, whatsapp: e.target.value})} className="w-full bg-gray-50 border-2 p-5 rounded-3xl font-bold outline-none focus:border-madrassah-950 shadow-inner" placeholder="+49 1..." />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Anschrift</label>
                     <input required value={sharedData.address} onChange={e => setSharedData({...sharedData, address: e.target.value})} className="w-full bg-gray-50 border-2 p-5 rounded-3xl font-bold outline-none focus:border-madrassah-950 shadow-inner" placeholder="Straße, Nr, PLZ & Stadt" />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-gray-50 pt-10">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Zahlungsart</label>
                     <select 
                       value={sharedData.paymentMethod} 
                       onChange={e => setSharedData({...sharedData, paymentMethod: e.target.value as any})}
                       className="w-full bg-gray-50 border-2 p-5 rounded-3xl font-black uppercase text-[11px] outline-none focus:border-madrassah-950 shadow-inner"
                     >
                       <option value="Bar">Barzahlung</option>
                       <option value="Überweisung">Überweisung</option>
                     </select>
                   </div>
                </div>
            </div>

            <div className="space-y-8">
               <div className="flex justify-between items-center px-4">
                  <h3 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter flex items-center gap-4"><UserPlus size={36} className="text-indigo-600" /> 2. Teilnehmer ({participants.length})</h3>
                  {!isEditMode && regType === 'KIDS' && (
                    <button type="button" onClick={addParticipant} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 shadow-xl hover:bg-black transition-all"><Plus size={18} /> Weiteres Kind</button>
                  )}
               </div>

               {participants.map((p, idx) => (
                  <div key={idx} className="bg-white rounded-[4rem] p-10 md:p-14 shadow-xl border border-gray-100 relative group animate-in zoom-in duration-500">
                     <div className="flex justify-between items-start mb-12">
                        <div className="flex items-center gap-6">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${p.gender === 'Junge' || p.gender === 'Mann' ? 'bg-indigo-950' : 'bg-pink-600'}`}>{idx + 1}</div>
                           <h4 className="text-3xl font-black uppercase italic text-madrassah-950">{regType === 'ADULT' ? 'Persönliche Daten' : `Kind #${idx + 1}`}</h4>
                        </div>
                        {participants.length > 1 && !isEditMode && (
                          <button type="button" onClick={() => removeParticipant(idx)} className="p-4 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={24}/></button>
                        )}
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                        <div className="space-y-4"><label className="text-[10px] font-black uppercase text-gray-400">Vorname</label><input required value={p.firstName} onChange={e => updateParticipant(idx, 'firstName', e.target.value)} className="w-full bg-gray-50 border-2 p-5 rounded-3xl font-bold outline-none focus:bg-white" /></div>
                        <div className="space-y-4"><label className="text-[10px] font-black uppercase text-gray-400">Nachname</label><input required value={p.lastName} onChange={e => updateParticipant(idx, 'lastName', e.target.value)} className="w-full bg-gray-50 border-2 p-5 rounded-3xl font-bold outline-none focus:bg-white" /></div>
                        
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-gray-400">Geschlecht</label>
                          <div className="flex bg-gray-50 p-1 rounded-2xl border-2 border-gray-100">
                            <button 
                              type="button"
                              onClick={() => updateParticipant(idx, 'gender', regType === 'KIDS' ? 'Junge' : 'Mann')}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${p.gender === 'Junge' || p.gender === 'Mann' ? 'bg-madrassah-950 text-white shadow-lg' : 'text-gray-400 hover:text-madrassah-950'}`}
                            >
                              J
                            </button>
                            <button 
                              type="button"
                              onClick={() => updateParticipant(idx, 'gender', regType === 'KIDS' ? 'Mädchen' : 'Frau')}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${p.gender === 'Mädchen' || p.gender === 'Frau' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-pink-600'}`}
                            >
                              M
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4"><label className="text-[10px] font-black uppercase text-gray-400">Geburtsdatum</label><input required type="date" value={p.birthDate} onChange={e => updateParticipant(idx, 'birthDate', e.target.value)} className="w-full bg-gray-50 border-2 p-5 rounded-3xl font-bold outline-none" /></div>
                        <div className="space-y-4"><label className="text-[10px] font-black uppercase text-gray-400">Klasse</label><select value={p.className} onChange={e => updateParticipant(idx, 'className', e.target.value)} className="w-full bg-gray-50 border-2 p-5 rounded-3xl font-black uppercase text-[11px] outline-none">{getFilteredClasses(p.gender, regType).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="space-y-4"><label className="text-[10px] font-black uppercase text-gray-400">Unterrichtszeit</label><select value={p.lessonTimes} onChange={e => updateParticipant(idx, 'lessonTimes', e.target.value)} className="w-full bg-gray-50 border-2 p-5 rounded-3xl font-black uppercase text-[11px] outline-none">{lessonOptions.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                     </div>
                  </div>
               ))}
            </div>

            <div className="flex flex-col items-center pt-8">
               <button type="submit" disabled={isSubmitting} className="bg-emerald-600 text-white px-24 py-8 rounded-[3rem] font-black uppercase text-[15px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-8 group disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={32} /> : <><Save size={32}/> {isEditMode ? 'Änderungen Speichern' : 'Jetzt Speichern'}</>}
               </button>
            </div>
          </form>
        </>
      ) : (
        <div className="space-y-10">
           {/* IMPORT WIZARD */}
           <div className="bg-indigo-950 p-12 text-white rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><FileSpreadsheet size={300} /></div>
              <div className="relative z-10 flex-1">
                 <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Smart List-Import</h2>
                 <p className="text-indigo-200 text-sm mt-4 font-medium italic max-w-xl leading-relaxed">
                   Kopiere deine Daten aus Google Sheets (Vorname | Nachname | Geburtsdatum | Klasse | Vormund) und füge sie hier ein. Fehlende Daten werden automatisch mit *** markiert.
                 </p>
                 <div className="mt-8 flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"><CheckCircle2 size={16}/> Auto-Fill aktiv (***)</div>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 bg-white p-10 rounded-[3.5rem] shadow-xl border border-gray-100 flex flex-col gap-8">
                 <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                    <div className="w-12 h-12 bg-gray-50 text-madrassah-950 rounded-2xl flex items-center justify-center shadow-inner border"><ClipboardPaste size={24}/></div>
                    <h3 className="text-xl font-black uppercase italic text-madrassah-950 leading-none">1. Daten einfügen</h3>
                 </div>
                 <textarea 
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    placeholder="Vorname	Nachname	2015-05-10	J-1a	Ali Butt..."
                    className="w-full h-80 p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] outline-none font-mono text-xs focus:bg-white focus:border-indigo-600 transition-all custom-scrollbar"
                 />
                 <button onClick={handleProcessImport} className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-4">
                    Daten verarbeiten <ChevronRight size={18}/>
                 </button>
              </div>

              <div className="lg:col-span-7 space-y-6">
                  {importPreview.length > 0 && (
                    <div className={`bg-indigo-950 p-6 rounded-3xl text-white flex flex-wrap items-center justify-between gap-6 transition-all duration-500 ${selectedIndices.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-50 pointer-events-none'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-indigo-400">{selectedIndices.length}</div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Ausgewählt</p>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-1 justify-end">
                        <div className="flex items-center gap-2">
                          <select 
                            value={bulkClass} 
                            onChange={e => setBulkClass(e.target.value)}
                            className="bg-white/10 border border-white/10 px-4 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white/20"
                          >
                            <optgroup label="Jungen" className="text-black">
                              {kidsJClasses.map(c => <option key={c} value={c}>{c}</option>)}
                              {adultJClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                            <optgroup label="Mädchen" className="text-black">
                              {kidsMClasses.map(c => <option key={c} value={c}>{c}</option>)}
                              {adultMClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                          </select>
                          <button onClick={applyBulkClass} className="bg-white text-indigo-950 px-6 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-400 hover:text-white transition-all">Klasse zuweisen</button>
                        </div>

                        <div className="flex items-center gap-2">
                          <select 
                            value={bulkLessonTimes} 
                            onChange={e => setBulkLessonTimes(e.target.value)}
                            className="bg-white/10 border border-white/10 px-4 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white/20"
                          >
                            {lessonOptions.map((opt: string) => <option key={opt} value={opt} className="text-black">{opt}</option>)}
                          </select>
                          <button onClick={applyBulkLessonTimes} className="bg-white text-indigo-950 px-6 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-400 hover:text-white transition-all">Zeit zuweisen</button>
                        </div>

                        <button onClick={deleteSelected} className="bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  )}
                 {importPreview.length > 0 ? (
                    <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-500">
                       <div className="p-10 border-b bg-emerald-50/50 flex justify-between items-center">
                          <div>
                             <h4 className="text-2xl font-black text-madrassah-950 uppercase italic leading-none">{importPreview.length} Schüler erkannt</h4>
                             <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest mt-2">Bereit zum Speichern</p>
                          </div>
                          <button onClick={handleSaveImport} disabled={isSubmitting} className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-[11px] shadow-xl hover:bg-black transition-all flex items-center gap-4">
                             {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <><CheckCircle2 size={24}/> Import abschließen</>}
                          </button>
                       </div>
                       <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                          <table className="w-full text-left">
                             <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                                <tr>
                                   <th className="px-6 py-6 w-10">
                                     <input 
                                       type="checkbox" 
                                       checked={selectedIndices.length === importPreview.length && importPreview.length > 0}
                                       onChange={toggleSelectAll}
                                       className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                     />
                                   </th>
                                   <th className="px-6 py-6">Name</th>
                                   <th className="px-6 py-6 text-center">G</th>
                                   <th className="px-6 py-6">Klasse</th>
                                   <th className="px-6 py-6">Unterrichtszeit</th>
                                   <th className="px-6 py-6">Vormund</th>
                                   <th className="px-10 py-6 text-center">Aktion</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                                {importPreview.map((s, i) => (
                                   <tr key={i} className={`hover:bg-gray-50 transition-colors ${selectedIndices.includes(i) ? 'bg-indigo-50/50' : ''}`}>
                                      <td className="px-6 py-4">
                                        <input 
                                          type="checkbox" 
                                          checked={selectedIndices.includes(i)}
                                          onChange={() => toggleSelect(i)}
                                          className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                      </td>
                                      <td className="px-10 py-4">
                                        <div className="flex flex-col gap-1">
                                          <input 
                                            value={s.firstName} 
                                            onChange={e => updateImportStudent(i, 'firstName', e.target.value)}
                                            className="bg-transparent font-black text-madrassah-950 uppercase italic text-sm outline-none focus:bg-white px-2 py-1 rounded border border-transparent focus:border-indigo-200"
                                          />
                                          <input 
                                            value={s.lastName} 
                                            onChange={e => updateImportStudent(i, 'lastName', e.target.value)}
                                            className="bg-transparent font-black text-madrassah-950 uppercase italic text-xs opacity-60 outline-none focus:bg-white px-2 py-1 rounded border border-transparent focus:border-indigo-200"
                                          />
                                        </div>
                                      </td>
                                      <td className="px-4 py-4">
                                        <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 w-fit">
                                          <button 
                                            onClick={() => updateImportStudent(i, 'gender', regType === 'KIDS' ? 'Junge' : 'Mann')}
                                            className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${s.gender === 'Junge' || s.gender === 'Mann' ? 'bg-madrassah-950 text-white shadow-sm' : 'text-gray-400'}`}
                                          >
                                            J
                                          </button>
                                          <button 
                                            onClick={() => updateImportStudent(i, 'gender', regType === 'KIDS' ? 'Mädchen' : 'Frau')}
                                            className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${s.gender === 'Mädchen' || s.gender === 'Frau' ? 'bg-pink-600 text-white shadow-sm' : 'text-gray-400'}`}
                                          >
                                            M
                                          </button>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <select 
                                          value={s.className} 
                                          onChange={e => updateImportStudent(i, 'className', e.target.value)}
                                          className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg font-black text-[10px] border border-indigo-100 uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                          <optgroup label="Jungen">
                                            {kidsJClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                            {adultJClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                          </optgroup>
                                          <optgroup label="Mädchen">
                                            {kidsMClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                            {adultMClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                          </optgroup>
                                          {!kidsJClasses.includes(s.className) && !kidsMClasses.includes(s.className) && !adultJClasses.includes(s.className) && !adultMClasses.includes(s.className) && (
                                            <option value={s.className}>{s.className}</option>
                                          )}
                                        </select>
                                      </td>
                                      <td className="px-6 py-4">
                                        <input 
                                          value={s.guardian} 
                                          onChange={e => updateImportStudent(i, 'guardian', e.target.value)}
                                          className="bg-transparent text-[10px] font-bold text-gray-500 italic outline-none focus:bg-white px-2 py-1 rounded border border-transparent focus:border-indigo-200 w-full"
                                        />
                                      </td>
                                      <td className="px-10 py-4 text-center">
                                        <button 
                                          onClick={() => setImportPreview(importPreview.filter((_, idx) => idx !== i))}
                                          className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                          title="Entfernen"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 ) : (
                    <div className="bg-gray-100/50 h-full min-h-[500px] rounded-[4rem] border-4 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 italic p-20 text-center">
                       <AlertCircle size={80} className="mb-6 opacity-20" />
                       <p className="text-3xl font-black uppercase tracking-tighter">Keine Daten verarbeitet</p>
                       <p className="text-sm mt-4 leading-relaxed max-w-sm">Füge links deine Google Sheets Zeilen ein und klicke auf "Daten verarbeiten". Die App erkennt automatisch fehlende Daten.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistration;
