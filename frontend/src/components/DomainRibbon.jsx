import React from 'react';
import CircleMasteryRing from './CircleMasteryRing';

/**
 * DomainRibbon: Interactive horizontal domain track featuring
 * circular mastery meters for each category in the active taxonomy lens.
 */
export default function DomainRibbon({
  domains = [],
  selectedDomainId = 'ALL',
  onSelectDomain,
  className = '',
}) {
  if (!domains || domains.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-[10px] font-black uppercase text-[#62685E] tracking-wider">
          Domain Competency Ribbon
        </span>
        <span className="text-[10px] text-[#62685E]">
          Click any domain circle to isolate root families
        </span>
      </div>

      <div className="flex items-center space-x-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {/* "All Domains" Pill */}
        <button
          onClick={() => onSelectDomain('ALL')}
          className={`flex items-center space-x-2 px-3 py-2 border-2 border-[#111410] font-mono text-xs font-bold uppercase transition shrink-0 ${
            selectedDomainId === 'ALL'
              ? 'bg-[#111410] text-white shadow-[2px_2px_0px_0px_#7BB33B]'
              : 'bg-white hover:bg-[#FAFBF8] text-[#111410] shadow-[2px_2px_0px_0px_#111410]'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full border border-current" />
          <span>ALL DOMAINS</span>
          <span className="text-[10px] opacity-75">
            ({domains.reduce((acc, d) => acc + d.totalRoots, 0)})
          </span>
        </button>

        {/* Individual Domain Badges with Circular Meters */}
        {domains.map((domain) => {
          const isSelected = selectedDomainId === domain.id;
          const isComplete = domain.masteryPercentage >= 100;

          return (
            <button
              key={domain.id}
              onClick={() => onSelectDomain(isSelected ? 'ALL' : domain.id)}
              className={`flex items-center space-x-2.5 px-3 py-1.5 border-2 border-[#111410] transition shrink-0 group ${
                isSelected
                  ? 'bg-[#EDF5E5] text-[#2F441E] shadow-[3px_3px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]'
                  : 'bg-white hover:bg-[#FAFBF8] text-[#111410] shadow-[2px_2px_0px_0px_#111410]'
              }`}
            >
              {/* Circular Radial Meter */}
              <CircleMasteryRing
                percentage={domain.masteryPercentage}
                size={32}
                strokeWidth={3.5}
                borderOutline={false}
                strokeColor={domain.accentColor || '#7BB33B'}
              >
                <span className="text-[8px] font-mono font-black">
                  {domain.masteryPercentage}%
                </span>
              </CircleMasteryRing>

              {/* Domain Name & Counter */}
              <div className="text-left font-mono">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">{domain.icon}</span>
                  <span className="text-xs font-black uppercase truncate max-w-[130px] sm:max-w-none">
                    {domain.name}
                  </span>
                </div>
                <div className="text-[9px] text-[#62685E] uppercase">
                  {domain.masteredWords}/{domain.totalWords} Words · {domain.totalRoots} Roots
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
