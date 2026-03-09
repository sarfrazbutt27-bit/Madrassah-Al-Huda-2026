
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  Globe, 
  Scroll, 
  Smartphone,
  Video,
  PlayCircle,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  FileCheck,
  Euro,
  Settings,
  UserCheck,
  GraduationCap,
  MousePointer2,
  Database,
  Milestone
} from 'lucide-react';
import LogoIcon from './LogoIcon';

const MadrassahInfo: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [demoTime, setDemoTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setDemoTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const demoSteps = [
    {
      title: "Präzise Einzelabrechnung",
      desc: "Keine Verwechslung mehr bei Geschwistern. Die Schulleitung sieht jedes Kind einzeln aufgeführt. Zahlungen können sekundenschnell per Klick quittiert werden, was volle Transparenz über das Institutsbudget schafft.",
      icon: <Euro className="text-emerald-500" />,
      color: "border-emerald-200 bg-emerald-50",
      feature: "Finanz-Präzision",
      component: (
         <div className="bg-white rounded-2xl shadow-xl border p-4 space-y-3 animate-in zoom-in duration-500">
            <div className="flex items-center justify-between border-b pb-2">
               <span className="text-[8px] font-black uppercase text-gray-400">Einzel-Checkout v3.2</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            <div className="space-y-2">
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-emerald-100">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold">Mustafa Muster (Kind 1)</span>
                     <span className="text-[7px] text-emerald-600 font-black">BEZAHLT ✓</span>
                  </div>
                  <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white"><CheckCircle2 size={14}/></div>
               </div>
               <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-red-100 shadow-sm">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold">Zainab Muster (Kind 2)</span>
                     <span className="text-[7px] text-red-500 font-black">OFFEN (Fam. Rabatt)</span>
                  </div>
                  <button className="px-3 py-1 bg-madrassah-950 text-white text-[7px] font-black rounded-md">LOG</button>
               </div>
            </div>
         </div>
      )
    },
    {
      title: "Automatisierter Workflow",
      desc: "Das neue Registrierungssystem verknüpft Geschwister automatisch über die familyId. Nach der Anmeldung wird sofort ein druckfertiger Aufnahmevertrag inklusive aller Bestimmungen und Gebühren generiert.",
      icon: <LayoutGrid className="text-indigo-500" />,
      color: "border-indigo-200 bg-indigo-50",
      feature: "Smart Registration",
      component: (
         <div className="bg-madrassah-950 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
               <FileCheck size={20} />
               <span className="text-[9px] font-black uppercase">Automatisierung aktiv</span>
            </div>
            <div className="space-y-2">
               <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[100%]"></div></div>
               <p className="text-[8px] font-bold text-gray-400">1. Eingabe WhatsApp-Nummer</p>
               <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[100%]"></div></div>
               <p className="text-[8px] font-bold text-gray-400">2. Stammdaten-Check (Auto-Fill)</p>
               <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-indigo-400 w-[60%]"></div></div>
               <p className="text-[8px] font-bold text-gray-400">3. Vertrag generieren...</p>
            </div>
         </div>
      )
    },
    {
      title: "KI-Pädagogik & Audit",
      desc: "Unsere Lehrer nutzen Gemini 3 KI, um individuelle Zeugnisbemerkungen zu verfassen. Die Schulleitung erhält am Jahresende einen KI-generierten Audit-Bericht über die finanzielle Gesundheit des Instituts.",
      icon: <Sparkles className="text-purple-500" />,
      color: "border-purple-200 bg-purple-50",
      feature: "KI Integration",
      component: (
        <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-purple-100 space-y-4 animate-in slide-in-from-right duration-700">
           <div className="flex items-center gap-3">
              <Sparkles className="text-purple-600 animate-pulse" size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest text-purple-950">KI-Dozent aktiv</span>
           </div>
           <div className="p-4 bg-purple-50 rounded-xl italic text-[10px] leading-relaxed text-purple-900 border border-purple-100">
              "Mustafa zeigt exzellente Fortschritte im Tajweed. Seine Pünktlichkeit ist vorbildlich. Wir empfehlen den Hifz-Kurs."
           </div>
           <div className="flex justify-end"><button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase">Einfügen</button></div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-32">
      {/* Hero */}
      <div className="bg-madrassah-950 p-12 md:p-24 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
           <div className="absolute top-0 right-0 p-20 rotate-12"><Globe size={400} /></div>
           <div className="absolute bottom-0 left-0 p-20 -rotate-12"><Scroll size={300} /></div>
        </div>
        
        <div className="relative z-10 space-y-10 max-w-5xl">
           <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl transform hover:scale-110 transition-transform p-6 text-madrassah-950">
              <LogoIcon className="w-16 h-16" />
           </div>
           <div>
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none mb-6">Madrassah Al-Huda</h1>
              <div className="flex flex-wrap justify-center gap-3">
                 <span className="bg-emerald-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Campus Portal v4.0</span>
                 <span className="bg-white/10 border border-white/20 text-madrassah-100 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Digital Learning Environment</span>
              </div>
           </div>
           <p className="text-xl md:text-2xl font-medium italic text-madrassah-100/90 leading-relaxed max-w-4xl mx-auto">
             "Integration von Wissen, Technologie und automatisierter Verwaltung für eine exzellente islamische Ausbildung."
           </p>
        </div>
      </div>

      {/* DASHBOARD DEMO */}
      <div className="bg-white p-12 md:p-20 rounded-[5rem] shadow-sm border border-gray-100 overflow-hidden relative">
         <div className="relative z-10 flex flex-col lg:flex-row items-stretch gap-20">
            <div className="flex-1 space-y-12">
               <div className="space-y-6">
                  <div className="inline-flex items-center gap-3 bg-emerald-50 text-emerald-700 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                     <PlayCircle size={16} className="animate-pulse" /> Live Tour & Funktionen
                  </div>
                  <h2 className="text-5xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-tight">Benutzungshinweise</h2>
                  <p className="text-lg text-gray-500 font-medium italic leading-relaxed">
                     Entdecken Sie die automatisierten Abläufe für Schulleitung und Kollegium.
                  </p>
               </div>
               
               <div className="space-y-4">
                  {demoSteps.map((step, i) => (
                     <button 
                       key={i} 
                       onClick={() => setActiveStep(i)}
                       className={`w-full text-left p-10 rounded-[3rem] border-2 transition-all flex items-center justify-between group ${activeStep === i ? 'bg-madrassah-950 border-madrassah-950 text-white shadow-2xl scale-[1.02]' : 'bg-gray-50 border-gray-100 hover:border-madrassah-200'}`}
                     >
                        <div className="flex items-center gap-8">
                           <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner transition-all ${activeStep === i ? 'bg-white/10' : 'bg-white border border-gray-100'}`}>
                              {React.cloneElement(step.icon as React.ReactElement<any>, { size: 32 })}
                           </div>
                           <div>
                              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${activeStep === i ? 'text-emerald-400' : 'text-gray-400'}`}>{step.feature}</p>
                              <h4 className="text-2xl font-black uppercase italic tracking-tight">{step.title}</h4>
                           </div>
                        </div>
                        <div className={`p-3 rounded-full border transition-all ${activeStep === i ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-100 text-gray-300'}`}>
                           <ChevronRight size={24} />
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            <div className="flex-1 w-full flex items-center">
               <div className="w-full bg-gray-900 rounded-[4rem] p-4 shadow-[0_50px_100px_rgba(0,0,0,0.4)] border-[12px] border-gray-800 relative overflow-hidden group">
                  <div className="bg-gray-800 rounded-t-[2.5rem] p-6 flex items-center justify-between">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                     </div>
                     <div className="bg-gray-700 px-8 py-1.5 rounded-full text-[8px] font-black text-gray-400 uppercase tracking-widest">madrassah-huda.app/audit</div>
                     <div className="text-[8px] font-bold text-gray-500">{demoTime}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-10 h-[500px] flex flex-col justify-center items-center relative">
                     <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center"><LogoIcon className="w-96 h-96" /></div>
                     
                     <div className="relative z-10 w-full max-w-sm space-y-10">
                        {demoSteps[activeStep].component}
                        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl space-y-4">
                           <h3 className="text-2xl font-black text-madrassah-950 uppercase italic leading-none">{demoSteps[activeStep].title}</h3>
                           <p className="text-sm font-medium text-gray-600 leading-relaxed italic">{demoSteps[activeStep].desc}</p>
                        </div>
                     </div>

                     <div className="absolute bottom-20 right-20 text-madrassah-950 animate-bounce"><MousePointer2 size={42} fill="currentColor" /></div>
                  </div>
                  
                  <div className="p-6 bg-gray-800 flex items-center gap-6">
                     <PlayCircle className="text-emerald-500" size={32} />
                     <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-2/3"></div></div>
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">Tutorial Modus</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Manual Content */}
      <div className="space-y-12">
         <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 p-5 rounded-3xl shadow-inner border border-indigo-100 flex items-center justify-center"><Smartphone size={40} /></div>
            <div>
               <h2 className="text-5xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Anwender-Handbuch</h2>
               <p className="text-gray-400 font-bold uppercase text-[12px] tracking-[0.6em] mt-3">Schritt-für-Schritt Anleitungen</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
               { 
                 role: 'Schulleitung', 
                 tasks: [
                   'Automatisierte Aufnahme (Vererbung der Daten)', 
                   'Einzel-Check der Finanzquittungen', 
                   'Personal-Accounts & Klassenzuweisung', 
                   'Druck der Monats- & Jahresbilanzen'
                 ], 
                 icon: <Settings size={32}/> 
               },
               { 
                 role: 'Lehrkräfte', 
                 tasks: [
                   'Digitale Präsenzliste (Rote/Gelbe Warnung)', 
                   'KI-gestützte Zeugnisbemerkungen', 
                   'Noten-Matrix (0-20 Pkt. Bereich)', 
                   'Online-Meetings über die Zoom-Zentrale'
                 ], 
                 icon: <UserCheck size={32}/> 
               },
               { 
                 role: 'Schüler & Eltern', 
                 tasks: [
                   'Dashboard mit Hausaufgaben-Deadline', 
                   'Download von ID-Karten (Identity-Check)', 
                   'Einsicht in freigegebene Zeugnisse', 
                   'Material-Bibliothek (PDF/Video)'
                 ], 
                 icon: <GraduationCap size={32}/> 
               }
            ].map((box, i) => (
               <div key={i} className="bg-white rounded-[4rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col group hover:-translate-y-2 transition-all">
                  <div className="bg-indigo-950 p-12 text-white relative">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">{box.icon}</div>
                     <h3 className="text-3xl font-black uppercase italic tracking-tight">{box.role}</h3>
                  </div>
                  <div className="p-12 flex-1 space-y-6">
                     <ul className="space-y-5">
                        {box.tasks.map((task, j) => (
                           <li key={j} className="flex gap-4 items-start">
                              <div className="w-6 h-6 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="text-emerald-500" size={14} /></div>
                              <p className="text-sm font-medium text-gray-600 leading-relaxed italic">{task}</p>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            ))}
         </div>
      </div>

      <div className="bg-indigo-950 p-16 md:p-24 rounded-[5rem] text-white flex flex-col lg:flex-row items-center gap-20 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-20 opacity-5 rotate-12"><Database size={300} /></div>
         
         <div className="flex-1 space-y-10">
            <div className="bg-emerald-500 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest w-fit shadow-xl">Infrastruktur & Sicherheit</div>
            <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-tight">Cloud & Datenschutz</h2>
            <p className="text-xl font-medium italic text-indigo-100 leading-relaxed">
               Alle sensiblen Daten werden DSGVO-konform verschlüsselt und in Echtzeit zwischen Schulleitung und Lehrkräften synchronisiert. 
               Papierlose Verwaltung für eine nachhaltige Zukunft.
            </p>
         </div>

         <div className="flex-1 w-full max-w-lg">
            <div className="bg-white rounded-[3.5rem] p-12 text-madrassah-950 space-y-8 shadow-2xl">
               <h3 className="text-3xl font-black uppercase italic tracking-tight">Ansprechpartner</h3>
               <div className="space-y-6">
                  <div className="flex gap-6 items-start">
                     <div className="w-12 h-12 bg-madrassah-50 rounded-2xl flex items-center justify-center shrink-0"><Milestone className="text-madrassah-950" size={24}/></div>
                     <div>
                        <h4 className="font-black uppercase text-xs">Institut Hamburg</h4>
                        <p className="text-sm text-gray-500 italic mt-1 leading-relaxed">Für technischen Support wenden Sie sich bitte an die Institutsleitung unter Shaikh Sarfraz Azmat Butt.</p>
                     </div>
                  </div>
               </div>
               <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                  <LogoIcon className="w-14 h-14" />
                  <p className="text-xl font-black italic">EST. 2010</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default MadrassahInfo;
