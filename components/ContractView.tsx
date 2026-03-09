
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, Euro, Users, Landmark, BookOpen } from 'lucide-react';
import { Student } from '../types';
import LogoIcon from './LogoIcon';

interface Props { students: Student[]; }

const ContractView: React.FC<Props> = ({ students }) => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  // Den Hauptschüler finden
  const student = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);
  
  // Alle aktiven Familienmitglieder finden
  const familyGroup = useMemo(() => {
    if (!student) return [];
    return students.filter(s => s.familyId === student.familyId && s.status === 'active');
  }, [students, student]);

  const pricing = useMemo(() => {
    const count = familyGroup.length;
    if (count === 0) return { monthlyTotal: 0, registrationFee: 0, isAdult: false };
    
    const isAdult = student?.gender === 'Mann' || student?.gender === 'Frau';
    let monthlyTotal = 0;
    
    if (isAdult) {
      monthlyTotal = count * 30;
    } else {
      // 1 Kind = 30€
      // 2 Kinder = 50€ (25 pro Kopf)
      // 3+ Kinder = 20€ pro Kopf
      if (count === 1) monthlyTotal = 30;
      else if (count === 2) monthlyTotal = 50;
      else monthlyTotal = count * 20;
    }

    return {
      monthlyTotal,
      registrationFee: count * 10,
      isAdult
    };
  }, [familyGroup, student]);

  if (!student || familyGroup.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-8 p-10">
         <div className="relative">
            <div className="w-24 h-24 border-8 border-madrassah-950/10 border-t-madrassah-950 rounded-full animate-spin"></div>
            <LogoIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-madrassah-950 opacity-20" />
         </div>
         <div className="text-center space-y-2">
            <h2 className="text-2xl font-black uppercase italic text-madrassah-950 tracking-tighter">Vertrag wird generiert...</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Die Datenbank synchronisiert Ihre Eingaben.</p>
         </div>
         <button onClick={() => navigate('/students')} className="px-8 py-3 bg-white border-2 border-madrassah-950 text-madrassah-950 rounded-xl text-[10px] font-black uppercase hover:bg-madrassah-950 hover:text-white transition-all shadow-xl">Zur Schüler-Liste</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 animate-in fade-in duration-500">
      <div className="no-print flex items-center justify-between px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-madrassah-950 font-black uppercase text-[10px] bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100"><ChevronLeft size={18} /> Zurück</button>
        <button onClick={() => window.print()} className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:-translate-y-1 transition-all"><Printer size={20} /> Vertrag drucken / PDF Speichern</button>
      </div>

      <div className="bg-white p-16 print:p-0 mx-auto w-full font-serif border-[6px] border-black print:border-none shadow-2xl relative overflow-hidden">
        
        <div className="flex justify-between items-start border-b-[4px] border-black pb-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-black text-white rounded-[2rem]"><LogoIcon className="w-16 h-16" /></div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter leading-none italic font-sans">Madrassah Al-Huda</h1>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500 font-sans mt-2">Akademie für Islamische Bildung Hamburg</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-black text-white px-6 py-2 rounded-xl mb-3">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1">Aufnahme-Vertrag {currentYear}</p>
               <p className="text-xl font-black font-sans tracking-tight italic">FAM-ID: {student.familyId}</p>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">Anmeldedatum: {student.registrationDate ? new Date(student.registrationDate).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')}</p>
          </div>
        </div>

        <div className="space-y-12">
          <section>
             <h2 className="text-[14px] font-black uppercase tracking-widest mb-6 font-sans flex items-center gap-4 border-b-2 border-black pb-2 italic">
                <Users size={18} /> I. Vertragspartner & Identität
             </h2>
             <div className="grid grid-cols-2 gap-12 text-[14px]">
                <div className="space-y-6">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase font-sans mb-1">{pricing.isAdult ? 'Teilnehmer' : 'Sorgeberechtigte/r'}</p>
                      <p className="font-black text-xl uppercase italic border-b border-black/10 pb-1">{student.guardian}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase font-sans mb-1">Wohnanschrift</p>
                      <p className="font-bold uppercase italic leading-relaxed">{student.address}</p>
                   </div>
                </div>
                <div className="space-y-6">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase font-sans mb-1">WhatsApp Kontakt</p>
                      <p className="font-black text-xl border-b border-black/10 pb-1">{student.whatsapp}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase font-sans mb-1">Anzahl angemeldete Personen</p>
                      <p className="font-bold font-mono text-indigo-700">{familyGroup.length} Teilnehmer</p>
                   </div>
                </div>
             </div>
          </section>

          <section>
             <h2 className="text-[14px] font-black uppercase tracking-widest mb-6 font-sans flex items-center gap-4 border-b-2 border-black pb-2 italic">
                <BookOpen size={18} /> II. Eingeschriebene Personen ({familyGroup.length})
             </h2>
             <table className="w-full border-collapse border-2 border-black font-sans text-[12px]">
                <thead>
                   <tr className="bg-gray-100 uppercase font-black border-b-2 border-black">
                      <th className="p-4 text-left border-r-2 border-black">System-ID</th>
                      <th className="p-4 text-left border-r-2 border-black">Name des Kindes / Teilnehmers</th>
                      <th className="p-4 text-left border-r-2 border-black">Bereich</th>
                      <th className="p-4 text-right">Beitrag (Anteil)</th>
                   </tr>
                </thead>
                <tbody>
                   {familyGroup.map(s => (
                     <tr key={s.id} className="border-b border-black/20 italic h-14">
                        <td className="p-4 border-r-2 border-black font-mono font-bold text-indigo-700">{s.id}</td>
                        <td className="p-4 border-r-2 border-black font-black uppercase">{s.firstName} {s.lastName}</td>
                        <td className="p-4 border-r-2 border-black uppercase font-bold text-gray-600">{s.className}</td>
                        <td className="p-4 text-right font-black">{(pricing.monthlyTotal / familyGroup.length).toFixed(2)} €</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </section>

          <section className="grid grid-cols-2 gap-10">
             <div className="p-8 border-2 border-black rounded-[2.5rem] space-y-6 bg-gray-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Euro size={80}/></div>
                <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3 border-b border-black/10 pb-3 font-sans italic">III. Kostenaufstellung</h3>
                <div className="space-y-4 text-[14px]">
                   <div className="flex justify-between border-b border-dotted border-black/20 pb-2 italic text-gray-500">
                      <span>Anmeldegebühr (einmalig für {familyGroup.length} Pers.):</span>
                      <span className="font-black text-black">{pricing.registrationFee.toFixed(2)} €</span>
                   </div>
                   <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-black shadow-sm">
                      <span className="font-bold uppercase text-[10px] tracking-widest">Monatsbeitrag (Gesamt):</span>
                      <span className="font-black text-3xl italic tracking-tighter text-emerald-600">{pricing.monthlyTotal.toFixed(2)} €</span>
                   </div>
                </div>
             </div>
             <div className="bg-indigo-950 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-center">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Landmark size={80} /></div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-3 border-b border-indigo-800/50 pb-3 mb-6 font-sans italic">IV. Überweisungsdaten</h3>
                <div className="space-y-4">
                   <div>
                      <p className="text-[8px] font-black uppercase text-indigo-400">Begünstigter</p>
                      <p className="font-black text-lg uppercase tracking-tight">Azmat Ullah Butt</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black uppercase text-indigo-400">IBAN Akademie Hamburg</p>
                      <p className="font-black text-xl font-mono tracking-tighter bg-white/10 px-4 py-2 rounded-xl">DE79 2004 1177 0546 3088 00</p>
                   </div>
                </div>
             </div>
          </section>

          <div className="grid grid-cols-2 gap-40 pt-24">
            <div className="text-center">
               <div className="h-[1.5px] bg-black w-full mb-4"></div>
               <p className="text-[10px] font-black uppercase tracking-widest font-sans text-gray-500">Stempel & Unterschrift Leitung</p>
               <p className="text-[11px] font-black uppercase font-sans mt-2 italic">Madrassah Al-Huda</p>
            </div>
            <div className="text-center">
               <div className="h-[1.5px] bg-black w-full mb-4"></div>
               <p className="text-[10px] font-black uppercase tracking-widest font-sans text-gray-500">Unterschrift Vertragspartner</p>
               <p className="text-[11px] font-black uppercase font-sans mt-2 italic">Hamburg, den {student.registrationDate ? new Date(student.registrationDate).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')}</p>
            </div>
          </div>
        </div>

        <div className="mt-32 pt-6 border-t border-dotted border-gray-200 flex justify-between items-center text-[8px] font-black text-gray-300 uppercase tracking-[0.5em] font-sans">
           <span>Digital Hub Registry &copy; {currentYear} • OFFICIAL BINDING CONTRACT</span>
           <div className="flex items-center gap-4">
              <span>REF: {student.id}</span>
              <LogoIcon className="w-6 h-6 opacity-20" />
           </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .shadow-2xl { box-shadow: none !important; }
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>
    </div>
  );
};

export default ContractView;
