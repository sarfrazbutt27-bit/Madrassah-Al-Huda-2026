
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, Volume2, Mic, Square, Save, Play, Trash2, CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { User, UserRole } from '../../types';

interface YassarnalQuranTeil1Props {
  user?: User;
  onBack: () => void;
}

const getAudioKey = (letter: string) => {
  const map: Record<string, string> = { 
    'ا': 'alif', 'ب': 'ba', 'ت': 'ta',
    'ث': 'tha', 'ج': 'jeem', 'ح': 'haa', 'خ': 'khaa'
  };
  return `teacher_audio_${map[letter] || letter}`;
};

const lessons = {
  1: {
    title: 'Lektion 1 – Die arabischen Buchstaben',
    letters: ['ا', 'ب', 'ت', 'ث'],
    names: { 'ا': 'ألف', 'ب': 'باء', 'ت': 'تاء', 'ث': 'ثاء' },
    grid: [
      ['ا', 'ب', 'ت', 'ث', 'ا'],
      ['ب', 'ت', 'ث', 'ا', 'ب'],
      ['ت', 'ث', 'ا', 'ب', 'ت'],
      ['ث', 'ا', 'ب', 'ت', 'ث'],
    ]
  },
  2: {
    title: 'Lektion 2 – Einzelne Buchstaben',
    letters: ['ج', 'ح', 'خ', 'د'],
    names: { 'ج': 'جيم', 'ح': 'حاء', 'خ': 'خاء', 'د': 'دال' },
    grid: [
      ['ج', 'ح', 'خ', 'د', 'ج'],
      ['ح', 'خ', 'د', 'ج', 'ح'],
      ['خ', 'د', 'ج', 'ح', 'خ'],
      ['د', 'ج', 'ح', 'خ', 'د'],
    ]
  },
  3: {
    title: 'Lektion 3 – Einzelne Buchstaben',
    letters: ['ذ', 'ر', 'ز', 'س'],
    names: { 'ذ': 'ذال', 'ر': 'راء', 'ز': 'زاي', 'س': 'سين' },
    grid: [
      ['ذ', 'ر', 'ز', 'س', 'ذ'],
      ['ر', 'ز', 'س', 'ذ', 'ر'],
      ['ز', 'س', 'ذ', 'ر', 'ز'],
      ['س', 'ذ', 'ر', 'ز', 'س'],
    ]
  },
  4: {
    title: 'Lektion 4 – Einzelne Buchstaben',
    letters: ['ش', 'ص', 'ض', 'ط'],
    names: { 'ش': 'شين', 'ص': 'صاد', 'ض': 'ضاد', 'ط': 'طاء' },
    grid: [
      ['ش', 'ص', 'ض', 'ط', 'ش'],
      ['ص', 'ض', 'ط', 'ش', 'ص'],
      ['ض', 'ط', 'ش', 'ص', 'ض'],
      ['ط', 'ش', 'ص', 'ض', 'ط'],
    ]
  },
  5: {
    title: 'Lektion 5 – Einzelne Buchstaben',
    letters: ['ظ', 'ع', 'غ', 'ف'],
    names: { 'ظ': 'ظاء', 'ع': 'عين', 'غ': 'غين', 'ف': 'فاء' },
    grid: [
      ['ظ', 'ع', 'غ', 'ف', 'ظ'],
      ['ع', 'غ', 'ف', 'ظ', 'ع'],
      ['غ', 'ف', 'ظ', 'ع', 'غ'],
      ['ف', 'ظ', 'ع', 'غ', 'ف'],
    ]
  }
};

