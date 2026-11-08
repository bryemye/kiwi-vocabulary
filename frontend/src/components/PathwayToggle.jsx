import React from 'react';
import { PATHWAYS, PATHWAY_THEMATIC, PATHWAY_YIELD } from '../services/pathwayService';

/**
 * PathwayToggle - Clean, minimal neo-brutalist segmented control
 * Allows students to toggle between:
 * - 🧠 "Thematic Pathways" (Semantic Clusters)
 * - ⚡ "Core Yield" (SAT/ACT 80/20 Frequency Tiers)
 */
export default function PathwayToggle({
  currentPathway = PATHWAY_THEMATIC,
  onPathwayChange,
  compact = false,
  className = '',
}) {
  const isThematic = currentPathway === PATHWAY_THEMATIC;
  const isYield = currentPathway === PATHWAY_YIELD;

  const handleSelect = (pathway) => {
    if (pathway === currentPathway) return;
    if (onPathwayChange) {
      onPathwayChange(pathway);
    }
  };

  return (
    <div
      className={`inline-flex items-center bg-[#FAFBF8] border-2 border-[#111410] p-1 shadow-[2px_2px_0px_0px_#111410] ${className}`}
      role="radiogroup"
      aria-label="Learning Mode Pathway Toggle"
    >
      {/* Label Indicator */}
      <span className="text-[10px] font-mono font-black uppercase text-[#62685E] px-2 hidden lg:inline">
        MODE:
      </span>

      {/* Thematic Pathways Option */}
      <button
        type="button"
        role="radio"
        aria-checked={isThematic}
        onClick={() => handleSelect(PATHWAY_THEMATIC)}
        className={`flex items-center space-x-1.5 px-2.5 py-1 font-mono text-xs font-black uppercase tracking-tight transition-all border ${
          isThematic
            ? 'bg-[#7BB33B] text-white border-[#111410] shadow-[1px_1px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]'
            : 'bg-transparent text-[#111410] border-transparent hover:bg-white/80'
        }`}
        title="Group roots into semantic narrative clusters (Movement, Communication, Cognition, Emotion, etc.)"
      >
        <span className="text-sm select-none">🧠</span>
        <span className={compact ? 'text-[11px]' : 'text-xs'}>Thematic</span>
        {!compact && (
          <span className="hidden md:inline font-normal text-[10px] opacity-90 lowercase">
            pathways
          </span>
        )}
      </button>

      {/* Core Yield Option */}
      <button
        type="button"
        role="radio"
        aria-checked={isYield}
        onClick={() => handleSelect(PATHWAY_YIELD)}
        className={`flex items-center space-x-1.5 px-2.5 py-1 font-mono text-xs font-black uppercase tracking-tight transition-all border ${
          isYield
            ? 'bg-[#111410] text-[#FAFBF8] border-[#111410] shadow-[1px_1px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]'
            : 'bg-transparent text-[#111410] border-transparent hover:bg-white/80'
        }`}
        title="Organize roots by 80/20 SAT/ACT test frequency tiers (Tier 1 High-Yield, Tier 2 Multipliers, Tier 3 Advanced)"
      >
        <span className="text-sm select-none">⚡</span>
        <span className={compact ? 'text-[11px]' : 'text-xs'}>Core Yield</span>
        {!compact && (
          <span className="hidden md:inline font-mono text-[9px] px-1 bg-[#F59E0B] text-black font-black uppercase">
            80/20
          </span>
        )}
      </button>
    </div>
  );
}
