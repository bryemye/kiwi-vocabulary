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
      className={`inline-flex items-center bg-stone-100/90 border border-stone-200/80 rounded-xl p-1 shadow-soft-xs ${className}`}
      role="radiogroup"
      aria-label="Learning Mode Pathway Toggle"
    >
      {/* Label Indicator */}
      <span className="text-[10px] font-mono font-bold uppercase text-stone-500 px-2 hidden lg:inline">
        Mode:
      </span>

      {/* Thematic Pathways Option */}
      <button
        type="button"
        role="radio"
        aria-checked={isThematic}
        onClick={() => handleSelect(PATHWAY_THEMATIC)}
        className={`flex items-center space-x-1.5 px-3 py-1 font-sans text-xs transition-all rounded-lg ${
          isThematic
            ? 'bg-white text-[#2F441E] font-bold shadow-soft-xs border border-stone-200/60'
            : 'bg-transparent text-stone-600 hover:text-stone-900 font-medium'
        }`}
        title="Group roots into semantic narrative clusters (Motion & Travel, Force & Transformation, Position & Holding, Senses & Perception, Cognition, etc.)"
      >
        <span className="text-xs select-none">🧠</span>
        <span className={compact ? 'text-[11px]' : 'text-xs'}>Thematic</span>
        {!compact && (
          <span className="hidden md:inline font-normal text-[10px] opacity-80 lowercase">
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
        className={`flex items-center space-x-1.5 px-3 py-1 font-sans text-xs transition-all rounded-lg ${
          isYield
            ? 'bg-white text-[#42281D] font-bold shadow-soft-xs border border-stone-200/60'
            : 'bg-transparent text-stone-600 hover:text-stone-900 font-medium'
        }`}
        title="Organize roots by 80/20 SAT/ACT test frequency tiers (Tier 1 High-Yield, Tier 2 Multipliers, Tier 3 Advanced)"
      >
        <span className="text-xs select-none">⚡</span>
        <span className={compact ? 'text-[11px]' : 'text-xs'}>Core Yield</span>
        {!compact && (
          <span className="hidden md:inline font-mono text-[9px] px-1 bg-[#F59E0B]/20 text-[#92400E] font-bold rounded">
            80/20
          </span>
        )}
      </button>
    </div>
  );
}
