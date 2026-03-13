
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, ShieldCheck, Star, History, AlertCircle, Lock, Loader2 } from 'lucide-react';
import { Student, Grade, UserRole, User } from '../types';
import { GoogleGenAI } from "@google/genai";
import LogoIcon from './LogoIcon';

interface Props {
  students: Student[];
  grades: Grade[];
  user: User;
}

const CertificateView: React.FC<Props> = ({ students, grades, user }) => {
  const { studentId, type } = useParams<{ studentId: string, type: string }>();
  const navigate = useNavigate();

  const student = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);
  const isStudent = user.role === UserRole.STUDENT;

  const [aiContent, setAiContent] = useState<string>('');
  const [aiGrade, setAiGrade] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [printScale, setPrintScale] = useState<number>(1);
  const reportRef = useRef<HTMLDivElement>(null);

  const qualification = useMemo(() => {
    const studentGrades = grades.filter(g => g.studentId === studentId);
    if (studentGrades.length === 0) return 'ANGEMESSEN QUALIFIZIERT';
    const subjectTotals: Record<string, number> = {};
    studentGrades.forEach(g => {
      subjectTotals[g.subject] = (subjectTotals[g.subject] || 0) + g.points;
    });
    const values = Object.values(subjectTotals);
    if (values.length === 0) return 'ANGEMESSEN QUALIFIZIERT';
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg >= 35) return 'HERVORRAGEND QUALIFIZIERT';
    if (avg >= 30) return 'HOCH QUALIFIZIERT';
    if (avg >= 24) return 'MITTEL QUALIFIZIERT';
    return 'ANGEMESSEN QUALIFIZIERT';
  }, [grades, studentId]);

  const isIjazah = type === 'Ijazah';
  const isArabisch = type === 'Arabisch';

  const generateCertificateContent = useCallback(async () => {
    if (!student) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const abschlussGrades = grades.filter(g => g.studentId === studentId && g.term === 'Abschluss');
      
      // Special check for Arabic Modules if it's an Arabic Certificate
      if (isArabisch) {
        const arabicModules = ['Arabisch Modul 1', 'Arabisch Modul 2', 'Arabisch Modul 3'];
        const completedModules = abschlussGrades.filter(g => arabicModules.includes(g.subject) && g.points > 0);
        
        if (completedModules.length < 3) {
          setAiContent('FEHLER: Der Schüler hat noch nicht alle 3 Arabisch-Module (Modul 1, 2 und 3) mit Abschlussnoten abgeschlossen. Dieses Zertifikat kann erst nach vollständigem Abschluss aller Module ausgestellt werden.');
          setAiGrade('NICHT QUALIFIZIERT');
          setIsGenerating(false);
          return;
        }
      }

      const gradesInfo = abschlussGrades.map(g => `${g.subject}: ${g.points}/20`).join(', ');

      const prompt = `
        Du bist die Institutsleitung der Madrassah Al-Huda Hamburg. 
        Erstelle den Inhalt für ein offizielles Zertifikat vom Typ "${type}" für den Schüler ${student.firstName} ${student.lastName}.
        
        ${isArabisch ? 'Dieses Zertifikat bestätigt den erfolgreichen Abschluss aller 3 Arabisch-Module (Modul 1, 2 und 3).' : ''}

        Informationen zum Schüler:
        - Name: ${student.firstName} ${student.lastName}
        - Geburtsdatum: ${student.birthDate}
        - Abschlussnoten: ${gradesInfo}
        
        Aufgaben:
        1. Leite basierend auf den Noten einen passenden akademischen Grad/Prädikat ab (z.B. "Mit Auszeichnung", "Hervorragend", "Sehr gut bestanden", etc.).
        2. Erstelle einen feierlichen, professionellen und islamisch geprägten Text für das Zertifikat (ca. 150-200 Wörter). 
           Der Text sollte die Leistungen würdigen und den Abschluss in ${type} bestätigen.
        
        Antworte STRENG im JSON-Format:
        {
          "grade": "Der abgeleitete Grad",
          "content": "Der vollständige feierliche Text"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setAiContent(result.content || '');
      setAiGrade(result.grade || '');
    } catch (error) {
      console.error("AI Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [student, isArabisch, type, grades, studentId]);

  useEffect(() => {
    const handleAfterPrint = () => setPrintScale(1);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  useEffect(() => {
    if (!isIjazah && student) {
      generateCertificateContent();
    } else if (isIjazah && student) {
      // For Ijazah, we still want to derive the grade via AI
      const deriveGrade = async () => {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const abschlussGrades = grades.filter(g => g.studentId === studentId && g.term === 'Abschluss');
          const gradesInfo = abschlussGrades.map(g => `${g.subject}: ${g.points}/20`).join(', ');
          const prompt = `Leite basierend auf diesen Abschlussnoten einen passenden akademischen Grad für ein Ijazah-Zertifikat ab: ${gradesInfo}. Antworte nur mit dem Grad (max 5 Wörter).`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiGrade(response.text?.trim() || '');
        } catch (e) { console.error(e); }
      };
      deriveGrade();
    }
  }, [student, type, generateCertificateContent, grades, isIjazah, studentId]);

  // --- SICHERHEITS-CHECK ---
  const isMyCert = user.id === studentId;
  const isReleased = student?.reportReleasedAbschluss; // Urkunden folgen der Abschlussfreigabe

  if (isStudent && (!isMyCert || !isReleased)) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-12 space-y-8 animate-in fade-in duration-500">
        <div className="w-32 h-32 bg-amber-50 text-amber-600 rounded-[3.5rem] flex items-center justify-center border-4 border-white shadow-2xl shadow-amber-200/50 animate-pulse">
           <Lock size={56} />
        </div>
        <div className="space-y-4 max-w-lg">
           <h2 className="text-4xl font-black text-amber-950 uppercase italic tracking-tighter">Urkunde geschützt</h2>
           <p className="text-gray-500 font-medium text-lg leading-relaxed italic">
             {!isMyCert 
               ? "Sie können nur Ihre eigenen Urkunden einsehen." 
               : "Ihre Urkunde wird erst nach der offiziellen Freigabe des Jahreszeugnisses im System aktiviert."}
           </p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="px-12 py-5 bg-amber-950 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-black transition-all"
        >
           Zurück zum Dashboard
        </button>
      </div>
    );
  }
  
  if (!student) return <div className="p-20 text-center font-black uppercase text-red-500">Datensatz nicht gefunden.</div>;

  const handlePrint = () => {
    if (!reportRef.current) return;
    setPrintScale(1);
    setTimeout(() => {
      const element = reportRef.current;
      if (!element) return;
      const contentHeight = element.scrollHeight;
      const availableHeightPx = 1050; // A4 Portrait height minus margins
      if (contentHeight > availableHeightPx) {
        const requiredScale = availableHeightPx / contentHeight;
        if (requiredScale >= 0.85) setPrintScale(requiredScale);
        else setPrintScale(1);
      } else {
        setPrintScale(1);
      }
      window.print();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-stone-100 print:bg-white pb-20 font-serif">
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-2xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase"><ChevronLeft size={16} /> Zurück</button>
        <div className="text-center flex-1">
           <h1 className="text-lg font-black uppercase italic leading-none text-yellow-400">Akademisches Zertifizierungssystem</h1>
           <p className="text-[10px] opacity-60 uppercase mt-1">Typ: {type} • {qualification}</p>
        </div>
        <button onClick={handlePrint} className="bg-amber-600 text-white px-10 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-lg hover:bg-amber-700 transition-all"><Printer size={20} /> Urkunde drucken</button>
      </div>

      <div className="p-6 print:p-0 mx-auto w-full max-w-[210mm] print:max-w-none print:w-[210mm] print-container" style={{ '--print-scale': printScale } as React.CSSProperties}>
        <div ref={reportRef} className="space-y-10 print:space-y-0">
          {/* PAGE 1: PERMISSION CERTIFICATE */}
          <div className="bg-white p-10 print:p-0 shadow-2xl print:shadow-none min-h-[297mm] border-[12px] border-double border-amber-900/20 relative overflow-hidden flex flex-col items-center report-content page-break-after">
            
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
               <LogoIcon className="w-[120mm] h-[120mm]" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center text-center flex-1">
               <div className="w-full flex flex-col items-center mb-6">
                  <div className="mb-4">
                     <p className="text-2xl font-bold mb-1">بسم الله الرحمن الرحيم</p>
                     <div className="flex items-center gap-3 justify-center text-amber-900 opacity-40">
                        <div className="h-px w-16 bg-current"></div>
                        <Star size={12} />
                        <div className="h-px w-16 bg-current"></div>
                     </div>
                  </div>

                  <h2 className="text-5xl font-black uppercase tracking-widest text-amber-950 mb-1 italic">{isIjazah ? 'Ijāzah' : type}</h2>
                  <p className="text-md font-bold text-amber-800 uppercase tracking-[0.3em] mb-4 italic">Madrassah Al-Huda Hamburg</p>
               </div>

               <div className="text-[10px] leading-relaxed max-w-5xl text-stone-700 italic space-y-3 mb-6 mx-auto">
                  {isGenerating ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-amber-600" size={40} />
                      <p className="font-black uppercase text-[10px] tracking-widest text-amber-900">KI generiert Zertifikatsinhalt...</p>
                    </div>
                  ) : isIjazah ? (
                    <>
                      <p>
                         Alles Lob gebührt Allah, dem Erhabenen, Der uns Sein edles Buch als kostbares Erbe anvertraut hat. Er ist es, Der in Seiner Weisheit dessen Buchstaben, Regeln, Grenzen und seine Etikette bewahrt hat. Wir danken Ihm dafür, dass Er uns unter all Seinen Dienern durch die Kette der Überlieferung (Isnād) und die Ehre der Riwayah ausgezeichnet hat.
                      </p>
                      <p>
                         Frieden und Segen seien in vollkommenster Weise auf unseren Herrn Muhammad ﷺ, den schriftunkundigen Propheten (an-Nabiyy al-Ummī), den Empfänger der Offenbarung und das Siegel der Gesandten. Durch ihn wurde der Qur’an herabgesandt, und durch ihn wurden die Grundlagen des Tajwīd und die Kunst des Tartīl an die Ummah überliefert. Möge Allah auch Seine Segnungen über seine reine Familie und seine edlen Gefährten ausbreiten – jene aufrechten Persönlichkeiten, die den Qur’an bewahrten, ihn mit Verständnis trugen, sich um seine Weitergabe bemühten und das Recht der Überlieferung in Wahrhaftigkeit erfüllten.
                      </p>
                      <p className="font-bold text-stone-900 text-xs">
                         Danach spricht der Diener, der auf die Barmherzigkeit seines Herrn hofft, Sarfraz bin Azmatullah:
                      </p>
                      <p>
                         Der durch Allah begünstigte Rezitator (Al-Qari):
                      </p>
                      <h3 className="text-3xl font-black uppercase italic text-stone-950 my-1 underline decoration-amber-200 decoration-4 underline-offset-4">
                         {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-stone-500 font-bold uppercase tracking-widest text-[9px]">
                         Geboren am {new Date(student.birthDate).toLocaleDateString('de-DE')}
                      </p>
                      <p>
                         Möge Allah sein Streben und seine Liebe zu Seinem gewaltigen Buch vermehren und ihn zu den Leuten des Qur’an zählen. Er hat den gesamten edlen Qur’an vollständig vor mir rezitiert nach der Riwayah von <strong>Ḥafṣ ʿan ʿĀṣim</strong> über den Weg der <strong>ash-Shāṭibiyyah</strong>, mit sorgfältiger Beachtung der Regeln des Tajwīd und der korrekten Rezitation. Nachdem er mich um die Ijāzah und den Isnād gebeten hat, habe ich ihm die Erlaubnis erteilt, den Qur’an zu rezitieren und zu unterrichten gemäß den bei den Gelehrten und Qurra anerkannten Bedingungen, so wie mir die Erlaubnis erteilt wurde von <strong>al-Qāri’ al-Muqri’ Imtiyāz bin Ahmad al-Wali</strong>.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black uppercase italic text-stone-950 my-1 underline decoration-amber-200 decoration-4 underline-offset-4">
                         {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-stone-500 font-bold uppercase tracking-widest text-[9px]">
                         Geboren am {new Date(student.birthDate).toLocaleDateString('de-DE')}
                      </p>
                      <div className="whitespace-pre-wrap text-stone-800 font-medium leading-relaxed">
                        {aiContent}
                      </div>
                    </div>
                  )}
               </div>

               {/* WASIYYA & DISCLAIMER */}
               <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-[9px] leading-relaxed max-w-5xl italic border-t border-amber-900/10 pt-4 mx-auto wasiyya-section">
                  <div className="md:col-span-8 text-stone-600 space-y-1 text-left pr-4">
                     <p className="font-bold text-stone-800 uppercase text-[8px] mb-1 flex items-center gap-2">WASIYYA (Ermahnung):</p>
                     <div className="space-y-0.5 text-[8px]">
                        <p>• Wir ermahnen dich zur Gottesfurcht (Taqwā) im Verborgenen wie im Offenkundigen.</p>
                        <p>• Erkenne den Wert dieser gewaltigen Gnade, die Allah dir gegeben hat.</p>
                        <p>• Der Gesandte Allahs ﷺ sagte: „Kein Neid (im guten Sinne) ist erlaubt außer in zwei Dingen …“</p>
                        <p>• Ehre den Qur’an: Nutze ihn nicht für weltlichen Gewinn, Geld, Ansehen oder Besitz.</p>
                        <p>• Suche durch ihn niemanden außer Allah und erwarte deine Belohnung nur von Ihm.</p>
                        <p>• Sei bescheiden gegenüber den Lernenden, ein aufrichtiger Ratgeber und Helfer.</p>
                        <p>• Weise niemanden ab, der das Wort Allahs lernen möchte. Dein Ziel sei allein Sein Wohlgefallen.</p>
                     </div>
                  </div>
                  <div className="md:col-span-4 bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50 text-[8px] flex flex-col justify-center">
                     <div className="flex items-center gap-1.5 text-amber-800 font-black uppercase mb-1">
                        <AlertCircle size={12} /> Haftungsausschluss
                     </div>
                     <p className="text-stone-500 italic leading-tight">
                        {type === 'Ijazah' && "Diese Ijāzah dient ausschließlich der Bestätigung der Befähigung zur Quran-Lehre unter den genannten Voraussetzungen. Madrassah Al-Huda und der Aussteller haften nicht für die politischen Ansichten, privaten Aktivitäten oder anderweitigen Handlungen des Inhabers. Diese Urkunde legitimiert keine Aktivitäten außerhalb des religiös-pädagogischen Rahmens."}
                        {type === 'Imam' && "Dieses Zertifikat bestätigt die erfolgreiche Teilnahme an der Imam-Ausbildung. Es dient als Nachweis der religiösen Qualifikation für den Dienst in einer Moschee. Madrassah Al-Huda haftet nicht für die Amtsführung oder private Handlungen des Inhabers."}
                        {type === 'Alim' && "Dieses Alim-Zertifikat bestätigt den Abschluss der theologischen Studien. Es dient als Nachweis fundierter islamischer Kenntnisse. Madrassah Al-Huda übernimmt keine Haftung für die Auslegung oder Anwendung des Wissens durch den Inhaber."}
                        {type === 'Hafiz' && "Diese Urkunde bestätigt das Auswendiglernen des edlen Qur'an. Sie dient als Anerkennung dieser spirituellen Leistung. Madrassah Al-Huda haftet nicht für die private Lebensführung des Inhabers."}
                        {type === 'Quran-Khatam' && "Dieses Zertifikat bestätigt den vollständigen Abschluss der Quran-Rezitation (Khatam). Es dient als Nachweis der Lesekompetenz. Madrassah Al-Huda haftet nicht für spätere Handlungen des Inhabers."}
                        {type === 'Arabisch' && "Dieses Zertifikat bestätigt den erfolgreichen Abschluss der Arabisch-Module (1-3). Es dient als Nachweis der Sprachkompetenz. Madrassah Al-Huda haftet nicht für die berufliche oder private Nutzung dieser Sprachkenntnisse."}
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-40 w-full mt-8 pb-2 signature-section">
                  <div className="text-center">
                     <div className="h-[1px] bg-amber-900 w-full mb-1 opacity-40"></div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 italic">Institutsleitung</p>
                     <p className="text-md font-black italic text-stone-800 leading-none">Shaikh Sarfraz Azmat Butt</p>
                     <p className="text-sm font-bold text-stone-600 mt-1" dir="rtl">الشيخ سرفراز أعظم بٹ</p>
                  </div>
                  <div className="text-center">
                     <div className="h-[1px] bg-amber-900 w-full mb-1 opacity-40"></div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 italic">Hamburg, den</p>
                     <p className="text-md font-black italic text-stone-800 leading-none">{new Date().toLocaleDateString('de-DE')}</p>
                  </div>
               </div>

               <div className="mt-auto pt-4 border-t border-stone-100 w-full flex justify-between items-center text-[7px] font-black text-stone-300 uppercase tracking-[0.4em] certificate-footer">
                  <span>Madrassah Al-Huda • {aiGrade || qualification} • Secure Digital Sanad v2.7</span>
                  <div className="flex items-center gap-3">
                     <span>CERT-ID: {student.id}-{type?.toUpperCase()}</span>
                     <ShieldCheck size={10} className="opacity-20" />
                  </div>
               </div>
            </div>
          </div>

          {/* PAGE 2: SANAD CHAIN (ONLY FOR IJAZAH) */}
          {isIjazah && (
            <div className="bg-white p-10 print:p-0 shadow-2xl print:shadow-none min-h-[297mm] border-[12px] border-double border-amber-900/20 relative overflow-hidden flex flex-col items-center report-content">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                 <LogoIcon className="w-[120mm] h-[120mm]" />
              </div>

              <div className="relative z-10 w-full flex flex-col items-center text-center flex-1">
                 <div className="w-full flex flex-col items-center mb-8">
                    <h2 className="text-4xl font-black uppercase tracking-widest text-amber-950 mb-1 italic">As-Sanad al-Muttaṣil</h2>
                    <p className="text-md font-bold text-amber-800 uppercase tracking-[0.3em] mb-4 italic">Die goldene Überlieferungskette</p>
                    <div className="flex items-center gap-3 justify-center text-amber-900 opacity-40">
                        <div className="h-px w-16 bg-current"></div>
                        <History size={16} />
                        <div className="h-px w-16 bg-current"></div>
                    </div>
                 </div>

                 <div className="w-full max-w-5xl p-12 border-2 border-amber-900/10 rounded-[3rem] bg-stone-50/30 mb-8 mx-auto silsila-container flex-1 flex flex-col justify-center" dir="rtl">
                    <div className="text-right text-[11px] font-serif text-stone-800 leading-relaxed whitespace-pre-wrap">
                       {`الحمد لله الذي أنزل القرآن هدى للناس وبينات من الهدى والفرقان، والصلاة والسلام على سيدنا محمد خير من تلا كتاب الله وأقرأه، وعلى آله وصحبه ومن تبعهم بإحسان إلى يوم الدين.
أما بعد:
فإن الطالب ${student.firstName} ${student.lastName} قد قرأ عليَّ القرآن الكريم كاملاً من أوله إلى آخره برواية حفص عن عاصم من طريق الشاطبية قراءةً صحيحةً مجودةً متقنةً، وقد استوفى ما يلزم في هذا الفن من أحكام التجويد وأداء الحروف على وجهها الصحيح.
فأجزته أن يقرأ ويُقرئ القرآن الكريم برواية حفص عن عاصم من طريق الإمام الشاطبي، وأذنت له أن يروي ذلك عني بسندي المتصل إلى رسول الله ﷺ.
وسندي في ذلك:
عن المقرئ مولانا يوسف بن عبد الله دروان
عن العلامة فضل الرحمن الأعظمي
ح (تحويل السند)
وقد أجازني المقرئ مولانا امتياز أحمد ولي
عن العلامة فضل الرحمن الأعظمي
عن الشيخ مصطفى الأعظمي
عن الشيخ رياست علي
عن الشيخ ضياء الدين بن أحمد
عن الشيخ عبد الرحمن بن محمد بشير خان المكي
عن الشيخ عبد الله خان بن محمد بشير خان
عن الشيخ إبراهيم سعد بن علي
عن الشيخ حسن بن بدير الجريسي الكبير
وهو قرأ العشر الصغرى عن الشيخ أحمد الدري التهامي
وقرأ العشر الكبرى عن الشيخ محمد المتولي
عن الشيخ أحمد الدري التهامي
عن الشيخ أحمد بن محمد سلمونة
عن الشيخ سيد إبراهيم العبيدي
عن مشايخ منهم الشيخ عبد الرحمن الأجهوري
عن مشايخ منهم الشيخ أحمد بن رجب البقري
عن الشيخ محمد بن القاسم البقري
عن الشيخ عبد الرحمن اليمني
عن والده الشيخ شحاذة اليمني
ثم عن الشيخ أحمد بن عبد الحق السنباطي
عن الشيخ شحاذة المذكور
عن مشايخ منهم الشيخ ناصر الدين محمد بن سالم بن علي الطَبَلَاوي
عن شيخ الإسلام زكريا الأنصاري
عن مشايخ منهم الشيخ أبو نعيم رضوان بن محمد بن يوسف العُقبي
والشيخ أحمد بن أبي بكر بن يوسف القلقيلي
والشيخ طاهر بن محمد النويري
وهم عن الإمام شمس الدين محمد بن محمد بن محمد بن علي بن يوسف الجزري محرر هذا الفن
عن مشايخه
عن الإمام أبي القاسم الشاطبي صاحب حرز الأماني ووجه التهاني
عن الإمام أبي عمرو عثمان بن سعيد الداني صاحب التيسير
بسنده المتصل إلى رسول الله ﷺ
عن جبريل عليه السلام
عن رب العزة جل جلاله.
وقد أجزته بذلك إجازةً صحيحةً معتبرةً على ما جرى عليه عمل أهل هذا الشأن.
والله تعالى أسأل أن يجعله من أهل القرآن الذين هم أهل الله وخاصته، وأن ينفع به الإسلام والمسلمين.
وصلى الله على سيدنا محمد وعلى آله وصحبه وسلم.`}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-40 w-full mt-8 pb-2 signature-section">
                    <div className="text-center">
                       <div className="h-[1px] bg-amber-900 w-full mb-1 opacity-40"></div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 italic">Institutsleitung</p>
                       <p className="text-md font-black italic text-stone-800 leading-none">Shaikh Sarfraz Azmat Butt</p>
                       <p className="text-sm font-bold text-stone-600 mt-1" dir="rtl">الشيخ سرفراز أعظم بٹ</p>
                    </div>
                    <div className="text-center">
                       <div className="h-[1px] bg-amber-900 w-full mb-1 opacity-40"></div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 italic">Hamburg, den</p>
                       <p className="text-md font-black italic text-stone-800 leading-none">{new Date().toLocaleDateString('de-DE')}</p>
                    </div>
                 </div>

                 <div className="mt-auto pt-4 border-t border-stone-100 w-full flex justify-between items-center text-[7px] font-black text-stone-300 uppercase tracking-[0.4em] certificate-footer">
                    <span>Madrassah Al-Huda • {aiGrade || qualification} • Secure Digital Sanad v2.7</span>
                    <div className="flex items-center gap-3">
                       <span>CERT-ID: {student.id}-{type?.toUpperCase()}-S</span>
                       <ShieldCheck size={10} className="opacity-20" />
                    </div>
                 </div>
              </div>
            </div>
          )}
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
            min-height: 297mm !important;
            position: relative;
            margin: 0 auto !important;
            padding: 0 !important;
          }

          .report-content {
            border: 12px double rgba(120, 53, 15, 0.2) !important;
            padding: 10mm !important;
            transform: scale(var(--print-scale, 1));
            transform-origin: top center;
            width: 210mm !important;
            min-height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
            page-break-after: always !important;
          }

          .report-content:last-child {
            page-break-after: auto !important;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
          }

          .print-table thead {
            display: table-header-group;
          }

          .print-table tbody {
            display: table-row-group;
          }

          /* Prevent splitting of key sections */
          .silsila-container, .wasiyya-section, .signature-section, .certificate-footer {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .silsila-item {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Ensure content doesn't get cut off and allows page breaks */
          .flex-1 { flex: 1 1 auto !important; }
        }
      `}</style>
    </div>
  );
};

export default CertificateView;
