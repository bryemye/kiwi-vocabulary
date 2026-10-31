import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Sparkles, 
  BookMarked,
  Layers,
  Filter,
  CheckCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { logStudyAttempt } from '../services/api';

export default function VocabView({ words, roots, onAttemptLogged, initialRootId }) {
  const [selectedRootId, setSelectedRootId] = useState(initialRootId || 'ALL');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showMorphemes, setShowMorphemes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'review' }
  const [cardStartTime, setCardStartTime] = useState(Date.now());

  // Filter words
  const filteredWords = React.useMemo(() => {
    if (selectedRootId === 'ALL') return words;
    return words.filter((w) => w.root === Number(selectedRootId));
  }, [words, selectedRootId]);

  const currentWord = filteredWords[currentIndex] || null;

  useEffect(() => {
    if (initialRootId) {
      setSelectedRootId(initialRootId);
      setCurrentIndex(0);
    }
  }, [initialRootId]);

  // Reset flip and timer on index change
  useEffect(() => {
    setIsFlipped(false);
    setFeedback(null);
    setCardStartTime(Date.now());
  }, [currentIndex, selectedRootId]);

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // loop
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(filteredWords.length - 1);
    }
  };

  const handleResponse = async (isCorrect) => {
    if (!currentWord || submitting) return;
    setSubmitting(true);
    const secondsSpent = Math.max(1, Math.round((Date.now() - cardStartTime) / 1000));

    try {
      await logStudyAttempt({
        item_type: 'WORD',
        word: currentWord.id,
        is_correct: isCorrect,
        seconds_spent: secondsSpent,
      });

      if (isCorrect) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#38bdf8', '#fbbf24']
        });
        setFeedback({ type: 'success', text: 'Marked Mastered! (+1)' });
      } else {
        setFeedback({ type: 'review', text: 'Scheduled for Active Spaced Recall' });
      }

      if (onAttemptLogged) {
        onAttemptLogged();
      }

      // Automatically flip to back if not flipped so student sees meaning, then short delay or user clicks next
      if (!isFlipped) {
        setIsFlipped(true);
      }

      setTimeout(() => {
        setFeedback(null);
        handleNext();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Connotation styles
  const getConnotationBadge = (connotation) => {
    switch (connotation?.toLowerCase()) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'negative':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  if (!filteredWords || filteredWords.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Layers className="w-16 h-16 mx-auto text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-slate-200">No Vocabulary Words Found</h3>
        <p className="text-slate-400 mt-2">Try selecting a different root family filter or reset to All.</p>
        <button
          onClick={() => setSelectedRootId('ALL')}
          className="mt-4 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition"
        >
          Reset Filter to All
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Etymology Flashcards</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Master high-frequency SAT/ACT words through morpheme decomposition & root logic.
          </p>
        </div>

        {/* Filter by Root */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedRootId}
            onChange={(e) => {
              setSelectedRootId(e.target.value);
              setCurrentIndex(0);
            }}
            className="bg-slate-800 text-slate-200 text-sm rounded-lg border border-slate-700 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Roots ({words.length} Words)</option>
            {roots.map((root) => (
              <option key={root.id} value={root.id}>
                {root.morpheme} ({root.language}) - {root.core_meaning}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress & Card Counter */}
      <div className="flex items-center justify-between mb-4 text-xs text-slate-400 font-mono">
        <div className="flex items-center space-x-2">
          <span>Card {currentIndex + 1} of {filteredWords.length}</span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-400 font-medium">Root: {currentWord.root_details?.morpheme} ({currentWord.root_details?.language})</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / filteredWords.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Flashcard Container */}
      <div className="relative min-h-[420px] w-full perspective-1000 mb-6 select-none">
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full min-h-[420px] rounded-2xl p-8 bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 shadow-2xl cursor-pointer transition-all duration-500 transform-style-3d relative flex flex-col justify-between ${
            isFlipped ? 'rotate-y-180 border-sky-500/40 shadow-sky-500/10' : 'hover:border-slate-700'
          }`}
        >
          {/* FRONT OF CARD */}
          {!isFlipped ? (
            <div className="flex flex-col h-full justify-between">
              {/* Top metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-semibold tracking-wider px-2.5 py-1 rounded-md bg-slate-800 text-sky-400 border border-slate-700/60 font-mono">
                    {currentWord.part_of_speech || 'noun'}
                  </span>
                  <span className={`text-xs capitalize font-medium px-2.5 py-1 rounded-md border ${getConnotationBadge(currentWord.connotation)}`}>
                    {currentWord.connotation} connotation
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak(currentWord.word);
                  }}
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Listen to pronunciation"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Target Word & Pronunciation */}
              <div className="my-8 text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                  {currentWord.word}
                </h1>
                {currentWord.pronunciation && (
                  <p className="text-slate-400 text-base mt-2 font-mono">
                    /{currentWord.pronunciation}/
                  </p>
                )}
              </div>

              {/* Middle / Reveal: Visual Morpheme Breakdown Tags */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Morpheme Decomposition</span>
                  </span>
                  <span className="text-slate-400 text-[11px] font-normal">Click card to reveal definition</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Prefix */}
                  {currentWord.prefix && (
                    <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                      <span className="text-slate-400 text-[10px] block uppercase font-mono">Prefix</span>
                      <span className="font-semibold">{currentWord.prefix}</span>
                    </div>
                  )}

                  {/* Plus icon */}
                  {currentWord.prefix && <span className="text-slate-600 font-bold">+</span>}

                  {/* Root Morpheme */}
                  <div className="px-3.5 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-medium">
                    <span className="text-sky-400/80 text-[10px] block uppercase font-mono">
                      Root ({currentWord.root_details?.language})
                    </span>
                    <span className="font-bold text-sky-200">
                      [{currentWord.root_details?.morpheme}]
                    </span>
                    <span className="text-slate-300 text-xs ml-1.5 font-normal">
                      &rarr; "{currentWord.root_details?.core_meaning}"
                    </span>
                  </div>

                  {/* Plus icon */}
                  {currentWord.suffix && <span className="text-slate-600 font-bold">+</span>}

                  {/* Suffix */}
                  {currentWord.suffix && (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                      <span className="text-slate-400 text-[10px] block uppercase font-mono">Suffix</span>
                      <span className="font-semibold">{currentWord.suffix}</span>
                    </div>
                  )}
                </div>

                {/* Root Mnemonic hint */}
                {currentWord.root_details?.mnemonic && (
                  <p className="mt-3 text-xs text-slate-400 italic flex items-center space-x-1.5">
                    <span className="text-amber-400 font-semibold not-italic">Memory Key:</span>
                    <span>"{currentWord.root_details.mnemonic}"</span>
                  </p>
                )}
              </div>

              {/* Bottom Flip Indicator */}
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-slate-400">
                <RotateCw className="w-3.5 h-3.5 animate-spin-slow text-sky-400" />
                <span>Click anywhere to flip for SAT context & sentence</span>
              </div>
            </div>
          ) : (
            /* BACK OF CARD (Rotated) */
            <div className="flex flex-col h-full justify-between rotate-y-180">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-2xl font-bold text-white">{currentWord.word}</h3>
                  <span className={`text-xs capitalize font-medium px-2.5 py-0.5 rounded-md border ${getConnotationBadge(currentWord.connotation)}`}>
                    {currentWord.connotation}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">Official SAT / ACT Lexicon</span>
              </div>

              {/* Definition */}
              <div className="my-4">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                  Core SAT Definition
                </h4>
                <p className="text-lg text-slate-100 font-serif leading-relaxed">
                  "{currentWord.definition}"
                </p>
              </div>

              {/* SAT-Style Example Sentence */}
              <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800">
                <h4 className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-1.5 flex items-center space-x-1.5">
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>Exam Context Sentence</span>
                </h4>
                <p className="text-sm text-slate-300 font-serif italic leading-relaxed">
                  "{currentWord.sat_sentence}"
                </p>
              </div>

              {/* Root Family Connection */}
              <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
                <span>Morpheme family: <strong className="text-sky-300">{currentWord.root_details?.morpheme}</strong> ({currentWord.root_details?.core_meaning})</span>
                <span className="text-slate-400 text-[11px]">Click to flip back</span>
              </div>
            </div>
          )}
        </div>

        {/* Transient Feedback overlay */}
        {feedback && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-2xl animate-fade-in pointer-events-none">
            <div className={`px-6 py-3 rounded-xl border text-sm font-semibold shadow-2xl flex items-center space-x-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}>
              {feedback.type === 'success' ? <Check className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
              <span>{feedback.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Response Controls & Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Prev / Next buttons */}
        <div className="flex items-center space-x-2 order-2 sm:order-1">
          <button
            onClick={handlePrev}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition"
            title="Previous Card"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Flip Card</span>
          </button>
          <button
            onClick={handleNext}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition"
            title="Next Card"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Active Study Action Buttons */}
        <div className="flex items-center space-x-3 w-full sm:w-auto order-1 sm:order-2">
          {/* Amber: Need Review */}
          <button
            onClick={() => handleResponse(false)}
            disabled={submitting}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-sm font-semibold transition active:scale-95 disabled:opacity-50"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Need Review</span>
          </button>

          {/* Green: I Knew It */}
          <button
            onClick={() => handleResponse(true)}
            disabled={submitting}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 text-sm font-semibold transition active:scale-95 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>I Knew It!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
