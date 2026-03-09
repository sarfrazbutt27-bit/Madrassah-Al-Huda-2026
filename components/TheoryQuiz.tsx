
import React, { useState, useEffect } from 'react';
import { Resource, QuizQuestion, User, Grade, QuizResult } from '../types';
import { Brain, CheckCircle2, XCircle, ArrowRight, RefreshCw, Trophy, ArrowLeft, Loader2, HelpCircle, Timer, Play, Settings2, Send } from 'lucide-react';
import { generateQuizFromResource } from '../lib/geminiService';

interface TheoryQuizProps {
  user: User;
  resource: Resource;
  onClose: () => void;
  onUpdateResource: (updated: Resource) => void;
  onUpdateGrades: (grades: Grade[], itemsToSync?: Grade[]) => void;
  grades: Grade[];
  saveQuizResult: (result: QuizResult) => Promise<boolean>;
  updateAutomatedGrade: (studentId: string, subject: string, term: 'Halbjahr' | 'Abschluss') => Promise<void>;
  calculateSubjectGrade: (studentId: string, subject: string, term: 'Halbjahr' | 'Abschluss') => { total: number, hasBonus: boolean, isMaxed: boolean };
}

const TheoryQuiz: React.FC<TheoryQuizProps> = ({ 
  user, 
  resource, 
  onClose, 
  onUpdateResource, 
  onUpdateGrades, 
  grades,
  saveQuizResult,
  updateAutomatedGrade,
  calculateSubjectGrade
}) => {
  const [quizState, setQuizState] = useState<'setup' | 'quiz' | 'result'>('setup');
  const [mode, setMode] = useState<'practice' | 'test'>('practice');
  const [term, setTerm] = useState<'Halbjahr' | 'Abschluss'>('Halbjahr');
  const [practiceCount, setPracticeCount] = useState(10);
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isSubmitted, setIsSubmitted] = useState(false);

  const existingGrade = grades.find(g => g.studentId === user.id && g.subject === resource.subject && g.term === term);
  const attempts = resource.quizAttempts?.[user.id] || 0;
  
  // If teacher deleted the grade, we allow retaking even if attempts were used? 
  // User said: "Wenn der Lehrer diesen die punkten zahl löscht dann soll der schüler nochmal fähig sein test zu machen"
  // This means if existingGrade is undefined, we reset or ignore the attempt limit?
  // Let's assume if existingGrade is missing, they can try again, but we still track attempts.
  const canAttemptTest = attempts < 3 || !existingGrade;

  const handleStartQuiz = async () => {
    if (mode === 'test' && attempts >= 3 && existingGrade) {
      alert("Du hast bereits die maximale Anzahl an Versuchen (3) erreicht. Bitte wenden Sie sich zum Lehrer.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // If resource already has quiz questions, use them instead of generating new ones
      if (resource.quizData && resource.quizData.length > 0) {
        // Filter or slice based on count if needed, but usually we take what's there
        let selectedQuestions = [...resource.quizData];
        if (mode === 'practice' && practiceCount < selectedQuestions.length) {
          selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, practiceCount);
        }
        
        setQuestions(selectedQuestions);
        setQuizState('quiz');
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setTimeLeft(mode === 'test' ? 1200 : 600);
        setLoading(false);
        return;
      }

      const count = mode === 'test' ? (term === 'Halbjahr' ? 20 : 30) : practiceCount;
      const difficulty = (mode === 'test' && term === 'Halbjahr') ? 'easy' : 'normal';
      
      const newQuestions = await generateQuizFromResource(
        resource.title, 
        resource.url, 
        resource.type,
        count,
        term,
        difficulty,
        resource.language
      );

      if (newQuestions && newQuestions.length > 0) {
        // Cache the generated questions in the resource for future use
        onUpdateResource({
          ...resource,
          quizData: newQuestions
        });
        
        setQuestions(newQuestions);
        setQuizState('quiz');
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setTimeLeft(mode === 'test' ? 1200 : 600); // 20 mins for test, 10 for practice
      } else {
        throw new Error("Die KI konnte keine Quiz-Fragen aus dieser Quelle generieren. Mögliche Ursachen:\n1. Die URL ist nicht öffentlich zugänglich.\n2. Die Webseite blockiert automatisierte Zugriffe.\n3. Die Datei enthält zu wenig Text.");
      }
    } catch (err: unknown) {
      console.error("Quiz generation error:", err);
      const errorMsg = err instanceof Error ? err.message : "";
      setError(errorMsg || "Das Quiz konnte nicht automatisch generiert werden. Bitte prüfen Sie die Internetverbindung.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setQuizState('result');
      // Auto-submit on 3rd attempt if it's a test
      if (mode === 'test' && attempts === 2) {
        await handleSubmitTest(score);
      }
    }
  };

  const handleSubmitTest = async (finalScore?: number) => {
    if (mode !== 'test') return;
    const s = finalScore !== undefined ? finalScore : score;

    // 1. Save the specific quiz result
    const result: QuizResult = {
      id: `QR-${Date.now()}`,
      studentId: user.id,
      resourceId: resource.id,
      term: term,
      score: s,
      maxScore: questions.length,
      completedAt: new Date().toISOString()
    };
    
    await saveQuizResult(result);

    // 2. Update attempts
    const updatedAttempts = { ...(resource.quizAttempts || {}), [user.id]: attempts + 1 };
    const updatedResource = { ...resource, quizAttempts: updatedAttempts };
    onUpdateResource(updatedResource);

    // 3. Automation: Recalculate the total grade for this subject
    await updateAutomatedGrade(user.id, resource.subject, term);
    
    setIsSubmitted(true);
    if (finalScore === undefined) {
      alert(`Test eingereicht! Deine Punkte wurden automatisch berechnet und in das Zeugnis übertragen.`);
    }
  };

  useEffect(() => {
    if (quizState === 'quiz' && questions.length > 0 && !loading) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setQuizState('result');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizState, questions.length, loading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === questions[currentQuestionIndex].correctAnswerIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setIsAnswered(true);
  };

  if (quizState === 'setup') {
    return (
      <div className="bg-white p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-2xl border-4 border-indigo-50 animate-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner">
            <Settings2 size={48} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-madrassah-950 uppercase italic tracking-tighter">Quiz Konfiguration</h3>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">{resource.title}</p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Modus wählen</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setMode('practice')} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all ${mode === 'practice' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-indigo-200'}`}>
                  Übung
                </button>
                <button onClick={() => setMode('test')} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all ${mode === 'test' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-emerald-200'}`}>
                  Test
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Zeitraum</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setTerm('Halbjahr')} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all ${term === 'Halbjahr' ? 'bg-madrassah-950 text-white border-madrassah-950 shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-madrassah-200'}`}>
                  Halbjahr
                </button>
                <button onClick={() => setTerm('Abschluss')} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all ${term === 'Abschluss' ? 'bg-madrassah-950 text-white border-madrassah-950 shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-madrassah-200'}`}>
                  Abschluss
                </button>
              </div>
            </div>

            {mode === 'practice' ? (
              <div className="space-y-4 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Anzahl der Fragen</label>
                <input 
                  type="number" 
                  min="1" 
                  max="50"
                  value={practiceCount || 1}
                  onChange={(e) => setPracticeCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl font-black text-lg outline-none focus:border-indigo-600 transition-all"
                />
              </div>
            ) : (
              <div className="md:col-span-2 bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-3">
                <div className="flex items-center gap-3 text-amber-600">
                  <Timer size={20} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Test-Bedingungen</h4>
                </div>
                <ul className="text-[10px] font-bold text-amber-900 space-y-2 list-disc ml-4 uppercase italic">
                  <li>{term === 'Halbjahr' ? '20 Fragen • 20 Min. • Bestehen: 10 Pkt.' : '30 Fragen • 20 Min. • Bestehen: 10 Pkt.'}</li>
                  <li>Maximal 3 Versuche (Aktuell: {attempts}/3)</li>
                  <li>Beim 3. Versuch wird das Ergebnis automatisch gespeichert</li>
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-4 w-full pt-4">
            <button 
              onClick={onClose} 
              className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
            >
              {user.role === 'STUDENT' ? 'Zurück zur Bibliothek' : 'Abbrechen'}
            </button>
            <button 
              onClick={handleStartQuiz} 
              disabled={loading || (mode === 'test' && !canAttemptTest)}
              className="flex-[2] py-5 bg-madrassah-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-30"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
              Quiz Starten
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-red-50 flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-500">
        <div className="w-32 h-32 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center shadow-inner">
          <XCircle size={64} />
        </div>
        <div>
          <h3 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter">Ups!</h3>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-2">Fehler beim Quiz</p>
        </div>
        <p className="text-sm font-bold text-gray-500 max-w-md uppercase leading-relaxed">
          {error}
        </p>
        <div className="flex gap-4 pt-4">
          <button 
            onClick={onClose} 
            className="px-10 py-5 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
          >
            {user.role === 'STUDENT' ? 'Bibliothek' : 'Schließen'}
          </button>
          <button onClick={() => {
            setQuizState('setup');
            setError(null);
          }} className="px-10 py-5 bg-madrassah-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3">
            <RefreshCw size={16} /> Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-8 animate-in fade-in duration-500 bg-white rounded-[4rem] shadow-2xl border-4 border-indigo-50">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={32} />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-black text-madrassah-950 uppercase italic tracking-tighter">KI generiert Fragen...</h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Analysiere: {resource.title}</p>
        </div>
        <button 
          onClick={onClose}
          className="px-10 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all mt-4"
        >
          {user.role === 'STUDENT' ? 'Zurück zur Bibliothek' : 'Abbrechen'}
        </button>
      </div>
    );
  }

  if (quizState === 'result') {
    const percentage = Math.round((score / questions.length) * 100);
    const passThreshold = 10;
    const isPass = score >= passThreshold;
    
    // Automation: Get the current total grade for this subject
    const subjectGrade = calculateSubjectGrade(user.id, resource.subject, term);

    return (
      <div id="quiz-result-card" className="bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-indigo-50 flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-500">
        <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-inner ${isPass ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {isPass ? <Trophy size={64} /> : <XCircle size={64} />}
        </div>
        <div>
          <h3 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter">
            {mode === 'test' ? (isPass ? 'Test Bestanden!' : 'Test Nicht Bestanden') : 'Übung Beendet!'}
          </h3>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-2">Dein Ergebnis ({term})</p>
          <p className="text-indigo-600 font-black uppercase text-lg mt-2 italic">Danke für deine Teilnahme!</p>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className={`text-6xl font-black italic ${isPass ? 'text-emerald-600' : 'text-red-600'}`}>{score} / {questions.length}</div>
          {mode === 'test' && (
            <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 animate-bounce">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Automatisierte Zeugnisnote</p>
              <p className="text-2xl font-black text-indigo-950 italic">{subjectGrade.total} / 20 {subjectGrade.hasBonus && <span className="text-emerald-600 text-sm ml-1">+ Bonus</span>}</p>
            </div>
          )}
        </div>

        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden max-w-md">
          <div className={`h-full transition-all duration-1000 ${isPass ? 'bg-emerald-600' : 'bg-red-600'}`} style={{ width: `${percentage}%` }}></div>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-500 max-w-md uppercase">
            {isPass ? "Hervorragend! Du hast das Thema verstanden." : `Du hast leider nicht bestanden (Benötigt: ${passThreshold} Pkt).`}
          </p>
          {mode === 'test' && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full">Versuch {Math.min(3, attempts + (isSubmitted ? 0 : 1))} von 3</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase italic">Tipp: Du kannst jetzt einen Screenshot von diesem Ergebnis machen!</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
          <button 
            onClick={onClose} 
            className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
          >
            {user.role === 'STUDENT' ? 'Zurück zur Bibliothek' : 'Schließen'}
          </button>
          
          {mode === 'test' && !isSubmitted && attempts < 3 && (
            <button 
              onClick={() => handleSubmitTest()}
              className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <Send size={18} /> Ergebnis Einreichen
            </button>
          )}

          <button onClick={() => {
            setQuizState('setup');
            setQuestions([]);
            setIsSubmitted(false);
          }} className="flex-1 py-5 bg-madrassah-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3">
            <RefreshCw size={18} /> {mode === 'test' ? 'Neuer Versuch' : 'Nochmal Üben'}
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl border-4 border-indigo-50 flex flex-col h-[85vh] md:h-[90vh] animate-in slide-in-from-bottom-8 duration-500 overflow-hidden">
      <div className="bg-indigo-600 p-4 md:p-10 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <Brain size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Theorie-Quiz</h3>
            <p className="text-white/60 font-bold uppercase text-[9px] tracking-widest mt-2">Frage {currentQuestionIndex + 1} von {questions.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 ${timeLeft < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white'}`}>
            <RefreshCw size={16} className={timeLeft < 60 ? 'animate-spin' : ''} />
            {formatTime(timeLeft)}
          </div>
          <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest">
            <ArrowLeft size={20} /> {user.role === 'STUDENT' ? 'Bibliothek' : 'Abbrechen'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 md:space-y-10 custom-scrollbar min-h-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-indigo-600">
            <HelpCircle size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Wissens-Check</span>
          </div>
          <h4 className="text-2xl font-black text-madrassah-950 italic leading-tight">{currentQuestion.question}</h4>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswerIndex;
            const showCorrect = isAnswered && isCorrect;
            const showWrong = isAnswered && isSelected && !isCorrect;

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
                className={`w-full p-6 rounded-3xl border-2 text-left transition-all flex items-center justify-between group ${
                  showCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-900' :
                  showWrong ? 'bg-red-50 border-red-500 text-red-900' :
                  isSelected ? 'bg-indigo-50 border-indigo-600 text-indigo-950' :
                  'bg-gray-50 border-gray-50 hover:border-indigo-200 text-gray-600'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 ${
                    showCorrect ? 'bg-emerald-500 text-white border-emerald-500' :
                    showWrong ? 'bg-red-500 text-white border-red-500' :
                    isSelected ? 'bg-indigo-600 text-white border-indigo-600' :
                    'bg-white text-gray-300 border-gray-100 group-hover:border-indigo-200'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="font-bold text-sm">{option}</span>
                </div>
                {showCorrect && <CheckCircle2 className="text-emerald-500" size={24} />}
                {showWrong && <XCircle className="text-red-500" size={24} />}
              </button>
            );
          })}
        </div>

        {isAnswered && currentQuestion.explanation && (
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Erklärung</p>
            <p className="text-xs font-bold text-indigo-900 leading-relaxed">{currentQuestion.explanation}</p>
          </div>
        )}

      </div>

      <div className="p-4 md:p-10 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 shrink-0">
        <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-full py-2">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 shrink-0 rounded-full transition-all ${i === currentQuestionIndex ? 'w-8 bg-indigo-600' : i < currentQuestionIndex ? 'w-4 bg-emerald-400' : 'w-4 bg-gray-100'}`}></div>
          ))}
        </div>
        
        <div className="w-full md:w-auto">
          {!isAnswered ? (
            <button 
              onClick={handleConfirmAnswer}
              disabled={selectedAnswer === null}
              className="w-full md:w-auto bg-madrassah-950 text-white px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all disabled:opacity-30 flex items-center justify-center gap-3"
            >
              Antwort prüfen <CheckCircle2 size={18} />
            </button>
          ) : (
            <button 
              onClick={handleNextQuestion}
              className="w-full md:w-auto bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Ergebnis sehen' : 'Nächste Frage'} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TheoryQuiz;