const YassarnalQuranTeil1: React.FC<YassarnalQuranTeil1Props> = ({ user, onBack }) => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [activeLesson, setActiveLesson] = useState<number>(parseInt(lessonId || '1'));
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [isInitializingMic, setIsInitializingMic] = useState(false);
  const [tempAudio, setTempAudio] = useState<Record<string, string>>({});
  const [savedRecordings, setSavedRecordings] = useState<Record<string, boolean>>(() => {
    const status: Record<string, boolean> = {};
    Object.values(lessons).forEach(lesson => {
      lesson.letters.forEach(l => {
        status[l] = !!localStorage.getItem(getAudioKey(l));
      });
    });
    return status;
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const isAdmin = user?.role === UserRole.PRINCIPAL;

  const currentLesson = lessons[activeLesson as keyof typeof lessons];

  const pronounce = (letter: string) => {
    const savedAudio = localStorage.getItem(getAudioKey(letter));
    
    if (savedAudio) {
      const audio = new Audio(savedAudio);
      audio.play().catch(err => {
        console.error("Playback error:", err);
        fallbackTTS(letter);
      });
      return;
    }

    fallbackTTS(letter);
  };

  const fallbackTTS = (letter: string) => {
    const utterance = new SpeechSynthesisUtterance();
    const ttsMap: Record<string, string> = {
      'ا': 'Alif', 'ب': 'Ba', 'ت': 'Ta',
      'ث': 'Tha', 'ج': 'Jeem', 'ح': 'Haa', 'خ': 'Khaa'
    };
    utterance.text = ttsMap[letter] || letter;
    
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
      utterance.lang = 'ar-SA';
    } else {
      utterance.lang = 'en-US';
    }
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async (letter: string) => {
    setIsInitializingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mime type
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setTempAudio(prev => ({ ...prev, [letter]: base64data }));
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(letter);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Mikrofon-Zugriff verweigert oder nicht verfügbar. Bitte stelle sicher, dass du der App den Zugriff auf dein Mikrofon erlaubt hast. Falls das Problem weiterhin besteht, versuche die App in einem neuen Tab zu öffnen.");
    } finally {
      setIsInitializingMic(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(null);
    }
  };

  const saveRecording = (letter: string) => {
    const audioData = tempAudio[letter];
    if (audioData) {
      try {
        localStorage.setItem(getAudioKey(letter), audioData);
        setSavedRecordings(prev => ({ ...prev, [letter]: true }));
        setTempAudio(prev => {
          const next = { ...prev };
          delete next[letter];
          return next;
        });
        alert("Aufnahme erfolgreich gespeichert!");
      } catch (e) {
        console.error("Save error:", e);
        alert("Fehler beim Speichern: Möglicherweise ist der Speicherplatz im Browser voll.");
      }
    }
  };

  const deleteRecording = (letter: string) => {
    if (confirm(`Aufnahme für ${letter} wirklich löschen?`)) {
      localStorage.removeItem(getAudioKey(letter));
      setSavedRecordings(prev => ({ ...prev, [letter]: false }));
    }
  };

  const playTemp = (letter: string) => {
    const audioData = tempAudio[letter];
    if (audioData) {
      const audio = new Audio(audioData);
      audio.play();
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto font-sans bg-[#fdfdfd] min-h-screen">
      {/* Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-madrassah-950 font-bold mb-6 transition-colors group no-print"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Zurück zur Auswahl
      </button>

      {/* Page Content (Workbook Style) */}
      <div className="bg-white shadow-2xl border border-gray-200 rounded-sm p-6 md:p-12 relative overflow-hidden">
        {/* Header */}
        <div className="border-b-2 border-madrassah-950 pb-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-madrassah-950 tracking-tight uppercase">
              Yassarnal Quran Teil 1
            </h1>
            <h2 className="text-lg md:text-xl font-bold text-gold-600 mt-1">
              {currentLesson.title}
            </h2>
          </div>
          <div className="flex flex-col items-end w-full md:w-auto">
            <div className="flex gap-2 mb-2 no-print">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    setActiveLesson(num);
                    window.location.hash = `#/yassarnal-quran/teil1/${num}`;
                  }}
                  className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${activeLesson === num ? 'bg-madrassah-950 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  Lektion {num}
                </button>
              ))}
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 hidden md:block">
              Madrassah Al-Huda Workbook
            </div>
            {isAdmin && (
              <div className="mt-2 px-4 py-1.5 bg-madrassah-950 text-gold-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-gold-400/30 flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse"></div>
                Admin-Aufnahme-Modus
              </div>
            )}
          </div>
        </div>

        {/* Main Layout: Grid Left, Learning Boxes Right */}
        <div className="flex flex-col-reverse md:flex-row gap-12 items-start">
          
          {/* Left Side: Exercise Grid */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-5 gap-0 border-t border-l border-gray-300 shadow-sm">
              {currentLesson.grid.map((row: string[], rowIndex: number) => (
                <React.Fragment key={rowIndex}>
                  {row.map((letter: string, colIndex: number) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => pronounce(letter)}
                      className="aspect-square border-r border-b border-gray-300 flex items-center justify-center bg-white hover:bg-madrassah-50 transition-colors group relative"
                    >
                      <span className="text-4xl md:text-5xl font-arabic leading-none pt-2 text-madrassah-950 group-active:scale-90 transition-transform">
                        {letter}
                      </span>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-20 transition-opacity">
                        <Volume2 size={12} />
                      </div>
                      {savedRecordings[letter] && (
                        <div className="absolute bottom-1 right-1 text-emerald-500/30">
                          <CheckCircle2 size={10} />
                        </div>
                      )}
                    </button>
                  ))}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-6 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                Tippe auf ein Feld, um die Aussprache zu hören
              </p>
            </div>
          </div>

          {/* Right Side: Learning Boxes (Vertical Stack) */}
          <div className="w-full md:w-64 flex flex-col gap-6">
            {currentLesson.letters.map((letter: string, idx: number) => {
              const hasRecording = savedRecordings[letter];
              
              return (
                <div 
                  key={letter} 
                  onClick={() => pronounce(letter)}
                  className={`border-2 p-5 flex flex-col items-center justify-center bg-white shadow-md rounded-xl relative transition-all duration-300 cursor-pointer ${hasRecording ? 'border-emerald-500/50 shadow-emerald-500/5' : 'border-madrassah-950'} hover:scale-[1.02] active:scale-95`}
                >
                  <div className="flex justify-between w-full mb-1">
                    <div className="text-xs font-black text-gray-300">{idx + 1}</div>
                    {hasRecording && (
                      <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                        <CheckCircle2 size={12} /> Aktiv
                      </div>
                    )}
                  </div>
                  
                  <div className="text-7xl font-arabic text-madrassah-950 mb-3 drop-shadow-sm">{letter}</div>
                  <div className="text-base font-bold text-madrassah-950 border-t border-gray-100 pt-3 w-full text-center mb-4">
                    {currentLesson.names[letter as keyof typeof currentLesson.names]}
                  </div>

                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="w-full space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        {isRecording === letter ? (
                          <button 
                            onClick={stopRecording}
                            className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 animate-pulse"
                          >
                            <Square size={16} fill="currentColor" /> Stoppen
                          </button>
                        ) : (
                          <button 
                            onClick={() => startRecording(letter)}
                            disabled={isInitializingMic}
                            className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg ${isInitializingMic ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : hasRecording ? 'bg-gray-100 text-gray-500 hover:bg-madrassah-950 hover:text-white' : 'bg-madrassah-950 text-white hover:bg-black shadow-madrassah-950/20'}`}
                          >
                            {isInitializingMic ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Mic size={16} />
                            )}
                            {isInitializingMic ? 'Initialisiere...' : hasRecording ? 'Neu Aufnehmen' : 'Aufnehmen'}
                          </button>
                        )}
                      </div>

                      {tempAudio[letter] && (
                        <div className="flex gap-2 animate-in slide-in-from-top-2">
                          <button 
                            onClick={() => playTemp(letter)}
                            className="flex-1 py-2.5 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase shadow-lg shadow-gold-500/20"
                          >
                            <Play size={14} fill="currentColor" /> Testen
                          </button>
                          <button 
                            onClick={() => saveRecording(letter)}
                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase shadow-lg shadow-emerald-600/20"
                          >
                            <Save size={14} /> Speichern
                          </button>
                        </div>
                      )}

                      {hasRecording && !tempAudio[letter] && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => pronounce(letter)}
                            className="flex-1 py-2 text-madrassah-950 hover:bg-madrassah-50 rounded-lg transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase border border-madrassah-950/10"
                          >
                            <Volume2 size={14} /> Abspielen
                          </button>
                          <button 
                            onClick={() => deleteRecording(letter)}
                            className="flex-1 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase"
                          >
                            <Trash2 size={14} /> Löschen
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer Decoration */}
        <div className="mt-16 pt-6 border-t border-gray-100 flex justify-between items-center opacity-30">
          <div className="text-[8px] font-black uppercase tracking-widest">Seite {activeLesson}</div>
          <div className="w-8 h-8 rounded-full border border-madrassah-950 flex items-center justify-center text-[10px] font-black">
            H
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 mt-12 no-print">
        <button 
          onClick={() => {
            const next = activeLesson > 1 ? activeLesson - 1 : 1;
            window.location.hash = `#/yassarnal-quran/teil1/${next}`;
            setActiveLesson(next);
          }}
          disabled={activeLesson === 1}
          className="px-8 py-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-400 hover:border-madrassah-950 hover:text-madrassah-950 disabled:opacity-30 disabled:hover:border-gray-100 transition-all"
        >
          Vorherige Lektion
        </button>
        <button 
          onClick={() => {
            const next = activeLesson < 5 ? activeLesson + 1 : 5;
            window.location.hash = `#/yassarnal-quran/teil1/${next}`;
            setActiveLesson(next);
          }}
          disabled={activeLesson === 5}
          className="px-8 py-4 bg-madrassah-950 text-white rounded-2xl font-bold hover:bg-black disabled:opacity-30 transition-all shadow-lg shadow-madrassah-900/20"
        >
          Nächste Lektion
        </button>
      </div>
    </div>
  );
};

export default YassarnalQuranTeil1;
