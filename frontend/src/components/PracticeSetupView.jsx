import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Layers,
  Plus,
  Search,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import {
  SESSION_SIZE,
  MAX_SELECTED_MORPHEMES,
  extractMorphemesFromWords,
  resolveInitialMorphemeIds,
  buildMorphemePracticeSession,
} from '../services/studySessionService';

/**
 * PracticeSetupView: Dedicated full-screen target builder for setting up a
 * focused practice set from the Mastery dashboard or editing active targets.
 */
export default function PracticeSetupView({
  roots = [],
  words = [],
  stats = null,
  initialSelectedRootIds = [],
  initialSelectedMorphemeIds = [],
  source = 'progress',
  onBack,
  onLaunchSession,
}) {
  const allMorphemes = useMemo(
    () => extractMorphemesFromWords(words, roots),
    [words, roots]
  );

  // Map root mastery telemetry from stats for quick mastery indicators
  const rootMasteryMap = useMemo(() => {
    const map = new Map();
    const list = stats?.root_mastery || [];
    list.forEach((r) => {
      if (r?.id != null) {
        map.set(Number(r.id), r);
      }
    });
    return map;
  }, [stats]);

  const [selectedMorphemeIds, setSelectedMorphemeIds] = useState(() =>
    resolveInitialMorphemeIds({
      allMorphemes,
      initialSelectedMorphemes: initialSelectedMorphemeIds,
      initialSelectedRootIds,
      fallbackToFirst: false,
    })
  );

  const [morphemeTypeFilter, setMorphemeTypeFilter] = useState('ROOT'); // 'ROOT' | 'ALL' | 'PREFIX' | 'SUFFIX'
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('ALL');
  const [masteryFilter, setMasteryFilter] = useState('ALL'); // 'ALL' | 'NEEDS_PRACTICE' | 'UNSTARTED'
  const [searchTerm, setSearchTerm] = useState('');
  const [backfillRelated, setBackfillRelated] = useState(false);

  // Re-sync if caller passes new initial target IDs
  useEffect(() => {
    const resolved = resolveInitialMorphemeIds({
      allMorphemes,
      initialSelectedMorphemes: initialSelectedMorphemeIds,
      initialSelectedRootIds,
      fallbackToFirst: false,
    });
    if (resolved.length > 0) {
      setSelectedMorphemeIds(resolved);
    }
  }, [initialSelectedRootIds, initialSelectedMorphemeIds, allMorphemes]);

  const selectedMorphemeSet = useMemo(
    () => new Set(selectedMorphemeIds),
    [selectedMorphemeIds]
  );

  const selectedMorphemesObjects = useMemo(() => {
    const byId = new Map(allMorphemes.map((m) => [m.id, m]));
    return selectedMorphemeIds.map((id) => byId.get(id)).filter(Boolean);
  }, [allMorphemes, selectedMorphemeIds]);

  const totalEligibleWords = useMemo(() => {
    const wordIds = new Set();
    selectedMorphemesObjects.forEach((m) => {
      m.words?.forEach((w) => wordIds.add(w.id));
    });
    return wordIds.size;
  }, [selectedMorphemesObjects]);

  const filteredMorphemes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allMorphemes.filter((m) => {
      if (morphemeTypeFilter !== 'ALL' && m.type.toUpperCase() !== morphemeTypeFilter) {
        return false;
      }
      if (
        selectedLanguageFilter !== 'ALL' &&
        m.type === 'root' &&
        m.language?.toLowerCase() !== selectedLanguageFilter.toLowerCase()
      ) {
        return false;
      }
      if (masteryFilter !== 'ALL') {
        if (m.type !== 'root') return false;
        const rm = rootMasteryMap.get(Number(m.numericId));
        const pct = rm?.mastery_percentage ?? 0;
        if (masteryFilter === 'NEEDS_PRACTICE' && pct >= 100) return false;
        if (masteryFilter === 'UNSTARTED' && pct > 0) return false;
      }
      if (q) {
        const morphMatch = (m.morpheme || '').toLowerCase().includes(q);
        const tokenMatch = (m.cleanToken || '').toLowerCase().includes(q);
        const meanMatch = (m.core_meaning || '').toLowerCase().includes(q);
        const clusterMatch = (m.thematic_cluster || '').toLowerCase().includes(q);
        const tierMatch = (m.sat_tier || '').toLowerCase().includes(q);
        const wordMatch = m.words?.some((w) => w.word?.toLowerCase().includes(q));
        if (!morphMatch && !tokenMatch && !meanMatch && !clusterMatch && !tierMatch && !wordMatch) {
          return false;
        }
      }
      return true;
    });
  }, [
    allMorphemes,
    morphemeTypeFilter,
    selectedLanguageFilter,
    masteryFilter,
    searchTerm,
    rootMasteryMap,
  ]);

  const handleToggleMorpheme = (morphemeId) => {
    const id = String(morphemeId);
    if (selectedMorphemeIds.includes(id)) {
      setSelectedMorphemeIds((prev) => prev.filter((item) => item !== id));
    } else if (selectedMorphemeIds.length < MAX_SELECTED_MORPHEMES) {
      setSelectedMorphemeIds((prev) => [...prev, id]);
    }
  };

  const handleStartPractice = () => {
    if (selectedMorphemeIds.length === 0) return;
    const sessionData = buildMorphemePracticeSession({
      selectedMorphemes: selectedMorphemesObjects,
      selectedMorphemeIds,
      allWords: words,
      allRoots: roots,
      allMorphemes,
      backfillRelated,
      targetCount: SESSION_SIZE,
    });
    if (sessionData.deck.length > 0 && onLaunchSession) {
      onLaunchSession(sessionData);
    }
  };

  const remainingSlots = Math.max(0, SESSION_SIZE - totalEligibleWords);
  const targetCardsInDeck = Math.min(totalEligibleWords, SESSION_SIZE);
  const estimatedCardCount =
    selectedMorphemeIds.length === 0
      ? 0
      : totalEligibleWords >= SESSION_SIZE
      ? SESSION_SIZE
      : backfillRelated
      ? SESSION_SIZE
      : totalEligibleWords;
  const fillPercentage = Math.min(100, Math.round((totalEligibleWords / SESSION_SIZE) * 100));
  const isCapReached = selectedMorphemeIds.length >= MAX_SELECTED_MORPHEMES;

  const backLabel = source === 'study' ? 'Back to Study Deck' : 'Back to Mastery';

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Top Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase transition active:translate-x-[1px] active:translate-y-[1px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel}</span>
        </button>

        <div className="flex items-center space-x-2 font-mono text-[11px]">
          <span className="px-2.5 py-1 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] font-black uppercase">
            Targeted Practice Setup
          </span>
          <span className="px-2.5 py-1 bg-white text-[#62685E] border border-[#111410]/30 font-bold uppercase hidden sm:inline">
            1–{MAX_SELECTED_MORPHEMES} Targets · {SESSION_SIZE}-Card Set
          </span>
        </div>
      </div>

      {/* Section 1: Selected Practice Targets & Fill Meter */}
      <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#111410] pb-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-[#7BB33B] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black font-sans uppercase tracking-tight text-[#111410]">
                Practice Set Targets
              </h1>
              <p className="text-xs font-mono text-[#62685E] mt-0.5">
                Start with your selected root and add up to {MAX_SELECTED_MORPHEMES} targets to fill out your {SESSION_SIZE}-card set.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs shrink-0">
            <span
              className={`px-3 py-1.5 border-2 border-[#111410] font-black uppercase ${
                selectedMorphemeIds.length > 0
                  ? 'bg-[#7BB33B] text-white'
                  : 'bg-[#EFE8DF] text-[#42281D]'
              }`}
            >
              {selectedMorphemeIds.length} / {MAX_SELECTED_MORPHEMES} Targets
            </span>
          </div>
        </div>

        {/* Practice Set Fill Progress Bar */}
        <div className="p-4 bg-[#FAFBF8] border-2 border-[#111410] space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono text-xs">
            <span className="font-black uppercase text-[#111410]">
              Set Capacity: {targetCardsInDeck} / {SESSION_SIZE} target words
              {totalEligibleWords > SESSION_SIZE && (
                <span className="text-[#2F441E] font-bold ml-1.5">
                  ({totalEligibleWords} eligible · balanced 15-card draw)
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold text-[#62685E]">
              {selectedMorphemeIds.length === 0
                ? 'Select at least 1 root below'
                : remainingSlots > 0
                ? `${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} left to fill ${SESSION_SIZE}`
                : 'Full 15-card target set ready'}
            </span>
          </div>

          <div className="w-full h-3 bg-white border border-[#111410] overflow-hidden">
            <div
              className="h-full bg-[#7BB33B] transition-all duration-300"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Selected Target Chips / Cards */}
        {selectedMorphemesObjects.length === 0 ? (
          <div className="p-5 bg-[#FDF2F2] border-2 border-dashed border-[#991B1B]/50 text-center font-mono text-xs text-[#991B1B] font-bold">
            No targets selected yet. Pick a root from the catalog below to start building your practice set.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedMorphemesObjects.map((m) => {
              const rm = m.type === 'root' ? rootMasteryMap.get(Number(m.numericId)) : null;
              const wordCount = m.wordCount || m.words?.length || 0;

              return (
                <div
                  key={m.id}
                  className="p-3.5 bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center flex-wrap gap-1.5 font-mono">
                      <span className="px-1.5 py-0.5 bg-white border border-[#111410] text-xs font-black text-[#111410] uppercase">
                        {m.type === 'root' ? `[${m.morpheme.toUpperCase()}]` : m.title}
                      </span>
                      {m.type === 'root' && (
                        <span className="text-[10px] font-bold uppercase text-[#42281D]">
                          {m.language}
                        </span>
                      )}
                      {rm && (
                        <span className="px-1.5 py-0.5 bg-white/80 border border-[#111410]/40 text-[10px] font-bold text-[#2F441E]">
                          {Math.round(rm.mastery_percentage || 0)}% mastered
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-serif italic text-[#2F441E] truncate">
                      "{m.core_meaning}"
                    </p>
                    <p className="text-[10px] font-mono font-bold text-[#42281D] uppercase">
                      {wordCount} {wordCount === 1 ? 'word' : 'words'}
                      {rm ? ` · ${rm.mastered_words}/${rm.total_words} mastered` : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleMorpheme(m.id)}
                    className="p-1 bg-white hover:bg-[#EFE8DF] border border-[#111410] text-[#111410] shrink-0 transition"
                    title="Remove from targets"
                    aria-label={`Remove ${m.title}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Under-15 Fill Mode Selector */}
        {totalEligibleWords > 0 && totalEligibleWords < SESSION_SIZE && (
          <div className="p-3.5 bg-[#FAFBF8] border-2 border-[#111410] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="text-xs font-mono text-[#42281D]">
              Your selected targets contain <strong>{totalEligibleWords} words</strong>. Choose more targets below, or decide how to handle the remaining <strong>{remainingSlots} slots</strong>:
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
              <button
                type="button"
                onClick={() => setBackfillRelated(false)}
                className={`px-3 py-1.5 border-2 border-[#111410] font-black uppercase transition ${
                  !backfillRelated
                    ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410]'
                    : 'bg-white text-[#111410] hover:bg-[#EFE8DF]'
                }`}
              >
                Targets Only ({totalEligibleWords})
              </button>
              <button
                type="button"
                onClick={() => setBackfillRelated(true)}
                className={`px-3 py-1.5 border-2 border-[#111410] font-black uppercase transition ${
                  backfillRelated
                    ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410]'
                    : 'bg-white text-[#111410] hover:bg-[#EFE8DF]'
                }`}
              >
                Fill to 15 (+{remainingSlots} related)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Choose More Targets Catalog */}
      <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#111410] pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#7BB33B]" />
            <h2 className="text-sm font-mono font-black uppercase text-[#111410]">
              Add More Roots & Morphemes to Your Set
            </h2>
          </div>
          {isCapReached ? (
            <span className="text-[11px] font-mono font-bold text-[#991B1B] uppercase">
              Target limit reached ({MAX_SELECTED_MORPHEMES}/{MAX_SELECTED_MORPHEMES}) — remove one above to swap
            </span>
          ) : (
            <span className="text-[11px] font-mono text-[#62685E] uppercase">
              Click any root below to add it ({MAX_SELECTED_MORPHEMES - selectedMorphemeIds.length} slots open)
            </span>
          )}
        </div>

        {/* Search & Filter Controls */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#62685E]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="SEARCH ROOTS, MEANINGS, DOMAINS, OR WORDS..."
                className="w-full bg-white text-[#111410] font-mono text-xs font-bold pl-8 pr-8 py-2 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] focus:outline-none uppercase placeholder:text-[#A8AAA6]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-[#62685E] hover:text-[#111410]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1 font-mono text-xs">
              {[
                { key: 'ROOT', label: 'ROOTS' },
                { key: 'ALL', label: 'ALL' },
                { key: 'PREFIX', label: 'PREFIXES' },
                { key: 'SUFFIX', label: 'SUFFIXES' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMorphemeTypeFilter(tab.key)}
                  className={`px-2.5 py-2 font-black uppercase border-2 border-[#111410] transition ${
                    morphemeTypeFilter === tab.key
                      ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410]'
                      : 'bg-white text-[#111410] hover:bg-[#FAFBF8]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
            {(morphemeTypeFilter === 'ALL' || morphemeTypeFilter === 'ROOT') && (
              <div className="flex items-center space-x-1.5">
                <span className="font-bold uppercase text-[10px] text-[#62685E]">Origin:</span>
                {['ALL', 'Latin', 'Greek'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLanguageFilter(lang)}
                    className={`px-2 py-0.5 border font-bold uppercase transition ${
                      selectedLanguageFilter.toLowerCase() === lang.toLowerCase()
                        ? 'bg-[#111410] text-white border-[#111410]'
                        : 'bg-white text-[#111410] border-[#111410]/30 hover:border-[#111410]'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-1.5">
              <span className="font-bold uppercase text-[10px] text-[#62685E]">Mastery:</span>
              {[
                { key: 'ALL', label: 'All' },
                { key: 'NEEDS_PRACTICE', label: 'Needs Practice' },
                { key: 'UNSTARTED', label: 'Unstarted' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setMasteryFilter(opt.key)}
                  className={`px-2 py-0.5 border font-bold uppercase transition ${
                    masteryFilter === opt.key
                      ? 'bg-[#42281D] text-white border-[#111410]'
                      : 'bg-white text-[#111410] border-[#111410]/30 hover:border-[#111410]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Morpheme Picker List */}
        <div className="border-2 border-[#111410] bg-white max-h-[380px] overflow-y-auto divide-y divide-[#111410]/15">
          {filteredMorphemes.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#62685E] uppercase">
              No morphemes match your current filters.
            </div>
          ) : (
            filteredMorphemes.map((m) => {
              const isSelected = selectedMorphemeSet.has(m.id);
              const disabled = isCapReached && !isSelected;
              const wordCount = m.wordCount || m.words?.length || 0;
              const rm = m.type === 'root' ? rootMasteryMap.get(Number(m.numericId)) : null;

              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleMorpheme(m.id)}
                  className={`w-full text-left p-3 sm:p-3.5 flex items-center justify-between gap-3 transition ${
                    isSelected
                      ? 'bg-[#EDF5E5] hover:bg-[#E2F0D5]'
                      : disabled
                      ? 'bg-[#FAFBF8] opacity-50 cursor-not-allowed'
                      : 'hover:bg-[#FAFBF8]'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-6 h-6 border-2 border-[#111410] flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#7BB33B] text-white' : 'bg-white text-[#111410]'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="font-mono text-xs font-black uppercase text-[#111410]">
                          {m.type === 'root' ? `[${m.morpheme.toUpperCase()}]` : m.title}
                        </span>
                        {m.type === 'root' ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white text-[#2F441E] border border-[#111410] uppercase font-bold">
                            {m.language}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#EFE8DF] text-[#42281D] border border-[#111410] uppercase font-bold">
                            {m.type}
                          </span>
                        )}
                        {m.thematic_cluster && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white border border-[#111410]/40 uppercase">
                            {m.thematic_cluster}
                          </span>
                        )}
                        {m.sat_tier && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#FFFBEB] text-[#92400E] border border-[#111410]/40 uppercase font-bold">
                            {m.sat_tier}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-serif italic text-[#42281D] truncate mt-0.5">
                        "{m.core_meaning}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 font-mono text-[10px]">
                    {rm && (
                      <span
                        className={`px-2 py-0.5 border border-[#111410] font-bold hidden sm:inline ${
                          (rm.mastery_percentage || 0) >= 100
                            ? 'bg-[#EDF5E5] text-[#2F441E]'
                            : 'bg-[#FAF3DD] text-[#42281D]'
                        }`}
                      >
                        {rm.mastered_words}/{rm.total_words} ({Math.round(rm.mastery_percentage || 0)}%)
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-white border border-[#111410] font-black text-[#111410]">
                      {wordCount} {wordCount === 1 ? 'word' : 'words'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Launch Bar */}
      <div className="bg-[#FAFBF8] border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="font-mono text-xs text-[#111410]">
          {selectedMorphemesObjects.length > 0 ? (
            <div className="space-y-0.5">
              <div className="font-black uppercase text-[#2F441E] flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#7BB33B] shrink-0" />
                <span>
                  Targeting:{' '}
                  {selectedMorphemesObjects
                    .map((m) => (m.type === 'root' ? `[${m.morpheme.toUpperCase()}]` : m.title))
                    .join(' + ')}
                </span>
              </div>
              <div className="text-[11px] text-[#62685E]">
                {totalEligibleWords < SESSION_SIZE && backfillRelated
                  ? `${totalEligibleWords} target words + ${remainingSlots} related fill = ${SESSION_SIZE} cards`
                  : `${estimatedCardCount} cards drawn strictly from your selected targets`}
              </div>
            </div>
          ) : (
            <span className="text-[#991B1B] font-bold uppercase">
              Select at least 1 root or morpheme to start practicing
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 bg-white hover:bg-[#EFE8DF] text-[#111410] font-mono font-black text-xs uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartPractice}
            disabled={selectedMorphemeIds.length === 0 || estimatedCardCount === 0}
            className={`px-6 py-2.5 font-mono font-black text-xs uppercase tracking-wider border-2 border-[#111410] flex items-center justify-center space-x-2 transition ${
              selectedMorphemeIds.length === 0 || estimatedCardCount === 0
                ? 'bg-[#EFE8DF] text-[#A8AAA6] cursor-not-allowed shadow-none'
                : 'bg-[#7BB33B] hover:bg-[#84C341] text-white shadow-[3px_3px_0px_0px_#111410] active:translate-x-[1px] active:translate-y-[1px]'
            }`}
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Start Practice Set ({estimatedCardCount} Cards)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
