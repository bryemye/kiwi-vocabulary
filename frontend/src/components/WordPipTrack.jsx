import React, { useState } from 'react';
import { Check } from 'lucide-react';

/**
 * WordPipTrack: Visual circular mastery pips for individual vocabulary words.
 * 
 * Motif:
 * - Unmastered word: Crisp outlined circle (○)
 * - Mastered word: Filled Kiwi-green circle (●) with high-contrast core
 */
export default function WordPipTrack({
  words = [],
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabels = false,
  showCounter = true,
  onWordClick,
  className = '',
}) {
  const [hoveredWord, setHoveredWord] = useState(null);

  if (!words || words.length === 0) {
    return null;
  }

  const masteredCount = words.filter((w) => w.is_mastered).length;
  const totalCount = words.length;
  const isAllMastered = totalCount > 0 && masteredCount === totalCount;

  // Size styling map
  const pipSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Optional Top Counter */}
      {showCounter && (
        <div className="flex items-center justify-between text-[11px] font-mono uppercase">
          <span className="text-[#62685E] font-bold">Word Mastery:</span>
          <span className={`font-black ${isAllMastered ? 'text-[#2F441E]' : 'text-[#111410]'}`}>
            {masteredCount} / {totalCount} {isAllMastered ? '★ ALL MASTERED' : 'CIRCLES FILLED'}
          </span>
        </div>
      )}

      {/* Row of Circular Pips */}
      <div className="flex items-center flex-wrap gap-2 relative">
        {words.map((item, index) => {
          const isMastered = Boolean(item.is_mastered);
          const wordText = typeof item === 'string' ? item : item.word || `Word ${index + 1}`;

          return (
            <div
              key={item.id || `${wordText}-${index}`}
              className="relative group"
              onMouseEnter={() => setHoveredWord(item)}
              onMouseLeave={() => setHoveredWord(null)}
            >
              <button
                type="button"
                onClick={() => onWordClick && onWordClick(item)}
                aria-label={`${wordText}: ${isMastered ? 'Mastered' : 'Not yet mastered'}`}
                className={`
                  ${pipSizes[size] || pipSizes.md}
                  rounded-full flex items-center justify-center transition-all duration-200
                  border-2 border-[#111410] shrink-0
                  ${isMastered
                    ? 'bg-[#7BB33B] text-white shadow-[1px_1px_0px_0px_#111410] hover:scale-110 active:scale-95'
                    : 'bg-white hover:bg-[#EDF5E5] text-transparent hover:border-[#7BB33B]'
                  }
                  ${onWordClick ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {isMastered ? (
                  <Check
                    className={`${iconSizes[size] || iconSizes.md} stroke-[3.5] text-white`}
                  />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111410]/20 group-hover:bg-[#7BB33B]/40" />
                )}
              </button>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                <div className="bg-[#111410] text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap border border-[#FAFBF8]/20 flex items-center space-x-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isMastered ? 'bg-[#7BB33B]' : 'border border-white/60 bg-transparent'
                    }`}
                  />
                  <span className="font-black uppercase tracking-wider">{wordText}</span>
                  <span className="text-white/60">
                    {isMastered ? '● MASTERED' : '○ IN TRAINING'}
                  </span>
                </div>
                {/* Arrow */}
                <div className="w-1.5 h-1.5 bg-[#111410] rotate-45 -mt-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional Word Pill Badges beneath */}
      {showLabels && (
        <div className="flex flex-wrap gap-1 pt-1">
          {words.map((item, index) => {
            const isMastered = Boolean(item.is_mastered);
            const wordText = typeof item === 'string' ? item : item.word || `Word ${index + 1}`;

            return (
              <span
                key={item.id || index}
                className={`text-[9px] font-mono uppercase px-1.5 py-0.5 border border-[#111410] flex items-center space-x-1 ${
                  isMastered
                    ? 'bg-[#EDF5E5] text-[#2F441E] font-bold'
                    : 'bg-white text-[#62685E]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isMastered ? 'bg-[#7BB33B]' : 'border border-[#111410] bg-white'
                  }`}
                />
                <span>{wordText}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
