import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FilterX,
  Target
} from 'lucide-react';
import MasteryDial from './MasteryDial';
import DomainFilterBar from './DomainFilterBar';
import DomainRibbon from './DomainRibbon';
import CircleMasteryRing from './CircleMasteryRing';
import WordPipTrack from './WordPipTrack';
import {
  getStoredPathway,
  setStoredPathway,
  PATHWAY_CHANGE_EVENT,
  PATHWAY_THEMATIC,
  groupRootsByDomainLens,
} from '../services/pathwayService';

/**
 * DashboardView: Revamped student expertise dashboard featuring the circular
 * mastery motif (outlined ○ to filled ● circles) and multi-dimensional domain filters.
 */
export default function DashboardView({ stats, onSelectRoot, onNavigateMode }) {
  // Domain Taxonomy Lens ('thematic' | 'yield' | 'origin' | 'academic')
  const [activeLens, setActiveLens] = useState(getStoredPathway);

  // Secondary Filters
  const [selectedDomainId, setSelectedDomainId] = useState('ALL');
  const [maturityFilter, setMaturityFilter] = useState('ALL'); // 'ALL' | 'MASTERED' | 'DEVELOPING' | 'FOCUS'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('DEFAULT');

  // Synchronize active pathway across tabs and components
  useEffect(() => {
    const handlePathwayEvent = (e) => {
      const next = e.detail?.pathway || getStoredPathway();
      setActiveLens(next);
    };
    window.addEventListener(PATHWAY_CHANGE_EVENT, handlePathwayEvent);
    return () => window.removeEventListener(PATHWAY_CHANGE_EVENT, handlePathwayEvent);
  }, []);

  const handleLensChange = (newLens) => {
    setActiveLens(newLens);
    setStoredPathway(newLens);
    setSelectedDomainId('ALL'); // Reset isolated domain on lens switch
  };

  const handleResetFilters = () => {
    setSelectedDomainId('ALL');
    setMaturityFilter('ALL');
    setSearchQuery('');
    setSortBy('DEFAULT');
  };

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-[#111410] font-mono">
        <div className="w-10 h-10 mx-auto border-4 border-[#111410] border-t-[#7BB33B] animate-spin mb-4" />
        <p className="uppercase text-xs font-bold tracking-wider">
          SYNCHRONIZING STUDENT MASTERY TELEMETRY...
        </p>
      </div>
    );
  }

  const { overall = {}, sections = {}, root_mastery = [], recommendations = [], recent_logs = [] } = stats;

  // Compute all domain groups for the active lens
  const allDomainGroups = useMemo(() => {
    return groupRootsByDomainLens(root_mastery, activeLens, {
      maturityFilter,
      searchQuery,
      sortBy,
    });
  }, [root_mastery, activeLens, maturityFilter, searchQuery, sortBy]);

  // Filter by selected domain if user clicked a specific domain in the ribbon
  const visibleGroups = useMemo(() => {
    if (selectedDomainId === 'ALL') return allDomainGroups;
    return allDomainGroups.filter((g) => g.id === selectedDomainId);
  }, [allDomainGroups, selectedDomainId]);

  const totalVisibleRoots = visibleGroups.reduce((acc, g) => acc + g.roots.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Hero Mastery Dial & Global Performance Banner */}
      <MasteryDial
        stats={stats}
        onStartSession={() => onNavigateMode && onNavigateMode('vocab')}
      />

      {/* 2. Targeted Practice Recommendations (Low-Mastery Focus Areas) */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#111410] pb-3 font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-[#42281D]" />
              <h2 className="text-xs font-black uppercase text-[#111410] tracking-wider">
                Priority Practice Targets (Highest Leverage)
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#62685E] uppercase">
              Identified roots with uncompleted word circles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((root) => {
              const rootWords = root.words || [];
              const isFull = root.mastered_words === root.total_words && root.total_words > 0;

              return (
                <div
                  key={root.id}
                  className="p-5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] flex flex-col justify-between space-y-4 group hover:translate-x-[-1px] hover:translate-y-[-1px] transition"
                >
                  <div>
                    {/* Header: Morpheme & Radial Meter */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center space-x-1.5 font-mono mb-1">
                          <span className="text-[#111410] font-black uppercase text-sm">
                            [{root.morpheme}]
                          </span>
                          <span className="px-1.5 py-0.2 bg-[#EFE8DF] text-[#42281D] border border-[#111410] text-[9px] font-bold uppercase">
                            {root.language}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-[#111410] font-sans">
                          "{root.core_meaning}"
                        </h4>
                      </div>

                      {/* Circular Gauge */}
                      <CircleMasteryRing
                        percentage={root.mastery_percentage || 0}
                        size={42}
                        strokeWidth={4}
                      >
                        <span className="text-[9px] font-mono font-black">
                          {Math.round(root.mastery_percentage || 0)}%
                        </span>
                      </CircleMasteryRing>
                    </div>

                    <p className="text-xs text-[#62685E] italic font-serif line-clamp-1 mt-1">
                      {root.mnemonic || 'Focus on etymology breakdown'}
                    </p>

                    {/* Word Pip Track */}
                    <div className="mt-4 pt-3 border-t border-[#111410]/15">
                      <WordPipTrack words={rootWords} size="sm" showCounter={true} />
                    </div>
                  </div>

                  {/* Practice Action */}
                  <button
                    onClick={() => onSelectRoot && onSelectRoot(root.id)}
                    className="w-full py-2 bg-white hover:bg-[#7BB33B] hover:text-white text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono font-black text-xs uppercase flex items-center justify-center space-x-1.5 transition active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    <span>Target in Practice Set</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Multi-Dimensional Domain Filter Bar */}
      <DomainFilterBar
        activeLens={activeLens}
        onLensChange={handleLensChange}
        maturityFilter={maturityFilter}
        onMaturityFilterChange={setMaturityFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* 4. Domain Mastery Ribbon (Quick-filter across all categories in active lens) */}
      <DomainRibbon
        domains={allDomainGroups}
        selectedDomainId={selectedDomainId}
        onSelectDomain={setSelectedDomainId}
      />

      {/* 5. Domain Mastery Matrix Grid */}
      <div className="space-y-10">
        {totalVisibleRoots === 0 ? (
          <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-12 text-center space-y-4 font-mono">
            <FilterX className="w-10 h-10 text-[#62685E] mx-auto stroke-1" />
            <h3 className="text-base font-black uppercase text-[#111410]">
              No Root Families Match Filter Criteria
            </h3>
            <p className="text-xs text-[#62685E] max-w-md mx-auto uppercase">
              No morphemes found matching the current search query or expertise maturity filter.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#7BB33B] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-black uppercase hover:bg-[#84C341] transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          visibleGroups.map((group) => {
            if (group.roots.length === 0) return null;

            return (
              <div key={group.id} className="space-y-4">
                {/* Domain Header Banner with Circular Meter */}
                <div className="bg-[#FAFBF8] border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <CircleMasteryRing
                      percentage={group.masteryPercentage}
                      size={48}
                      strokeWidth={4.5}
                      strokeColor={group.accentColor || '#7BB33B'}
                    >
                      <span className="text-[10px] font-mono font-black">
                        {group.masteryPercentage}%
                      </span>
                    </CircleMasteryRing>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{group.icon}</span>
                        <h3 className="text-sm sm:text-base font-black text-[#111410] font-mono uppercase tracking-wide">
                          {group.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-white border border-[#111410] text-[10px] font-mono font-black text-[#42281D]">
                          {group.roots.length} {group.roots.length === 1 ? 'ROOT' : 'ROOTS'}
                        </span>
                      </div>
                      <p className="text-xs text-[#62685E] font-sans mt-0.5 max-w-2xl">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 font-mono text-xs border-t sm:border-t-0 border-[#111410]/15 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-[#62685E] uppercase font-bold">Domain Expertise</div>
                      <div className="font-black text-[#2F441E]">
                        {group.masteredWords}/{group.totalWords} Words Mastered
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid of Root Mastery Cards for this Domain */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.roots.map((root) => {
                    const isFullMastery =
                      root.mastered_words === root.total_words && root.total_words > 0;
                    const rootWords = root.words || [];

                    return (
                      <div
                        key={root.id}
                        className="bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] p-5 flex flex-col justify-between space-y-4 hover:translate-x-[-1px] hover:translate-y-[-1px] transition"
                      >
                        <div className="space-y-3">
                          {/* Card Header: Morpheme & Circular Mastery Ring */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center space-x-2 mb-1.5 font-mono">
                                <span className="px-2 py-0.5 text-xs font-black bg-[#EDF5E5] text-[#2F441E] border border-[#111410]">
                                  [{root.morpheme.toUpperCase()}]
                                </span>
                                <span className="text-[10px] font-bold text-[#42281D] uppercase">
                                  {root.language}
                                </span>
                              </div>
                              <h4 className="text-base font-black text-[#111410] font-sans uppercase">
                                "{root.core_meaning}"
                              </h4>
                            </div>

                            {/* Circular Progress Ring */}
                            <CircleMasteryRing
                              percentage={root.mastery_percentage || 0}
                              size={46}
                              strokeWidth={4.5}
                              title={`Mastery: ${root.mastery_percentage || 0}%`}
                            >
                              <span className="text-[9px] font-mono font-black text-[#111410]">
                                {Math.round(root.mastery_percentage || 0)}%
                              </span>
                            </CircleMasteryRing>
                          </div>

                          {/* Mnemonic Hint */}
                          <p className="text-xs text-[#62685E] italic font-serif leading-relaxed line-clamp-2">
                            "{root.mnemonic || 'Focus on prefix and root composition'}"
                          </p>

                          {/* Secondary Domain & Tier Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {root.thematic_cluster && (
                              <span className="px-2 py-0.5 bg-[#FAFBF8] text-[#2F441E] border border-[#111410] text-[9px] font-mono font-bold uppercase flex items-center space-x-1">
                                <span>🧠</span>
                                <span>{root.thematic_cluster}</span>
                              </span>
                            )}
                            {root.sat_tier && (
                              <span className="px-2 py-0.5 bg-[#FAF3DD] text-[#42281D] border border-[#111410] text-[9px] font-mono font-bold uppercase flex items-center space-x-1">
                                <span>⚡</span>
                                <span>{root.sat_tier}</span>
                              </span>
                            )}
                          </div>

                          {/* Circular Word Pips Track (The Outlined-to-Filled Motif) */}
                          <div className="pt-3 border-t border-[#111410]/15">
                            <WordPipTrack
                              words={rootWords}
                              size="md"
                              showCounter={true}
                              showLabels={false}
                            />
                          </div>
                        </div>

                        {/* Bottom Action: Practice Root */}
                        <div className="pt-3 border-t border-[#111410]/15">
                          <button
                            onClick={() => onSelectRoot && onSelectRoot(root.id)}
                            className="w-full py-2 bg-[#FAFBF8] hover:bg-[#7BB33B] hover:text-white text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono font-black uppercase flex items-center justify-center space-x-1.5 transition active:translate-x-[1px] active:translate-y-[1px]"
                          >
                            <span>Target in Practice Set</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Recent Telemetry Audit Log */}
      {recent_logs && recent_logs.length > 0 && (
        <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#111410] pb-3 font-mono">
            <h3 className="text-xs font-black uppercase text-[#111410] tracking-wider">
              Recent Practice Telemetry Audit
            </h3>
            <span className="text-[10px] font-bold text-[#62685E] uppercase">
              Real-time Spaced Repetition Logs
            </span>
          </div>

          <div className="divide-y-2 divide-[#111410]/15">
            {recent_logs.map((log) => {
              const isWord = log.item_type === 'WORD';
              const title = isWord
                ? `VOCABULARY: ${log.word_details?.word?.toUpperCase() || 'WORD'}`
                : `QUESTION: ${log.question_details?.section} — ${log.question_details?.prompt?.slice(0, 50)}...`;

              return (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-6 h-6 rounded-full border-2 border-[#111410] flex items-center justify-center shrink-0 ${
                        log.is_correct ? 'bg-[#7BB33B] text-white' : 'bg-white text-[#42281D]'
                      }`}
                    >
                      {log.is_correct ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#42281D]" />
                      )}
                    </span>
                    <div>
                      <span className="font-bold text-[#111410]">{title}</span>
                      <div className="text-[10px] text-[#62685E] mt-0.5 uppercase">
                        {log.seconds_spent}S ELAPSED · {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 font-bold uppercase text-[10px] border border-[#111410] ${
                      log.is_correct
                        ? 'bg-[#EDF5E5] text-[#2F441E]'
                        : 'bg-[#FAF3DD] text-[#42281D]'
                    }`}
                  >
                    {log.is_correct ? '● MASTERED' : '○ REVIEW NEEDED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
