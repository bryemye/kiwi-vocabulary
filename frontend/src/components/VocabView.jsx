import React, { useState, useEffect } from 'react';
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
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { logStudyAttempt } from '../services/api';

export default function VocabView({ words, roots, onAttemptLogged, initialRootId }) {
  const [selectedRootId, setSelectedRootId] = useState(initialRootId || 'ALL');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
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
      setCurrentIndex(0);
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
        word_id: currentWord.id,
        is_correct: isCorrect,
        seconds_spent: secondsSpent,
      });

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

      // Automatically flip to back if not flipped so student sees meaning
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
        return 'bg-[#EDF5E5] text-[#2F441E] border-2 border-[#111410]';
      case 'negative':
        return 'bg-[#FDF2F2] text-[#991B1B] border-2 border-[#111410]';
      default:
        return 'bg-[#EFE8DF] text-[#42281D] border-2 border-[#111410]';
    }
  };

  if (!filteredWords || filteredWords.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto bg-[#EFE8DF] border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-[#42281D]" />
        </div>
        <h3 className="text-xl font-bold font-mono text-[#111410] uppercase">No Vocabulary Items Found</h3>
        <p className="text-sm font-mono text-[#62685E] mt-2">Adjust root filter or reset to complete lexicon.</p>
        <button
          onClick={() => setSelectedRootId('ALL')}
          className="mt-6 px-6 py-2.5 bg-[#7BB33B] text-white font-mono font-bold text-xs uppercase border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] transition hover:translate-x-[-1px] hover:translate-y-[-1px]"
        >
          Reset Filter to All
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Header & Root Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-[#111410]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 bg-[#84C341] border-2 border-[#111410] flex items-center justify-center text-white text-xs font-mono font-bold">
              01
            </span>
            <h2 className="text-xl font-black text-[#111410] tracking-tight uppercase font-mono">
              Etymology Flashcards
            </h2>
          </div>
          <p className="text-xs font-mono text-[#62685E] mt-1 uppercase">
            Morpheme breakdown tags: [Prefix] + [Root] + [Suffix]
          </p>
        </div>

        {/* Filter by Root */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-[#42281D] mr-2" />
            <select
              value={selectedRootId}
              onChange={(e) => {
                setSelectedRootId(e.target.value);
                setCurrentIndex(0);
              }}
              className="bg-transparent text-[#111410] text-xs font-mono font-bold uppercase focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL ROOTS ({words.length} WORDS)</option>
              {roots.map((root) => (
                <option key={root.id} value={root.id}>
                  {root.morpheme.toUpperCase()} ({root.language.toUpperCase()}) — {root.core_meaning.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Progress Counter & Visual Bar */}
      <div className="flex items-center justify-between mb-4 text-xs font-mono font-bold text-[#111410] uppercase">
        <div className="flex items-center space-x-3">
          <span className="px-2 py-0.5 bg-[#FAFBF8] border-2 border-[#111410]">
            CARD {currentIndex + 1} / {filteredWords.length}
          </span>
          <span className="text-[#42281D]">
            ROOT: <strong>{currentWord.root_details?.morpheme?.toUpperCase()}</strong> ({currentWord.root_details?.language?.toUpperCase()})
          </span>
        </div>
        <div className="w-40 h-3 bg-[#EFE8DF] border-2 border-[#111410] overflow-hidden">
          <div 
            className="h-full bg-[#7BB33B] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / filteredWords.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Heavy Geometric Token Flashcard */}
      <div className="relative min-h-[440px] w-full perspective-1000 mb-6 select-none">
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

              {/* Middle / Reveal: Morpheme Breakdown Tags */}
              <div className="bg-[#FAFBF8] border-2 border-[#111410] p-4">
                <div className="text-[11px] font-mono font-black text-[#111410] uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#7BB33B]" />
                    <span>Morpheme Decomposition</span>
                  </span>
                  <span className="text-[#62685E] text-[10px] font-normal">CLICK CARD TO FLIP FOR SAT DEFINITION</span>
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

                  {/* Roots/Stems: Warm Caramel/Cream #EFE8DF with Deep Bark Brown #42281D */}
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

                  {/* Suffixes: Soft Gray/White #FAFBF8 with Jet Black text */}
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

              {/* Bottom Flip Indicator */}
              <div className="mt-4 flex items-center justify-center space-x-2 text-[11px] font-mono font-bold uppercase text-[#62685E]">
                <RotateCw className="w-3.5 h-3.5 text-[#7BB33B]" />
                <span>Click to reveal official exam definition</span>
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
                  Official CollegeBoard Definition
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
                <span className="text-[#7BB33B] font-bold">Click to flip front</span>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Overlay */}
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

      {/* Response Controls & Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Prev / Flip / Next buttons */}
        <div className="flex items-center space-x-2 order-2 sm:order-1">
          <button
            onClick={handlePrev}
            className="p-2.5 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#111410] transition"
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
            onClick={handleNext}
            className="p-2.5 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#111410] transition"
            title="Next Card"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Active Study Action Buttons */}
        <div className="flex items-center space-x-3 w-full sm:w-auto order-1 sm:order-2">
          {/* Bark Brown: Need Review */}
          <button
            onClick={() => handleResponse(false)}
            disabled={submitting}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-[#42281D] hover:bg-[#593627] text-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] text-xs font-mono font-black uppercase tracking-wider transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#111410] disabled:opacity-50"
          >
            <HelpCircle className="w-4 h-4 text-[#C29B78]" />
            <span>Need Review</span>
          </button>

          {/* Vivid Kiwi: I Knew It */}
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
    </div>
  );
}
