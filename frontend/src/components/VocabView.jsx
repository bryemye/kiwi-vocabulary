import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Volume2, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Sparkles, 
  BookMarked, 
  Layers, 
  Filter, 
  CheckCircle, 
  HelpCircle,
  Search,
  X,
  ArrowRight,
  RotateCcw,
  LayoutDashboard,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { logStudyAttempt, fetchWordSession } from '../services/api';

const SESSION_SIZE = 15;

export default function VocabView({ 
  words = [], 
  roots = [], 
  onAttemptLogged, 
  initialRootId,
  onNavigateDashboard 
}) {
  // Filter States
  const [selectedLanguage, setSelectedLanguage] = useState('ALL'); // 'ALL' | 'Latin' | 'Greek'
  const [selectedRootId, setSelectedRootId] = useState(initialRootId || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Deck & Session States
  const [sessionDeck, setSessionDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'review', text: string }
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [sessionRound, setSessionRound] = useState(1);
  const [roundStats, setRoundStats] = useState({ correct: 0, total: 0 });
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // Sync initialRootId if passed from dashboard
  useEffect(() => {
    if (initialRootId) {
      setSelectedRootId(initialRootId);
      // Auto-set language based on this root if found
      const matchingRoot = roots.find(r => r.id === Number(initialRootId));
      if (matchingRoot) {
        setSelectedLanguage(matchingRoot.language);
      }
    }
  }, [initialRootId, roots]);

  // Filter available roots based on selected language
  const availableRoots = useMemo(() => {
    if (selectedLanguage === 'ALL') return roots;
    return roots.filter(r => r.language.toLowerCase() === selectedLanguage.toLowerCase());
  }, [roots, selectedLanguage]);

  // When language changes, reset root filter if it doesn't belong to the language
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    if (selectedRootId !== 'ALL') {
      const rootBelongs = roots.find(r => r.id === Number(selectedRootId) && (lang === 'ALL' || r.language.toLowerCase() === lang.toLowerCase()));
      if (!rootBelongs) {
        setSelectedRootId('ALL');
      }
    }
  };

  // Build filtered master list
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      // Language filter
      if (selectedLanguage !== 'ALL') {
        const rootLang = w.root_details?.language || roots.find(r => r.id === w.root)?.language;
        if (rootLang && rootLang.toLowerCase() !== selectedLanguage.toLowerCase()) {
          return false;
        }
      }
      // Root filter
      if (selectedRootId !== 'ALL' && w.root !== Number(selectedRootId)) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const wordMatch = w.word.toLowerCase().includes(query);
        const defMatch = w.definition.toLowerCase().includes(query);
        const rootMatch = w.root_details?.morpheme?.toLowerCase().includes(query);
        if (!wordMatch && !defMatch && !rootMatch) {
          return false;
        }
      }
      return true;
    });
  }, [words, roots, selectedLanguage, selectedRootId, searchTerm]);

  // Initialize or replenish a 15-word session deck
  const initializeSession = useCallback(async (isNextRound = false) => {
    setIsSessionComplete(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setFeedback(null);
    setCardStartTime(Date.now());

    if (isNextRound) {
      setSessionRound(prev => prev + 1);
    } else {
      setSessionRound(1);
    }
    setRoundStats({ correct: 0, total: 0 });

    try {
      // Try backend session endpoint for prioritized deck
      const params = { count: SESSION_SIZE };
      if (selectedLanguage !== 'ALL') params.language = selectedLanguage;
      if (selectedRootId !== 'ALL') params.root = selectedRootId;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const serverSession = await fetchWordSession(params);
      if (serverSession && serverSession.length > 0) {
        setSessionDeck(serverSession);
        return;
      }
    } catch (err) {
      // Fallback to client-side slicing
    }

    // Client-side prioritized slicing: shuffle and pick up to 15
    const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);
    setSessionDeck(shuffled.slice(0, SESSION_SIZE));
  }, [selectedLanguage, selectedRootId, searchTerm, filteredWords]);

  // Re-seed session deck whenever primary filters change
  useEffect(() => {
    initializeSession(false);
  }, [selectedLanguage, selectedRootId, searchTerm, initializeSession]);

  const currentWord = sessionDeck[currentIndex] || null;

  // Reset flip on index change
  useEffect(() => {
    setIsFlipped(false);
    setFeedback(null);
    setCardStartTime(Date.now());
  }, [currentIndex]);

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleResponse = useCallback(async (isCorrect) => {
    if (!currentWord || submitting || isSessionComplete) return;
    setSubmitting(true);
    const secondsSpent = Math.max(1, Math.round((Date.now() - cardStartTime) / 1000));

    try {
      await logStudyAttempt({
        item_type: 'WORD',
        word_id: currentWord.id,
        is_correct: isCorrect,
        seconds_spent: secondsSpent,
      });

      // Update round stats
      setRoundStats(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1
      }));

      if (isCorrect) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#7BB33B', '#84C341', '#42281D']
        });
        setFeedback({ type: 'success', text: 'WORD MASTERED (+1)' });
      } else {
        setFeedback({ type: 'review', text: 'SCHEDULED FOR ACTIVE REVIEW' });
      }

      if (onAttemptLogged) {
        onAttemptLogged();
      }

      // Automatically flip to back if not flipped
      if (!isFlipped) {
        setIsFlipped(true);
      }

      setTimeout(() => {
        setFeedback(null);
        if (currentIndex < sessionDeck.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Finished the 15-card session!
          setIsSessionComplete(true);
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#7BB33B', '#84C341', '#2F441E', '#C29B78']
          });
        }
      }, 1100);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }, [currentWord, submitting, isSessionComplete, cardStartTime, onAttemptLogged, isFlipped, currentIndex, sessionDeck.length]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is focused inside input/textarea/select
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag)) return;
      if (isSessionComplete) return;

      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        handleResponse(false);
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        handleResponse(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResponse, isSessionComplete]);

  // Connotation styling
  const getConnotationBadge = (connotation) => {
    switch (connotation?.toLowerCase()) {
      case 'positive':
        return 'bg-[#EDF5E5] text-[#2F441E] border-2 border-[#111410]';
      case 'negative':
        return 'bg-[#FDF2F2] text-[#991B1B] border-2 border-[#111410]';
      default:
        return 'bg-[#EFE8DF] text-[#42281D] border-2 border-[#111410]';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* STICKY ROOT & LANGUAGE FILTER TOOLBAR */}
      <div className="sticky top-16 z-30 bg-[#FAFBF8] pb-4 mb-4 border-b-2 border-[#111410] pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Language Origin Toggles */}
          <div className="flex items-center space-x-1 font-mono text-xs">
            <span className="text-[10px] font-black uppercase text-[#62685E] mr-1 hidden sm:inline">ORIGIN:</span>
            {['ALL', 'Latin', 'Greek'].map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1 font-black uppercase border-2 border-[#111410] transition ${
                  selectedLanguage.toLowerCase() === lang.toLowerCase()
                    ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410]'
                    : 'bg-white text-[#111410] hover:bg-[#FAFBF8]'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Root Dropdown & Search Input */}
          <div className="flex items-center space-x-2 flex-1 sm:justify-end">
            {/* Root Select */}
            <div className="bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] px-2 py-1 flex items-center">
              <Filter className="w-3.5 h-3.5 text-[#42281D] mr-1.5 shrink-0" />
              <select
                value={selectedRootId}
                onChange={(e) => setSelectedRootId(e.target.value)}
                className="bg-transparent text-[#111410] text-xs font-mono font-bold uppercase focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[190px] truncate"
              >
                <option value="ALL">ALL ROOTS ({availableRoots.length})</option>
                {availableRoots.map((root) => (
                  <option key={root.id} value={root.id}>
                    [{root.morpheme.toUpperCase()}] {root.core_meaning.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Instant Search Bar */}
            <div className="relative flex-1 sm:max-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#62685E]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="SEARCH WORDS..."
                className="w-full bg-white text-[#111410] font-mono font-bold text-xs pl-8 pr-7 py-1 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] focus:outline-none uppercase placeholder:text-[#A8AAA6]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-[#42281D] hover:text-[#111410]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SESSION COMPLETE BENTO CARD */}
      {isSessionComplete ? (
        <div className="bg-white border-2 border-[#111410] shadow-[6px_6px_0px_0px_#111410] p-8 text-center animate-fade-in my-8">
          <div className="w-14 h-14 mx-auto bg-[#EDF5E5] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-[#7BB33B]" />
          </div>

          <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] inline-block mb-2">
            ROUND {sessionRound} SUMMARY
          </span>

          <h2 className="text-3xl font-black font-sans uppercase tracking-tight text-[#111410]">
            Session Complete!
          </h2>
          <p className="text-sm font-mono text-[#62685E] mt-1 uppercase">
            Structured 15-word mastery batch finished.
          </p>

          {/* Round Score Metric */}
          <div className="my-6 max-w-sm mx-auto bg-[#FAFBF8] border-2 border-[#111410] p-4 shadow-[3px_3px_0px_0px_#111410]">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase mb-2">
              <span className="text-[#62685E]">Batch Accuracy:</span>
              <span className="text-[#2F441E] font-black">
                {roundStats.correct} / {roundStats.total} MASTERED ({roundStats.total > 0 ? Math.round((roundStats.correct / roundStats.total) * 100) : 0}%)
              </span>
            </div>
            {/* Progress meter */}
            <div className="w-full h-3 bg-[#EFE8DF] border-2 border-[#111410] overflow-hidden">
              <div 
                className="h-full bg-[#7BB33B] transition-all duration-500"
                style={{ width: `${roundStats.total > 0 ? (roundStats.correct / roundStats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            <button
              onClick={() => initializeSession(true)}
              className="w-full sm:w-auto px-6 py-3 bg-[#7BB33B] hover:bg-[#84C341] text-white font-mono font-black text-xs uppercase tracking-wider border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#111410] flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Next 15 Words</span>
            </button>

            {onNavigateDashboard && (
              <button
                onClick={onNavigateDashboard}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-[#FAFBF8] text-[#111410] font-mono font-black text-xs uppercase tracking-wider border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#111410] flex items-center justify-center space-x-2"
              >
                <LayoutDashboard className="w-4 h-4 text-[#42281D]" />
                <span>Return to Dashboard</span>
              </button>
            )}
          </div>
        </div>
      ) : !currentWord ? (
        /* Empty Filter State */
        <div className="max-w-4xl mx-auto px-4 py-16 text-center bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] my-8">
          <div className="w-16 h-16 mx-auto bg-[#EFE8DF] border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] flex items-center justify-center mb-4">
            <Layers className="w-8 h-8 text-[#42281D]" />
          </div>
          <h3 className="text-xl font-bold font-mono text-[#111410] uppercase">No Vocabulary Matches Found</h3>
          <p className="text-sm font-mono text-[#62685E] mt-2">Try clearing your search query or reset root filters.</p>
          <button
            onClick={() => {
              setSelectedLanguage('ALL');
              setSelectedRootId('ALL');
              setSearchTerm('');
            }}
            className="mt-6 px-6 py-2.5 bg-[#7BB33B] text-white font-mono font-bold text-xs uppercase border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] transition hover:translate-x-[-1px] hover:translate-y-[-1px]"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        /* ACTIVE FLASHCARD SESSION */
        <>
          {/* Geometric Progress Header: CARD 4 OF 15 alongside Kiwi Green Fill Bar */}
          <div className="flex items-center justify-between mb-4 text-xs font-mono font-bold text-[#111410] uppercase">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
                CARD {currentIndex + 1} OF {sessionDeck.length}
              </span>
              <span className="text-[#42281D] hidden sm:inline">
                ROOT: <strong>{currentWord.root_details?.morpheme?.toUpperCase()}</strong> ({currentWord.root_details?.language?.toUpperCase()})
              </span>
            </div>

            {/* Thin Kiwi Green (#7BB33B) Fill Bar */}
            <div className="w-44 h-3 bg-[#EFE8DF] border-2 border-[#111410] overflow-hidden shadow-[1px_1px_0px_0px_#111410]">
              <div 
                className="h-full bg-[#7BB33B] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / sessionDeck.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Flashcard Token */}
          <div className="relative min-h-[440px] w-full perspective-1000 mb-4 select-none">
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className={`w-full min-h-[440px] bg-white border-2 border-[#111410] shadow-[6px_6px_0px_0px_#42281D] p-8 cursor-pointer transition-all duration-500 transform-style-3d relative flex flex-col justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[7px_7px_0px_0px_#42281D] ${
                isFlipped ? 'rotate-y-180 border-[#42281D]' : ''
              }`}
            >
              {/* FRONT OF CARD */}
              {!isFlipped ? (
                <div className="flex flex-col h-full justify-between">
                  {/* Top metadata */}
                  <div className="flex items-center justify-between border-b-2 border-[#111410] pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 bg-[#111410] text-white">
                        {currentWord.part_of_speech || 'noun'}
                      </span>
                      <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 ${getConnotationBadge(currentWord.connotation)}`}>
                        {currentWord.connotation}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(currentWord.word);
                      }}
                      className="p-1.5 bg-[#FAFBF8] hover:bg-[#EDF5E5] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-4 h-4 text-[#2F441E]" />
                    </button>
                  </div>

                  {/* Target Word & Pronunciation */}
                  <div className="my-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-black text-[#111410] tracking-tight uppercase font-sans">
                      {currentWord.word}
                    </h1>
                    {currentWord.pronunciation && (
                      <p className="text-[#62685E] text-sm mt-2 font-mono font-bold tracking-wider">
                        /{currentWord.pronunciation}/
                      </p>
                    )}
                  </div>

                  {/* Morpheme Decomposition Tags */}
                  <div className="bg-[#FAFBF8] border-2 border-[#111410] p-4">
                    <div className="text-[11px] font-mono font-black text-[#111410] uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#7BB33B]" />
                        <span>Morpheme Decomposition</span>
                      </span>
                      <span className="text-[#62685E] text-[10px] font-normal uppercase">[Space] to reveal</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Prefix: Soft Kiwi #EDF5E5 with Deep Olive #2F441E */}
                      {currentWord.prefix && (
                        <div className="px-3 py-1.5 bg-[#EDF5E5] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
                          <span className="text-[9px] block uppercase font-mono font-bold text-[#2F441E]/70">Prefix</span>
                          <span className="font-mono font-extrabold text-xs">{currentWord.prefix}</span>
                        </div>
                      )}

                      {currentWord.prefix && <span className="text-[#111410] font-black font-mono text-base">+</span>}

                      {/* Roots/Stems: Warm Cream #EFE8DF with Deep Bark Brown #42281D */}
                      <div className="px-3 py-1.5 bg-[#EFE8DF] text-[#42281D] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
                        <span className="text-[9px] block uppercase font-mono font-bold text-[#42281D]/70">
                          Root ({currentWord.root_details?.language})
                        </span>
                        <span className="font-mono font-black text-xs text-[#42281D]">
                          [{currentWord.root_details?.morpheme?.toUpperCase()}]
                        </span>
                        <span className="text-[#42281D] text-xs ml-1.5 font-sans font-bold">
                          = "{currentWord.root_details?.core_meaning}"
                        </span>
                      </div>

                      {currentWord.suffix && <span className="text-[#111410] font-black font-mono text-base">+</span>}

                      {/* Suffixes: Pure White #FFFFFF with Jet Black text */}
                      {currentWord.suffix && (
                        <div className="px-3 py-1.5 bg-[#FFFFFF] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
                          <span className="text-[9px] block uppercase font-mono font-bold text-[#62685E]">Suffix</span>
                          <span className="font-mono font-extrabold text-xs">{currentWord.suffix}</span>
                        </div>
                      )}
                    </div>

                    {/* Mnemonic Memory Key */}
                    {currentWord.root_details?.mnemonic && (
                      <div className="mt-3 pt-2 border-t border-[#111410]/20 flex items-start space-x-2 text-xs font-mono text-[#42281D]">
                        <span className="font-black uppercase text-[#2F441E] bg-[#EDF5E5] px-1 border border-[#111410]">Key:</span>
                        <span className="italic font-serif">"{currentWord.root_details.mnemonic}"</span>
                      </div>
                    )}
                  </div>

                  {/* Flip Prompt */}
                  <div className="mt-4 flex items-center justify-center space-x-2 text-[11px] font-mono font-bold uppercase text-[#62685E]">
                    <RotateCw className="w-3.5 h-3.5 text-[#7BB33B]" />
                    <span>Click or press [Space] to reveal official definition</span>
                  </div>
                </div>
              ) : (
                /* BACK OF CARD */
                <div className="flex flex-col h-full justify-between rotate-y-180">
                  <div className="flex items-center justify-between border-b-2 border-[#111410] pb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-2xl font-black text-[#111410] font-sans uppercase">{currentWord.word}</h3>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 ${getConnotationBadge(currentWord.connotation)}`}>
                        {currentWord.connotation}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-[#42281D] uppercase">SAT · ACT Lexicon</span>
                  </div>

                  {/* Core SAT Definition */}
                  <div className="my-4">
                    <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-[#62685E] mb-1.5">
                      Official SAT Context Definition
                    </h4>
                    <p className="text-xl text-[#111410] font-serif leading-relaxed">
                      "{currentWord.definition}"
                    </p>
                  </div>

                  {/* Exam Context Sentence */}
                  <div className="bg-[#FAFBF8] border-2 border-[#111410] p-4 shadow-[2px_2px_0px_0px_#111410]">
                    <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-[#42281D] mb-1 flex items-center space-x-1.5">
                      <BookMarked className="w-3.5 h-3.5 text-[#7BB33B]" />
                      <span>Exam Context Sentence</span>
                    </h4>
                    <p className="text-sm text-[#111410] font-serif italic leading-relaxed">
                      "{currentWord.sat_sentence}"
                    </p>
                  </div>

                  {/* Root Family Connection */}
                  <div className="mt-3 pt-2 border-t border-[#111410]/20 text-[11px] font-mono text-[#62685E] flex items-center justify-between uppercase">
                    <span>Family: <strong className="text-[#42281D]">{currentWord.root_details?.morpheme}</strong> ({currentWord.root_details?.core_meaning})</span>
                    <span className="text-[#7BB33B] font-bold">[Space] to flip front</span>
                  </div>
                </div>
              )}
            </div>

            {/* Response Telemetry Overlay */}
            {feedback && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 border-2 border-[#111410] shadow-[6px_6px_0px_0px_#111410] animate-fade-in pointer-events-none">
                <div className={`px-6 py-3 border-2 border-[#111410] text-sm font-mono font-black uppercase shadow-[4px_4px_0px_0px_#111410] flex items-center space-x-2 ${
                  feedback.type === 'success'
                    ? 'bg-[#7BB33B] text-white'
                    : 'bg-[#42281D] text-white'
                }`}>
                  <Check className="w-5 h-5" />
                  <span>{feedback.text}</span>
                </div>
              </div>
            )}
          </div>

          {/* Response Controls & Keyboard Shortcuts */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Prev / Flip / Next buttons */}
              <div className="flex items-center space-x-2 order-2 sm:order-1">
                <button
                  onClick={() => {
                    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
                  }}
                  disabled={currentIndex === 0}
                  className="p-2.5 bg-white hover:bg-[#FAFBF8] disabled:opacity-40 disabled:cursor-not-allowed text-[#111410] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#111410] transition"
                  title="Previous Card"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-4 py-2.5 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] text-xs font-mono font-black uppercase flex items-center space-x-1.5 transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#111410]"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#7BB33B]" />
                  <span>Flip Card</span>
                </button>

                <button
                  onClick={() => {
                    if (currentIndex < sessionDeck.length - 1) setCurrentIndex(prev => prev + 1);
                  }}
                  disabled={currentIndex === sessionDeck.length - 1}
                  className="p-2.5 bg-white hover:bg-[#FAFBF8] disabled:opacity-40 disabled:cursor-not-allowed text-[#111410] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#111410] transition"
                  title="Next Card"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Active Action Buttons */}
              <div className="flex items-center space-x-3 w-full sm:w-auto order-1 sm:order-2">
                {/* Need Review Button */}
                <button
                  onClick={() => handleResponse(false)}
                  disabled={submitting}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-[#42281D] hover:bg-[#593627] text-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] text-xs font-mono font-black uppercase tracking-wider transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#111410] disabled:opacity-50"
                >
                  <HelpCircle className="w-4 h-4 text-[#C29B78]" />
                  <span>Need Review</span>
                </button>

                {/* I Knew It Button */}
                <button
                  onClick={() => handleResponse(true)}
                  disabled={submitting}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-7 py-3 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] text-xs font-mono font-black uppercase tracking-wider transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#111410] disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>I Knew It!</span>
                </button>
              </div>
            </div>

            {/* Subtle Keyboard Shortcut Indicators */}
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-[#62685E] pt-2 border-t border-[#111410]/20 px-1">
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] text-[#111410]">Space</kbd>
                <span>or</span>
                <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] text-[#111410]">↑</kbd>
                <span>to Flip</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] text-[#111410]">←</kbd>
                <span>or</span>
                <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] text-[#111410]">1</kbd>
                <span>Review</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] text-[#111410]">→</kbd>
                <span>or</span>
                <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] text-[#111410]">2</kbd>
                <span>Got It</span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
