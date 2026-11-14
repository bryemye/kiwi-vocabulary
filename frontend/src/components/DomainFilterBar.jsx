import React from 'react';
import { Search, Clock } from 'lucide-react';
import { DOMAIN_LENSES } from '../services/pathwayService';

/**
 * DomainFilterBar: Multi-dimensional controls allowing students to define
 * domains and filter expertise levels using the circular mastery motif.
 */
export default function DomainFilterBar({
  activeLens,
  onLensChange,
  maturityFilter,
  onMaturityFilterChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  className = '',
}) {
  return (
    <div className={`bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-4 sm:p-5 space-y-4 ${className}`}>
      {/* Row 1: Taxonomy Definition Lenses */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b-2 border-[#111410]/15 pb-4">
        <div>
          <span className="text-[10px] font-mono font-black uppercase text-[#62685E] tracking-wider block">
            Domain Definition Lens
          </span>
          <span className="text-xs font-mono font-bold text-[#111410]">
            Choose how to classify and view student expertise domains:
          </span>
        </div>

        {/* 4 Taxonomy Lens Tabs */}
        <div className="flex items-center flex-wrap gap-1.5 font-mono text-xs">
          {DOMAIN_LENSES.map((lens) => {
            const isActive = activeLens === lens.id;
            return (
              <button
                key={lens.id}
                onClick={() => onLensChange(lens.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 border-2 border-[#111410] font-black uppercase transition text-xs ${
                  isActive
                    ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-white hover:bg-[#FAFBF8] text-[#111410]'
                }`}
                title={lens.description}
              >
                <span>{lens.icon}</span>
                <span>{lens.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Secondary Filters (Circle Maturity, Search, Sort) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
        {/* Maturity Stage Pills (Outlined vs Filled Motif) */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[10px] font-black uppercase text-[#62685E] mr-1 hidden sm:inline">
            Status:
          </span>

          <button
            onClick={() => onMaturityFilterChange('ALL')}
            className={`px-2.5 py-1 border border-[#111410] uppercase font-bold text-[11px] transition ${
              maturityFilter === 'ALL'
                ? 'bg-[#111410] text-white font-black'
                : 'bg-white hover:bg-[#FAFBF8] text-[#111410]'
            }`}
          >
            All Roots
          </button>

          <button
            onClick={() => onMaturityFilterChange('RECENTLY_WORKED')}
            className={`flex items-center space-x-1 px-2.5 py-1 border border-[#111410] uppercase font-bold text-[11px] transition ${
              maturityFilter === 'RECENTLY_WORKED'
                ? 'bg-[#EDF5E5] text-[#2F441E] border-[#2F441E] font-black shadow-[1px_1px_0px_0px_#111410]'
                : 'bg-white hover:bg-[#EDF5E5] text-[#2F441E]'
            }`}
            title="Show only roots you have studied, ordered by most recently worked on"
          >
            <Clock className="w-3 h-3" />
            <span>Recently Worked On</span>
          </button>

          <button
            onClick={() => onMaturityFilterChange('MASTERED')}
            className={`flex items-center space-x-1 px-2.5 py-1 border border-[#111410] uppercase font-bold text-[11px] transition ${
              maturityFilter === 'MASTERED'
                ? 'bg-[#EDF5E5] text-[#2F441E] border-[#2F441E] font-black shadow-[1px_1px_0px_0px_#111410]'
                : 'bg-white hover:bg-[#EDF5E5] text-[#2F441E]'
            }`}
            title="Roots with 80% to 100% of circles filled"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#7BB33B] border border-[#111410]" />
            <span>Mastered (≥80%)</span>
          </button>

          <button
            onClick={() => onMaturityFilterChange('DEVELOPING')}
            className={`flex items-center space-x-1 px-2.5 py-1 border border-[#111410] uppercase font-bold text-[11px] transition ${
              maturityFilter === 'DEVELOPING'
                ? 'bg-[#FFFBEB] text-[#92400E] border-[#92400E] font-black shadow-[1px_1px_0px_0px_#111410]'
                : 'bg-white hover:bg-[#FFFBEB] text-[#92400E]'
            }`}
            title="Roots with 30% to 79% of circles filled"
          >
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#D97706] bg-[#FEF3C7]" />
            <span>In Training (30-79%)</span>
          </button>

          <button
            onClick={() => onMaturityFilterChange('FOCUS')}
            className={`flex items-center space-x-1 px-2.5 py-1 border border-[#111410] uppercase font-bold text-[11px] transition ${
              maturityFilter === 'FOCUS'
                ? 'bg-[#FAF3DD] text-[#42281D] border-[#42281D] font-black shadow-[1px_1px_0px_0px_#111410]'
                : 'bg-white hover:bg-[#FAF3DD] text-[#42281D]'
            }`}
            title="Roots with < 30% circles filled (highest practice priority)"
          >
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#111410] bg-white" />
            <span>Focus Areas (&lt;30%)</span>
          </button>
        </div>

        {/* Search & Sort Input Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Live Search */}
          <div className="relative flex-1 sm:w-48 md:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="SEARCH ROOTS OR WORDS..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#FAFBF8] border-2 border-[#111410] text-xs font-mono text-[#111410] placeholder:text-[#62685E]/70 focus:outline-none focus:bg-white uppercase"
            />
            <Search className="w-3.5 h-3.5 text-[#62685E] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FAFBF8] border-2 border-[#111410] text-xs font-mono font-bold text-[#111410] focus:outline-none focus:bg-white uppercase cursor-pointer"
          >
            <option value="DEFAULT">Sort: Recommended</option>
            <option value="RECENT_DESC">Most Recently Worked On</option>
            <option value="MASTERY_DESC">Highest Expertise (●)</option>
            <option value="MASTERY_ASC">Lowest Expertise (○)</option>
            <option value="ALPHA">Alphabetical (A-Z)</option>
            <option value="WORDS_DESC">Most Words</option>
          </select>
        </div>
      </div>
    </div>
  );
}
