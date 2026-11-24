import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Search,
  Shuffle,
} from 'lucide-react';
import HarmonicWheel from './wheel/HarmonicWheel';
import WheelInspectorPanel from './wheel/WheelInspectorPanel';
import CircleMasteryRing from './CircleMasteryRing';
import WordPipTrack from './WordPipTrack';
import {
  DOMAIN_LENSES,
  PATHWAY_CHANGE_EVENT,
  PATHWAY_YIELD,
  buildHarmonicWheelModel,
  getStoredPathway,
  groupRootsByDomainLens,
  setStoredPathway,
} from '../services/pathwayService';

const TIER_FILTERS = [
  { id: 'ALL', label: 'All Tiers' },
  { id: 'TIER_1', label: 'Tier 1' },
  { id: 'TIER_2', label: 'Tier 2' },
  { id: 'TIER_3', label: 'Tier 3' },
];

const MATURITY_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'FOCUS', label: 'Focus (<30%)' },
  { id: 'DEVELOPING', label: 'Developing' },
  { id: 'MASTERED', label: 'Mastered' },
  { id: 'RECENTLY_WORKED', label: 'Recent' },
];

function formatLastWorked(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * DashboardView: Progressive-disclosure circular mastery dashboard.
 *
 * Opens on a calm Harmonic Wheel (max 12 partitions) with dual-axis
 * filtering (Thematic Clusters × Test Relevance Tiers), a sample-size
 * focus slider, and drill-down from clusters -> roots -> word circles.
 */
export default function DashboardView({ stats, onSelectRoot, onNavigateMode }) {
  const [activeLens, setActiveLens] = useState(getStoredPathway);
  const [tierFilter, setTierFilter] = useState('ALL');
  const [maturityFilter, setMaturityFilter] = useState('ALL');

  // Drill-down navigation state
  const [drillDomainId, setDrillDomainId] = useState(null);
  const [drillSubId, setDrillSubId] = useState(null);
  const [overflowPage, setOverflowPage] = useState(0);

  // Sample-size "draw from the core" slider (1..12 or 'ALL')
  const [sampleLimit, setSampleLimit] = useState(5);
  const [sampleOffset, setSampleOffset] = useState(0);

  // Hover & deep root focus
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedRootNode, setSelectedRootNode] = useState(null);

  // Collapsible details drawer (Priority targets, search, audit log)
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (newLens === PATHWAY_YIELD) {
      setTierFilter('ALL');
    }
    setDrillDomainId(null);
    setDrillSubId(null);
    setOverflowPage(0);
    setSelectedRootNode(null);
    setHoveredNode(null);
  };

  const handleTierFilterChange = (nextTier) => {
    setTierFilter(nextTier);
    setDrillSubId(null);
    setOverflowPage(0);
    setSelectedRootNode(null);
  };

  const handleMaturityChange = (nextMat) => {
    setMaturityFilter(nextMat);
    setOverflowPage(0);
    setSelectedRootNode(null);
  };

  const handleBreadcrumbClick = (targetDepth) => {
    if (targetDepth === 0) {
      setDrillDomainId(null);
      setDrillSubId(null);
      setOverflowPage(0);
      setSelectedRootNode(null);
    } else if (targetDepth === 1) {
      setDrillSubId(null);
      setOverflowPage(0);
      setSelectedRootNode(null);
    }
  };

  const handleZoomOut = () => {
    if (selectedRootNode) {
      setSelectedRootNode(null);
      return;
    }
    if (drillSubId) {
      setDrillSubId(null);
      setOverflowPage(0);
      return;
    }
    if (drillDomainId) {
      setDrillDomainId(null);
      setOverflowPage(0);
    }
  };

  const handleSelectNode = (node) => {
    if (!node || node.isEmpty) return;

    if (node.kind === 'DOMAIN') {
      setDrillDomainId(node.domainId);
      setDrillSubId(null);
      setOverflowPage(0);
      setSelectedRootNode(null);
      setHoveredNode(null);
    } else if (node.kind === 'SUB_DOMAIN') {
      setDrillSubId(node.subId);
      setOverflowPage(0);
      setSelectedRootNode(null);
      setHoveredNode(null);
    } else if (node.kind === 'OVERFLOW') {
      setOverflowPage(node.nextPage || 0);
      setSelectedRootNode(null);
    } else if (node.kind === 'ROOT') {
      setSelectedRootNode(node);
    }
  };

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center text-[#111410]">
        <div className="w-9 h-9 mx-auto rounded-full border-2 border-[#7BB33B]/30 border-t-[#7BB33B] animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#62685E]">
          Gathering mastery telemetry...
        </p>
      </div>
    );
  }

  const {
    overall = {},
    sections = {},
    root_mastery = [],
    recommendations = [],
    recent_logs = [],
  } = stats;

  const totalWordsInLexicon =
    root_mastery.reduce((acc, r) => acc + (r.total_words || 0), 0) || 700;
  const totalMasteredWords =
    root_mastery.reduce((acc, r) => acc + (r.mastered_words || 0), 0) ||
    overall.unique_words_reviewed ||
    0;
  const accuracyPct =
    overall.accuracy_percentage || sections.vocab?.accuracy_percentage || 0;

  const wheelModel = useMemo(
    () =>
      buildHarmonicWheelModel(root_mastery, {
        primaryLens: activeLens,
        tierFilter,
        maturityFilter,
        drillDomainId,
        drillSubId,
        sampleLimit,
        sampleOffset,
        overflowPage,
      }),
    [
      root_mastery,
      activeLens,
      tierFilter,
      maturityFilter,
      drillDomainId,
      drillSubId,
      sampleLimit,
      sampleOffset,
      overflowPage,
    ]
  );

  // Filtered list for optional collapsible details drawer
  const drawerGroups = useMemo(() => {
    if (!showDetailsDrawer) return [];
    return groupRootsByDomainLens(root_mastery, activeLens, {
      maturityFilter,
      searchQuery,
    }).filter((g) => g.roots.length > 0);
  }, [showDetailsDrawer, root_mastery, activeLens, maturityFilter, searchQuery]);

  const sliderNumericValue = sampleLimit === 'ALL' ? 12 : sampleLimit;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* 1. Calm Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111410] tracking-tight">
            Progress Constellation
          </h1>
          <p className="text-xs sm:text-sm text-[#62685E] mt-1">
            {totalMasteredWords} of {totalWordsInLexicon} words mastered · {accuracyPct}% accuracy
          </p>
        </div>

        {onNavigateMode && (
          <button
            type="button"
            onClick={() => onNavigateMode('vocab')}
            className="inline-flex items-center gap-2 self-start sm:self-auto px-5 py-2.5 rounded-xl bg-[#7BB33B] hover:bg-[#84C341] text-white text-xs font-semibold shadow-soft-sm transition"
          >
            <span>Practice Now</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Lens & Filter Bar (Compact, Dual-Axis) */}
      <div className="bg-white/90 border border-[#111410]/15 rounded-2xl shadow-soft-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Primary Clustering Axis */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#62685E] mr-1">
              Group by:
            </span>
            {DOMAIN_LENSES.map((lens) => {
              const isActive = activeLens === lens.id;
              return (
                <button
                  key={lens.id}
                  type="button"
                  onClick={() => handleLensChange(lens.id)}
                  title={lens.description}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#111410] text-white shadow-soft-xs'
                      : 'bg-[#FAFBF8] hover:bg-[#EDF5E5] text-[#111410] border border-[#111410]/10'
                  }`}
                >
                  <span>{lens.icon}</span>
                  <span>{lens.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Orthogonal Test Relevance Filter */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#62685E] mr-1">
              Relevance:
            </span>
            {TIER_FILTERS.map((tf) => {
              const isActive = tierFilter === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => handleTierFilterChange(tf.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B] font-semibold'
                      : 'bg-[#FAFBF8] text-[#62685E] hover:text-[#111410] border border-[#111410]/10'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Draw-Into-Focus Slider + Maturity Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-[#111410]/10">
          {/* Sample Size Slider */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2.5 text-xs text-[#62685E]">
              <span className="font-medium text-[#111410] whitespace-nowrap">
                Roots per cluster:
              </span>
              <input
                type="range"
                min="1"
                max="12"
                value={sliderNumericValue}
                onChange={(e) => setSampleLimit(Number(e.target.value))}
                className="w-28 sm:w-36 accent-[#7BB33B] cursor-pointer"
                aria-label="Filter how many roots to draw per cluster"
              />
              <span className="font-mono font-bold text-[#111410] tabular-nums min-w-[54px]">
                {sampleLimit === 'ALL' ? 'All' : `${sampleLimit} max`}
              </span>
            </label>

            <button
              type="button"
              onClick={() => setSampleLimit(sampleLimit === 'ALL' ? 5 : 'ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                sampleLimit === 'ALL'
                  ? 'bg-[#7BB33B] text-white border-[#7BB33B]'
                  : 'bg-[#FAFBF8] text-[#111410] border-[#111410]/15 hover:border-[#7BB33B]'
              }`}
            >
              {sampleLimit === 'ALL' ? 'Showing Whole Set' : 'Take Whole Set'}
            </button>

            {sampleLimit !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSampleOffset((prev) => prev + Math.max(1, sampleLimit))}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FAFBF8] hover:bg-[#EDF5E5] text-[#2F441E] border border-[#111410]/15 transition"
                title="Draw a different sample of roots from the latent core"
              >
                <Shuffle className="w-3 h-3" />
                <span>Drift</span>
              </button>
            )}
          </div>

          {/* Maturity Filter Pills */}
          <div className="flex items-center flex-wrap gap-1">
            {MATURITY_FILTERS.map((mf) => {
              const isActive = maturityFilter === mf.id;
              return (
                <button
                  key={mf.id}
                  type="button"
                  onClick={() => handleMaturityChange(mf.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                    isActive
                      ? 'bg-[#111410]/10 text-[#111410] font-semibold'
                      : 'text-[#62685E] hover:text-[#111410]'
                  }`}
                >
                  {mf.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Harmonic Stage: Wheel + Progressive Inspector */}
      <div className="bg-white/80 border border-[#111410]/15 rounded-3xl shadow-soft-md p-5 sm:p-8 space-y-4">
        {/* Breadcrumb Trail */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <nav aria-label="Wheel depth" className="flex items-center gap-1.5 text-xs text-[#62685E]">
            {wheelModel.breadcrumbs.map((crumb, idx) => {
              const isLast = idx === wheelModel.breadcrumbs.length - 1;
              return (
                <React.Fragment key={`${crumb.depth}-${crumb.label}`}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleBreadcrumbClick(crumb.depth)}
                    className={`transition ${
                      isLast
                        ? 'font-semibold text-[#111410] cursor-default'
                        : 'hover:text-[#2F441E] hover:underline'
                    }`}
                  >
                    {crumb.label}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {wheelModel.hasOverflow && (
            <span className="text-xs font-mono text-[#62685E]">
              Ring {wheelModel.currentPage + 1} of {wheelModel.totalPages} (max 12 orbs)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Harmonic Orbs Wheel */}
          <div className="lg:col-span-6">
            <HarmonicWheel
              model={wheelModel}
              selectedNodeId={selectedRootNode?.id}
              hoveredNodeId={hoveredNode?.id}
              onHoverNode={setHoveredNode}
              onSelectNode={handleSelectNode}
              onZoomOut={handleZoomOut}
            />
          </div>

          {/* Right: Contextual Inspector Panel */}
          <div className="lg:col-span-6">
            <WheelInspectorPanel
              model={wheelModel}
              hoveredNode={hoveredNode}
              selectedRootNode={selectedRootNode}
              onClearSelectedRoot={() => setSelectedRootNode(null)}
              onSelectNode={handleSelectNode}
              onSelectRootForPractice={onSelectRoot}
            />
          </div>
        </div>
      </div>

      {/* 4. Collapsible Deep Details Drawer (Collapsed by default so start stays calm) */}
      <div className="bg-white/90 border border-[#111410]/15 rounded-2xl shadow-soft-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDetailsDrawer((prev) => !prev)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#FAFBF8] transition"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-[#111410]">
              Priority Targets, Search & Study Telemetry
            </span>
            <span className="text-xs text-[#62685E]">
              ({recommendations.length} targets · {recent_logs.length} recent logs)
            </span>
          </div>
          {showDetailsDrawer ? (
            <ChevronUp className="w-4 h-4 text-[#62685E]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#62685E]" />
          )}
        </button>

        {showDetailsDrawer && (
          <div className="p-5 sm:p-6 border-t border-[#111410]/10 space-y-6 bg-[#FAFBF8]/60">
            {/* Priority Targets */}
            {recommendations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#62685E]">
                  Priority Practice Targets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendations.map((root) => (
                    <div
                      key={root.id}
                      className="p-4 bg-white rounded-xl border border-[#111410]/15 shadow-soft-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <span className="font-bold text-[#111410]">
                              [{root.morpheme.toUpperCase()}]
                            </span>
                            <span className="text-[11px] text-[#62685E]">
                              {root.language}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-[#111410] mt-0.5">
                            “{root.core_meaning}”
                          </div>
                        </div>
                        <CircleMasteryRing
                          percentage={root.mastery_percentage || 0}
                          size={38}
                          strokeWidth={3.5}
                          borderOutline={false}
                        >
                          <span className="text-[10px] font-mono font-bold">
                            {Math.round(root.mastery_percentage || 0)}%
                          </span>
                        </CircleMasteryRing>
                      </div>

                      <WordPipTrack words={root.words || []} size="sm" showCounter={true} />

                      <button
                        type="button"
                        onClick={() => onSelectRoot && onSelectRoot(root.id)}
                        className="w-full py-1.5 rounded-lg bg-[#FAFBF8] hover:bg-[#7BB33B] hover:text-white text-[#111410] border border-[#111410]/15 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <span>Target in Practice Set</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Search Across All Roots */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#62685E]">
                  All Roots Directory
                </h3>
                <div className="relative sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search roots or words..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#111410]/15 rounded-lg text-xs text-[#111410] placeholder:text-[#62685E]/70 focus:outline-none focus:border-[#7BB33B]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#62685E] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                {drawerGroups.flatMap((group) =>
                  group.roots.map((root) => (
                    <div
                      key={root.id}
                      className="p-3.5 bg-white rounded-xl border border-[#111410]/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-[#2F441E]">
                            [{root.morpheme.toUpperCase()}]
                          </span>
                          <span className="text-[11px] text-[#62685E] truncate">
                            “{root.core_meaning}”
                          </span>
                        </div>
                        <div className="text-[11px] text-[#62685E] mt-0.5 flex items-center gap-2">
                          <span>{Math.round(root.mastery_percentage || 0)}%</span>
                          {root.last_worked_at && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatLastWorked(root.last_worked_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectRoot && onSelectRoot(root.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#EDF5E5] hover:bg-[#7BB33B] hover:text-white text-[#2F441E] text-xs font-semibold shrink-0 transition"
                      >
                        Practice
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Telemetry Audit Log */}
            {recent_logs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#62685E]">
                  Recent Study Telemetry
                </h3>
                <div className="bg-white rounded-xl border border-[#111410]/10 divide-y divide-[#111410]/10">
                  {recent_logs.slice(0, 8).map((log) => {
                    const isWord = log.item_type === 'WORD';
                    const title = isWord
                      ? log.word_details?.word || 'Word'
                      : `${log.question_details?.section || 'Question'} — ${
                          log.question_details?.prompt?.slice(0, 48) || ''
                        }`;

                    return (
                      <div
                        key={log.id}
                        className="px-4 py-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              log.is_correct
                                ? 'bg-[#7BB33B] text-white'
                                : 'border border-[#111410]/30 bg-white'
                            }`}
                          >
                            {log.is_correct && <CheckCircle2 className="w-3 h-3" />}
                          </span>
                          <span className="font-medium text-[#111410] truncate">
                            {title}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#62685E] shrink-0 ml-2">
                          {log.seconds_spent}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
