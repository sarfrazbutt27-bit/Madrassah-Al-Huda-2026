import React from 'react';
import { 
  HelpCircle, ShieldCheck, UserCheck, GraduationCap, 
  Euro, Video, IdCard, MessageCircle, FileText, 
  Smartphone, Info, Zap,
  Calendar
} from 'lucide-react';
import { User, UserRole } from '../types';

interface HelpCenterProps {
  user: User;
}

const HelpCenter: React.FC<HelpCenterProps> = ({ user }) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-8">
           <div className="bg-madrassah-950 p-6 rounded-[2rem] shadow-2xl text-white transform -rotate-2">
              <HelpCircle size={42} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Hilfe-Zentrum</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 italic">Madrassah Al-Huda Benutzungshinweise</p>
           </div>
        </div>
        <div className="bg-emerald-50 px-8 py-5 rounded-[2.5rem] border border-emerald-100 flex items-center gap-4">
           <ShieldCheck size={24} className="text-emerald-600" />
           <p className="text-[10px] font-black uppercase text-emerald-950 tracking-widest leading-relaxed italic">Systemstatus: Sicher & Aktiv</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Hauptspalte: Rollen-spezifisch */}
        <div className="lg:col-span-8 space-y-12">
           
           {/* Section für Schulleitung */}
           {(user.role === UserRole.PRINCIPAL) && (
              <section className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden">
                 <div className="bg-indigo-950 p-10 text-white flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20"><ShieldCheck size={28}/></div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Leitfaden für Schulleiter</h3>
                 </div>
                 <div className="p-10 space-y-10">
                    <div className="flex gap-8 items-start">
                       <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner"><Euro size={24}/></div>
                       <div>
                          <h4 className="font-black text-madrassah-950 uppercase text-lg mb-2">Finanzen & Geschwister-Logik</h4>
                          <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                             Das System berechnet Beiträge automatisch: 30€ (1 Kind), 50€ (2 Kinder), ab 3 Kindern 20€/Kind. 
                             Sie müssen lediglich die familyId bei der Aufnahme prüfen – das System macht den Rest.
                          </p>
                       </div>
                    </div>
                    <div className="flex gap-8 items-start">
                       <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner"><MessageCircle size={24}/></div>
                       <div>
                          <h4 className="font-black text-madrassah-950 uppercase text-lg mb-2">WhatsApp QR-Codes</h4>
                          <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                             Hinterlegen Sie unter "WhatsApp-QR" den Gruppen-Einladungslink. Der QR-Code wird sofort für alle Lehrer und Schüler dieser Klasse generiert.
                          </p>
                       </div>
                    </div>
                    <div className="flex gap-8 items-start">
                       <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner"><FileText size={24}/></div>
                       <div>
                          <h4 className="font-black text-madrassah-950 uppercase text-lg mb-2">Zeugnis-Freigabe</h4>
                          <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                             Lehrer tragen Noten ein. Erst wenn Sie (oder der Lehrer) im Zeugnis-Manager die "Freigabe" aktivieren, kann der Schüler sein Zeugnis sehen.
                          </p>
                       </div>
                    </div>
                 </div>
              </section>
           )}

           {/* Section für Lehrer */}
           {(user.role === UserRole.TEACHER || user.role === UserRole.PRINCIPAL) && (
              <section className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden">
                 <div className="bg-emerald-600 p-10 text-white flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20"><UserCheck size={28}/></div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Leitfaden für Dozenten</h3>
                 </div>
                 <div className="p-10 space-y-10">
                    <div className="flex gap-8 items-start">
                       <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner"><Calendar size={24}/></div>
                       <div>
                          <h4 className="font-black text-madrassah-950 uppercase text-lg mb-2">Anwesenheit & Risiko-Warnung</h4>
                          <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                             Markieren Sie Schüler als anwesend (grün) oder abwesend (rot). Ab 9 Fehltagen erscheint ein gelbes Warn-Icon, ab 18 Tagen ein rotes. Das System informiert Sie über kritische Fälle.
                          </p>
                       </div>
                    </div>
                    <div className="flex gap-8 items-start">
                       <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner"><Zap size={24}/></div>
                       <div>
                          <h4 className="font-black text-madrassah-950 uppercase text-lg mb-2">KI-Assistent für Gutachten</h4>
                          <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                             Nutzen Sie im Zeugnis-Ansichtsmodus den Button "KI-Bemerkung". Die KI analysiert die Noten und das Verhalten und schlägt einen professionellen Text vor.
                          </p>
                       </div>
                    </div>
                 </div>
              </section>
           )}

           {/* Section für Schüler */}
           {(user.role === UserRole.STUDENT || user.role === UserRole.PRINCIPAL) && (
              <section className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden">
                 <div className="bg-madrassah-800 p-10 text-white flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20"><GraduationCap size={28}/></div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Leitfaden für Schüler & Eltern</h3>
                 </div>
                 <div className="p-10 space-y-10">
                    <div className="flex gap-8 items-start">
                       <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner"><IdCard size={24}/></div>
                       <div>
                          <h4 className="font-black text-madrassah-950 uppercase text-lg mb-2">Dein Digitaler ID-Ausweis</h4>
                          <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                             Dein Ausweis enthält alle wichtigen Kontodaten für die Überweisung. Eltern können den "Familien-Ausweis" nutzen, der den Gesamtbetrag aller Kinder anzeigt.
                          </p>
                       </div>
                    </div>
                    <div className="flex gap-8 items-start">
                       <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner"><Video size={24}/></div>
                       <div>
                          <h4 className="font-black text-madrassah-950 uppercase text-lg mb-2">Zoom-Meetings beitreten</h4>
                          <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                             Geplante Sitzungen erscheinen direkt in deinem Dashboard. Ein Klick auf den blauen Button verbindet dich sofort mit dem virtuellen Klassenzimmer.
                          </p>
                       </div>
                    </div>
                 </div>
              </section>
           )}
        </div>

        {/* Seitenspalte: FAQ & Support */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-indigo-950 p-10 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Info size={150}/></div>
              <h3 className="text-xl font-black uppercase italic mb-8 border-b border-white/10 pb-4">Häufige Fragen</h3>
              <div className="space-y-6">
                 <div className="group">
                    <p className="text-[10px] font-black uppercase text-indigo-300 mb-2">Wo finde ich meine Noten?</p>
                    <p className="text-xs italic text-indigo-100/60 leading-relaxed">Im Schüler-Dashboard unter "Zeugnisse". Hinweis: Diese müssen erst vom Lehrer freigegeben werden.</p>
                 </div>
                 <div className="group">
                    <p className="text-[10px] font-black uppercase text-indigo-300 mb-2">Login klappt nicht?</p>
                    <p className="text-xs italic text-indigo-100/60 leading-relaxed">Prüfe, ob du die richtige Rolle (Schüler/Lehrer) ausgewählt hast. Schüler loggen sich mit ihrer ID (HUDA-XXXXXX) ein.</p>
                 </div>
                 <div className="group">
                    <p className="text-[10px] font-black uppercase text-indigo-300 mb-2">Synchronisierung?</p>
                    <p className="text-xs italic text-indigo-100/60 leading-relaxed">Klicke auf den Button "Synchronisieren" in der Sidebar, um die neuesten Daten aus der Cloud zu laden.</p>
                 </div>
              </div>
           </div>

           <div className="bg-gray-50 p-10 rounded-[3.5rem] border border-gray-200 space-y-8 italic">
              <div className="flex items-center gap-4 text-madrassah-950">
                 <Smartphone size={24} className="text-indigo-600"/>
                 <h4 className="font-black uppercase text-sm tracking-widest">Technischer Support</h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                 Bei Problemen mit Ihrem Account oder der Bedienung wenden Sie sich bitte direkt an die Schulleitung:
              </p>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                 <p className="text-[9px] font-black uppercase text-gray-400">Verantwortlich</p>
                 <p className="text-sm font-black text-madrassah-950 uppercase tracking-tighter">Shaikh Sarfraz Azmat Butt</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;