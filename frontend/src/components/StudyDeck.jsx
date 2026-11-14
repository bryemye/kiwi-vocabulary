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
  Edit3,
  Target
} from 'lucide-react';
import { getMatchingTargetMorphemes } from '../services/studySessionService';

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
  onEditTargets = null,
  onExitSession,
  onResetFilters,
  isGuestMode = false,
  dailyDateFormatted = '',
  onOpenAuth = null,
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
  const targetMorphemes = subsetPracticeInfo?.targetMorphemes || [];
  const hasExplicitTargets = targetMorphemes.length > 0;
  const matchingTargetsForCard = hasExplicitTargets && currentWord
    ? getMatchingTargetMorphemes(currentWord, targetMorphemes)
    : [];
  const matchingTargetIds = new Set(matchingTargetsForCard.map((m) => m.id));

  const getConnotationBadge = (connotation) => {
    switch (connotation) {
      case 'positive':
        return 'bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B]/40 rounded-full font-sans font-semibold';
      case 'negative':
        return 'bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-sans font-semibold';
      default:
        return 'bg-stone-100 text-stone-700 border border-stone-200 rounded-full font-sans font-semibold';
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
        <div className="bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] p-3.5 sm:p-4 space-y-2.5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center space-x-2.5 font-mono text-xs">
              <span className="px-2 py-0.5 bg-[#7BB33B] text-white font-black text-[10px] uppercase border border-[#111410] shrink-0 mt-0.5 sm:mt-0 inline-flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>
                  {subsetPracticeInfo.modeLabel ? subsetPracticeInfo.modeLabel.toUpperCase() : 'CUSTOM SESSION'}
                </span>
              </span>
              <div className="text-[#111410] font-bold">
                <span>Practicing {sessionDeck.length} cards</span>
                {!hasExplicitTargets && (
                  <span>: <strong className="text-[#42281D]">{subsetPracticeInfo.title}</strong></span>
                )}
                {subsetPracticeInfo.details && (
                  <span className="text-[#62685E] font-normal block sm:inline sm:ml-2">
                    ({subsetPracticeInfo.details})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => handleSafeExit(hasExplicitTargets && onEditTargets ? onEditTargets : onOpenCustomModal)}
                className="px-3 py-1.5 sm:py-1 bg-white hover:bg-[#FAFBF8] text-[#111410] font-mono font-black text-xs uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center space-x-1.5 transition active:translate-x-[1px] active:translate-y-[1px]"
                title={hasExplicitTargets ? 'Add or remove practice targets' : 'Configure custom practice deck'}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{hasExplicitTargets ? 'Edit Targets' : 'Change Mode'}</span>
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

          {hasExplicitTargets && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#111410]/15 font-mono text-[11px]">
              <span className="text-[10px] font-black uppercase text-[#62685E] mr-1">
                Active Targets:
              </span>
              {targetMorphemes.map((m) => {
                const isCardMatch = matchingTargetIds.has(m.id);
                const label = m.type === 'root' ? `[${(m.morpheme || '').toUpperCase()}]` : m.title;
                return (
                  <span
                    key={m.id}
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 border font-bold transition ${
                      isCardMatch
                        ? 'bg-[#7BB33B] text-white border-[#111410] shadow-[1px_1px_0px_0px_#111410]'
                        : 'bg-white text-[#111410] border-[#111410]/40'
                    }`}
                  >
                    <span>{label}</span>
                    {m.core_meaning && (
                      <span className={`font-serif italic text-[10px] ${isCardMatch ? 'text-white/90' : 'text-[#62685E]'}`}>
                        "{m.core_meaning}"
                      </span>
                    )}
                  </span>
                );
              })}
              {!isSessionComplete && currentWord && matchingTargetsForCard.length === 0 && (
                <span className="ml-auto px-2 py-0.5 bg-[#FAF3DD] text-[#42281D] border border-[#111410]/40 text-[10px] font-bold uppercase">
                  Related Fill Card
                </span>
              )}
            </div>
          )}
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
        <div className="bg-white border border-stone-200/90 rounded-3xl shadow-soft-lg p-6 sm:p-10 text-center animate-fade-in my-4 sm:my-6">
          <div className="w-14 h-14 mx-auto bg-[#EDF5E5] border border-[#7BB33B]/40 rounded-2xl shadow-soft-xs flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-[#7BB33B]" />
          </div>

          <span className="text-[11px] font-sans font-bold uppercase tracking-wider px-3 py-1 bg-[#EDF5E5] text-[#2F441E] rounded-full inline-block mb-3 border border-[#7BB33B]/30">
            Round {sessionRound} Summary
          </span>

          <h2 className="text-2xl sm:text-4xl font-extrabold font-sans tracking-tight text-stone-900">
            {subsetPracticeInfo ? 'Practice Session Complete!' : '15-Card Session Complete!'}
          </h2>
          <p className="text-xs sm:text-sm font-sans text-stone-500 mt-1.5">
            {subsetPracticeInfo 
              ? `Completed review: ${subsetPracticeInfo.title}.`
              : 'Spaced repetition batch logged to platform progress.'}
          </p>

          <div className="my-6 max-w-sm mx-auto bg-stone-50 border border-stone-200/80 rounded-2xl p-4 shadow-soft-xs">
            <div className="flex items-center justify-between text-xs font-sans font-semibold mb-2">
              <span className="text-stone-500">Batch Accuracy:</span>
              <span className="text-[#2F441E] font-bold">
                {roundStats.correct} / {roundStats.total} Mastered ({roundStats.total > 0 ? Math.round((roundStats.correct / roundStats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#7BB33B] rounded-full transition-all duration-500"
                style={{ width: `${roundStats.total > 0 ? (roundStats.correct / roundStats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Guest completion call-to-action */}
          {isGuestMode && onOpenAuth && (
            <div className="my-6 p-5 bg-[#EDF5E5]/70 border border-[#7BB33B]/30 rounded-2xl shadow-soft-xs text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-white text-[#2F441E] rounded-md border border-[#7BB33B]/30 inline-block mb-1.5">
                  ⚡ Guest Challenge Finished
                </span>
                <h4 className="text-base font-bold font-sans text-stone-900">
                  Save your streak & unlock personalized spaced repetition
                </h4>
                <p className="text-xs font-sans text-stone-600 mt-1">
                  Sign in with your email to log your accuracy, review words you missed, and track root mastery rings.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="shrink-0 px-4 py-2.5 bg-[#7BB33B] hover:bg-[#6FA334] text-white rounded-xl shadow-soft-xs text-xs font-sans font-bold transition-all cursor-pointer"
              >
                Sign In To Save Progress &rarr;
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button
              onClick={onRestartSession}
              className="w-full sm:w-auto px-6 py-3 bg-[#7BB33B] hover:bg-[#6FA334] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-2xl shadow-soft-sm transition-all flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Deck Again ({sessionDeck.length})</span>
            </button>

            <button
              onClick={hasExplicitTargets && onEditTargets ? onEditTargets : onOpenCustomModal}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-stone-50 text-stone-700 font-sans font-bold text-xs uppercase tracking-wider rounded-2xl border border-stone-200 shadow-soft-xs transition-all flex items-center justify-center space-x-2"
            >
              <Sliders className="w-4 h-4 text-stone-500" />
              <span>{hasExplicitTargets ? 'Edit Targets' : 'Custom Session'}</span>
            </button>

            <button
              onClick={onReviewProgress}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-stone-50 text-stone-700 font-sans font-bold text-xs uppercase tracking-wider rounded-2xl border border-stone-200 shadow-soft-xs transition-all flex items-center justify-center space-x-2"
            >
              <Award className="w-4 h-4 text-stone-500" />
              <span>Root Progress</span>
            </button>
          </div>
        </div>
      ) : !currentWord ? (
        <div className="bg-white border border-stone-200 rounded-3xl shadow-soft-md p-8 sm:p-12 text-center my-6">
          <Layers className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold font-sans text-stone-800">No Matching Vocabulary Words</h3>
          <p className="text-xs font-sans text-stone-500 mt-1">Try resetting your origin filter or launching a custom practice session.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
            <button
              onClick={onResetFilters}
              className="w-full sm:w-auto px-5 py-2.5 bg-white text-stone-700 font-sans font-bold text-xs rounded-xl border border-stone-200 shadow-soft-xs hover:bg-stone-50"
            >
              Reset Filters
            </button>
            <button
              onClick={onOpenCustomModal}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#7BB33B] text-white font-sans font-bold text-xs rounded-xl shadow-soft-xs hover:bg-[#6FA334]"
            >
              Start Custom Session
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Guest Mode Indicator Header */}
          {isGuestMode && (
            <div className="mb-3 px-3.5 py-2 bg-[#EDF5E5]/80 border border-[#7BB33B]/30 rounded-2xl shadow-soft-xs flex items-center justify-between text-xs font-sans">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#7BB33B] animate-pulse shrink-0" />
                <span className="font-bold text-[#2F441E]">
                  Daily Guest Challenge {dailyDateFormatted ? `· ${dailyDateFormatted}` : ''}
                </span>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="text-xs font-semibold text-[#42281D] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>Sign in to save progress</span>
                  <span>&rarr;</span>
                </button>
              )}
            </div>
          )}

          {/* Progress Bar & Header */}
          <div className="flex items-center justify-between text-xs font-sans text-stone-700">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="px-2.5 py-1 bg-white border border-stone-200 rounded-xl font-mono font-bold shadow-soft-xs text-stone-800">
                Card {currentIndex + 1} of {sessionDeck.length}
              </span>
              <span className="text-stone-500 text-xs">
                Root: <strong className="text-[#2F441E] font-mono font-bold">[{currentWord.root_details?.morpheme?.toUpperCase()}]</strong>
                <span className="hidden sm:inline"> ({currentWord.root_details?.language})</span>
              </span>
            </div>

            <div className="w-28 sm:w-44 h-2 bg-stone-200 rounded-full overflow-hidden shadow-soft-xs">
              <div 
                className="h-full bg-[#7BB33B] rounded-full transition-all duration-300"
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
          <div className="relative min-h-[480px] sm:min-h-[520px] lg:min-h-[530px] w-full [perspective:1200px] mb-3 sm:mb-5 select-none">
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
              className="w-full min-h-[480px] sm:min-h-[520px] lg:min-h-[530px] relative cursor-pointer touch-pan-y"
            >
              {/* Dynamic On-Card Swipe Feedback Badges */}
              {touchOffset > 30 && (
                <div className="absolute top-6 right-6 z-40 pointer-events-none bg-[#7BB33B] text-white font-sans font-bold text-xs sm:text-sm uppercase px-3.5 py-1.5 rounded-xl shadow-soft-lg rotate-6 animate-pulse">
                  ✓ Mastered →
                </div>
              )}
              {touchOffset < -30 && (
                <div className="absolute top-6 left-6 z-40 pointer-events-none bg-rose-600 text-white font-sans font-bold text-xs sm:text-sm uppercase px-3.5 py-1.5 rounded-xl shadow-soft-lg -rotate-6 animate-pulse">
                  ← Needs Review ✗
                </div>
              )}

              {/* FRONT OF CARD */}
              <div 
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg)',
                }}
                className={`absolute inset-0 w-full h-full bg-white border border-stone-200/90 rounded-3xl shadow-soft-lg hover:shadow-card-glow p-5 sm:p-7 lg:p-8 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                  isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
                }`}
              >
                {/* Top Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3 sm:pb-3.5 shrink-0">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-y-1.5">
                    <span className="text-[11px] font-sans font-bold uppercase tracking-wider px-2.5 py-0.5 bg-stone-800 text-white rounded-full">
                      {currentWord.part_of_speech || 'noun'}
                    </span>
                    <span className={`text-[11px] font-sans font-semibold uppercase tracking-wider px-2.5 py-0.5 ${getConnotationBadge(currentWord.connotation)}`}>
                      {currentWord.connotation}
                    </span>
                    {currentWord.root_details?.thematic_cluster && (
                      <span className="text-[11px] font-sans font-semibold px-2.5 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B]/30 rounded-full">
                        🧠 {currentWord.root_details.thematic_cluster}
                      </span>
                    )}
                    {currentWord.root_details?.sat_tier && (
                      <span className="text-[11px] font-sans font-semibold px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                        ⚡ {currentWord.root_details.sat_tier}
                      </span>
                    )}
                    {currentWord.review?.verified && (
                      <span 
                        className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B]/40 text-[11px] font-sans font-semibold rounded-full shadow-soft-xs cursor-help"
                        title="Independently verified for SAT/ACT accuracy"
                      >
                        <Check className="w-3 h-3 text-[#7BB33B] stroke-[3]" />
                        <span className="hidden sm:inline">Verified</span>
                      </span>
                    )}
                    {isAdminMode && !currentWord.review?.verified && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-sans font-bold rounded-full">
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
                        className="px-2.5 py-1 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border border-[#7BB33B]/30 rounded-xl text-xs font-sans font-bold flex items-center space-x-1 transition shadow-soft-xs"
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
                      className="p-2 bg-stone-50 hover:bg-[#EDF5E5] text-stone-700 border border-stone-200 rounded-xl transition shadow-soft-xs min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-4 h-4 text-[#2F441E]" />
                    </button>
                  </div>
                </div>

                {/* Target Word */}
                <div className="my-3 sm:my-5 text-center px-2 flex-1 flex flex-col justify-center">
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight font-sans break-words hyphens-auto">
                    {currentWord.word}
                  </h1>
                  {currentWord.pronunciation && (
                    <p className="text-stone-500 text-xs sm:text-sm mt-1 sm:mt-1.5 font-mono font-medium tracking-wide">
                      /{currentWord.pronunciation}/
                    </p>
                  )}
                </div>

                {/* Morpheme Decomposition Tags */}
                <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-3.5 sm:p-4 shadow-soft-xs shrink-0">
                  <div className="text-[11px] font-sans font-bold text-stone-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-stone-700">
                      <Layers className="w-3.5 h-3.5 text-[#7BB33B]" />
                      <span>Morpheme Decomposition</span>
                    </span>
                    <span className="text-stone-400 text-[10px] font-mono lowercase hidden sm:inline">[space to flip]</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
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
                        className="px-3 py-1.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border border-[#7BB33B]/40 rounded-xl shadow-soft-xs hover:shadow-soft-sm transition cursor-pointer text-left group"
                        title="Click to explore this Prefix Morpheme & practice subset"
                      >
                        <div className="flex items-center justify-between space-x-1">
                          <span className="text-[9px] block uppercase font-mono font-bold text-[#2F441E]/70">Prefix</span>
                          <span className="text-[9px] font-mono font-bold opacity-60 group-hover:opacity-100">↗</span>
                        </div>
                        <span className="font-mono font-extrabold text-xs">{currentWord.prefix}</span>
                      </button>
                    )}

                    {currentWord.prefix && <span className="text-stone-400 font-bold font-mono text-base">+</span>}

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
                      className="px-3 py-1.5 bg-[#EFE8DF]/80 hover:bg-[#EFE8DF] text-[#42281D] border border-[#C29B78]/40 rounded-xl shadow-soft-xs hover:shadow-soft-sm transition cursor-pointer text-left group"
                      title="Click to explore this Root Morpheme & practice subset"
                    >
                      <div className="flex items-center justify-between space-x-1.5">
                        <span className="text-[9px] block uppercase font-mono font-bold text-[#42281D]/70">
                          Root ({currentWord.root_details?.language || 'Latin'})
                        </span>
                        <div className="flex items-center space-x-1">
                          {currentWord.root_details?.thematic_cluster && (
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 bg-white/90 border border-stone-200 rounded">
                              🧠 {currentWord.root_details.thematic_cluster}
                            </span>
                          )}
                          {currentWord.root_details?.sat_tier && (
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded">
                              ⚡ {currentWord.root_details.sat_tier}
                            </span>
                          )}
                          <span className="text-[9px] font-mono font-bold opacity-60 group-hover:opacity-100">↗</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#42281D]">
                        [{currentWord.root_details?.morpheme?.toUpperCase()}]
                      </span>
                      <span className="text-[#42281D] text-xs ml-1.5 font-sans font-medium">
                        = "{currentWord.root_details?.core_meaning}"
                      </span>
                    </button>

                    {currentWord.suffix && <span className="text-stone-400 font-bold font-mono text-base">+</span>}

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
                        className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-xl shadow-soft-xs hover:shadow-soft-sm transition cursor-pointer text-left group"
                        title="Click to explore this Suffix Morpheme & practice subset"
                      >
                        <div className="flex items-center justify-between space-x-1">
                          <span className="text-[9px] block uppercase font-mono font-bold text-stone-500">Suffix</span>
                          <span className="text-[9px] font-mono font-bold opacity-60 group-hover:opacity-100">↗</span>
                        </div>
                        <span className="font-mono font-extrabold text-xs">{currentWord.suffix}</span>
                      </button>
                    )}
                  </div>

                  {(currentWord.mnemonic || currentWord.root_details?.mnemonic) && (
                    <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-start space-x-2 text-xs font-sans text-stone-700">
                      <span className="font-bold uppercase text-[10px] text-[#2F441E] bg-[#EDF5E5] px-1.5 py-0.5 rounded border border-[#7BB33B]/30 shrink-0 font-mono">Key:</span>
                      <span className="italic font-serif">"{currentWord.mnemonic || currentWord.root_details.mnemonic}"</span>
                    </div>
                  )}
                </div>

                <div className="mt-2.5 sm:mt-3 flex items-center justify-center space-x-1.5 text-xs font-sans font-medium text-stone-400 shrink-0">
                  <RotateCw className="w-3.5 h-3.5 text-[#7BB33B]" />
                  <span>Tap card to flip definition <span className="hidden sm:inline font-mono text-[11px]">[Space]</span></span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div 
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
                className={`absolute inset-0 w-full h-full bg-white border border-stone-200/90 rounded-3xl shadow-soft-lg hover:shadow-card-glow p-5 sm:p-7 lg:p-8 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                  isFlipped ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3 sm:pb-3.5 shrink-0">
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-sans tracking-tight break-words">{currentWord.word}</h3>
                    <span className={`text-[10px] sm:text-[11px] font-sans font-semibold uppercase px-2.5 py-0.5 ${getConnotationBadge(currentWord.connotation)}`}>
                      {currentWord.connotation}
                    </span>
                    {currentWord.review?.verified && (
                      <span 
                        className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B]/40 text-[10px] font-sans font-semibold rounded-full shadow-soft-xs cursor-help"
                        title="Independently verified for SAT/ACT accuracy"
                      >
                        <Check className="w-3 h-3 text-[#7BB33B] stroke-[3]" />
                        <span className="hidden sm:inline">Verified</span>
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
                        className="px-2.5 py-1 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border border-[#7BB33B]/30 rounded-xl text-xs font-sans font-bold flex items-center space-x-1 transition shadow-soft-xs"
                        title="Edit verification & editorial notes"
                      >
                        <Edit3 className="w-3 h-3 text-[#7BB33B]" />
                        <span className="hidden sm:inline">Edit Verification</span>
                        <span className="sm:hidden">Edit</span>
                      </button>
                    )}
                    <span className="text-xs font-mono font-bold text-stone-400 uppercase">SAT Lexicon</span>
                  </div>
                </div>

                {/* Core Definition */}
                <div className="my-3 sm:my-4 flex-1 flex flex-col justify-center">
                  <h4 className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    SAT Context Definition
                  </h4>
                  <p className="text-lg sm:text-xl text-stone-900 font-serif leading-relaxed font-normal">
                    "{currentWord.definition}"
                  </p>
                </div>

                {/* Exam Context Sentence */}
                <div className="bg-[#FAFBF8] border-l-4 border-[#7BB33B] rounded-r-2xl p-3.5 sm:p-4 my-2 shadow-soft-xs shrink-0">
                  <h4 className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#2F441E] mb-1 flex items-center space-x-1.5">
                    <BookMarked className="w-3.5 h-3.5 text-[#7BB33B]" />
                    <span>Exam Context</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-700 font-serif italic leading-relaxed">
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
                  className="bg-[#EDF5E5]/60 hover:bg-[#EDF5E5] border border-[#7BB33B]/30 rounded-2xl p-2.5 sm:p-3 text-xs font-sans text-[#2F441E] flex items-center justify-between cursor-pointer transition shadow-soft-xs shrink-0"
                  title="Click to view root morpheme deep dive"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-bold uppercase text-[10px] text-stone-500 font-mono">Root:</span>
                    <strong className="underline decoration-[#7BB33B] text-xs font-mono font-bold">
                      [{currentWord.root_details?.morpheme?.toUpperCase()}]
                    </strong>
                    <span className="text-xs text-stone-600 truncate font-serif italic">
                      "{currentWord.root_details?.core_meaning}"
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase text-[#7BB33B] shrink-0 ml-2">Explore ↗</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Gestures Helper Bar */}
          <div className="flex sm:hidden items-center justify-between text-xs font-sans font-medium px-2 text-stone-500">
            <span className="text-rose-600">← Swipe: Review</span>
            <span className="text-stone-700">Tap: Flip</span>
            <span className="text-[#2F441E]">Swipe: Master →</span>
          </div>

          {/* Flashcard Action Controls (Taller, spacious, Thumb-Friendly) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 sm:pt-3">
            <button
              onClick={() => setIsFlipped(prev => !prev)}
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-stone-50 text-stone-800 font-sans font-bold text-xs rounded-2xl border border-stone-200 shadow-soft-xs hover:shadow-soft-sm transition-all flex items-center justify-center space-x-2 min-h-[48px]"
            >
              <RotateCw className="w-4 h-4 text-[#7BB33B]" />
              <span>Flip Card <span className="hidden sm:inline font-mono text-[11px] text-stone-400">[Space]</span></span>
            </button>

            {/* RESPONSE BUTTONS */}
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                disabled={submitting}
                onClick={() => onResponse(false)}
                className={`flex-1 sm:flex-none px-6 py-3 bg-white hover:bg-rose-50 text-rose-700 font-sans font-bold text-xs tracking-wide rounded-2xl border border-rose-200 shadow-soft-xs hover:shadow-soft-sm transition-all flex items-center justify-center space-x-2 min-h-[48px] ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <X className="w-4 h-4 shrink-0" />
                <span>Needs Review <span className="hidden sm:inline font-mono text-[11px] opacity-60">[1]</span></span>
              </button>

              <button
                disabled={submitting}
                onClick={() => onResponse(true)}
                className={`flex-1 sm:flex-none px-6 py-3 bg-[#7BB33B] hover:bg-[#6FA334] text-white font-sans font-bold text-xs tracking-wide rounded-2xl shadow-soft-md hover:shadow-card-glow transition-all flex items-center justify-center space-x-2 min-h-[48px] ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Check className="w-4 h-4 stroke-[3] shrink-0" />
                <span>Mastered <span className="hidden sm:inline font-mono text-[11px] text-white/80">[2]</span></span>
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
