
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  MessageSquare, FileText, Copy, CheckCircle2, 
  CalendarDays, RotateCcw, UserCheck, X, Search, Share2, Loader2, Link2, MessageCircle, Moon, Sun
} from 'lucide-react';
import { Student } from '../types';
import LogoIcon from './LogoIcon';
import * as htmlToImage from 'html-to-image';

type TemplateCategory = 'WA' | 'LETTER';

interface Template {
  id: string;
  category: TemplateCategory;
  title: string;
  description: string;
  defaultText: string;
}

interface CommunicationCenterProps {
  students?: Student[];
}

const TEMPLATES: Template[] = [
  // WhatsApp Status Templates
  {
    id: 'wa-cancel',
    category: 'WA',
    title: 'Unterrichtsausfall',
    description: 'Statusmeldung für ausfallende Stunden',
    defaultText: '📢 *Madrassah Al-Huda Hamburg (Jenfeld) Benachrichtigung*\n\nDer Unterricht entfällt im Zeitraum vom [VON] bis zum [BIS].\n\nBitte nutzt die Zeit für die Wiederholung der gelernten Suren. 📖✨\n\nBarakallahu Feekum!'
  },
  {
    id: 'wa-ramadan-break',
    category: 'WA',
    title: 'Ramadhan Ferien',
    description: 'Statusmeldung für Ferien im Ramadan',
    defaultText: '🌙 *Madrassah Hamburg (Jenfeld) - Ramadan Ferien*\n\nLiebe Eltern und Schüler,\n\naufgrund des heiligen Monats Ramadan pausiert der Unterricht vom [VON] bis zum [BIS].\n\nDer Unterricht beginnt wieder am [RUECKKEHR].\n\nWir wünschen euch einen gesegneten Monat voller Ibadah! 🤲✨'
  },
  {
    id: 'wa-eid-holiday',
    category: 'WA',
    title: 'Eid-Feiertage',
    description: 'Statusmeldung für schulfreie Eid-Tage',
    defaultText: '🎉 *Eid Mubarak - Madrassah Jenfeld*\n\nAnlässlich des Eid-Festes bleibt die Madrassah vom [VON] bis zum [BIS] geschlossen.\n\nWir wünschen allen Familien ein frohes Fest! 🍬🎊'
  },
  {
    id: 'wa-summer',
    category: 'WA',
    title: 'Sommerferien',
    description: 'Ankündigung der Sommerpause',
    defaultText: '☀️ *Sommerferien bei Al-Huda Hamburg (Jenfeld)*\n\nWir verabschieden uns in die Sommerpause! Vom [VON] bis zum [BIS] findet kein Unterricht statt.\n\nErholt euch gut und wir sehen uns am [RUECKKEHR] wieder! 🏝️📖'
  },
  {
    id: 'wa-portal-link',
    category: 'WA',
    title: 'Portal Link teilen',
    description: 'Link zum Daten-Portal an Eltern schicken',
    defaultText: 'Salam! Bitte nutzen Sie unser neues Daten-Portal der Madrassah Al-Huda Hamburg (Jenfeld) Quran Schule, um Ihre Kontaktdaten und die Zahlungsweise zu prüfen oder zu aktualisieren.\n\n🔗 Link: [PORTAL_URL]\n\nSie benötigen zur Anmeldung lediglich Ihre Familien-ID oder die Schüler-ID.'
  },

  // Elternbrief Templates
  {
    id: 'letter-holiday',
    category: 'LETTER',
    title: 'Ferien-Ankündigung',
    description: 'Formeller Brief über anstehende Ferien',
    defaultText: 'Assalamu Alaikum [ELTERN],\n\nhiermit teilen wir Ihnen mit, dass die Madrassah Al-Huda Hamburg (Jenfeld) aufgrund der anstehenden Ferien im Zeitraum vom [VON] bis zum [BIS] geschlossen bleibt.\n\nDies betrifft auch den Unterricht für [VORNAME]. Wir wünschen allen Familien erholsame Tage und freuen uns darauf, die Kinder ab dem [RUECKKEHR] wieder im Unterricht begrüßen zu dürfen.'
  },
  {
    id: 'letter-fees',
    category: 'LETTER',
    title: 'Beitrag-Erinnerung',
    description: 'Höfliche Erinnerung an offene Beiträge',
    defaultText: 'Assalamu Alaikum [ELTERN],\n\nbei der Prüfung der Unterlagen der Madrassah Hamburg (Jenfeld) haben wir festgestellt, dass der monatliche Beitrag für [VORNAME] ([KLASSE]) noch ausstehend ist.\n\nWir bitten Sie höflich, die Überweisung zeitnah unter Angabe der Familien-ID vorzunehmen. Falls sich die Zahlung überschnitten hat, betrachten Sie dieses Schreiben bitte als gegenstandslos.'
  }
];

