
import React from 'react';
import { Book, ArrowRight, Sparkles, ChevronLeft } from 'lucide-react';

interface YassarnalQuranSelectionProps {
  onNavigate: (page: 'teil1' | 'teil2') => void;
}

const YassarnalQuranSelection: React.FC<YassarnalQuranSelectionProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 md:p-8 font-sans relative">
      <button 
        onClick={() => window.location.hash = '#/'}
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-madrassah-950 hover:text-gold-600 transition-colors font-black uppercase text-[10px] tracking-widest no-print"
      >
        <ChevronLeft size={18} /> Zurück
      </button>

      <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-4xl md:text-5xl font-black text-madrassah-950 mb-4 tracking-tight">
          Qaida Lernen
        </h1>
        <p className="text-lg md:text-xl text-gray-600 font-medium">
          Wähle dein Buch
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Card 1: Teil 1 */}
        <div className="group bg-white rounded-[2.5rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-madrassah-200 flex flex-col items-center text-center animate-in fade-in slide-in-from-left-8 duration-700 delay-150">
          <div className="w-20 h-20 bg-madrassah-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Book className="w-10 h-10 text-madrassah-600" />
          </div>
          <h2 className="text-2xl font-bold text-madrassah-950 mb-1">Yassarnal Quran</h2>
          <h3 className="text-xl font-black text-gold-600 uppercase tracking-widest mb-4">Teil 1</h3>
          <p className="text-gray-500 mb-8 font-medium">Arabische Buchstaben und Grundlagen</p>
          <button 
            onClick={() => onNavigate('teil1')}
            className="w-full py-5 bg-madrassah-950 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-colors flex items-center justify-center gap-3 group/btn shadow-lg shadow-madrassah-900/20"
          >
            Teil 1 öffnen
            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Card 2: Teil 2 */}
        <div className="group bg-white rounded-[2.5rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-gold-200 flex flex-col items-center text-center animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
          <div className="w-20 h-20 bg-gold-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-10 h-10 text-gold-600" />
          </div>
          <h2 className="text-2xl font-bold text-madrassah-950 mb-1">Yassarnal Quran</h2>
          <h3 className="text-xl font-black text-gold-600 uppercase tracking-widest mb-4">Teil 2</h3>
          <p className="text-gray-500 mb-8 font-medium">Wörter, Harakat und Lesen</p>
          <button 
            onClick={() => onNavigate('teil2')}
            className="w-full py-5 bg-gold-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gold-700 transition-colors flex items-center justify-center gap-3 group/btn shadow-lg shadow-gold-600/20"
          >
            Teil 2 öffnen
            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default YassarnalQuranSelection;
