
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, Volume2, Mic, Square, Save, Play, Trash2, CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { User, UserRole } from '../../types';

interface YassarnalQuranTeil2Props {
  user?: User;
  onBack: () => void;
}

const getAudioKey = (letter: string) => {
  const map: Record<string, string> = { 
    'ق': 'qaf', 'ك': 'kaf', 'ل': 'lam', 'م': 'meem',
    'ن': 'noon', 'و': 'waw', 'ه': 'ha', 'ي': 'ya'
  };
  return `teacher_audio_teil2_${map[letter] || letter}`;
};

const lessons = {
  1: {
    title: 'Lektion 1 – Wiederholung',
    letters: ['ق', 'ك', 'ل', 'م'],
    names: { 'ق': 'قاف', 'ك': 'كاف', 'ل': 'لام', 'م': 'ميم' },
    grid: [
      ['ق', 'ك', 'ل', 'م', 'ق'],
      ['ك', 'ل', 'م', 'ق', 'ك'],
      ['ل', 'م', 'ق', 'ك', 'ل'],
      ['م', 'ق', 'ك', 'ل', 'م'],
    ]
  },
  2: {
    title: 'Lektion 2 – Lange Vokale',
    letters: ['ن', 'و', 'ه', 'ي'],
    names: { 'ن': 'نون', 'و': 'واو', 'ه': 'هاء', 'ي': 'ياء' },
    grid: [
      ['ن', 'و', 'ه', 'ي', 'ن'],
      ['و', 'ه', 'ي', 'ن', 'و'],
      ['ه', 'ي', 'ن', 'و', 'ه'],
      ['ي', 'ن', 'و', 'ه', 'ي'],
    ]
  },
  3: {
    title: 'Lektion 3 – Sukoon',
    letters: ['أَ', 'إِ', 'أُ', 'بْ'],
    names: { 'أَ': 'ألف فتحة', 'إِ': 'ألف كسرة', 'أُ': 'ألف ضمة', 'بْ': 'باء سكون' },
    grid: [
      ['أَ', 'إِ', 'أُ', 'بْ', 'أَ'],
      ['إِ', 'أُ', 'بْ', 'أَ', 'إِ'],
      ['أُ', 'بْ', 'أَ', 'إِ', 'أُ'],
      ['بْ', 'أَ', 'إِ', 'أُ', 'بْ'],
    ]
  },
  4: {
    title: 'Lektion 4 – Shadda',
    letters: ['بَّ', 'بِّ', 'بُّ', 'تَّ'],
    names: { 'بَّ': 'باء شدة فتحة', 'بِّ': 'باء شدة كسرة', 'بُّ': 'باء شدة ضمة', 'تَّ': 'تاء شدة فتحة' },
    grid: [
      ['بَّ', 'بِّ', 'بُّ', 'تَّ', 'بَّ'],
      ['بِّ', 'بُّ', 'تَّ', 'بَّ', 'بِّ'],
      ['بُّ', 'تَّ', 'بَّ', 'بِّ', 'بُّ'],
      ['تَّ', 'بَّ', 'بِّ', 'بُّ', 'تَّ'],
    ]
  },
  5: {
    title: 'Lektion 5 – Tanween',
    letters: ['بًا', 'بٍ', 'بٌ', 'تًا'],
    names: { 'بًا': 'باء فتحتين', 'بٍ': 'باء كسرتين', 'بٌ': 'باء ضمتين', 'تًا': 'تاء فتحتين' },
    grid: [
      ['بًا', 'بٍ', 'بٌ', 'تًا', 'بًا'],
      ['بٍ', 'بٌ', 'تًا', 'بًا', 'بٍ'],
      ['بٌ', 'تًا', 'بًا', 'بٍ', 'بٌ'],
      ['تًا', 'بًا', 'بٍ', 'بٌ', 'تًا'],
    ]
  }
};