const CommunicationCenter: React.FC<CommunicationCenterProps> = ({ students = [] }) => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('WA');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id);
  const [customText, setCustomText] = useState(TEMPLATES[0].defaultText);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');
  const letterRef = useRef<HTMLDivElement>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '...';
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  const selectedTemplate = useMemo(() => 
    TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0]
  , [selectedTemplateId]);

  const selectedStudent = useMemo(() => 
    students.find(s => s.id === selectedStudentId)
  , [students, selectedStudentId]);

  const filteredStudents = useMemo(() => 
    students.filter(s => 
      s.status === 'active' && 
      (`${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) || s.id.toLowerCase().includes(studentSearch.toLowerCase()))
    ).slice(0, 5)
  , [students, studentSearch]);

  const getPortalUrl = () => {
    let origin = window.location.origin;
    // Fix: Always use the public 'pre' origin for sharing with parents
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    
    const pathname = window.location.pathname.endsWith('/') 
      ? window.location.pathname 
      : window.location.pathname + '/';
    return `${origin}${pathname}#/portal`;
  };

  const PORTAL_LINK = getPortalUrl();

  useEffect(() => {
    let text = selectedTemplate.defaultText;
    text = text.replace(/\[PORTAL_URL\]/g, PORTAL_LINK);
    text = text.replace(/\[VON\]/g, formatDate(fromDate));
    text = text.replace(/\[BIS\]/g, formatDate(toDate));
    text = text.replace(/\[DATUM\]/g, formatDate(fromDate));
    text = text.replace(/\[RUECKKEHR\]/g, formatDate(returnDate));

    if (selectedStudent) {
      text = text.replace(/\[VORNAME\]/g, selectedStudent.firstName);
      text = text.replace(/\[NACHNAME\]/g, selectedStudent.lastName);
      text = text.replace(/\[ELTERN\]/g, selectedStudent.guardian || 'werte Eltern');
      text = text.replace(/\[KLASSE\]/g, selectedStudent.className);
    } else {
      text = text.replace(/\[VORNAME\]/g, 'dem Kind');
      text = text.replace(/\[NACHNAME\]/g, '');
      text = text.replace(/\[ELTERN\]/g, 'Liebe Eltern');
      text = text.replace(/\[KLASSE\]/g, 'der Klasse');
    }

    setCustomText(text);
  }, [selectedTemplate, fromDate, toDate, returnDate, selectedStudent, PORTAL_LINK]);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSharePortalLink = () => {
    const message = `Salam! Bitte nutzen Sie unser Daten-Portal der Madrassah Al-Huda Hamburg (Jenfeld) Quran Schule zur Aktualisierung Ihrer Kontaktdaten:\n\n${PORTAL_LINK}`;
    const encoded = encodeURIComponent(message);
    const waNum = selectedStudent?.whatsapp?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${waNum}?text=${encoded}`, '_blank');
  };

  const handleShareAsDocument = async () => {
    if (!letterRef.current) return;
    setIsGenerating(true);
    try {
      const blob = await htmlToImage.toBlob(letterRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
      if (!blob) throw new Error("Bild-Generierung fehlgeschlagen");
      const fileName = `AlHuda_Brief_${selectedStudent?.lastName || 'Allgemein'}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Offizieller Brief - Madrassah Jenfeld' });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        alert("Der Brief wurde als Bild heruntergeladen. Bitte manuell in WhatsApp hochladen.");
      }
    } catch (error) {
      alert("Fehler beim Teilen.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getTemplateIcon = (id: string) => {
    if (id.includes('ramadan')) return <Moon className="text-amber-500" size={18} />;
    if (id.includes('summer')) return <Sun className="text-orange-500" size={18} />;
    if (id.includes('wa')) return <MessageSquare className="text-emerald-500" size={18} />;
    if (id.includes('portal')) return <Link2 className="text-indigo-500" size={18} />;
    return <FileText className="text-indigo-500" size={18} />;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32">
      {/* Header */}
      <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10 no-print">
        <div className="flex items-center gap-8">
           <div className="bg-madrassah-950 p-6 rounded-[2rem] shadow-2xl text-white transform -rotate-3">
              <MessageSquare size={42} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Info-Zentrale</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 italic">Madrassah Hamburg (Jenfeld) • Kommunikation</p>
           </div>
        </div>
        
        <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner">
           <button onClick={() => { setActiveCategory('WA'); handleTemplateChange(TEMPLATES.find(t => t.category === 'WA')!.id); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'WA' ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}>WhatsApp Status</button>
           <button onClick={() => { setActiveCategory('LETTER'); handleTemplateChange(TEMPLATES.find(t => t.category === 'LETTER')!.id); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'LETTER' ? 'bg-madrassah-950 text-white shadow-xl' : 'text-gray-400'}`}>Elternbriefe</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 no-print">
         <div className="lg:col-span-4 space-y-8">
            <div className="bg-indigo-50 border-2 border-indigo-100 p-6 rounded-[2.5rem] space-y-4">
               <div className="flex items-center gap-3 text-indigo-950">
                  <Link2 size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Portal-Link (Jenfeld)</span>
               </div>
               <p className="text-[9px] text-indigo-800 italic leading-relaxed">Senden Sie den Link zur Datenpflege der Madrassah Jenfeld:</p>
               <div className="bg-white p-3 rounded-xl border border-indigo-100 text-[8px] font-mono break-all text-indigo-600 mb-4">{PORTAL_LINK}</div>
               
               <div className="grid grid-cols-1 gap-2">
                 <button onClick={() => { navigator.clipboard.writeText(PORTAL_LINK); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }} className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${isCopied ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-indigo-200 text-indigo-950'}`}>
                   {isCopied ? <CheckCircle2 size={12}/> : <Copy size={12}/>} {isCopied ? 'Link kopiert!' : 'Link Kopieren'}
                 </button>
                 <button onClick={handleSharePortalLink} className="w-full bg-emerald-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg">
                   <MessageCircle size={14}/> WhatsApp Senden
                 </button>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-6">
               <h3 className="text-xl font-black text-madrassah-950 uppercase italic tracking-widest flex items-center gap-3"><CalendarDays className="text-indigo-600" /> Zeitraum</h3>
               <div className="space-y-4">
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-1 italic">Beginn</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl font-bold text-xs" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-1 italic">Ende (Bis)</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl font-bold text-xs" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-1 italic">Wiederbeginn</label><input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full bg-emerald-50 border border-emerald-100 p-4 rounded-2xl font-bold text-xs" /></div>
               </div>
            </div>

            <div className="bg-indigo-950 p-8 rounded-[3.5rem] shadow-xl text-white space-y-6">
               <h3 className="text-xl font-black uppercase italic tracking-widest flex items-center gap-3"><UserCheck className="text-emerald-400" /> Empfänger</h3>
               <div className="space-y-4">
                  <div className="relative">
                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                     <input type="text" placeholder="Schüler suchen..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase outline-none focus:bg-white/10 placeholder:text-white/20" />
                  </div>
                  {studentSearch.length > 0 && !selectedStudentId && (
                     <div className="bg-white/10 rounded-2xl p-2 space-y-1">
                        {filteredStudents.map(s => (
                           <button key={s.id} onClick={() => { setSelectedStudentId(s.id); setStudentSearch(''); }} className="w-full text-left p-3 hover:bg-white/10 rounded-xl transition-all">
                              <p className="text-[10px] font-black uppercase italic leading-none">{s.firstName} {s.lastName}</p>
                              <p className="text-[8px] opacity-40 mt-1 uppercase">{s.className}</p>
                           </button>
                        ))}
                     </div>
                  )}
                  {selectedStudent && (
                     <div className="bg-emerald-600/20 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-xs">{selectedStudent.firstName.charAt(0)}</div>
                           <div><p className="text-[10px] font-black uppercase italic">{selectedStudent.firstName} {selectedStudent.lastName}</p><p className="text-[8px] opacity-60 uppercase">Personalisiert</p></div>
                        </div>
                        <button onClick={() => setSelectedStudentId('')} className="p-2 text-white/40 hover:text-white"><X size={18}/></button>
                     </div>
                  )}
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-xl font-black text-madrassah-950 uppercase italic tracking-widest px-4">Vorlagen</h3>
               <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {TEMPLATES.filter(t => t.category === activeCategory).map(t => (
                     <button key={t.id} onClick={() => handleTemplateChange(t.id)} className={`w-full text-left p-6 rounded-[2.5rem] border-2 transition-all ${selectedTemplateId === t.id ? 'bg-madrassah-950 border-madrassah-950 text-white shadow-2xl' : 'bg-white border-gray-100 text-gray-500'}`}>
                        <div className="flex items-center gap-3 mb-1">{getTemplateIcon(t.id)}<p className={`text-[10px] font-black uppercase tracking-widest ${selectedTemplateId === t.id ? 'text-emerald-400' : 'text-indigo-400'}`}>{t.category === 'WA' ? 'WhatsApp' : 'Brief'}</p></div>
                        <h4 className="font-black text-lg uppercase italic leading-tight mb-2">{t.title}</h4>
                        <p className={`text-[11px] italic leading-relaxed ${selectedTemplateId === t.id ? 'text-white/60' : 'text-gray-400'}`}>{t.description}</p>
                     </button>
                  ))}
               </div>
            </div>
         </div>

         <div className="lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[4rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full">
               <div className="p-10 border-b bg-gray-50/20 flex flex-col md:flex-row justify-between items-center gap-6">
                  <h3 className="text-2xl font-black text-madrassah-950 uppercase italic">Editor</h3>
                  <div className="flex flex-wrap gap-3">
                     <button onClick={() => handleTemplateChange(selectedTemplateId)} className="p-3 bg-gray-100 text-gray-400 hover:text-madrassah-950 rounded-xl" title="Zurücksetzen"><RotateCcw size={20}/></button>
                     {activeCategory === 'WA' ? (
                        <button onClick={copyToClipboard} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-3 ${isCopied ? 'bg-emerald-600 text-white' : 'bg-madrassah-950 text-white'}`}>
                           {isCopied ? <CheckCircle2 size={18}/> : <Copy size={18}/>} {isCopied ? 'Kopiert' : 'Status Kopieren'}
                        </button>
                     ) : (
                        <button onClick={handleShareAsDocument} disabled={isGenerating} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-3 shadow-lg ${isGenerating ? 'bg-gray-400' : 'bg-emerald-600 text-white'}`}>
                           {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18}/>} In WhatsApp teilen
                        </button>
                     )}
                  </div>
               </div>
               <div className="p-10 flex-1"><textarea value={customText} onChange={(e) => setCustomText(e.target.value)} className="w-full h-[550px] p-8 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 outline-none font-medium italic text-lg focus:bg-white transition-all shadow-inner" /></div>
            </div>
         </div>
      </div>

      <div className={`mx-auto w-full max-w-[210mm] ${activeCategory === 'LETTER' ? 'block' : 'hidden print:block'}`}>
         <div ref={letterRef} className="bg-white p-[20mm] print:p-0 shadow-2xl print:shadow-none min-h-[297mm] flex flex-col border border-gray-100 print:border-none relative overflow-hidden">
            <div className="flex justify-between items-start border-b-[4px] border-black pb-8 mb-12">
               <div className="flex items-center gap-8"><div className="p-4 bg-black text-white rounded-2xl"><LogoIcon className="w-16 h-16" /></div><div><h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Madrassah Al-Huda</h1><p className="text-sm font-bold uppercase tracking-[0.3em] text-gray-500 mt-2">Institut Hamburg (Jenfeld)</p></div></div>
               <div className="text-right"><div className="bg-madrassah-950 text-white px-5 py-2 text-[10px] font-black uppercase rounded-lg mb-3">OFFIZIELLER BRIEF</div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">{new Date().toLocaleDateString('de-DE')}</p></div>
            </div>
            <div className="flex-1 font-serif text-lg leading-relaxed text-black space-y-10 pt-10">
               <h2 className="text-3xl font-black uppercase italic border-l-8 border-black pl-8">{selectedTemplate.title}</h2>
               <div className="whitespace-pre-wrap leading-relaxed text-xl">{customText}</div>
               <div className="pt-20"><p className="italic mb-12">Mit freundlichen Grüßen,</p><div className="grid grid-cols-2 gap-40"><div className="text-center border-t border-black pt-4"><p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Institutsleitung</p><p className="text-xl font-black italic">Sarfraz Azmat Butt</p></div></div></div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CommunicationCenter;
