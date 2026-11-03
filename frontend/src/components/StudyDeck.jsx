import React, { useState, useRef } from 'react';
import { 
  Layers, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  Check, 
  X, 
  Sliders, 
  Award, 
  BookMarked, 
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Edit3
} from 'lucide-react';

export default function StudyDeck({
  sessionDeck = [],
  currentIndex = 0,
  isFlipped = false,
  setIsFlipped,
  submitting = false,
  feedback = null,
  onSpeak,
  onOpenMorpheme,
  onResponse,
  isAdminMode = false,
  onEditWordVerification,
  subsetPracticeInfo = null,
  isSessionComplete = false,
  roundStats = { correct: 0, total: 0 },
  sessionRound = 1,
  onNextRound,
  onRestartSession,
  onReviewProgress,
  onOpenCustomModal,
  onExitSession,
  onResetFilters,
}) {
  // Confirmation dialog state for backing out of an active session
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Touch Swipe Gesture State
  const touchStartRef = useRef(null);
  const touchDeltaRef = useRef({ x: 0, y: 0 });
  const [touchOffset, setTouchOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const ignoreNextClickRef = useRef(false);

  const currentWord = sessionDeck[currentIndex] || null;

  const getConnotationBadge = (connotation) => {
    switch (connotation) {
      case 'positive':
        return 'bg-[#EDF5E5] text-[#2F441E] border-2 border-[#111410]';
      case 'negative':
        return 'bg-[#FDF2F2] text-[#991B1B] border-2 border-[#111410]';
      default:
        return 'bg-[#EFE8DF] text-[#42281D] border-2 border-[#111410]';
    }
  };

  // Safely trigger an action that could interrupt an active session
  const handleSafeExit = (action) => {
    if (currentIndex > 0 && !isSessionComplete) {
      setPendingAction(() => action);
      setShowExitConfirm(true);
    } else {
      action();
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCancelExit = () => {
    setShowExitConfirm(false);
    setPendingAction(null);
  };

  // Touch Gesture Handlers (Swipe left = Needs Review, Swipe right = Mastered, Tap = Flip)
  const handleTouchStart = (e) => {
    if (isSessionComplete || submitting || !currentWord) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchDeltaRef.current = { x: 0, y: 0 };
    setIsSwiping(false);
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchDeltaRef.current = { x: dx, y: dy };

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      setIsSwiping(true);
      // Dampen translation slightly for physics feel
      setTouchOffset(dx * 0.7);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;
    const { x: dx, y: dy } = touchDeltaRef.current;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    setTouchOffset(0);

    const SWIPE_THRESHOLD = 70;

    if (isSwiping && Math.abs(dx) > SWIPE_THRESHOLD) {
      ignoreNextClickRef.current = true;
      setTimeout(() => { ignoreNextClickRef.current = false; }, 350);
      setIsSwiping(false);
      if (dx > 0) {
        onResponse(true); // Mastered
      } else {
        onResponse(false); // Needs Review
      }
      return;
    }

    setIsSwiping(false);
    // If it was a quick tap with minimal movement, flip card
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && elapsed < 350) {
      ignoreNextClickRef.current = true;
      setTimeout(() => { ignoreNextClickRef.current = false; }, 350);
      setIsFlipped(prev => !prev);
    }
  };

  const handleCardClick = () => {
    if (ignoreNextClickRef.current || isSwiping) return;
    setIsFlipped(prev => !prev);
  };

  return (
    <div className="space-y-4">
      {/* ACTIVE SESSION / TARGETED SUBSET BANNER */}
      {subsetPracticeInfo && (
        <div className="bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start sm:items-center space-x-2.5 font-mono text-xs">
            <span className="px-2 py-0.5 bg-[#7BB33B] text-white font-black text-[10px] uppercase border border-[#111410] shrink-0 mt-0.5 sm:mt-0">
              {subsetPracticeInfo.modeLabel ? subsetPracticeInfo.modeLabel.toUpperCase() : 'CUSTOM SESSION'}
            </span>
            <div className="text-[#111410] font-bold">
              <span>Practicing {sessionDeck.length} cards: </span>
              <strong className="text-[#42281D]">{subsetPracticeInfo.title}</strong>
              {subsetPracticeInfo.details && (
                <span className="text-[#62685E] font-normal block sm:inline sm:ml-2">
                  ({subsetPracticeInfo.details})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => handleSafeExit(onOpenCustomModal)}
              className="px-3 py-1.5 sm:py-1 bg-white hover:bg-[#FAFBF8] text-[#111410] font-mono font-black text-xs uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center space-x-1.5 transition active:translate-x-[1px] active:translate-y-[1px]"
              title="Configure custom practice deck"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Change Mode</span>
            </button>

            <button
              onClick={() => handleSafeExit(onExitSession)}
              className="px-3 py-1.5 sm:py-1 bg-[#FAFBF8] hover:bg-[#EFE8DF] text-[#42281D] font-mono font-black text-xs uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center space-x-1.5 transition active:translate-x-[1px] active:translate-y-[1px]"
              title="Return to full general deck"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR EXITING ACTIVE SESSION */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111410]/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white border-3 border-[#111410] shadow-[6px_6px_0px_0px_#111410] p-6 space-y-4">
            <div className="flex items-center space-x-3 text-[#991B1B]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-black font-sans uppercase text-[#111410]">
                Active Session In Progress
              </h3>
            </div>
            <p className="text-xs font-mono text-[#42281D] leading-relaxed">
              You are currently on <strong>Card {currentIndex + 1} of {sessionDeck.length}</strong>. 
              Exiting or customizing your session now will reset your active round progress.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCancelExit}
                className="px-4 py-2 bg-white hover:bg-[#FAFBF8] text-[#111410] font-mono font-bold text-xs uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]"
              >
                Keep Studying
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="px-4 py-2 bg-[#991B1B] hover:bg-red-700 text-white font-mono font-bold text-xs uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]"
              >
                Reset & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SESSION COMPLETE BENTO */}
      {isSessionComplete ? (
        <div className="bg-white border-2 border-[#111410] shadow-[5px_5px_0px_0px_#111410] sm:shadow-[6px_6px_0px_0px_#111410] p-5 sm:p-8 text-center animate-fade-in my-4 sm:my-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-[#EDF5E5] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] flex items-center justify-center mb-3 sm:mb-4">
            <Award className="w-6 h-6 sm:w-7 sm:h-7 text-[#7BB33B]" />
          </div>

          <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] inline-block mb-2">
            ROUND {sessionRound} SUMMARY
          </span>

          <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-[#111410]">
            {subsetPracticeInfo ? 'Practice Session Complete!' : '15-Card Session Complete!'}
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[#62685E] mt-1 uppercase">
            {subsetPracticeInfo 
              ? `Completed review: ${subsetPracticeInfo.title}.`
              : 'Active spaced-repetition batch logged to platform activity.'}
          </p>

          <div className="my-5 sm:my-6 max-w-sm mx-auto bg-[#FAFBF8] border-2 border-[#111410] p-4 shadow-[3px_3px_0px_0px_#111410]">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase mb-2">
              <span className="text-[#62685E]">Batch Accuracy:</span>
              <span className="text-[#2F441E] font-black">
                {roundStats.correct} / {roundStats.total} MASTERED ({roundStats.total > 0 ? Math.round((roundStats.correct / roundStats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full h-3 bg-[#EFE8DF] border-2 border-[#111410] overflow-hidden">
              <div 
                className="h-full bg-[#7BB33B] transition-all duration-500"
                style={{ width: `${roundStats.total > 0 ? (roundStats.correct / roundStats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6">
            <button
              onClick={onRestartSession}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-[#7BB33B] hover:bg-[#84C341] text-white font-mono font-black text-xs uppercase tracking-wider border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] sm:shadow-[4px_4px_0px_0px_#111410] transition active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Deck Again ({sessionDeck.length})</span>
            </button>

            <button
              onClick={onOpenCustomModal}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-[#FAFBF8] hover:bg-white text-[#111410] font-mono font-black text-xs uppercase tracking-wider border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] sm:shadow-[4px_4px_0px_0px_#111410] transition flex items-center justify-center space-x-2"
            >
              <Sliders className="w-4 h-4 text-[#42281D]" />
              <span>New Custom Session</span>
            </button>

            <button
              onClick={onReviewProgress}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-white hover:bg-[#FAFBF8] text-[#111410] font-mono font-black text-xs uppercase tracking-wider border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] sm:shadow-[4px_4px_0px_0px_#111410] transition flex items-center justify-center space-x-2"
            >
              <Award className="w-4 h-4 text-[#42281D]" />
              <span>Review Root Progress</span>
            </button>
          </div>
        </div>
      ) : !currentWord ? (
        <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-8 sm:p-12 text-center my-6">
          <Layers className="w-12 h-12 text-[#42281D] mx-auto mb-3" />
          <h3 className="text-lg font-bold font-mono text-[#111410] uppercase">No Matching Vocabulary Words</h3>
          <p className="text-xs font-mono text-[#62685E] mt-1">Try resetting your origin filter or launching a custom practice session.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <button
              onClick={onResetFilters}
              className="w-full sm:w-auto px-5 py-2.5 bg-white text-[#111410] font-mono font-bold text-xs uppercase border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410]"
            >
              Reset All Filters
            </button>
            <button
              onClick={onOpenCustomModal}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#7BB33B] text-white font-mono font-bold text-xs uppercase border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410]"
            >
              Start Custom Session
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress Bar & Header */}
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#111410] uppercase">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="px-2 sm:px-2.5 py-1 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
                CARD {currentIndex + 1} OF {sessionDeck.length}
              </span>
              <span className="text-[#42281D] text-[11px] sm:text-xs">
                ROOT: <strong>{currentWord.root_details?.morpheme?.toUpperCase()}</strong>
                <span className="hidden sm:inline"> ({currentWord.root_details?.language?.toUpperCase()})</span>
              </span>
            </div>

            <div className="w-28 sm:w-44 h-3 bg-[#EFE8DF] border-2 border-[#111410] overflow-hidden shadow-[1px_1px_0px_0px_#111410]">
              <div 
                className="h-full bg-[#7BB33B] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / sessionDeck.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Admin Editorial Review Bar for the active card */}
          {isAdminMode && currentWord && (
            <div className="bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in">
              <div className="flex items-center space-x-2.5">
                <div className="p-1 bg-[#111410] text-white shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7BB33B]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-[10px] font-mono font-black uppercase text-[#111410]">
                      Editorial Status:
                    </span>
                    {currentWord.review?.verified ? (
                      <span className="px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] text-[10px] font-mono font-black uppercase">
                        ✓ Verified by {currentWord.review.verifiedBy || 'Editor'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] border border-[#111410] text-[10px] font-mono font-black uppercase">
                        ⚠ Unreviewed Entry
                      </span>
                    )}
                  </div>
                  {currentWord.review?.notes && (
                    <p className="text-[11px] font-sans italic text-[#42281D] mt-0.5 truncate">
                      "{currentWord.review.notes}"
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onEditWordVerification) onEditWordVerification(currentWord);
                }}
                className="px-3 py-1.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 transition active:translate-x-[1px] active:translate-y-[1px] shrink-0 self-end sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Verification</span>
              </button>
            </div>
          )}

          {/* 3D FLASHCARD CONTAINER WITH TOUCH SWIPE GESTURES */}
          <div className="relative min-h-[420px] sm:min-h-[440px] w-full [perspective:1200px] mb-2 sm:mb-4 select-none">
            <div 
              onClick={handleCardClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transformStyle: 'preserve-3d',
                WebkitTransformStyle: 'preserve-3d',
                transform: `${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'} ${
                  touchOffset ? `translateX(${touchOffset}px) rotate(${touchOffset * 0.04}deg)` : ''
                }`,
                transition: touchOffset ? 'none' : 'transform 0.45s ease-in-out',
              }}
              className="w-full min-h-[420px] sm:min-h-[440px] relative cursor-pointer touch-pan-y"
            >
              {/* Dynamic On-Card Swipe Feedback Badges */}
              {touchOffset > 30 && (
                <div className="absolute top-6 right-6 z-40 pointer-events-none bg-[#7BB33B] text-white font-mono font-black text-xs sm:text-sm uppercase px-3 py-1.5 border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] rotate-6 animate-pulse">
                  ✓ MASTERED →
                </div>
              )}
              {touchOffset < -30 && (
                <div className="absolute top-6 left-6 z-40 pointer-events-none bg-[#991B1B] text-white font-mono font-black text-xs sm:text-sm uppercase px-3 py-1.5 border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] -rotate-6 animate-pulse">
                  ← NEEDS REVIEW ✗
                </div>
              )}

              {/* FRONT OF CARD */}
              <div 
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg)',
                }}
                className={`absolute inset-0 w-full min-h-[420px] sm:min-h-[440px] h-full bg-white border-2 border-[#111410] shadow-[5px_5px_0px_0px_#42281D] sm:shadow-[6px_6px_0px_0px_#42281D] p-4 sm:p-8 flex flex-col justify-between transition-shadow duration-200 ${
                  isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
                }`}
              >
                {/* Top Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#111410] pb-2.5 sm:pb-3">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-y-1">
                    <span className="text-[10px] sm:text-[11px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 bg-[#111410] text-white">
                      {currentWord.part_of_speech || 'noun'}
                    </span>
                    <span className={`text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 ${getConnotationBadge(currentWord.connotation)}`}>
                      {currentWord.connotation}
                    </span>
                    {currentWord.review?.verified && (
                      <span 
                        className="inline-flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B] text-[10px] font-mono font-bold uppercase shadow-[1px_1px_0px_0px_#2F441E] cursor-help"
                        title="Independently verified for SAT/ACT accuracy"
                      >
                        <Check className="w-3 h-3 text-[#7BB33B] stroke-[3]" />
                        <span className="hidden sm:inline">✓ Verified</span>
                      </span>
                    )}
                    {isAdminMode && !currentWord.review?.verified && (
                      <span className="px-1.5 py-0.5 bg-[#FEF3C7] text-[#92400E] border border-[#111410] text-[9px] font-mono font-bold uppercase">
                        Unreviewed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {isAdminMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditWordVerification) onEditWordVerification(currentWord);
                        }}
                        className="px-2 py-1 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[10px] font-mono font-black uppercase flex items-center space-x-1 transition active:translate-x-[1px] active:translate-y-[1px]"
                        title="Edit verification & editorial notes"
                      >
                        <Edit3 className="w-3 h-3 text-[#7BB33B]" />
                        <span className="hidden sm:inline">Edit Verification</span>
                        <span className="sm:hidden">Edit</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpeak(currentWord.word);
                      }}
                      className="p-1.5 bg-[#FAFBF8] hover:bg-[#EDF5E5] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-4 h-4 text-[#2F441E]" />
                    </button>
                  </div>
                </div>

                {/* Target Word */}
                <div className="my-6 sm:my-8 text-center px-1">
                  <h1 className="text-3xl sm:text-5xl font-black text-[#111410] tracking-tight uppercase font-sans break-words hyphens-auto">
                    {currentWord.word}
                  </h1>
                  {currentWord.pronunciation && (
                    <p className="text-[#62685E] text-xs sm:text-sm mt-1.5 sm:mt-2 font-mono font-bold tracking-wider">
                      /{currentWord.pronunciation}/
                    </p>
                  )}
                </div>

                {/* Morpheme Decomposition Tags */}
                <div className="bg-[#FAFBF8] border-2 border-[#111410] p-3 sm:p-4">
                  <div className="text-[10px] sm:text-[11px] font-mono font-black text-[#111410] uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#7BB33B]" />
                      <span>Morpheme Decomposition</span>
                    </span>
                    <span className="text-[#62685E] text-[10px] font-normal uppercase hidden sm:inline">[Space] to reveal</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {currentWord.prefix && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMorpheme({
                            type: 'prefix',
                            raw: currentWord.prefix,
                            word: currentWord,
                          });
                        }}
                        className="px-2.5 sm:px-3 py-1.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] hover:shadow-[3px_3px_0px_0px_#111410] active:translate-y-0 transition cursor-pointer text-left group"
                        title="Click to explore this Prefix Morpheme & practice subset"
                      >
                        <div className="flex items-center justify-between space-x-1">
                          <span className="text-[9px] block uppercase font-mono font-bold text-[#2F441E]/70">Prefix</span>
                          <span className="text-[9px] font-mono font-bold opacity-60 group-hover:opacity-100">↗</span>
                        </div>
                        <span className="font-mono font-extrabold text-xs">{currentWord.prefix}</span>
                      </button>
                    )}

                    {currentWord.prefix && <span className="text-[#111410] font-black font-mono text-base">+</span>}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMorpheme({
                          type: 'root',
                          root: currentWord.root_details,
                          word: currentWord,
                        });
                      }}
                      className="px-2.5 sm:px-3 py-1.5 bg-[#EFE8DF] hover:bg-[#E5DCD1] text-[#42281D] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] hover:shadow-[3px_3px_0px_0px_#111410] active:translate-y-0 transition cursor-pointer text-left group"
                      title="Click to explore this Root Morpheme & practice subset"
                    >
                      <div className="flex items-center justify-between space-x-1">
                        <span className="text-[9px] block uppercase font-mono font-bold text-[#42281D]/70">
                          Root ({currentWord.root_details?.language || 'Latin'})
                        </span>
                        <span className="text-[9px] font-mono font-bold opacity-60 group-hover:opacity-100">↗</span>
                      </div>
                      <span className="font-mono font-black text-xs text-[#42281D]">
                        [{currentWord.root_details?.morpheme?.toUpperCase()}]
                      </span>
                      <span className="text-[#42281D] text-xs ml-1.5 font-sans font-bold">
                        = "{currentWord.root_details?.core_meaning}"
                      </span>
                    </button>

                    {currentWord.suffix && <span className="text-[#111410] font-black font-mono text-base">+</span>}

                    {currentWord.suffix && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMorpheme({
                            type: 'suffix',
                            raw: currentWord.suffix,
                            word: currentWord,
                          });
                        }}
                        className="px-2.5 sm:px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] hover:shadow-[3px_3px_0px_0px_#111410] active:translate-y-0 transition cursor-pointer text-left group"
                        title="Click to explore this Suffix Morpheme & practice subset"
                      >
                        <div className="flex items-center justify-between space-x-1">
                          <span className="text-[9px] block uppercase font-mono font-bold text-[#62685E]">Suffix</span>
                          <span className="text-[9px] font-mono font-bold opacity-60 group-hover:opacity-100">↗</span>
                        </div>
                        <span className="font-mono font-extrabold text-xs">{currentWord.suffix}</span>
                      </button>
                    )}
                  </div>

                  {currentWord.root_details?.mnemonic && (
                    <div className="mt-2.5 pt-2 border-t border-[#111410]/20 flex items-start space-x-2 text-[11px] sm:text-xs font-mono text-[#42281D]">
                      <span className="font-black uppercase text-[#2F441E] bg-[#EDF5E5] px-1 border border-[#111410] shrink-0">Key:</span>
                      <span className="italic font-serif">"{currentWord.root_details.mnemonic}"</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 sm:mt-4 flex items-center justify-center space-x-1.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase text-[#62685E]">
                  <RotateCw className="w-3.5 h-3.5 text-[#7BB33B]" />
                  <span>Tap card to flip definition <span className="hidden sm:inline">[Space]</span></span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div 
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
                className={`absolute inset-0 w-full min-h-[420px] sm:min-h-[440px] h-full bg-white border-2 border-[#111410] shadow-[5px_5px_0px_0px_#42281D] sm:shadow-[6px_6px_0px_0px_#42281D] p-4 sm:p-8 flex flex-col justify-between transition-shadow duration-200 ${
                  isFlipped ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#111410] pb-2.5 sm:pb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl sm:text-2xl font-black text-[#111410] font-sans uppercase break-words">{currentWord.word}</h3>
                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase px-2 py-0.5 ${getConnotationBadge(currentWord.connotation)}`}>
                      {currentWord.connotation}
                    </span>
                    {currentWord.review?.verified && (
                      <span 
                        className="inline-flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B] text-[10px] font-mono font-bold uppercase shadow-[1px_1px_0px_0px_#2F441E] cursor-help"
                        title="Independently verified for SAT/ACT accuracy"
                      >
                        <Check className="w-3 h-3 text-[#7BB33B] stroke-[3]" />
                        <span className="hidden sm:inline">✓ Verified</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isAdminMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditWordVerification) onEditWordVerification(currentWord);
                        }}
                        className="px-2 py-1 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[10px] font-mono font-black uppercase flex items-center space-x-1 transition active:translate-x-[1px] active:translate-y-[1px]"
                        title="Edit verification & editorial notes"
                      >
                        <Edit3 className="w-3 h-3 text-[#7BB33B]" />
                        <span className="hidden sm:inline">Edit Verification</span>
                        <span className="sm:hidden">Edit</span>
                      </button>
                    )}
                    <span className="text-[10px] sm:text-xs font-mono font-extrabold text-[#42281D] uppercase">Kiwi SAT Lexicon</span>
                  </div>
                </div>

                {/* Core Definition */}
                <div className="my-3 sm:my-4">
                  <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-[#62685E] mb-1">
                    Official SAT Context Definition
                  </h4>
                  <p className="text-base sm:text-xl text-[#111410] font-serif leading-relaxed">
                    "{currentWord.definition}"
                  </p>
                </div>

                {/* Exam Context Sentence */}
                <div className="bg-[#FAFBF8] border-2 border-[#111410] p-3 sm:p-4 shadow-[2px_2px_0px_0px_#111410]">
                  <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-[#42281D] mb-1 flex items-center space-x-1.5">
                    <BookMarked className="w-3.5 h-3.5 text-[#7BB33B]" />
                    <span>Exam Context Sentence</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-[#111410] font-serif italic leading-relaxed">
                    "{currentWord.sat_sentence}"
                  </p>
                </div>

                {/* Root Breakdown Capsule on Back */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMorpheme({
                      type: 'root',
                      root: currentWord.root_details,
                      word: currentWord,
                    });
                  }}
                  className="bg-[#EDF5E5] border-2 border-[#111410] p-2.5 sm:p-3 text-xs font-mono text-[#2F441E] flex items-center justify-between cursor-pointer hover:bg-[#E2F0D5] transition"
                  title="Click to view root morpheme deep dive"
                >
                  <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
                    <span className="font-black uppercase text-[10px] sm:text-xs">Root:</span>
                    <strong className="underline decoration-2 text-[11px] sm:text-xs">
                      [{currentWord.root_details?.morpheme?.toUpperCase()}]
                    </strong>
                    <span className="text-[10px] sm:text-[11px] font-sans truncate">
                      = "{currentWord.root_details?.core_meaning}"
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase underline shrink-0 ml-1">Explore ↗</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Gestures Helper Bar */}
          <div className="flex sm:hidden items-center justify-between text-[10px] font-mono font-bold px-1 text-[#62685E]">
            <span className="text-[#991B1B]">← Swipe: Review</span>
            <span className="text-[#111410]">Tap: Flip</span>
            <span className="text-[#2F441E]">Swipe: Master →</span>
          </div>

          {/* Flashcard Action Controls (Large Thumb-Friendly on Mobile) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-1 sm:pt-2">
            <button
              onClick={() => setIsFlipped(prev => !prev)}
              className="w-full sm:w-auto px-4 sm:px-5 py-3 sm:py-2.5 bg-white hover:bg-[#FAFBF8] text-[#111410] font-mono font-bold text-xs uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] sm:shadow-[3px_3px_0px_0px_#111410] transition flex items-center justify-center space-x-2 min-h-[44px]"
            >
              <RotateCw className="w-4 h-4 text-[#7BB33B]" />
              <span>Flip Card <span className="hidden sm:inline">[Space]</span></span>
            </button>

            {/* RESPONSE BUTTONS */}
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                disabled={submitting}
                onClick={() => onResponse(false)}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3.5 sm:py-2.5 bg-white hover:bg-[#FDF2F2] text-[#991B1B] font-mono font-black text-xs uppercase tracking-wider border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] sm:shadow-[3px_3px_0px_0px_#111410] transition active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center space-x-1.5 sm:space-x-2 min-h-[48px] ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <X className="w-4 h-4 shrink-0" />
                <span>Needs Review <span className="hidden sm:inline">[1]</span></span>
              </button>

              <button
                disabled={submitting}
                onClick={() => onResponse(true)}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3.5 sm:py-2.5 bg-[#7BB33B] hover:bg-[#84C341] text-white font-mono font-black text-xs uppercase tracking-wider border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] sm:shadow-[3px_3px_0px_0px_#111410] transition active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center space-x-1.5 sm:space-x-2 min-h-[48px] ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Check className="w-4 h-4 stroke-[3] shrink-0" />
                <span>Mastered <span className="hidden sm:inline">[2]</span></span>
              </button>
            </div>
          </div>

          {/* Toast / Feedback Banner */}
          {feedback && (
            <div 
              className={`p-2.5 sm:p-3 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] sm:shadow-[3px_3px_0px_0px_#111410] font-mono font-bold text-xs uppercase text-center animate-bounce ${
                feedback.type === 'success' 
                  ? 'bg-[#EDF5E5] text-[#2F441E]' 
                  : 'bg-[#FDF2F2] text-[#991B1B]'
              }`}
            >
              {feedback.text}
            </div>
          )}
        </>
      )}
    </div>
  );
}