const YassarnalQuranTeil2: React.FC<YassarnalQuranTeil2Props> = ({ user, onBack }) => {
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

  const playPronunciation = (letter: string) => {
    const audioKey = getAudioKey(letter);
    const savedAudio = localStorage.getItem(audioKey);
    
    if (savedAudio) {
      const audio = new Audio(savedAudio);
      audio.play();
    } else {
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async (letter: string) => {
    try {
      setIsInitializingMic(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setTempAudio(prev => ({ ...prev, [letter]: base64Audio }));
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(letter);
      setIsInitializingMic(false);
    } catch (err) {
      console.error('Error accessing microphone:', err);
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
      localStorage.setItem(getAudioKey(letter), audioData);
      setSavedRecordings(prev => ({ ...prev, [letter]: true }));
      setTempAudio(prev => {
        const next = { ...prev };
        delete next[letter];
        return next;
      });
    }
  };

  const deleteRecording = (letter: string) => {
    localStorage.removeItem(getAudioKey(letter));
    setSavedRecordings(prev => ({ ...prev, [letter]: false }));
    setTempAudio(prev => {
      const next = { ...prev };
      delete next[letter];
      return next;
    });
  };

  if (!currentLesson) return <div>Lektion nicht gefunden</div>;

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto font-sans bg-[#fdfdfd] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 no-print">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-madrassah-950 font-bold transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Zurück zur Liste
        </button>
        
        <div className="flex flex-col items-end w-full md:w-auto">
          <div className="flex gap-2 mb-2 no-print">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                onClick={() => {
                  setActiveLesson(num);
                  window.location.hash = `#/yassarnal-quran/teil2/${num}`;
                }}
                className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${activeLesson === num ? 'bg-madrassah-950 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Lektion {num}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gold-50 px-4 py-2 rounded-2xl border border-gold-100">
            <CheckCircle2 className="w-5 h-5 text-gold-600" />
            <span className="text-sm font-black text-gold-700 uppercase tracking-widest">
              Yassarnal Quran Teil 2
            </span>
          </div>
        </div>
      </div>

      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-madrassah-950 mb-4 tracking-tight">
          {currentLesson.title}
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          Klicke auf die Buchstaben, um die Aussprache zu hören.
        </p>
      </div>

      <div className="bg-white rounded-[3rem] p-6 md:p-12 shadow-2xl border-2 border-gray-50 mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
          {currentLesson.grid.flat().map((letter, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <button
                onClick={() => playPronunciation(letter)}
                className="aspect-square bg-gray-50 rounded-[2rem] flex items-center justify-center text-5xl md:text-6xl font-arabic hover:bg-gold-600 hover:text-white hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-xl group relative overflow-hidden"
                dir="rtl"
              >
                <span className="relative z-10">{letter}</span>
                <div className="absolute inset-0 bg-gold-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                <Volume2 className="absolute bottom-4 right-4 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {savedRecordings[letter] && (
                  <div className="absolute top-4 left-4 text-green-500">
                    <CheckCircle2 className="w-4 h-4 fill-white" />
                  </div>
                )}
              </button>
              
              {isAdmin && (
                <div className="flex flex-wrap items-center justify-center gap-1 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  {isRecording === letter ? (
                    <button
                      onClick={stopRecording}
                      className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors animate-pulse"
                      title="Aufnahme stoppen"
                    >
                      <Square size={14} fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      onClick={() => startRecording(letter)}
                      disabled={!!isRecording || isInitializingMic}
                      className="p-2 bg-madrassah-950 text-white rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                      title="Aufnahme starten"
                    >
                      <Mic size={14} />
                    </button>
                  )}

                  {(tempAudio[letter] || localStorage.getItem(getAudioKey(letter))) && (
                    <>
                      <button
                        onClick={() => {
                          const audio = new Audio(tempAudio[letter] || localStorage.getItem(getAudioKey(letter))!);
                          audio.play();
                        }}
                        className="p-2 bg-gold-600 text-white rounded-xl hover:bg-gold-700 transition-colors"
                        title="Anhören"
                      >
                        <Play size={14} fill="currentColor" />
                      </button>
                      
                      {tempAudio[letter] && (
                        <button
                          onClick={() => saveRecording(letter)}
                          className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                          title="Speichern"
                        >
                          <Save size={14} />
                        </button>
                      )}

                      <button
                        onClick={() => deleteRecording(letter)}
                        className="p-2 bg-gray-200 text-gray-600 rounded-xl hover:bg-red-100 hover:text-red-600 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4 no-print">
        <button 
          onClick={() => {
            const next = activeLesson > 1 ? activeLesson - 1 : 1;
            window.location.hash = `#/yassarnal-quran/teil2/${next}`;
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
            window.location.hash = `#/yassarnal-quran/teil2/${next}`;
            setActiveLesson(next);
          }}
          disabled={activeLesson === 5}
          className="px-8 py-4 bg-madrassah-950 text-white rounded-2xl font-bold hover:bg-black disabled:opacity-30 transition-all shadow-lg shadow-madrassah-900/20"
        >
          Nächste Lektion
        </button>
      </div>

      {/* Footer Decoration */}
      <div className="mt-16 pt-6 border-t border-gray-100 flex justify-between items-center opacity-30">
        <div className="text-[8px] font-black uppercase tracking-widest">Seite {activeLesson}</div>
        <div className="w-8 h-8 rounded-full border border-madrassah-950 flex items-center justify-center text-[10px] font-black">
          H
        </div>
      </div>
    </div>
  );
};

export default YassarnalQuranTeil2;
