
import React, { useState } from 'react';
import { Library, Plus, Trash2, ExternalLink, Search, BookOpen, X, Loader2, Save } from 'lucide-react';
import { LibraryResource, User } from '../types';

interface LibraryManagerProps {
  resources: LibraryResource[];
  onUpdateResources: (resources: LibraryResource[]) => Promise<boolean | void>;
  classes: string[];
  user: User;
}

const LibraryManager: React.FC<LibraryManagerProps> = ({ resources, onUpdateResources, classes, user }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('Alle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [newResource, setNewResource] = useState<Partial<LibraryResource>>({
    title: '',
    url: '',
    className: '',
    description: ''
  });

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (r.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === 'Alle' || r.className === selectedClassFilter;
    return matchesSearch && matchesClass;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title || !newResource.url || !newResource.className) return;

    setIsSubmitting(true);
    const resource: LibraryResource = {
      id: Date.now().toString(),
      title: newResource.title,
      url: newResource.url,
      className: newResource.className,
      description: newResource.description,
      createdAt: new Date().toISOString(),
      createdBy: user.name
    };

    const updated = [...resources, resource];
    await onUpdateResources(updated);
    setIsSubmitting(false);
    setShowAddModal(false);
    setNewResource({ title: '', url: '', className: '', description: '' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Möchten Sie dieses Material wirklich löschen?')) {
      const updated = resources.filter(r => r.id !== id);
      await onUpdateResources(updated);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Header Section */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-indigo-950 pointer-events-none rotate-12"><Library size={280} /></div>
        <div className="relative z-10 flex items-center gap-8">
           <div className="bg-madrassah-950 p-6 rounded-[2rem] shadow-2xl text-white transform -rotate-3">
              <Library size={36} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Lehrer-Bibliothek</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">Verwaltung von Lehrmaterialien & Büchern</p>
           </div>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="relative z-10 bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-4 shadow-xl hover:bg-black transition-all"
        >
           <Plus size={22} /> Material hinzufügen
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text" 
              placeholder="Material suchen..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border-2 border-gray-100 rounded-[2.5rem] text-sm font-bold outline-none focus:bg-white focus:border-madrassah-950 transition-all shadow-sm" 
            />
         </div>
         <div className="relative w-full lg:w-72">
            <select 
              value={selectedClassFilter} 
              onChange={e => setSelectedClassFilter(e.target.value)}
              className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-[2.5rem] text-xs font-black uppercase outline-none appearance-none cursor-pointer shadow-sm focus:border-madrassah-950 transition-all"
            >
              <option value="Alle">Alle Klassen</option>
              {classes.map(c => <option key={c} value={c}>Klasse {c}</option>)}
            </select>
         </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredResources.length > 0 ? filteredResources.map(r => (
          <div key={r.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-indigo-950 group-hover:scale-110 transition-transform"><BookOpen size={120} /></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border border-indigo-100">
                  Klasse {r.className}
                </span>
                <button 
                  onClick={() => handleDelete(r.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-black text-madrassah-950 uppercase italic leading-tight mb-2">{r.title}</h3>
                <p className="text-gray-400 text-xs font-medium line-clamp-2 italic">{r.description || 'Keine Beschreibung vorhanden.'}</p>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-gray-50">
                <p className="text-[8px] font-black text-gray-300 uppercase italic">Hinzugefügt am {new Date(r.createdAt).toLocaleDateString('de-DE')}</p>
                <a 
                  href={r.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-madrassah-950 text-white p-3 rounded-xl hover:bg-black transition-all shadow-lg"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center space-y-6 bg-white rounded-[4rem] border-4 border-dashed border-gray-100">
             <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mx-auto">
                <Library size={48} />
             </div>
             <div>
                <p className="text-2xl font-black text-gray-300 uppercase italic tracking-tighter">Keine Materialien gefunden</p>
                <p className="text-gray-400 text-xs font-bold uppercase mt-2">Füge neue Bücher oder Links für die Lehrer hinzu.</p>
             </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-madrassah-950/80 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 shadow-2xl relative border-4 border-white animate-in zoom-in duration-300 my-auto">
            <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-gray-300 hover:text-red-500 transition-all"><X size={32}/></button>
            
            <div className="mb-12">
              <h3 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Material hinzufügen</h3>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 italic">Link zu Buch oder Dokument für Lehrer</p>
            </div>

            <form onSubmit={handleAddResource} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block italic">Titel des Materials</label>
                  <input 
                    required 
                    placeholder="z.B. Arabisch Buch Stufe 1" 
                    value={newResource.title} 
                    onChange={e => setNewResource({...newResource, title: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold outline-none focus:border-madrassah-950 transition-all" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block italic">Download-Link / URL</label>
                  <input 
                    required 
                    type="url"
                    placeholder="https://..." 
                    value={newResource.url} 
                    onChange={e => setNewResource({...newResource, url: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold outline-none focus:border-madrassah-950 transition-all" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block italic">Ziel-Klasse</label>
                  <select 
                    required
                    value={newResource.className} 
                    onChange={e => setNewResource({...newResource, className: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold outline-none focus:border-madrassah-950 transition-all appearance-none"
                  >
                    <option value="">Klasse wählen...</option>
                    {classes.map(c => <option key={c} value={c}>Klasse {c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block italic">Beschreibung (Optional)</label>
                  <textarea 
                    placeholder="Kurze Info für den Lehrer..." 
                    value={newResource.description} 
                    onChange={e => setNewResource({...newResource, description: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl font-bold outline-none focus:border-madrassah-950 transition-all h-32 resize-none" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-madrassah-950 text-white py-6 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                Material jetzt speichern
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryManager;
