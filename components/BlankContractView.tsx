
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, Landmark, Euro, CreditCard } from 'lucide-react';
import LogoIcon from './LogoIcon';

const BlankContractView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="no-print flex justify-between items-center px-4">
        <button onClick={() => navigate(-1)} className="bg-white px-6 py-4 rounded-2xl shadow-sm border font-black uppercase text-[10px] tracking-widest"><ChevronLeft size={18} className="inline mr-2"/> Zurück</button>
        <button onClick={() => window.print()} className="bg-madrassah-950 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-3"><Printer size={20} /> Blanko-Formular drucken</button>
      </div>

      <div className="bg-white p-12 md:p-16 shadow-2xl print:shadow-none print:p-0 mx-auto w-full font-serif text-black leading-snug border border-gray-100 print:border-none">
        <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="p-3 bg-black text-white rounded-2xl"><LogoIcon className="w-14 h-14" /></div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter font-sans">Madrassah Al-Huda</h1>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-600 font-sans">Anmeldeformular • Aufnahme 2026</p>
            </div>
          </div>
          <div className="text-right font-sans font-black text-[10px] uppercase border border-black p-4">Eingangsdatum: __________</div>
        </div>

        <div className="space-y-10">
           <section>
              <h2 className="text-[11px] font-black uppercase bg-black text-white px-4 py-1.5 inline-block font-sans rounded-r-lg mb-6">I. Personalien der Erziehungsberechtigten</h2>
              <div className="grid grid-cols-2 gap-x-12 gap-y-10 pt-4">
                 <div className="border-b border-black/30 pb-2"><p className="text-[9px] font-black uppercase text-gray-400 font-sans mb-1">Vorname, Nachname</p><div className="h-6"></div></div>
                 <div className="border-b border-black/30 pb-2"><p className="text-[9px] font-black uppercase text-gray-400 font-sans mb-1">WhatsApp / Mobil</p><div className="h-6"></div></div>
                 <div className="border-b border-black/30 pb-2 col-span-2"><p className="text-[9px] font-black uppercase text-gray-400 font-sans mb-1">Wohnanschrift (Straße, Nr, PLZ, Stadt)</p><div className="h-6"></div></div>
              </div>
           </section>

           <section>
              <h2 className="text-[11px] font-black uppercase bg-black text-white px-4 py-1.5 inline-block font-sans rounded-r-lg mb-6">II. Kursbelegung & Studiendauer</h2>
              <table className="w-full border-collapse border-2 border-black font-sans text-[10px]">
                 <thead>
                    <tr className="bg-gray-100 uppercase font-black">
                       <th className="border border-black p-3 w-10">Nr.</th>
                       <th className="border border-black p-3">Name des Kindes</th>
                       <th className="border border-black p-3">Kurs (siehe unten)</th>
                       <th className="border border-black p-3">Intervall (z.B. monatl.)</th>
                    </tr>
                 </thead>
                 <tbody>
                    {[1, 2, 3].map(n => (
                      <tr key={n} className="h-14">
                         <td className="border border-black p-3 text-center font-bold">{n}.</td>
                         <td className="border border-black p-3"></td>
                         <td className="border border-black p-3"></td>
                         <td className="border border-black p-3 italic text-gray-300">Monatlich / Jährlich...</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </section>

           <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 border-2 border-black rounded-2xl bg-gray-50/50">
                 <h2 className="text-[11px] font-black uppercase tracking-widest mb-4 font-sans flex items-center gap-2 border-b border-black/10 pb-2"><Euro size={16} /> Gebühren-Tabelle (Monatlich)</h2>
                 <div className="grid grid-cols-2 gap-x-4 text-[9px] font-bold uppercase text-gray-600 font-sans leading-relaxed">
                    <p>● Ilmiya (5 J.): 100€</p>
                    <p>● Arabisch (3 J.): 30€</p>
                    <p>● Imam (3 J.): 50€</p>
                    <p>● Arabiyya (1 J.): 30€</p>
                    <p>● Hifz (3 J.): 50€</p>
                    <p>● Ijazah (1 J.): 30€</p>
                 </div>
                 <div className="mt-4 pt-4 border-t border-black/10 text-black font-black text-xs">
                    Gesamtbetrag: __________ , 00 €
                 </div>
              </div>

              <div className="p-6 border-2 border-indigo-600 rounded-2xl bg-indigo-50/30">
                 <h2 className="text-[11px] font-black uppercase tracking-widest mb-4 font-sans flex items-center gap-2 border-b border-indigo-200 pb-2 text-indigo-950"><Landmark size={18} /> Bankverbindung</h2>
                 <p className="text-[10px] font-black uppercase text-indigo-400">Kontoinhaber</p>
                 <p className="font-black text-sm uppercase">Azmat Ullah Butt</p>
                 <p className="text-[10px] font-black uppercase text-indigo-400 mt-2">IBAN</p>
                 <p className="font-black text-sm font-mono tracking-tighter">DE79 2004 1177 0546 3088 00</p>
              </div>
           </section>

           <section className="p-8 border-2 border-dashed border-black/20 rounded-3xl font-sans">
              <h2 className="text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><CreditCard size={16} /> Zahlungsmodalitäten</h2>
              <p className="text-[9px] font-bold uppercase text-gray-500 leading-relaxed">
                 Beiträge können monatlich, vierteljährlich, jährlich oder als Gesamtkurs-Vorauszahlung geleistet werden. 
                 Zahlungen sind bis zum 5. des jeweiligen Intervalls fällig. Eine Aufnahmegebühr von 10€ fällt einmalig pro Kind an.
              </p>
           </section>

           <div className="grid grid-cols-2 gap-32 pt-20">
             <div className="text-center"><div className="h-[1px] bg-black w-full mb-4"></div><p className="text-[10px] font-black uppercase tracking-widest font-sans">Ort / Datum</p></div>
             <div className="text-center"><div className="h-[1px] bg-black w-full mb-4"></div><p className="text-[10px] font-black uppercase tracking-widest font-sans">Unterschrift Erziehungsberechtigte/r</p></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BlankContractView;
