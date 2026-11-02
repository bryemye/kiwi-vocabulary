import React, { useState, useMemo } from 'react';
import { 
  X, 
  Layers, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Search, 
  Info, 
  BookOpen, 
  AlertCircle,
  Play,
  Zap,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { 
  SESSION_SIZE, 
  MAX_SELECTED_ROOTS, 
  HIGH_FREQUENCY_TIER1_MORPHEMES,
  getWordProgressMap,
  getReviewEligibleWords,
  generateRootFamilyDeck,
  generateSmartReviewDeck,
  generateTier1Deck,
  generateQuickStartDeck
} from '../services/studySessionService';

export default function CustomPracticeModal({
  isOpen,
  onClose,
  roots = [],
  words = [],
  initialSelectedRootIds = [],
  onLaunchSession
}) {
  if (!isOpen) return null;

  // Selected mode: 'root_family' | 'smart_review' | 'tier1'
  const [mode, setMode] = useState('root_family');

  // Option A States
  const [selectedRootIds, setSelectedRootIds] = useState(() => {
    if (initialSelectedRootIds && initialSelectedRootIds.length > 0) {
      return initialSelectedRootIds.slice(0, MAX_SELECTED_ROOTS).map(Number);
    }
    // Default to first root if available
    return roots.length > 0 ? [roots[0].id] : [];
  });
  const [rootSearchTerm, setRootSearchTerm] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('ALL');
  const [backfillRelatedRoots, setBackfillRelatedRoots] = useState(true);

  // Option B States
  const [backfillUnstudiedReview, setBackfillUnstudiedReview] = useState(true);

  // Root word counts lookup
  const rootWordCounts = useMemo(() => {
    const counts = {};
    words.forEach(w => {
      const rId = Number(w.root || w.root_details?.id);
      if (rId) {
        counts[rId] = (counts[rId] || 0) + 1;
      }
    });
    return counts;
  }, [words]);

  // Filtered roots for search in Option A
  const filteredRoots = useMemo(() => {
    return roots.filter(r => {
      if (selectedLanguageFilter !== 'ALL' && r.language.toLowerCase() !== selectedLanguageFilter.toLowerCase()) {
        return false;
      }
      if (rootSearchTerm.trim()) {
        const q = rootSearchTerm.toLowerCase();
        const morphMatch = (r.morpheme || '').toLowerCase().includes(q);
        const meanMatch = (r.core_meaning || '').toLowerCase().includes(q);
        if (!morphMatch && !meanMatch) return false;
      }
      return true;
    });
  }, [roots, selectedLanguageFilter, rootSearchTerm]);

  // Selected roots objects & total eligible words for Option A
  const selectedRootsObjects = useMemo(() => {
    const set = new Set(selectedRootIds);
    return roots.filter(r => set.has(r.id));
  }, [roots, selectedRootIds]);

  const totalEligibleRootWords = useMemo(() => {
    const set = new Set(selectedRootIds);
    return words.filter(w => set.has(Number(w.root || w.root_details?.id))).length;
  }, [words, selectedRootIds]);

  // Review status calculations for Option B
  const progressMap = useMemo(() => getWordProgressMap(), []);
  const reviewWords = useMemo(() => getReviewEligibleWords(words), [words]);

  const reviewBreakdown = useMemo(() => {
    let struggling = 0;
    let learning = 0;
    reviewWords.forEach(w => {
      const p = progressMap[(w.word || '').toLowerCase()];
      if (p?.status === 'struggling') struggling++;
      else learning++;
    });
    return { struggling, learning, total: reviewWords.length };
  }, [reviewWords, progressMap]);

  // Toggle root selection for Option A
  const handleToggleRoot = (rootId) => {
    const id = Number(rootId);
    if (selectedRootIds.includes(id)) {
      setSelectedRootIds(prev => prev.filter(r => r !== id));
    } else {
      if (selectedRootIds.length >= MAX_SELECTED_ROOTS) {
        return; // Max 5 cap enforced
      }
      setSelectedRootIds(prev => [...prev, id]);
    }
  };

  const handleRemoveChip = (rootId) => {
    setSelectedRootIds(prev => prev.filter(r => r !== Number(rootId)));
  };

  // Launch handlers
  const handleStartSession = () => {
    let sessionData = null;

    if (mode === 'root_family') {
      if (selectedRootIds.length === 0) return;
      const gen = generateRootFamilyDeck({
        selectedRootIds,
        allWords: words,
        allRoots: roots,
        backfillRelated: backfillRelatedRoots,
        targetCount: SESSION_SIZE
      });

      const titleList = selectedRootsObjects.map(r => `[${r.morpheme.toUpperCase()}]`).join(' + ');
      sessionData = {
        deck: gen.deck,
        title: `Root Focus: ${titleList}`,
        mode: 'root_family',
        modeLabel: 'Root Family Focus',
        details: `${selectedRootIds.length} roots selected (${gen.deck.length} words)`
      };
    } else if (mode === 'smart_review') {
      const gen = generateSmartReviewDeck({
        allWords: words,
        backfillUnstudied: backfillUnstudiedReview,
        targetCount: SESSION_SIZE
      });

      sessionData = {
        deck: gen.deck,
        title: 'Smart Spaced Repetition Review',
        mode: 'smart_review',
        modeLabel: 'Smart Review',
        details: gen.backfilledCount > 0 
          ? `${gen.reviewCount} review words + ${gen.backfilledCount} backfilled unstudied`
          : `${gen.reviewCount} review words queued`
      };
    } else if (mode === 'tier1') {
      const gen = generateTier1Deck({
        allWords: words,
        allRoots: roots,
        targetCount: SESSION_SIZE
      });

      sessionData = {
        deck: gen.deck,
        title: 'High-Frequency SAT/ACT Tier 1',
        mode: 'tier1',
        modeLabel: 'Tier 1 Academic',
        details: '15 High-yield words balanced across recurring SAT roots'
      };
    }

    if (sessionData && sessionData.deck.length > 0) {
      onLaunchSession(sessionData);
      onClose();
    }
  };

  // Quick Start Handler
  const handleQuickStart = () => {
    const gen = generateQuickStartDeck({ allWords: words, targetCount: SESSION_SIZE });
    onLaunchSession({
      deck: gen.deck,
      title: 'General 15-Card Study Session',
      mode: 'quick_start',
      modeLabel: 'Quick Start',
      details: 'Balanced random sample from full SAT/ACT lexicon'
    });
    onClose();
  };

  // Calculate target card count for button label
  const estimatedCardCount = useMemo(() => {
    if (mode === 'root_family') {
      if (selectedRootIds.length === 0) return 0;
      if (totalEligibleRootWords >= SESSION_SIZE) return SESSION_SIZE;
      return backfillRelatedRoots ? SESSION_SIZE : totalEligibleRootWords;
    }
    if (mode === 'smart_review') {
      if (reviewWords.length >= SESSION_SIZE) return SESSION_SIZE;
      return backfillUnstudiedReview ? SESSION_SIZE : reviewWords.length;
    }
    return SESSION_SIZE;
  }, [mode, selectedRootIds, totalEligibleRootWords, backfillRelatedRoots, reviewWords, backfillUnstudiedReview]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#111410]/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-3xl bg-white border-3 border-[#111410] shadow-[8px_8px_0px_0px_#111410] flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-[#FAFBF8] border-b-2 border-[#111410] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#7BB33B] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="modal-title" className="text-xl sm:text-2xl font-black font-sans uppercase tracking-tight text-[#111410]">
                  Custom Practice Session
                </h2>
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410]">
                  15-CARD ENGINE
                </span>
              </div>
              <p className="text-xs font-mono uppercase text-[#62685E] mt-0.5">
                Tailor your study deck with targeted root families, spaced repetition, or high-yield roots
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-white hover:bg-[#EFE8DF] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition active:translate-x-[1px] active:translate-y-[1px]"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODE SELECTION TABS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b-2 border-[#111410] bg-[#FAFBF8] shrink-0">
          <button
            type="button"
            onClick={() => setMode('root_family')}
            className={`p-3.5 text-left border-b-2 sm:border-b-0 sm:border-r-2 border-[#111410] transition flex items-center space-x-3 ${
              mode === 'root_family'
                ? 'bg-white shadow-[inset_0_-3px_0_0_#7BB33B]'
                : 'bg-[#FAFBF8] hover:bg-[#F2EFE9] opacity-75 hover:opacity-100'
            }`}
          >
            <div className={`p-2 border border-[#111410] ${mode === 'root_family' ? 'bg-[#7BB33B] text-white' : 'bg-white text-[#111410]'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-xs font-black uppercase tracking-wider text-[#111410]">
                  Option A
                </span>
                <span className="text-[9px] font-mono uppercase px-1 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] font-bold">
                  DEFAULT
                </span>
              </div>
              <div className="font-sans font-bold text-xs sm:text-sm text-[#111410] truncate">
                Root Family Focus
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('smart_review')}
            className={`p-3.5 text-left border-b-2 sm:border-b-0 sm:border-r-2 border-[#111410] transition flex items-center space-x-3 ${
              mode === 'smart_review'
                ? 'bg-white shadow-[inset_0_-3px_0_0_#7BB33B]'
                : 'bg-[#FAFBF8] hover:bg-[#F2EFE9] opacity-75 hover:opacity-100'
            }`}
          >
            <div className={`p-2 border border-[#111410] ${mode === 'smart_review' ? 'bg-[#7BB33B] text-white' : 'bg-white text-[#111410]'}`}>
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-xs font-black uppercase tracking-wider text-[#111410]">
                Option B
              </div>
              <div className="font-sans font-bold text-xs sm:text-sm text-[#111410] truncate">
                Smart Review
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('tier1')}
            className={`p-3.5 text-left transition flex items-center space-x-3 ${
              mode === 'tier1'
                ? 'bg-white shadow-[inset_0_-3px_0_0_#7BB33B]'
                : 'bg-[#FAFBF8] hover:bg-[#F2EFE9] opacity-75 hover:opacity-100'
            }`}
          >
            <div className={`p-2 border border-[#111410] ${mode === 'tier1' ? 'bg-[#7BB33B] text-white' : 'bg-white text-[#111410]'}`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-xs font-black uppercase tracking-wider text-[#111410]">
                Option C
              </div>
              <div className="font-sans font-bold text-xs sm:text-sm text-[#111410] truncate">
                SAT/ACT Tier 1
              </div>
            </div>
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">

          {/* ------------------------------------------------------------- */}
          {/* MODE A: ROOT FAMILY FOCUS */}
          {/* ------------------------------------------------------------- */}
          {mode === 'root_family' && (
            <div className="space-y-4">
              {/* Header Status & Counter */}
              <div className="p-3.5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className={`px-2.5 py-1 font-black uppercase border border-[#111410] ${
                    selectedRootIds.length > 0 ? 'bg-[#7BB33B] text-white' : 'bg-[#EFE8DF] text-[#42281D]'
                  }`}>
                    Selected: {selectedRootIds.length} / {MAX_SELECTED_ROOTS} roots
                  </span>
                  <span className="font-bold text-[#111410]">
                    ({totalEligibleRootWords} total eligible words)
                  </span>
                </div>

                <div className="text-[11px] font-mono text-[#62685E]">
                  {selectedRootIds.length >= MAX_SELECTED_ROOTS ? (
                    <span className="text-[#C29B78] font-bold">Max cap reached (5/5)</span>
                  ) : (
                    <span>Choose 1 to 5 root families</span>
                  )}
                </div>
              </div>

              {/* Selected Roots Chips */}
              {selectedRootsObjects.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-[#EDF5E5] border border-[#111410]">
                  <span className="text-[10px] font-mono font-black uppercase text-[#2F441E] mr-1">Active Roots:</span>
                  {selectedRootsObjects.map(r => (
                    <span 
                      key={r.id}
                      className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-white border border-[#111410] shadow-[1px_1px_0px_0px_#111410] text-xs font-mono font-bold text-[#111410]"
                    >
                      <span>[{r.morpheme.toUpperCase()}]</span>
                      <span className="text-[10px] text-[#62685E]">({rootWordCounts[r.id] || 0}w)</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChip(r.id)}
                        className="hover:text-red-600 transition"
                        title="Remove root"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedRootIds([])}
                    className="text-[10px] font-mono font-bold text-[#42281D] hover:underline ml-2"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* Search & Origin Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#62685E]" />
                  <input
                    type="text"
                    value={rootSearchTerm}
                    onChange={(e) => setRootSearchTerm(e.target.value)}
                    placeholder="SEARCH ROOTS OR CORE MEANINGS..."
                    className="w-full bg-white text-[#111410] font-mono text-xs font-bold pl-8 pr-7 py-2 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] focus:outline-none uppercase placeholder:text-[#A8AAA6]"
                  />
                  {rootSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setRootSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-[#62685E] hover:text-[#111410]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1 font-mono text-xs">
                  {['ALL', 'Latin', 'Greek'].map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLanguageFilter(lang)}
                      className={`px-3 py-2 font-black uppercase border-2 border-[#111410] transition ${
                        selectedLanguageFilter.toLowerCase() === lang.toLowerCase()
                          ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410]'
                          : 'bg-white text-[#111410] hover:bg-[#FAFBF8]'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roots List / Selection Grid */}
              <div className="border-2 border-[#111410] bg-white max-h-56 overflow-y-auto divide-y divide-[#111410]/20">
                {filteredRoots.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono text-[#62685E] uppercase">
                    No roots match your search query.
                  </div>
                ) : (
                  filteredRoots.map(r => {
                    const isSelected = selectedRootIds.includes(r.id);
                    const isCapReached = selectedRootIds.length >= MAX_SELECTED_ROOTS && !isSelected;
                    const count = rootWordCounts[r.id] || 0;

                    return (
                      <div
                        key={r.id}
                        onClick={() => !isCapReached && handleToggleRoot(r.id)}
                        className={`p-2.5 sm:p-3 flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#EDF5E5] hover:bg-[#E2F0D5]'
                            : isCapReached
                            ? 'bg-[#FAFBF8] opacity-50 cursor-not-allowed'
                            : 'hover:bg-[#FAFBF8]'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isCapReached}
                            onChange={() => !isCapReached && handleToggleRoot(r.id)}
                            className="w-4 h-4 accent-[#7BB33B] border-2 border-[#111410] cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-black uppercase text-[#111410]">
                                [{r.morpheme.toUpperCase()}]
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white text-[#2F441E] border border-[#111410] uppercase font-bold">
                                {r.language}
                              </span>
                            </div>
                            <p className="text-xs font-serif italic text-[#42281D] truncate">
                              "{r.core_meaning}"
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 bg-white border border-[#111410] font-mono text-[10px] font-bold text-[#111410]">
                            {count} {count === 1 ? 'word' : 'words'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sub-options for Option A (Sampling & Backfill rule) */}
              <div className="p-3 bg-[#FAFBF8] border-2 border-[#111410] space-y-2 text-xs font-mono">
                {totalEligibleRootWords > SESSION_SIZE ? (
                  <div className="flex items-start space-x-2 text-[#2F441E]">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#7BB33B]" />
                    <p>
                      Selected roots contain <strong>{totalEligibleRootWords} words</strong>. The engine will draw a balanced random sample of <strong>15 words</strong> across these roots with morpheme variety interleaving.
                    </p>
                  </div>
                ) : totalEligibleRootWords > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2 text-[#42281D]">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#C29B78]" />
                      <p>
                        Selected roots contain <strong>{totalEligibleRootWords} words</strong> (fewer than the standard 15-card session).
                      </p>
                    </div>

                    <label className="flex items-center space-x-2 cursor-pointer pt-1 border-t border-[#111410]/20">
                      <input
                        type="checkbox"
                        checked={backfillRelatedRoots}
                        onChange={(e) => setBackfillRelatedRoots(e.target.checked)}
                        className="w-4 h-4 accent-[#7BB33B] border-2 border-[#111410] cursor-pointer"
                      />
                      <span className="text-[#111410] font-bold">
                        Fill remaining slots ({SESSION_SIZE - totalEligibleRootWords} cards) with closely related root families to make a full 15-card session
                      </span>
                    </label>
                    {!backfillRelatedRoots && (
                      <p className="text-[11px] text-[#62685E] pl-6 italic">
                        Unchecked: Practice session will run with exact count of {totalEligibleRootWords} cards.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[#991B1B] font-bold">
                    Please select at least 1 root family from the list above.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* MODE B: SMART REVIEW (SPACED REPETITION / MISSED WORDS) */}
          {/* ------------------------------------------------------------- */}
          {mode === 'smart_review' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
                <div className="flex items-center space-x-2 mb-2">
                  <RotateCcw className="w-5 h-5 text-[#2F441E]" />
                  <h3 className="font-mono text-sm font-black uppercase text-[#2F441E]">
                    Spaced Repetition & Missed Words Filter
                  </h3>
                </div>
                <p className="font-mono text-xs text-[#2F441E] leading-relaxed">
                  Targets vocabulary marked as <strong>"struggling"</strong> (recently missed) or <strong>"learning"</strong> (fewer than 2 consecutive correct answers) from your practice history stored in localStorage.
                </p>
              </div>

              {/* Review Queue Metrics Bento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border-2 border-[#111410] p-3 shadow-[2px_2px_0px_0px_#111410]">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#62685E]">Needs Review</span>
                  <div className="text-2xl font-black font-mono text-[#111410] mt-0.5">
                    {reviewBreakdown.total}
                  </div>
                  <span className="text-[10px] font-mono text-[#42281D]">Eligible Review Words</span>
                </div>

                <div className="bg-white border-2 border-[#111410] p-3 shadow-[2px_2px_0px_0px_#111410]">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#991B1B]">Struggling (Missed)</span>
                  <div className="text-2xl font-black font-mono text-[#991B1B] mt-0.5">
                    {reviewBreakdown.struggling}
                  </div>
                  <span className="text-[10px] font-mono text-[#62685E]">Priority 1 Flashcards</span>
                </div>

                <div className="bg-white border-2 border-[#111410] p-3 shadow-[2px_2px_0px_0px_#111410]">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#42281D]">Learning (In Progress)</span>
                  <div className="text-2xl font-black font-mono text-[#42281D] mt-0.5">
                    {reviewBreakdown.learning}
                  </div>
                  <span className="text-[10px] font-mono text-[#62685E]">Reinforcement Cards</span>
                </div>
              </div>

              {/* Queue Status Details */}
              <div className="p-3.5 bg-[#FAFBF8] border-2 border-[#111410] space-y-3 font-mono text-xs">
                {reviewBreakdown.total >= SESSION_SIZE ? (
                  <div className="flex items-start space-x-2 text-[#2F441E]">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#7BB33B]" />
                    <p>
                      <strong>{reviewBreakdown.total} words</strong> need review. Generating a prioritized 15-word session featuring struggling words first.
                    </p>
                  </div>
                ) : reviewBreakdown.total > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2 text-[#42281D]">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#C29B78]" />
                      <p>
                        <strong>{reviewBreakdown.total} words</strong> currently need review.
                      </p>
                    </div>

                    <label className="flex items-center space-x-2 cursor-pointer pt-1 border-t border-[#111410]/20">
                      <input
                        type="checkbox"
                        checked={backfillUnstudiedReview}
                        onChange={(e) => setBackfillUnstudiedReview(e.target.checked)}
                        className="w-4 h-4 accent-[#7BB33B] border-2 border-[#111410] cursor-pointer"
                      />
                      <span className="text-[#111410] font-bold">
                        Automatically backfill with {SESSION_SIZE - reviewBreakdown.total} unstudied words to make a 15-card session
                      </span>
                    </label>
                    {!backfillUnstudiedReview && (
                      <p className="text-[11px] text-[#62685E] pl-6 italic">
                        Unchecked: Session will practice only your {reviewBreakdown.total} review words.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-[#42281D]">
                    <div className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#7BB33B]" />
                      <p>
                        <strong>All caught up!</strong> You have 0 missed or struggling words currently recorded in your local study logs.
                      </p>
                    </div>
                    <p className="text-[11px] text-[#62685E] pl-6">
                      Starting this session will pull 15 fresh, unstudied vocabulary cards to establish baseline spaced repetition data.
                    </p>
                  </div>
                )}
              </div>

              {/* Sample Review Preview Chips */}
              {reviewWords.length > 0 && (
                <div className="p-3 bg-white border-2 border-[#111410]">
                  <span className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-2">
                    Sample Queued Words:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {reviewWords.slice(0, 10).map((w, idx) => (
                      <span
                        key={w.id || idx}
                        className="px-2 py-0.5 bg-[#FAFBF8] border border-[#111410] font-mono text-[11px] font-bold text-[#111410] uppercase"
                      >
                        {w.word}
                      </span>
                    ))}
                    {reviewWords.length > 10 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono text-[#62685E]">
                        +{reviewWords.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* MODE C: HIGH-FREQUENCY SAT/ACT TIER 1 */}
          {/* ------------------------------------------------------------- */}
          {mode === 'tier1' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#2F441E]" />
                  <h3 className="font-mono text-sm font-black uppercase text-[#2F441E]">
                    High-Frequency SAT/ACT Tier 1 Lexicon
                  </h3>
                </div>
                <p className="font-mono text-xs text-[#2F441E] leading-relaxed">
                  Automatically assembles a curated 15-card session drawing from the highest-yield classical roots and recurring academic exam terms.
                </p>
              </div>

              <div className="p-4 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] space-y-3">
                <span className="text-[10px] font-mono font-black uppercase text-[#62685E] block">
                  Priority Root Families Included:
                </span>
                <div className="flex flex-wrap gap-2">
                  {HIGH_FREQUENCY_TIER1_MORPHEMES.slice(0, 12).map((morpheme, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 bg-[#FAFBF8] border-2 border-[#111410] shadow-[1px_1px_0px_0px_#111410] font-mono text-xs font-bold text-[#111410] uppercase"
                    >
                      [{morpheme}]
                    </span>
                  ))}
                  <span className="px-2 py-1 text-xs font-mono text-[#62685E] font-bold">
                    + more recurring roots
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-[#FAFBF8] border-2 border-[#111410] font-mono text-xs text-[#111410] space-y-1.5">
                <div className="font-bold flex items-center space-x-1.5 text-[#2F441E]">
                  <CheckCircle2 className="w-4 h-4 text-[#7BB33B]" />
                  <span>Automatic 15-Card Balanced Session</span>
                </div>
                <p className="text-[#62685E]">
                  Ensures student exposure to top morphemes with smart interleaving so that related roots are evenly distributed across the round.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-[#FAFBF8] border-t-2 border-[#111410] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Quick Start Alternative */}
          <button
            type="button"
            onClick={handleQuickStart}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-[#FAFBF8] text-[#42281D] font-mono font-black text-xs uppercase border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] transition active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center space-x-1.5"
            title="Start standard 15-card session without customizing"
          >
            <Play className="w-3.5 h-3.5 fill-[#42281D]" />
            <span>Quick Start (General 15)</span>
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-[#FAFBF8] text-[#111410] font-mono font-black text-xs uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleStartSession}
              disabled={mode === 'root_family' && selectedRootIds.length === 0}
              className={`w-full sm:w-auto px-6 py-2.5 font-mono font-black text-xs uppercase tracking-wider border-2 border-[#111410] transition flex items-center justify-center space-x-2 ${
                mode === 'root_family' && selectedRootIds.length === 0
                  ? 'bg-[#EFE8DF] text-[#A8AAA6] cursor-not-allowed shadow-none'
                  : 'bg-[#7BB33B] hover:bg-[#84C341] text-white shadow-[4px_4px_0px_0px_#111410] active:translate-x-[2px] active:translate-y-[2px]'
              }`}
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Start Session ({estimatedCardCount} Cards)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
