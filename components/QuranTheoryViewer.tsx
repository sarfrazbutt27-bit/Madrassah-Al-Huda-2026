
import React, { useState, useRef } from 'react';
import { Resource, Lesson, User } from '../types';
import { Play, Pause, Book, Music, ArrowLeft, X, Brain, Plus } from 'lucide-react';

interface QuranTheoryViewerProps {
  user: User;
  resource: Resource;
  onClose: () => void;
  onUpdateResource?: (updated: Resource) => void;
  canEdit?: boolean;
}

const QuranTheoryViewer: React.FC<QuranTheoryViewerProps> = ({ user, resource, onClose, onUpdateResource, canEdit }) => {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLessons, setEditedLessons] = useState<Lesson[]>(resource.lessons || []);
  const [editedTitle, setEditedTitle] = useState(resource.title);
  const [editedUrl, setEditedUrl] = useState(resource.url);
  const lastResourceId = useRef(resource.id);

  // Load draft from localStorage on mount or when resource changes
  React.useEffect(() => {
    const draftKey = `quran_edit_draft_${resource.id}`;
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setEditedLessons(draft.lessons || []);
        setEditedTitle(draft.title || '');
        setEditedUrl(draft.url || '');
        setIsEditing(true);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    } else {
      setEditedLessons(resource.lessons || []);
      setEditedTitle(resource.title);
      setEditedUrl(resource.url);
      setIsEditing(false);
    }
    lastResourceId.current = resource.id;
  }, [resource.id, resource.lessons, resource.title, resource.url]);

  // Save draft to localStorage whenever it changes
  React.useEffect(() => {
    if (isEditing) {
      const draftKey = `quran_edit_draft_${resource.id}`;
      localStorage.setItem(draftKey, JSON.stringify({
        lessons: editedLessons,
        title: editedTitle,
        url: editedUrl
      }));
    } else {
      localStorage.removeItem(`quran_edit_draft_${resource.id}`);
    }
  }, [editedLessons, editedTitle, editedUrl, isEditing, resource.id]);

  const handleSaveLessons = () => {
    if (onUpdateResource) {
      onUpdateResource({
        ...resource,
        title: editedTitle,
        url: editedUrl,
        lessons: editedLessons
      });
      setIsEditing(false);
      localStorage.removeItem(`quran_edit_draft_${resource.id}`);
    }
  };

  const addLesson = () => {
    setEditedLessons([...editedLessons, { title: '', audioUrl: '' }]);
  };

  const removeLesson = (idx: number) => {
    setEditedLessons(editedLessons.filter((_, i) => i !== idx));
  };

  const updateLesson = (idx: number, field: keyof Lesson, value: string) => {
    const updated = [...editedLessons];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditedLessons(updated);
  };

  const show = (v: string | null) => v || '***';

  const [showHint, setShowHint] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const getDirectAudioUrl = (url: string, variant: number = 0) => {
    if (!url) return '';
    const cleanUrl = url.trim();

    // Handle Google Drive links
    if (cleanUrl.includes('drive.google.com')) {
      let id = '';
      if (cleanUrl.includes('id=')) {
        id = cleanUrl.split('id=')[1].split('&')[0];
      } else {
        const match = cleanUrl.match(/\/d\/(.+?)(\/|$)/);
        if (match) id = match[1];
      }
      if (id) {
        // Variant 0: Docs UC with export=open (often best for cross-origin streaming)
        if (variant === 0) return `https://docs.google.com/uc?export=open&id=${id}`;
        // Variant 1: Drive UC with export=download
        if (variant === 1) return `https://drive.google.com/uc?export=download&id=${id}`;
        // Variant 2: Simple UC
        return `https://drive.google.com/uc?id=${id}`;
      }
    }

    // Handle Dropbox links
    if (cleanUrl.includes('dropbox.com')) {
      return cleanUrl.replace(/\?dl=0$/, '?raw=1').replace(/\?dl=1$/, '?raw=1');
    }

    return cleanUrl;
  };

  const [audioError, setAudioError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error("Audio error occurred", e);
    if (currentLesson && retryCount < 2) {
      // Try fallback variant
      setRetryCount(prev => prev + 1);
      const nextVariant = retryCount + 1;
      const fallbackUrl = getDirectAudioUrl(currentLesson.audioUrl, nextVariant);
      
      if (audioRef.current) {
        audioRef.current.src = fallbackUrl;
        audioRef.current.load();
        // Don't auto-play on error to avoid gesture policy issues
        setIsPlaying(false);
        setAudioError(
          `Ladeversuch ${retryCount + 1} fehlgeschlagen. Versuche alternative Verbindung...`
        );
      }
      return;
    }

    if (currentLesson) {
      const isAmr = currentLesson.audioUrl.toLowerCase().endsWith('.amr');
      const is3gp = currentLesson.audioUrl.toLowerCase().endsWith('.3gp');
      
      if (isAmr || is3gp) {
        setAudioError(
          "Dieses Format (.amr/.3gp) wird von Browsern nicht unterstützt.\n" +
          "Bitte konvertieren Sie die Aufnahme am Computer in .mp3 oder .wav."
        );
      } else {
        setAudioError(
          "Abspielen fehlgeschlagen. Mögliche Gründe:\n" +
          "1. Die Datei ist in Google Drive nicht öffentlich freigegeben.\n" +
          "2. Das Format wird von Ihrem Browser nicht unterstützt.\n" +
          "Tipp: Prüfen Sie die Freigabe (Jeder mit Link)."
        );
      }
      setIsPlaying(false);
    }
  };

  const handlePlayLesson = (lesson: Lesson) => {
    setAudioError(null);
    setRetryCount(0);

    // Pre-check for known unsupported formats
    const isUnsupported = lesson.audioUrl.toLowerCase().endsWith('.amr') || 
                         lesson.audioUrl.toLowerCase().endsWith('.3gp');
    
    if (isUnsupported) {
      setAudioError(
        "Dieses Format (.amr/.3gp) wird von Browsern nicht unterstützt.\n" +
        "Bitte konvertieren Sie die Aufnahme am Computer in .mp3 oder .wav."
      );
      setCurrentLesson(lesson);
      setIsPlaying(false);
      return;
    }
    
    if (currentLesson?.audioUrl === lesson.audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current?.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error("Playback failed");
            setAudioError("Abspielen fehlgeschlagen. Bitte klicken Sie auf 'Abspielen erzwingen'.");
            setIsPlaying(false);
          });
        }
        setIsPlaying(true);
      }
    } else {
      setCurrentLesson(lesson);
      setIsPlaying(true);
    }
  };

  // React to lesson changes for more stable playback
  React.useEffect(() => {
    if (currentLesson && audioRef.current) {
      const directUrl = getDirectAudioUrl(currentLesson.audioUrl, 0);
      audioRef.current.pause();
      audioRef.current.src = directUrl;
      audioRef.current.load();
      
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error("Initial playback failed");
            setAudioError("Laden fehlgeschlagen. Bitte klicken Sie auf 'Abspielen erzwingen'.");
            setIsPlaying(false);
          });
        }
      }
    }
  }, [currentLesson, isPlaying]);

  const openMiniPlayer = (lesson: Lesson) => {
    const directUrl = getDirectAudioUrl(lesson.audioUrl, 0);
    const width = 450;
    const height = 250;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    const popup = window.open(
      '',
      `Player_${lesson.title.replace(/[^a-zA-Z0-9]/g, '_')}`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=no`
    );

    if (popup) {
      popup.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Madrassah Player - ${lesson.title}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
                background-color: #f0fdf4;
                color: #064e3b;
                overflow: hidden;
              }
              .container {
                background: white;
                padding: 25px;
                border-radius: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                width: 85%;
                text-align: center;
                border: 1px solid #dcfce7;
              }
              h3 { font-size: 16px; margin: 0 0 20px 0; color: #065f46; line-height: 1.4; }
              audio { width: 100%; height: 40px; }
              .footer { font-size: 10px; margin-top: 20px; color: #10b981; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
              .hint { font-size: 11px; margin-top: 10px; color: #059669; opacity: 0.8; }
            </style>
          </head>
          <body>
            <div class="container">
              <h3>${lesson.title}</h3>
              <audio controls autoplay crossorigin="anonymous">
                <source src="${directUrl}">
                Ihr Browser unterstützt das Audio-Element nicht.
              </audio>
              <div class="hint">Falls kein Ton kommt, prüfen Sie die Freigabe der Datei.</div>
              <div class="footer">Madrassah Al-Huda</div>
            </div>
          </body>
        </html>
      `);
      popup.document.close();
    } else {
      alert("Das Mini-Fenster wurde blockiert! Bitte erlauben Sie Popups für diese Seite in Ihren Browser-Einstellungen.");
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
      if (url.includes('/view') || url.includes('/edit')) {
        return url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
      }
      if (url.includes('id=')) {
        const id = url.split('id=')[1].split('&')[0];
        return `https://drive.google.com/file/d/${id}/preview`;
      }
    }
    return url;
  };

  const pdfUrl = resource.bookUrl || resource.url;
  const embedUrl = getEmbedUrl(pdfUrl);

  return (
    <div className="bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl border-4 border-emerald-50 flex flex-col h-[85vh] md:h-[90vh] animate-in slide-in-from-bottom-8 duration-500 overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-600 p-4 md:p-8 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <Book size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Quran Theorie</h3>
            <p className="text-white/60 font-bold uppercase text-[9px] tracking-widest mt-2">{resource.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {canEdit && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                isEditing ? 'bg-white text-emerald-600' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              {isEditing ? 'Abbrechen' : 'Bearbeiten'}
            </button>
          )}
          <a 
            href={pdfUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
          >
            Extern öffnen
          </a>
          <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest">
            <X size={20} /> {user.role === 'STUDENT' ? 'Bibliothek' : 'Schließen'}
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: PDF Viewer */}
        <div className="flex-1 bg-gray-100 border-r border-gray-200 relative flex flex-col">
          <div className="flex-1 relative">
            <iframe
              src={embedUrl}
              className="w-full h-full border-none"
              title="PDF Viewer"
              allow="autoplay"
            />
            {/* Overlay hint for Google Drive issues */}
            {pdfUrl.includes('drive.google.com') && showHint && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 p-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-1000 delay-1000">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                  <Book size={16} />
                </div>
                <div className="text-[9px] font-bold text-amber-900 leading-tight uppercase">
                  Wird das Buch nicht geladen? <br/>
                  <span className="text-amber-600">Prüfen Sie die Freigabe oder nutzen Sie den Button oben.</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white border-t border-gray-100 md:hidden">
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg"
            >
              Buch in neuem Tab öffnen
            </a>
          </div>
        </div>

        {/* Right: Lessons List */}
        <div className="w-full lg:w-[400px] flex flex-col bg-white overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-emerald-600">
                <Music size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{isEditing ? 'Lektionen bearbeiten' : 'Lektionen'}</span>
              </div>
              {isEditing ? (
                <button 
                  onClick={addLesson}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                >
                  <Plus size={10} /> Neu
                </button>
              ) : (
                <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">WAV/M4A Support</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Basis-Informationen</p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-gray-400 uppercase ml-1">Titel</label>
                      <input 
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        placeholder="Titel der Ressource"
                        className="w-full bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-gray-400 uppercase ml-1">PDF / Buch URL</label>
                      <input 
                        value={editedUrl}
                        onChange={(e) => setEditedUrl(e.target.value)}
                        placeholder="PDF Link (Google Drive/Dropbox)"
                        className="w-full bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex justify-between items-center">
                    Audio Lektionen
                    <span className="text-[8px] font-bold text-gray-400 lowercase italic">({editedLessons.length} Lektionen)</span>
                  </p>
                  {editedLessons.map((lesson, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group space-y-3">
                      <input 
                        value={lesson.title}
                        onChange={(e) => updateLesson(idx, 'title', e.target.value)}
                        placeholder="Lektion Titel"
                        className="w-full bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-bold outline-none focus:border-emerald-500"
                      />
                      <input 
                        value={lesson.audioUrl}
                        onChange={(e) => updateLesson(idx, 'audioUrl', e.target.value)}
                        placeholder="Audio URL (Drive/Dropbox)"
                        className="w-full bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-bold outline-none focus:border-emerald-500"
                      />
                      <button 
                        onClick={() => removeLesson(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    onClick={addLesson}
                    className="w-full py-3 border-2 border-dashed border-emerald-200 text-emerald-600 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Lektion hinzufügen
                  </button>
                </div>

                <button 
                  onClick={handleSaveLessons}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-700 transition-all"
                >
                  Änderungen speichern
                </button>
              </div>
            ) : (!resource.lessons || resource.lessons.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-4">
                <Music size={48} strokeWidth={1} />
                <p className="font-black text-xl italic">{show(null)}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest">Keine Lektionen verfügbar</p>
              </div>
            ) : (
              resource.lessons.map((lesson, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                    currentLesson?.audioUrl === lesson.audioUrl
                      ? 'bg-emerald-50 border-emerald-500'
                      : 'bg-gray-50 border-gray-50 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 shrink-0 ${
                      currentLesson?.audioUrl === lesson.audioUrl
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white text-gray-300 border-gray-100 group-hover:border-emerald-200'
                    }`}>
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <span className="font-bold text-sm text-madrassah-950 truncate">{lesson.title}</span>
                  </div>
                  <button
                    onClick={() => handlePlayLesson(lesson)}
                    className={`p-3 rounded-xl transition-all ${
                      currentLesson?.audioUrl === lesson.audioUrl && isPlaying
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white'
                    }`}
                  >
                    {currentLesson?.audioUrl === lesson.audioUrl && isPlaying ? (
                      <Pause size={18} fill="currentColor" />
                    ) : (
                      <Play size={18} fill="currentColor" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Audio Player Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            {currentLesson ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center animate-pulse">
                      <Music size={14} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Aktuelle Lektion</p>
                      <p className="text-xs font-bold text-madrassah-950 truncate">{currentLesson.title}</p>
                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        Format: {currentLesson.audioUrl.split('.').pop()?.toUpperCase() || 'AUDIO'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.load();
                          audioRef.current.play();
                        }
                      }}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Neu laden"
                    >
                      <ArrowLeft size={16} className="rotate-90" />
                    </button>
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  controls
                  className="w-full h-10"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onError={handleAudioError}
                  key={currentLesson.audioUrl}
                  preload="metadata"
                  crossOrigin="anonymous"
                >
                  <source src={getDirectAudioUrl(currentLesson.audioUrl, 0)} />
                  Ihr Browser unterstützt das Audio-Element nicht.
                </audio>

                {audioError && (
                  <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                       <X size={14} className="shrink-0" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Fehler beim Abspielen</p>
                    </div>
                    <p className="text-[9px] font-bold text-red-800 leading-relaxed whitespace-pre-line">
                      {audioError}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button 
                        onClick={() => currentLesson && openMiniPlayer(currentLesson)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-madrassah-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-madrassah-700 transition-all shadow-md animate-pulse"
                      >
                        <Play size={10} /> Mini-Player öffnen
                      </button>
                      <button 
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.play().catch(() => {
                              setAudioError("Manueller Start fehlgeschlagen. Bitte Freigabe prüfen.");
                            });
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm"
                      >
                        <Play size={10} /> Abspielen erzwingen
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(currentLesson.audioUrl);
                          alert("Link kopiert! Sie können ihn nun in einem neuen Browser-Tab testen.");
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                      >
                        Link kopieren
                      </button>
                      <a 
                        href={getDirectAudioUrl(currentLesson.audioUrl, 1)} 
                        download
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-sm"
                      >
                        Datei herunterladen
                      </a>
                      <a 
                        href={currentLesson.audioUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm"
                      >
                        Freigabe prüfen
                      </a>
                    </div>
                    <p className="text-[7px] text-red-400 italic">
                      Tipp: Wenn "Abspielen erzwingen" nicht hilft, ist die Datei wahrscheinlich nicht öffentlich freigegeben.
                    </p>
                  </div>
                )}

                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                  <p className="text-[8px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Brain size={12} /> Hilfe & Tipps
                  </p>
                  <ul className="space-y-1">
                    <li className="text-[8px] text-emerald-800 font-bold">• Nutzen Sie den <span className="underline">"Mini-Player öffnen"</span> Button für die beste Kompatibilität.</li>
                    <li className="text-[8px] text-emerald-800 font-bold">• Wenn der Link im neuen Tab funktioniert, die App aber stumm bleibt: Klicken Sie auf <span className="underline">"Abspielen erzwingen"</span>. Manche Browser blockieren den Ton innerhalb von Apps aus Sicherheitsgründen.</li>
                    <li className="text-[8px] text-emerald-800 font-bold">• Freigabe in Google Drive muss auf <span className="underline">"Jeder mit Link"</span> stehen.</li>
                    <li className="text-[8px] text-emerald-800 font-bold">• Handy-Aufnahmen im <span className="underline">.amr</span> Format funktionieren nicht.</li>
                  </ul>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <a 
                    href={getDirectAudioUrl(currentLesson.audioUrl, 0)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-emerald-100 text-emerald-600 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-emerald-50 transition-all shadow-sm"
                  >
                    <Play size={12} /> In neuem Tab abspielen
                  </a>
                  <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">
                    Nutzen Sie diesen Button, wenn der Player oben stumm bleibt.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Wähle eine Lektion zum Abspielen</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuranTheoryViewer;
