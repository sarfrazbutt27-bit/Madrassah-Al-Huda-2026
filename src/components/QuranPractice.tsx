
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, Pause, CheckCircle, RotateCcw, ChevronRight, ChevronLeft, 
  BookOpen, Trophy, User, Calendar, Clock, BarChart2, Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Student, User as AppUser, UserRole, QuranPracticeRecord } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Ayah {
  number: number;
  absolute_number: number;
  verse_key: string;
  text: string;
  numberInSurah: number;
  audio_url?: string;
}

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

interface QuranPracticeProps {
  currentUser: AppUser;
  students: Student[];
}

const QuranPractice: React.FC<QuranPracticeProps> = ({ currentUser, students }) => {
  const [surah, setSurah] = useState<Surah | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [practiceRecords, setPracticeRecords] = useState<QuranPracticeRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    currentUser.role === UserRole.STUDENT ? currentUser.id : ''
  );
  const [surahNumber, setSurahNumber] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTajweed, setShowTajweed] = useState(true);
  const [fontSize, setFontSize] = useState(5); // 5 = 5xl

  const isTeacher = currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.PRINCIPAL;

  const fetchSurahData = useCallback(async (num: number) => {
    setLoading(true);
    try {
      console.log(`DEBUG: Fetching Surah ${num} from Quran.com...`);
      // 1. Fetch Surah Info from Quran.com API v4
      const surahInfoRes = await fetch(`https://api.quran.com/api/v4/chapters/${num}?language=de`);
      const surahInfoData = await surahInfoRes.json();
      
      // 2. Fetch Verses with Tajweed from Quran.com (More reliable than AlQuran.cloud)
      const versesRes = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=${num}`);
      const versesData = await versesRes.json();
      
      // 3. Fetch Audio Info (Minshawi Murattal - ID 11) from Quran.com
      const audioRes = await fetch(`https://api.quran.com/api/v4/recitations/11/by_chapter/${num}`);
      const audioData = await audioRes.json();
      
      if (surahInfoData.chapter && versesData.verses) {
        const audioMap = new Map();
        audioData.audio_files.forEach((file: any) => {
          audioMap.set(file.verse_key, file.url);
        });

        const surahData: Surah = {
          number: surahInfoData.chapter.id,
          name: surahInfoData.chapter.name_arabic,
          englishName: surahInfoData.chapter.name_complex,
          englishNameTranslation: surahInfoData.chapter.translated_name.name,
          revelationType: surahInfoData.chapter.revelation_place,
          numberOfAyahs: surahInfoData.chapter.verses_count,
          ayahs: versesData.verses.map((v: any, idx: number) => {
            const verseKey = v.verse_key;
            const rawAudioUrl = audioMap.get(verseKey);
            let finalAudioUrl = null;
            if (rawAudioUrl) {
              finalAudioUrl = rawAudioUrl.startsWith('http') 
                ? rawAudioUrl 
                : `https://audio.qurancdn.com/${rawAudioUrl}`;
            }

            return {
              number: idx + 1,
              absolute_number: v.id,
              verse_key: verseKey,
              text: v.text_uthmani_tajweed, // This already contains <span class="tajweed-...">
              numberInSurah: idx + 1,
              audio_url: finalAudioUrl
            };
          })
        };
        setSurah(surahData);
      }
    } catch (error) {
      console.error("Error fetching Quran data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tanzil Tajweed Parser
  // [h] -> Hamzat Wasl
  // [s] -> Silah
  // [l] -> Lam Jalalah
  // [n] -> Ghunnah
  // [v] -> Madd Obligatory
  // [w] -> Madd Permissible
  // [y] -> Madd Long
  // [q] -> Qalqalah
  // [i] -> Iqlab
  // [f] -> Ikhfa
  // [g] -> Idgham with Ghunnah
  // [u] -> Idgham without Ghunnah
  const parseTanzilTajweed = (text: string) => {
    if (!text) return "";
    
    // If it already has spans, it's likely from Quran.com's uthmani_tajweed
    if (text.includes("<span")) return text;

    // Map Tanzil brackets to spans
    const tanzilMap: Record<string, string> = {
      'h': 'tz-h',
      's': 'tz-s',
      'l': 'tz-l',
      'n': 'tz-n',
      'v': 'tz-v',
      'w': 'tz-w',
      'y': 'tz-y',
      'm': 'tz-m',
      'q': 'tz-q',
      'i': 'tz-i',
      'f': 'tz-f',
      'p': 'tz-p',
      'c': 'tz-c',
      'g': 'tz-g',
      'j': 'tz-j',
      'u': 'tz-u',
      'k': 'tz-k'
    };

    let parsed = text;
    
    // Log raw text for debugging (only for the first ayah of a surah)
    if (text.length > 0 && text.includes("[") && text.includes("]")) {
      console.log("DEBUG: Raw Tajweed Text before parsing:", text.substring(0, 100) + "...");
    }

    // More robust replacement that handles potential nesting and multiple occurrences
    // We run it multiple times to handle nested tags if they exist
    let previous;
    let iterations = 0;
    do {
      previous = parsed;
      // This regex handles any single-letter OR multi-letter tag in brackets
      parsed = parsed.replace(/\[([a-zA-Z_]+)\](.*?)\[\/\1\]/g, (match, key, content) => {
        const lowerKey = key.toLowerCase();
        const className = tanzilMap[lowerKey] || `tz-${lowerKey}`;
        return `<span class="${className}">${content}</span>`;
      });
      iterations++;
    } while (parsed !== previous && iterations < 5);

    // Handle cases where tags might not be balanced or use different formats
    // Some Tanzil versions use [n] without a closing tag for a single letter
    if (parsed.includes("[") && parsed.includes("]")) {
      // Fallback: try to wrap single characters after a tag that wasn't closed
      parsed = parsed.replace(/\[([a-zA-Z_]+)\](.)/g, (match, key, char) => {
        // Skip if it looks like a closing tag start
        if (char === "/") return match;
        const lowerKey = key.toLowerCase();
        const className = tanzilMap[lowerKey] || `tz-${lowerKey}`;
        return `<span class="${className}">${char}</span>`;
      });
      
      // Remove any remaining brackets to keep text clean
      parsed = parsed.replace(/\[\/?[a-zA-Z_]+\]/g, "");
    }

    return parsed;
  };

  const fetchPracticeRecords = useCallback(async (studentId: string, sNum: number) => {
    if (!studentId) return;
    const { data, error } = await supabase
      .from('quran_practice')
      .select('*')
      .eq('student_id', studentId)
      .eq('surah_number', sNum);
    
    if (error) {
      console.error("Error fetching practice records:", error);
    } else {
      setPracticeRecords(data.map(r => ({
        id: r.id,
        studentId: r.student_id,
        surahNumber: r.surah_number,
        ayahNumber: r.ayah_number,
        practiced: r.practiced,
        repeatNeeded: r.repeat_needed,
        practiceCount: r.practice_count,
        lastPracticedAt: r.last_practiced_at
      })));
    }
  }, []);

  useEffect(() => {
    fetchSurahData(surahNumber);
  }, [surahNumber, fetchSurahData]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchPracticeRecords(selectedStudentId, surahNumber);
    }
  }, [selectedStudentId, surahNumber, fetchPracticeRecords]);

  const playAudio = (ayah: Ayah, onEnded?: () => void) => {
    if (playingAudio) {
      playingAudio.pause();
    }

    const handleEnded = () => {
      setPlayingAudio(null);
      setActiveAyah(null);
      if (onEnded) onEnded();
    };

    // Helper to try multiple sources sequentially
    const trySources = (sources: string[]) => {
      if (sources.length === 0) {
        console.error(`All audio sources failed for ayah ${ayah.verse_key}`);
        setPlayingAudio(null);
        setActiveAyah(null);
        if (onEnded) onEnded();
        return;
      }

      const currentSrc = sources[0];
      const audio = new Audio(currentSrc);
      
      audio.onended = handleEnded;
      audio.onerror = () => {
        console.warn(`Audio source failed: ${currentSrc}. Trying next...`);
        trySources(sources.slice(1));
      };

      audio.play().catch(error => {
        console.warn(`Playback failed for ${currentSrc}:`, error);
        // onerror will usually handle the source failure
      });

      setPlayingAudio(audio);
      setActiveAyah(ayah.number);
    };

    // Construct list of potential sources
    const sources: string[] = [];
    
    // 1. Quran.com URL (if available)
    if (ayah.audio_url) sources.push(ayah.audio_url);
    
    // 2. Islamic Network (Minshawi Murattal)
    sources.push(`https://cdn.islamic.network/quran/audio/128/ar.minshawi/${ayah.absolute_number}.mp3`);
    
    // 3. EveryAyah (Minshawi Murattal)
    const [sNum, aNum] = ayah.verse_key.split(':');
    const paddedS = sNum.padStart(3, '0');
    const paddedA = aNum.padStart(3, '0');
    sources.push(`https://everyayah.com/data/Minshawi_Murattal_128kbps/${paddedS}${paddedA}.mp3`);
    
    // 4. Global Quran (Minshawi)
    sources.push(`https://audio.globalquran.com/ar.minshawi/mp3/64k/${ayah.absolute_number}.mp3`);

    // 5. Alafasy (Emergency Fallback)
    sources.push(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.absolute_number}.mp3`);

    trySources(sources);
  };

  const stopAudio = () => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
      setActiveAyah(null);
      setIsPlayingAll(false);
    }
  };

  const playAll = async () => {
    if (!surah) return;
    setIsPlayingAll(true);
    
    for (const ayah of surah.ayahs) {
      if (!isPlayingAll && playingAudio) break;
      await new Promise<void>((resolve) => {
        playAudio(ayah, resolve);
      });
    }
    setIsPlayingAll(false);
  };

  const togglePractice = async (ayahNumber: number, type: 'practiced' | 'repeat') => {
    if (isTeacher && selectedStudentId !== currentUser.id) return; // Teachers can't mark for students unless it's themselves
    if (!selectedStudentId) return;

    const existing = practiceRecords.find(r => r.ayahNumber === ayahNumber);
    const now = new Date().toISOString();

    const update = {
      student_id: selectedStudentId,
      surah_number: surahNumber,
      ayah_number: ayahNumber,
      practiced: type === 'practiced' ? !(existing?.practiced) : (existing?.practiced || false),
      repeat_needed: type === 'repeat' ? !(existing?.repeatNeeded) : (existing?.repeatNeeded || false),
      practice_count: (existing?.practiceCount || 0) + (type === 'practiced' && !existing?.practiced ? 1 : 0),
      last_practiced_at: now
    };

    const { error } = await supabase
      .from('quran_practice')
      .upsert(update, { onConflict: 'student_id,surah_number,ayah_number' });

    if (error) {
      console.error("Error updating practice record:", error);
    } else {
      fetchPracticeRecords(selectedStudentId, surahNumber);
    }
  };

  const getRecord = (ayahNumber: number) => {
    return practiceRecords.find(r => r.ayahNumber === ayahNumber);
  };

  const practicedCount = practiceRecords.filter(r => r.practiced).length;
  const totalAyahs = surah?.numberOfAyahs || 0;
  const progressPercent = totalAyahs > 0 ? (practicedCount / totalAyahs) * 100 : 0;

  // Helper to render Tajweed text
  // The api.alquran.cloud quran-tajweed edition returns text with [h] [s] etc markers
  // We need to map these to colors.
  // Common mapping:
  // [h] -> Ghunnah (Pink/Red)
  // [s] -> Ikhfa (Blue)
  // [m] -> Madd (Orange)
  // [q] -> Qalqalah (Green)
  // etc.
  // However, the API often returns the text with <span> tags if requested correctly, 
  // but the 'quran-tajweed' edition text is actually just plain text with markers.
  // Actually, there's a better way: some editions return HTML.
  // Let's try to parse the markers if they exist, or just show the text if not.
  const renderTajweedText = (ayah: Ayah) => {
    const fontSizeStyle = { fontSize: `${fontSize * 0.75}rem` };
    
    // First parse Tanzil markers if present, then handle toggle
    let processedText = parseTanzilTajweed(ayah.text);
    
    // If Tajweed is disabled, strip HTML tags to show plain text
    const displayText = showTajweed 
      ? processedText 
      : processedText.replace(/<\/?[^>]+(>|$)/g, "");

    return (
      <div 
        dir="rtl" 
        className="font-quran leading-[2.5] text-right quran-text-container" 
        style={fontSizeStyle}
        dangerouslySetInnerHTML={{ __html: displayText }}
      />
    );
  };

  const filteredStudents = students.filter(s => 
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !surah) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gold-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gold-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-gold-600" />
              </div>
              <h1 className="text-3xl font-black text-madrassah-950">Quran Üben mit Tajweed</h1>
            </div>
            <p className="text-madrassah-600 font-medium">
              Referenz-Audio: Qari Muhammad Siddiq al-Minshawi (Mujawwad)
            </p>
          </div>

          {isTeacher && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-madrassah-400">Schüler auswählen</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-madrassah-400" />
                <input 
                  type="text"
                  placeholder="Suchen..."
                  className="pl-10 pr-4 py-2 bg-madrassah-50 border border-madrassah-100 rounded-xl text-sm focus:ring-2 focus:ring-gold-400 outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="px-4 py-2 bg-madrassah-50 border border-madrassah-100 rounded-xl text-sm focus:ring-2 focus:ring-gold-400 outline-none"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">-- Schüler wählen --</option>
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.className})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedStudentId && surah && (
          <div className="mt-8 pt-8 border-t border-gold-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gold-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-gold-500/20">
                  {surah.number}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-madrassah-950">{surah.name}</h2>
                  <p className="text-madrassah-500 font-medium">{surah.englishName} - {surah.englishNameTranslation}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-madrassah-400 uppercase tracking-widest mb-1">Fortschritt</div>
                <div className="text-3xl font-black text-gold-600">{practicedCount} / {totalAyahs}</div>
                <div className="text-xs font-bold text-madrassah-400">Ayat geübt</div>
              </div>
            </div>
            <div className="w-full h-3 bg-madrassah-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-gold-400 to-gold-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSurahNumber(Math.max(1, surahNumber - 1))}
              disabled={surahNumber <= 1}
              className="p-3 bg-white rounded-2xl border border-madrassah-100 text-madrassah-600 hover:bg-madrassah-50 disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <select 
              className="px-6 py-3 bg-white rounded-2xl border border-madrassah-100 font-bold text-madrassah-950 focus:ring-2 focus:ring-gold-400 outline-none appearance-none cursor-pointer"
              value={surahNumber}
              onChange={(e) => setSurahNumber(Number(e.target.value))}
            >
              {Array.from({ length: 114 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>Surah {num}</option>
              ))}
            </select>
            <button 
              onClick={() => setSurahNumber(Math.min(114, surahNumber + 1))}
              disabled={surahNumber >= 114}
              className="p-3 bg-white rounded-2xl border border-madrassah-100 text-madrassah-600 hover:bg-madrassah-50 disabled:opacity-50 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-madrassah-50 p-1.5 rounded-2xl border border-madrassah-100">
              <button 
                onClick={() => setFontSize(Math.max(3, fontSize - 1))}
                className="p-2 text-madrassah-400 hover:text-madrassah-600 transition-colors"
                title="Schrift verkleinern"
              >
                <span className="text-sm">A</span>
              </button>
              <div className="w-px h-4 bg-madrassah-200 mx-1"></div>
              <button 
                onClick={() => setFontSize(Math.min(8, fontSize + 1))}
                className="p-2 text-madrassah-400 hover:text-madrassah-600 transition-colors"
                title="Schrift vergrößern"
              >
                <span className="text-xl">A</span>
              </button>
            </div>

            <div className="flex items-center bg-madrassah-50 p-1.5 rounded-2xl border border-madrassah-100">
              <button 
                onClick={() => setShowTajweed(false)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${!showTajweed ? 'bg-white text-madrassah-950 shadow-sm' : 'text-madrassah-400 hover:text-madrassah-600'}`}
              >
                Uthmani
              </button>
              <button 
                onClick={() => setShowTajweed(true)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${showTajweed ? 'bg-gold-500 text-white shadow-sm' : 'text-madrassah-400 hover:text-madrassah-600'}`}
              >
                Tajweed
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={isPlayingAll ? stopAudio : playAll}
          className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-wider transition-all shadow-lg w-full md:w-auto self-end ${
            isPlayingAll 
              ? 'bg-red-500 text-white shadow-red-500/20' 
              : 'bg-madrassah-950 text-white shadow-madrassah-950/20 hover:scale-105'
          }`}
        >
          {isPlayingAll ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isPlayingAll ? 'Stoppen' : 'Ganzen Abschnitt abspielen'}
        </button>

        {/* Tajweed Legend */}
        {showTajweed && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 border border-madrassah-100 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 bg-gold-500 rounded-full"></div>
              <h3 className="text-sm font-black uppercase tracking-wider text-madrassah-950">Tajweed-Legende</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff0000]"></div>
                <span className="text-[11px] font-bold text-madrassah-600 uppercase">Ghunnah / Lam Jalalah</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#2196f3]"></div>
                <span className="text-[11px] font-bold text-madrassah-600 uppercase">Madd (Pflicht)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#4caf50]"></div>
                <span className="text-[11px] font-bold text-madrassah-600 uppercase">Madd (Erlaubt)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#1976d2]"></div>
                <span className="text-[11px] font-bold text-madrassah-600 uppercase">Madd (Lang)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#9c27b0]"></div>
                <span className="text-[11px] font-bold text-madrassah-600 uppercase">Ikhfa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff9800]"></div>
                <span className="text-[11px] font-bold text-madrassah-600 uppercase">Idgham mit Ghunnah</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#757575]"></div>
                <span className="text-[11px] font-bold text-madrassah-600 uppercase">Idgham ohne Ghunnah</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#e91e63]"></div>
                <span className="text-[11px] font-bold text-madrassah-600 uppercase">Qalqalah</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00bcd4]"></div>
                <span className="text-[11px] font-bold text-madrassah-600 uppercase">Iqlab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#aaaaaa]"></div>
                <span className="text-[11px] font-bold text-madrassah-600 uppercase">Hamzat Wasl</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Ayah List */}
      <div className="space-y-4">
        {surah && surah.number !== 1 && surah.number !== 9 && (
          <div dir="rtl" className="text-center py-12 font-quran text-gold-600 border-b border-gold-100 mb-8" style={{ fontSize: `${(fontSize + 1) * 0.75}rem` }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        )}
        {surah?.ayahs.map((ayah) => {
          const record = getRecord(ayah.number);
          const isActive = activeAyah === ayah.number;

          return (
            <motion.div 
              key={ayah.number}
              layout
              className={`bg-white rounded-3xl p-6 shadow-md border-2 transition-all ${
                isActive ? 'border-gold-400 ring-4 ring-gold-400/10' : 'border-transparent'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Ayah Number & Controls */}
                <div className="flex md:flex-col items-center justify-between md:justify-start gap-4 md:w-20">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                    record?.practiced ? 'bg-green-100 text-green-600' : 'bg-madrassah-50 text-madrassah-400'
                  }`}>
                    {ayah.numberInSurah}
                  </div>
                  
                  <button 
                    onClick={() => isActive ? stopAudio() : playAudio(ayah)}
                    className={`p-4 rounded-2xl transition-all ${
                      isActive 
                        ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/20 animate-pulse' 
                        : 'bg-madrassah-50 text-madrassah-600 hover:bg-gold-100 hover:text-gold-600'
                    }`}
                  >
                    {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                </div>

                {/* Text Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex justify-end">
                    {renderTajweedText(ayah)}
                  </div>

                  {/* Practice Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-madrassah-50">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => togglePractice(ayah.number, 'practiced')}
                        disabled={isTeacher && selectedStudentId !== currentUser.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          record?.practiced 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                            : 'bg-madrassah-50 text-madrassah-600 hover:bg-green-100 hover:text-green-600'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {record?.practiced ? 'Geübt' : 'Als geübt markieren'}
                      </button>

                      <button 
                        onClick={() => togglePractice(ayah.number, 'repeat')}
                        disabled={isTeacher && selectedStudentId !== currentUser.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          record?.repeatNeeded 
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                            : 'bg-madrassah-50 text-madrassah-600 hover:bg-amber-100 hover:text-amber-600'
                        }`}
                      >
                        <RotateCcw className="w-4 h-4" />
                        {record?.repeatNeeded ? 'Wiederholen' : 'Wiederholung nötig'}
                      </button>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-bold text-madrassah-400 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" />
                        <span>{record?.practiceCount || 0}x geübt</span>
                      </div>
                      {record?.lastPracticedAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Zuletzt: {new Date(record.lastPracticedAt).toLocaleDateString('de-DE')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Teacher Stats Summary */}
      {isTeacher && selectedStudentId && (
        <div className="bg-madrassah-950 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-gold-400" />
            <h3 className="text-xl font-bold">Lehrer-Übersicht</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Gesamtfortschritt</div>
              <div className="text-3xl font-black text-gold-400">{Math.round(progressPercent)}%</div>
              <div className="text-white/30 text-xs mt-1">der Surah abgeschlossen</div>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Wiederholungen</div>
              <div className="text-3xl font-black text-amber-400">
                {practiceRecords.filter(r => r.repeatNeeded).length}
              </div>
              <div className="text-white/30 text-xs mt-1">Ayat markiert</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Fleiß-Faktor</div>
              <div className="text-3xl font-black text-blue-400">
                {practiceRecords.reduce((acc, r) => acc + r.practiceCount, 0)}
              </div>
              <div className="text-white/30 text-xs mt-1">Gesamt-Wiederholungen</div>
            </div>
          </div>
        </div>
      )}
      {/* Debug Info (Only for teachers/admins) */}
      {isTeacher && surah && surah.ayahs.length > 0 && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-300 text-xs font-mono overflow-auto max-h-40">
          <p className="font-bold mb-2">Debug: Raw Tajweed Text (Ayah 1)</p>
          <pre>{surah.ayahs[0].text}</pre>
        </div>
      )}
    </div>
  );
};

export default QuranPractice;
