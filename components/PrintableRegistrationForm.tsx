
import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Printer, ChevronLeft, Users, School, ShieldCheck, MapPin, Phone, Calendar, Hash, Euro, CreditCard, Landmark } from 'lucide-react';
import { Student } from '../types';
import LogoIcon from './LogoIcon';

interface PrintableRegistrationFormProps {
  students: Student[];
}

const PrintableRegistrationForm: React.FC<PrintableRegistrationFormProps> = ({ students }) => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  
  const sourceData = useMemo(() => {
    if (!studentId) return null;
    
    const student = students.find(x => x.id === studentId);
    if (student) {
      const family = students.filter(x => x.familyId === student.familyId && x.status === 'active');
      
      const participants = family.map(f => {
        const isAdult = f.gender === 'Mann' || f.gender === 'Frau';
        let feeNum = 30;
        if (!isAdult) {
          feeNum = family.length === 1 ? 30 : family.length === 2 ? 25 : 20;
        }
        return {
          firstName: f.firstName,
          lastName: f.lastName,
          birthDate: f.birthDate,
          id: f.id,
          className: f.className,
          gender: f.gender,
          feeNum: feeNum
        };
      });

      const totalMonthly = participants.reduce((acc, p) => acc + p.feeNum, 0);
      const totalRegistration = participants.length * 10;

      return {
        guardian: student.guardian,
        whatsapp: student.whatsapp,
        address: student.address,
        familyId: student.familyId,
        registrationDate: student.registrationDate,
        paymentMethod: student.paymentMethod,
        totalMonthly,
        totalRegistration,
        participants
      };
    }
    return null;
  }, [studentId, students]);

  if (!sourceData) return (
    <div className="p-20 text-center">
       <div className="w-16 h-16 border-4 border-madrassah-950 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
       <p className="font-black uppercase tracking-widest text-madrassah-950">Dokument wird vorbereitet...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white pb-20 font-sans">
      <div className="no-print p-6 bg-madrassah-950 text-white flex items-center justify-between sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all">
              <ChevronLeft size={16} /> Zurück
           </button>
           <div>
              <h1 className="text-lg font-black uppercase italic leading-none text-yellow-400">Anmeldeformular Export</h1>
              <p className="text-[10px] font-bold text-white/50 uppercase mt-1 italic">Format: DIN A4 Hochformat</p>
           </div>
        </div>
        <button onClick={() => window.print()} className="bg-emerald-500 text-white px-10 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-3 shadow-lg hover:scale-105 transition-all">
          <Printer size={20} /> Jetzt drucken / PDF speichern
        </button>
      </div>

      <div className="p-8 print:p-0 mx-auto w-full max-w-[210mm] text-black">
        <div className="bg-white p-12 print:p-10 shadow-2xl print:shadow-none min-h-[297mm] flex flex-col border border-gray-200 print:border-none relative overflow-hidden">
          
          {/* Institutioneller Kopf */}
          <div className="flex justify-between items-start border-b-[4px] border-black pb-8 mb-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-black text-white rounded-2xl shadow-xl">
                 <LogoIcon className="w-16 h-16" />
              </div>
              <div>
                <h1 className="text-4xl font-black uppercase italic leading-none tracking-tighter">Madrassah Al-Huda</h1>
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-gray-500 mt-2">Akademie für Islamische Bildung Hamburg</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-black text-white px-5 py-2 text-[10px] font-black uppercase rounded-lg mb-3">STAMM-DOKUMENTATION</div>
              <p className="text-[10px] font-black font-mono text-indigo-600 uppercase">FAM-NUMMER: {sourceData.familyId}</p>
              <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 italic">Erfasst am: {new Date(sourceData.registrationDate).toLocaleDateString('de-DE')}</p>
            </div>
          </div>

          <div className="space-y-10 flex-1">
             <h2 className="text-center text-3xl font-black mb-8 italic uppercase tracking-tighter underline underline-offset-8">Offizielle Schulanmeldung</h2>
             
             {/* I. Sorgeberechtigte */}
             <section className="space-y-4">
                <h3 className="text-[11px] font-black uppercase bg-gray-100 px-4 py-2 border-l-8 border-black italic flex items-center gap-3">
                   <Users size={16} /> I. Angaben zum gesetzlichen Vormund / Zahler
                </h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 pt-2">
                   <div className="border-b border-black/20 pb-1 col-span-2">
                      <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Vollständiger Name</label>
                      <span className="text-xl font-black uppercase italic text-madrassah-950">{sourceData.guardian}</span>
                   </div>
                   <div className="border-b border-black/20 pb-1">
                      <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Kontakt WhatsApp / Mobil</label>
                      <span className="text-xl font-black text-emerald-600 italic tracking-tighter">{sourceData.whatsapp}</span>
                   </div>
                   <div className="border-b border-black/20 pb-1">
                      <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Wohnanschrift</label>
                      <span className="text-lg font-bold uppercase italic">{sourceData.address}</span>
                   </div>
                </div>
             </section>

             {/* II. Eingeschriebene Schüler */}
             <section className="space-y-4">
                <h3 className="text-[11px] font-black uppercase bg-gray-100 px-4 py-2 border-l-8 border-indigo-950 italic flex items-center gap-3">
                   <School size={16} /> II. Teilnehmerdaten & Beitragsübersicht
                </h3>
                <table className="w-full border-collapse border-2 border-black font-sans text-[11px]">
                   <thead>
                      <tr className="bg-gray-50 uppercase font-black border-b-2 border-black">
                         <th className="p-4 border-r border-black w-10">Nr.</th>
                         <th className="p-4 border-r border-black text-left">Eingeschriebene Person</th>
                         <th className="p-4 border-r border-black text-center">Geburtsdatum</th>
                         <th className="p-4 border-r border-black text-center">Klasse</th>
                         <th className="p-4 text-right">Anteil mtl.</th>
                      </tr>
                   </thead>
                   <tbody>
                      {sourceData.participants.map((m, i) => (
                        <tr key={i} className="h-12 border-b border-black/10 italic">
                           <td className="p-4 border-r border-black text-center font-bold">{i + 1}.</td>
                           <td className="p-4 border-r border-black font-black uppercase text-sm">{m.firstName} {m.lastName}</td>
                           <td className="p-4 border-r border-black text-center font-bold">{new Date(m.birthDate).toLocaleDateString('de-DE')}</td>
                           <td className="p-4 border-r border-black text-center font-black text-indigo-700">{m.className}</td>
                           <td className="p-4 text-right font-black">{m.feeNum.toFixed(2)} €</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </section>

             {/* III. Finanzielle Zusammenfassung */}
             <section className="space-y-4 pt-4">
                <h3 className="text-[11px] font-black uppercase bg-emerald-50 px-4 py-2 border-l-8 border-emerald-600 italic flex items-center gap-3">
                   <CreditCard size={16} className="text-emerald-700" /> III. Abrechnungsmodalitäten
                </h3>
                <div className="grid grid-cols-2 gap-8 pt-2">
                   <div className="p-6 border-2 border-black rounded-3xl bg-white shadow-sm flex justify-between items-center">
                      <div>
                         <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Monatsbeitrag (Gesamt)</p>
                         <p className="text-[7px] font-bold text-gray-400 uppercase italic leading-tight">Berechnet inkl. Geschwister-Rabatt</p>
                      </div>
                      <div className="text-right">
                         <span className="text-5xl font-black italic text-madrassah-950">{sourceData.totalMonthly.toFixed(2)} €</span>
                      </div>
                   </div>
                   <div className="p-6 border-2 border-dashed border-indigo-200 rounded-3xl bg-indigo-50/30 flex justify-between items-center">
                      <div>
                         <p className="text-[9px] font-black uppercase text-indigo-900 mb-1">Aufnahmegebühr</p>
                         <p className="text-[7px] font-bold text-indigo-400 uppercase italic">Einmalig fällig bei Kursstart</p>
                      </div>
                      <div className="text-right">
                         <span className="text-3xl font-black italic text-indigo-900">{sourceData.totalRegistration.toFixed(2)} €</span>
                      </div>
                   </div>
                </div>

                <div className="p-6 border-2 border-indigo-900 rounded-[2rem] bg-indigo-50/50 flex flex-col gap-2 animate-in fade-in duration-500">
                   <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-indigo-950 mb-2">
                      <Landmark size={14}/> Gewählte Zahlungsweise
                   </h4>
                   <div className="flex items-center gap-4">
                      <span className="bg-indigo-950 text-white px-6 py-2 rounded-xl text-xs font-black uppercase italic tracking-widest shadow-md">
                         {sourceData.paymentMethod || 'Nicht angegeben'}
                      </span>
                      <p className="text-[9px] font-bold text-indigo-400 uppercase italic">
                         {sourceData.paymentMethod === 'Überweisung' 
                           ? 'Zahlung erfolgt per Banküberweisung bis zum 5. des Monats.' 
                           : 'Zahlung erfolgt monatlich in Bar vor Ort.'}
                      </p>
                   </div>
                </div>

                <div className="bg-gray-900 text-white p-6 rounded-[2.5rem] flex justify-between items-center mt-4">
                   <div className="flex items-center gap-4">
                      <Euro size={24} className="text-emerald-400" />
                      <p className="text-[11px] font-black uppercase tracking-[0.2em]">Fälliger Gesamtbetrag zur ersten Stunde:</p>
                   </div>
                   <p className="text-4xl font-black italic">{(sourceData.totalMonthly + sourceData.totalRegistration).toFixed(2)} €</p>
                </div>
             </section>

             {/* Bestimmungen */}
             <div className="mt-8 border-2 border-dashed border-black/10 p-8 rounded-[2.5rem] bg-gray-50/50">
                <h4 className="text-[10px] font-black uppercase mb-3 italic">Erklärung des Vertragspartners:</h4>
                <p className="text-[10px] leading-relaxed text-gray-600 italic">
                   Hiermit bestätige ich die Anmeldung der oben genannten Personen für das laufende Schuljahr. Ich erkenne die Hausordnung der Madrassah Al-Huda an. Die Aufnahmegebühr in Höhe von {sourceData.totalRegistration.toFixed(2)} € wird mit dem ersten Monatsbeitrag fällig. Zahlungen sind pünktlich bis zum 5. des Kalendermonats zu leisten. 
                </p>
             </div>

             <div className="grid grid-cols-2 gap-40 pt-16 mt-auto">
                <div className="text-center border-t-2 border-black pt-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 italic">Hamburg, den {sourceData.registrationDate ? new Date(sourceData.registrationDate).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')}</p>
                   <p className="text-[11px] font-black uppercase italic">Unterschrift Eltern / Vormund</p>
                </div>
                <div className="text-center border-t-2 border-black pt-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 italic">Institutsleitung</p>
                   <p className="text-[12px] font-black uppercase italic tracking-tighter">Sarfraz Azmat Butt</p>
                </div>
             </div>
          </div>
          
          <div className="mt-12 pt-6 text-[7px] font-black text-gray-300 uppercase tracking-[0.5em] flex justify-between border-t border-dotted border-gray-200">
             <span>Digital Student Registry &copy; 2026 • Madrassah Al-Huda • CLOUD VERIFIED</span>
             <div className="flex items-center gap-4">
                <ShieldCheck size={10} className="grayscale opacity-20" />
                <span>EXPORT-GEN: {studentId?.substring(0, 8).toUpperCase()}</span>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; }
          .no-print { display: none !important; }
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>
    </div>
  );
};

export default PrintableRegistrationForm;
