
import React, { useState, useMemo } from 'react';
import { MessageCircle, Save, Smartphone, QrCode, ShieldCheck, Info } from 'lucide-react';
import { ClassConfig, User, UserRole } from '../types';

interface ClassWhatsAppManagerProps {
  classConfigs: ClassConfig[];
  onUpdate: (configs: ClassConfig[]) => void;
  user: User;
}

const ClassWhatsAppManager: React.FC<ClassWhatsAppManagerProps> = ({ classConfigs, onUpdate, user }) => {
  const isAdmin = user.role === UserRole.PRINCIPAL;
  const assignedClasses = useMemo(() => user.assignedClasses || [], [user.assignedClasses]);

  const [editingLinks, setEditingLinks] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    classConfigs.forEach(c => map[c.className] = c.whatsappLink);
    return map;
  });

  const staticClasses = useMemo(() => [
    'J-1', 'J-2', 'J-3', 'J-4', 'J-5', 'J-6', 'J-1a', 'J-1b', 'J-Imam', 'J-Ijazah', 'J-Ilmiyyah', 'J-Hifz',
    'M-1', 'M-2', 'M-3', 'M-4', 'M-5', 'M-6', 'M-1a', 'M-1b', 'M-Imam', 'M-Ijazah', 'M-Ilmiyyah', 'M-Hifz',
    'Arabisch Modul 1', 'Arabisch Modul 2', 'Arabisch Modul 3'
  ], []);

  // Filter: Nur zugewiesene Klassen für Lehrer, alle für Schulleiter
  const visibleClasses = useMemo(() => {
    if (isAdmin) return staticClasses;
    return staticClasses.filter(c => assignedClasses.includes(c));
  }, [isAdmin, assignedClasses, staticClasses]);

  const handleSave = (className: string) => {
    const link = editingLinks[className] || '';
    const existingIdx = classConfigs.findIndex(c => c.className === className);
    const existingConfig = classConfigs[existingIdx];
    
    const newConfig: ClassConfig = {
      className,
      whatsappLink: link,
      selectedSubjects: existingConfig?.selectedSubjects || [],
      updatedAt: new Date().toISOString()
    };

    let nextConfigs;
    if (existingIdx > -1) {
      nextConfigs = [...classConfigs];
      nextConfigs[existingIdx] = newConfig;
    } else {
      nextConfigs = [...classConfigs, newConfig];
    }
    onUpdate(nextConfigs);
    alert(`WhatsApp-Link für Klasse ${className} erfolgreich gespeichert!`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-8">
           <div className="bg-emerald-600 p-6 rounded-[2rem] shadow-2xl text-white transform -rotate-3">
              <MessageCircle size={42} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter">WhatsApp-Zentrale</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">
                {isAdmin ? 'Alle Einladungslinks des Campus' : 'Einladungslinks Ihrer zugewiesenen Klassen'}
              </p>
           </div>
        </div>
        <div className="bg-emerald-50 px-8 py-5 rounded-[2.5rem] border border-emerald-100 flex items-center gap-4">
           <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600"><Smartphone size={24}/></div>
           <p className="text-[10px] font-black uppercase text-emerald-900 tracking-widest leading-relaxed">
             QR-Codes werden automatisch<br/>aus den Links generiert.
           </p>
        </div>
      </div>

      {visibleClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleClasses.map(c => {
            const currentLink = editingLinks[c] || '';
            const qrUrl = currentLink ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentLink)}` : null;

            return (
              <div key={c} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col group hover:shadow-2xl transition-all relative overflow-hidden">
                 <div className="flex justify-between items-center mb-6">
                    <span className="bg-indigo-950 text-white px-6 py-2 rounded-xl text-xs font-black uppercase italic">Klasse {c}</span>
                    {currentLink && <ShieldCheck size={18} className="text-emerald-500" />}
                 </div>

                 <div className="mb-8 flex-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block ml-2">Einladungs-Link</label>
                    <div className="relative">
                       <input 
                        type="text" 
                        value={currentLink}
                        onChange={e => setEditingLinks({...editingLinks, [c]: e.target.value})}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-[10px] font-bold focus:border-emerald-500 outline-none transition-all pr-12"
                       />
                       <button onClick={() => handleSave(c)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-xl hover:bg-black transition-all">
                          <Save size={16} />
                       </button>
                    </div>
                 </div>

                 {qrUrl ? (
                   <div className="bg-gray-50 rounded-[2.5rem] p-6 flex flex-col items-center gap-4 border-2 border-dashed border-gray-200">
                      <img src={qrUrl} alt="QR Code" className="w-32 h-32 bg-white p-2 rounded-xl shadow-inner" />
                      <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest italic">QR-CODE BEREIT</p>
                   </div>
                 ) : (
                   <div className="bg-gray-50 rounded-[2.5rem] h-44 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200 opacity-30">
                      <QrCode size={48} />
                      <p className="text-[9px] font-black uppercase">Kein Link hinterlegt</p>
                   </div>
                 )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 opacity-50 italic">
          <Info size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-black uppercase tracking-widest">Keine zugewiesenen Klassen gefunden.</p>
        </div>
      )}

      <div className="bg-madrassah-950 p-10 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center gap-10 opacity-80">
         <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shrink-0"><Info size={28}/></div>
         <div>
            <h4 className="text-lg font-black uppercase italic mb-2">Wie bekomme ich den Link?</h4>
            <p className="text-[11px] font-medium text-indigo-200 leading-relaxed uppercase tracking-widest italic">
              Gehen Sie in Ihrer WhatsApp Gruppe auf "Gruppeninfo" → "Mit Link einladen" → "Link kopieren". 
              Fügen Sie diesen Link oben für die entsprechende Klasse ein. Der QR-Code wird sofort für alle Schüler dieser Klasse sichtbar.
            </p>
         </div>
      </div>
    </div>
  );
};

export default ClassWhatsAppManager;
