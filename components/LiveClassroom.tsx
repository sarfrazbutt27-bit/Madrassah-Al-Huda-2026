
import React, { useState } from 'react';
import { 
  Video, 
  ExternalLink, 
  Save, 
  ShieldCheck, 
  Info, 
  Link as LinkIcon,
  Copy,
  CheckCircle,
  MonitorPlay,
  Globe,
  Radio,
  ArrowRight
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LiveClassroomProps {
  user: User;
  onUpdateUser?: (user: User) => void;
  onNotify: (n: { userId: string; role: UserRole; title: string; message: string; type: string }) => void;
}

const LiveClassroom: React.FC<LiveClassroomProps> = ({ user, onUpdateUser, onNotify }) => {
  const [zoomUrl, setZoomUrl] = useState(user.zoomUrl || '');
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    if (onUpdateUser) {
      onUpdateUser({ ...user, zoomUrl });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    
    if (zoomUrl) {
      onNotify({
        userId: 'ALL',
        role: UserRole.STUDENT,
        title: 'Virtual Classroom Bereit',
        message: `${user.name} hat den Zoom-Link für den Online-Unterricht aktualisiert. Sie können jetzt beitreten.`,
        type: 'meeting'
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(zoomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Visual Header Hub */}
      <div className="bg-indigo-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="absolute top-0 right-0 p-12 opacity-10 text-white pointer-events-none rotate-12">
           <Video size={300} />
        </div>
        <div className="relative z-10 flex items-center gap-10">
           <div className="w-28 h-28 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl transform -rotate-3 animate-pulse">
              <Radio size={48} className="text-red-400" />
           </div>
           <div>
              <div className="flex items-center gap-3 mb-4">
                 <span className="bg-red-500 text-white px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-bounce">Live Hub</span>
                 <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">v4.0 Enterprise</span>
              </div>
              <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Zoom-Zentrale</h2>
              <p className="text-indigo-200/60 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 flex items-center gap-2">
                 <Globe size={14} /> Globaler Unterrichts-Stream aktiv
              </p>
           </div>
        </div>
        
        {zoomUrl && (
          <a 
            href={zoomUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative z-10 bg-white text-indigo-950 px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-4 shadow-2xl hover:bg-indigo-50 transition-all hover:-translate-y-1 active:scale-95"
          >
             <MonitorPlay size={22} /> Meeting jetzt starten
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Link Management */}
         <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] shadow-xl border border-gray-100 space-y-12 relative overflow-hidden">
            <div className="space-y-6">
               <h3 className="text-2xl font-black text-indigo-950 uppercase italic tracking-tighter flex items-center gap-4">
                  <LinkIcon size={28} className="text-indigo-600" /> Permanenter Unterrichts-Link
               </h3>
               <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-2xl italic">
                  Hinterlegen Sie hier Ihren festen Zoom-Link. Dieser Link wird in den Dashboards Ihrer Schüler (Klasse: {user.assignedClasses?.join(', ') || 'Keine'}) als direkter Beitritts-Button angezeigt.
               </p>
            </div>

            <div className="relative group">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-200 group-focus-within:text-indigo-600 transition-colors">
                  <ExternalLink size={24} />
               </div>
               <input 
                type="text" 
                value={zoomUrl}
                onChange={(e) => setZoomUrl(e.target.value)}
                placeholder="https://zoom.us/j/123456789..."
                className="w-full pl-16 pr-24 py-7 bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner text-indigo-900"
               />
               <button 
                 onClick={copyToClipboard}
                 className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white text-gray-300 hover:text-indigo-600 rounded-2xl transition-all shadow-sm border border-gray-100"
               >
                 {copied ? <CheckCircle size={20} className="text-emerald-500" /> : <Copy size={20} />}
               </button>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2.5rem] flex items-center gap-8 shadow-sm">
               <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-200/50">
                  <ShieldCheck size={32} />
               </div>
               <div>
                  <p className="text-xs font-black text-emerald-950 uppercase tracking-widest">Echtzeit-Synchronisierung</p>
                  <p className="text-[11px] text-emerald-800 font-medium mt-1 leading-relaxed">
                    Alle Änderungen werden sofort an die Campus-Server übertragen und sind für Ihre Klassen sofort sichtbar.
                  </p>
               </div>
            </div>

            <div className="pt-6 flex flex-col items-center">
               <button 
                onClick={handleSave}
                disabled={!zoomUrl}
                className={`w-full md:w-auto px-20 py-7 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl transition-all hover:-translate-y-1.5 active:scale-95 ${
                  isSaved ? 'bg-emerald-600 text-white' : 'bg-indigo-950 text-white hover:bg-black'
                }`}
               >
                 {isSaved ? <><CheckCircle size={24} /> Konfiguration gespeichert</> : <><Save size={24} /> Link jetzt aktualisieren</>}
               </button>
               <p className="mt-8 text-[9px] font-black text-gray-300 uppercase tracking-[0.5em] italic">Madrassah Secure Hub v4.0</p>
            </div>
         </div>

         {/* Info & Tips */}
         <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
               <div className="flex items-center gap-4 text-indigo-950">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                     <Info size={24} />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-widest">Dozenten-Check</h4>
               </div>
               <p className="text-[11px] text-gray-500 font-medium leading-relaxed uppercase tracking-widest">
                  Nutzen Sie für Zoom am besten einen "Wiederkehrenden Link" ohne Passwort, damit Ihre Schüler ohne Verzögerung beitreten können.
               </p>
               <ul className="space-y-4 pt-4 border-t border-gray-50">
                  <li className="flex items-center gap-3 text-[9px] font-black uppercase text-emerald-600"><CheckCircle size={14}/> Kamera aktiviert</li>
                  <li className="flex items-center gap-3 text-[9px] font-black uppercase text-emerald-600"><CheckCircle size={14}/> Mikrofon Test</li>
                  <li className="flex items-center gap-3 text-[9px] font-black uppercase text-emerald-600"><CheckCircle size={14}/> Stabil Verbindung</li>
               </ul>
            </div>

            <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <MonitorPlay size={80} />
               </div>
               <h3 className="text-xl font-black uppercase italic mb-4">Zoom Support</h3>
               <p className="text-[10px] font-medium text-indigo-100 leading-relaxed mb-8">
                  Haben Sie Probleme mit Ihrem Account? Kontaktieren Sie die Schulleitung für einen offiziellen Huda-Zoom-Account.
               </p>
               <button className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/20 transition-all flex items-center justify-center gap-3">
                  Hilfe anfordern <ArrowRight size={14} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default LiveClassroom;
