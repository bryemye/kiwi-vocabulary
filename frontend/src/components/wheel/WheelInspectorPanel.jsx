import React from 'react';
import { ArrowRight, ChevronRight, Sparkles, X } from 'lucide-react';
import WordPipTrack from '../WordPipTrack';

/**
 * WheelInspectorPanel: Quiet contextual side panel for the Harmonic Wheel.
 * Displays only the currently hovered/selected orb or current wheel scope,
 * progressively revealing WordPipTrack and practice actions at Root depth.
 */
export default function WheelInspectorPanel({
  model,
  hoveredNode,
  selectedRootNode,
  onClearSelectedRoot,
  onSelectNode,
  onSelectRootForPractice,
}) {
  // 1. Deepest focus: a specific Root orb is selected
  if (selectedRootNode && selectedRootNode.root) {
    const root = selectedRootNode.root;
    const words = root.words || [];
    const pct = Math.round(root.mastery_percentage || 0);

    return (
      <div className="bg-white/95 border border-[#111410]/15 rounded-2xl shadow-soft-md p-6 space-y-5 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B]/40 text-xs font-mono font-bold">
                [{(root.morpheme || '').toUpperCase()}]
              </span>
              {root.sat_tier && (
                <span className="text-xs text-[#62685E] font-medium">
                  {root.sat_tier}
                </span>
              )}
              <span className="text-xs text-[#62685E]">
                · {root.language}
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#111410]">
              “{root.core_meaning}”
            </h3>
          </div>

          <button
            type="button"
            onClick={onClearSelectedRoot}
            className="p-1.5 rounded-full hover:bg-[#FAFBF8] text-[#62685E] hover:text-[#111410] transition"
            aria-label="Close root focus"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {root.mnemonic && (
          <p className="text-sm text-[#62685E] italic font-serif leading-relaxed bg-[#FAFBF8] rounded-xl p-3.5 border border-[#111410]/10">
            “{root.mnemonic}”
          </p>
        )}

        {/* Word Mastery Pips */}
        <div className="pt-1">
          <WordPipTrack
            words={words}
            size="md"
            showCounter={true}
            showLabels={true}
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#111410]/10">
          <span className="text-xs font-mono text-[#62685E]">
            {pct}% mastered ({root.mastered_words || 0}/{root.total_words || 0} words)
          </span>
          <button
            type="button"
            onClick={() => onSelectRootForPractice && onSelectRootForPractice(root.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7BB33B] hover:bg-[#84C341] text-white text-xs font-semibold shadow-soft-sm transition"
          >
            <span>Target in Practice Set</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Previewing a hovered Domain / Tier / Root / Overflow orb
  const focusNode = hoveredNode;
  if (focusNode) {
    return (
      <div className="bg-white/95 border border-[#111410]/15 rounded-2xl shadow-soft-md p-6 space-y-4 transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#62685E]">
            {focusNode.kind === 'ROOT'
              ? 'Root Preview'
              : focusNode.kind === 'OVERFLOW'
                ? 'Next Set'
                : 'Cluster Focus'}
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
            style={{
              backgroundColor: '#EDF5E5',
              color: '#2F441E',
            }}
          >
            {focusNode.percentage}% mastered
          </span>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#111410] flex items-center gap-2">
            {focusNode.icon && <span>{focusNode.icon}</span>}
            <span>{focusNode.label}</span>
          </h3>
          {focusNode.subtitle && (
            <p className="text-sm text-[#62685E] mt-1 leading-relaxed">
              {focusNode.subtitle}
            </p>
          )}
          {focusNode.matchedWords && focusNode.matchedWords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-[#62685E]">Matched words:</span>
              {focusNode.matchedWords.slice(0, 4).map((mw) => (
                <span
                  key={mw}
                  className="px-2 py-0.5 rounded-full bg-[#EDF5E5] text-[#2F441E] text-[11px] font-medium"
                >
                  {mw}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl bg-[#FAFBF8] border border-[#111410]/10 p-3">
            <div className="text-[11px] text-[#62685E] uppercase">Words Mastered</div>
            <div className="text-base font-mono font-bold text-[#111410] mt-0.5">
              {focusNode.masteredWords || 0} / {focusNode.totalWords || 0}
            </div>
          </div>
          {focusNode.kind !== 'ROOT' ? (
            <div className="rounded-xl bg-[#FAFBF8] border border-[#111410]/10 p-3">
              <div className="text-[11px] text-[#62685E] uppercase">Roots Drawn</div>
              <div className="text-base font-mono font-bold text-[#111410] mt-0.5">
                {focusNode.activeRootsCount || focusNode.totalRoots || 0}
                {focusNode.totalRootsCount > focusNode.activeRootsCount
                  ? ` of ${focusNode.totalRootsCount}`
                  : ''}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[#FAFBF8] border border-[#111410]/10 p-3">
              <div className="text-[11px] text-[#62685E] uppercase">Relevance</div>
              <div className="text-sm font-medium text-[#111410] mt-0.5 truncate">
                {focusNode.tier || 'Core'}
              </div>
            </div>
          )}
        </div>

        {!focusNode.isEmpty && (
          <p className="text-xs text-[#2F441E] flex items-center gap-1.5 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-[#7BB33B]" />
            <span>
              {focusNode.kind === 'ROOT'
                ? 'Click this orb to inspect its words and launch practice.'
                : focusNode.kind === 'OVERFLOW'
                  ? 'Click to cycle to the next roots in this cluster.'
                  : 'Click this orb to step inside.'}
            </span>
          </p>
        )}
      </div>
    );
  }

  // 3. Default calm overview of the current wheel ring (<= 12 compact clickable items)
  const nodes = model?.nodes || [];

  return (
    <div className="bg-white/95 border border-[#111410]/15 rounded-2xl shadow-soft-md p-6 space-y-4">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-[#62685E]">
          {model?.depth === 0 ? 'Overview' : `Level ${model?.depth || 1} Focus`}
        </div>
        <h3 className="text-lg font-bold text-[#111410] mt-0.5">
          {model?.title || 'Lexicon Constellation'}
        </h3>
        <p className="text-xs text-[#62685E] mt-1">
          {model?.subtitle}
        </p>
      </div>

      {/* Clean list of the current <= 12 orbs */}
      <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
        {nodes.length === 0 ? (
          <div className="text-xs text-[#62685E] py-6 text-center bg-[#FAFBF8] rounded-xl border border-[#111410]/10">
            No roots match the active filters. Try widening the tier or status filter.
          </div>
        ) : (
          nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              disabled={node.isEmpty}
              onClick={() => onSelectNode && onSelectNode(node)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition ${
                node.isEmpty
                  ? 'border-[#111410]/10 bg-[#FAFBF8]/60 opacity-50 cursor-default'
                  : 'border-[#111410]/10 bg-[#FAFBF8] hover:bg-[#EDF5E5]/60 hover:border-[#7BB33B]/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: node.accentColor || '#7BB33B' }}
                />
                <span className="text-xs font-semibold text-[#111410] truncate">
                  {node.icon ? `${node.icon} ` : ''}
                  {node.label}
                </span>
                {node.kind === 'ROOT' && node.matchedWords && node.matchedWords.length > 0 ? (
                  <span className="text-[11px] text-[#2F441E] bg-[#EDF5E5] px-2 py-0.5 rounded-full truncate">
                    {node.matchedWords[0]}
                    {node.matchedWords.length > 1 ? ` +${node.matchedWords.length - 1}` : ''}
                  </span>
                ) : (
                  node.kind === 'ROOT' &&
                  node.subtitle && (
                    <span className="text-xs text-[#62685E] truncate hidden sm:inline">
                      “{node.subtitle}”
                    </span>
                  )
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs font-mono font-semibold text-[#2F441E]">
                  {node.percentage}%
                </span>
                {!node.isEmpty && <ChevronRight className="w-3.5 h-3.5 text-[#62685E]" />}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
