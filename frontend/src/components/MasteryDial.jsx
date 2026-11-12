import React from 'react';
import { Award, Zap, BookOpen, Clock, Target, ArrowUpRight } from 'lucide-react';
import CircleMasteryRing from './CircleMasteryRing';

/**
 * MasteryDial: Hero student expertise telemetry banner.
 * 
 * Features a high-contrast radial gauge showcasing overall student mastery,
 * accompanied by clear outlined-vs-filled circular motif indicators and
 * key performance metrics.
 */
export default function MasteryDial({
  stats,
  onStartSession,
  className = '',
}) {
  const { overall = {}, sections = {}, root_mastery = [] } = stats || {};

  const totalWordsReviewed = overall.unique_words_reviewed || 0;
  const totalRootFamilies = root_mastery.length || 0;
  const accuracyPercentage = overall.accuracy_percentage || sections.vocab?.accuracy_percentage || 0;
  const totalSeconds = overall.total_seconds_spent || 0;

  // Calculate total words in the root mastery index vs mastered
  const totalWordsInLexicon = root_mastery.reduce((acc, r) => acc + (r.total_words || 0), 0) || 700;
  const totalMasteredWords = root_mastery.reduce((acc, r) => acc + (r.mastered_words || 0), 0) || totalWordsReviewed;
  const lexiconMasteryPct = totalWordsInLexicon > 0
    ? Math.round((totalMasteredWords / totalWordsInLexicon) * 100)
    : accuracyPercentage;

  // Calculate full roots mastered count
  const fullyMasteredRootsCount = root_mastery.filter(
    (r) => r.mastered_words === r.total_words && r.total_words > 0
  ).length;

  const formatSeconds = (totalSecs) => {
    if (!totalSecs || totalSecs === 0) return '0 MIN';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) return `${hrs}H ${mins}M`;
    if (mins > 0) return `${mins}M ${secs}S`;
    return `${secs}S`;
  };

  // Determine scholar rank title based on mastery
  const getScholarRank = (pct) => {
    if (pct >= 85) return { title: 'Master Lexicographer', badge: 'RANK IV', color: '#2F441E', bg: '#EDF5E5' };
    if (pct >= 60) return { title: 'Advanced Etymologist', badge: 'RANK III', color: '#2F441E', bg: '#EDF5E5' };
    if (pct >= 30) return { title: 'Active Morpheme Scholar', badge: 'RANK II', color: '#42281D', bg: '#FAF3DD' };
    return { title: 'Initiate Scholar', badge: 'RANK I', color: '#62685E', bg: '#FAFBF8' };
  };

  const rank = getScholarRank(lexiconMasteryPct);

  return (
    <div className={`bg-white border-2 border-[#111410] shadow-[5px_5px_0px_0px_#111410] p-6 sm:p-8 space-y-6 ${className}`}>
      {/* Top Banner Row: Brand / Engine Status + Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-[#111410] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2 font-mono">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-[#EDF5E5] border border-[#111410] text-[#2F441E] text-[10px] font-black uppercase tracking-wider">
              <Zap className="w-3 h-3 text-[#7BB33B]" />
              <span>Student Expertise Engine</span>
            </span>
            <span
              className="px-2 py-0.5 border border-[#111410] text-[10px] font-black uppercase tracking-wider"
              style={{ backgroundColor: rank.bg, color: rank.color }}
            >
              {rank.badge}: {rank.title}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#111410] tracking-tight uppercase font-sans">
            Student Mastery Command
          </h1>
          <p className="text-xs sm:text-sm text-[#62685E] font-mono mt-1 uppercase max-w-2xl">
            Real-time circular mastery telemetry across etymology roots, vocabulary words & domain competencies.
          </p>
        </div>

        {/* Quick Action Button & Visual Legend */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          {/* Visual Circle Motif Mini Legend */}
          <div className="bg-[#FAFBF8] border-2 border-[#111410] px-3 py-2 flex items-center space-x-3 text-[10px] font-mono font-bold uppercase">
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#111410] bg-white inline-block" />
              <span className="text-[#62685E]">Outlined = Developing</span>
            </div>
            <span className="text-[#111410]/30">|</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#111410] bg-[#7BB33B] inline-block" />
              <span className="text-[#2F441E]">Filled = Mastered</span>
            </div>
          </div>

          {onStartSession && (
            <button
              onClick={onStartSession}
              className="flex items-center space-x-2 px-5 py-2.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] font-mono font-black text-xs uppercase tracking-wider transition active:translate-x-[2px] active:translate-y-[2px]"
            >
              <span>Practice Now</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Dial Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Hero Dial: Circular Radial Progress */}
        <div className="lg:col-span-5 bg-[#FAFBF8] border-2 border-[#111410] p-6 shadow-[3px_3px_0px_0px_#111410] flex flex-col sm:flex-row items-center justify-center gap-6">
          <CircleMasteryRing
            percentage={lexiconMasteryPct}
            size={132}
            strokeWidth={10}
            className="shrink-0"
            title={`Overall Lexicon Mastery: ${lexiconMasteryPct}%`}
          >
            <div className="font-mono flex flex-col items-center leading-none">
              <span className="text-2xl sm:text-3xl font-black text-[#111410]">
                {lexiconMasteryPct}%
              </span>
              <span className="text-[9px] font-bold text-[#62685E] uppercase tracking-wider mt-0.5">
                Mastered
              </span>
            </div>
          </CircleMasteryRing>

          <div className="space-y-2 text-center sm:text-left min-w-0">
            <div className="text-[10px] font-mono font-black uppercase text-[#62685E] tracking-wider">
              Total Lexicon Coverage
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#111410] font-mono">
              {totalMasteredWords} / {totalWordsInLexicon}
              <span className="text-xs text-[#62685E] font-normal block sm:inline sm:ml-1.5 uppercase">
                Words
              </span>
            </div>
            <p className="text-xs text-[#42281D] font-mono leading-relaxed">
              <strong>{fullyMasteredRootsCount}</strong> root families fully complete (100% filled circles).
            </p>
          </div>
        </div>

        {/* Right 3 Metric Bento Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Metric 1: Root Families Active */}
          <div className="bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="w-full h-1 bg-[#42281D] absolute top-0 left-0" />
            <div className="flex items-center justify-between font-mono">
              <span className="text-[10px] font-black text-[#62685E] uppercase">Roots Active</span>
              <CircleMasteryRing
                percentage={totalRootFamilies > 0 ? Math.round((fullyMasteredRootsCount / totalRootFamilies) * 100) : 0}
                size={28}
                strokeWidth={3}
                borderOutline={false}
              />
            </div>
            <div className="mt-3 font-mono">
              <div className="text-2xl sm:text-3xl font-black text-[#111410]">
                {totalRootFamilies}
              </div>
              <div className="text-[10px] text-[#62685E] uppercase mt-0.5">
                {fullyMasteredRootsCount} Complete ({totalRootFamilies > 0 ? Math.round((fullyMasteredRootsCount / totalRootFamilies) * 100) : 0}%)
              </div>
            </div>
          </div>

          {/* Metric 2: Retention Rate */}
          <div className="bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="w-full h-1 bg-[#7BB33B] absolute top-0 left-0" />
            <div className="flex items-center justify-between font-mono">
              <span className="text-[10px] font-black text-[#62685E] uppercase">Retention Acc</span>
              <CircleMasteryRing
                percentage={accuracyPercentage}
                size={28}
                strokeWidth={3}
                borderOutline={false}
              />
            </div>
            <div className="mt-3 font-mono">
              <div className="text-2xl sm:text-3xl font-black text-[#111410]">
                {accuracyPercentage}%
              </div>
              <div className="text-[10px] text-[#2F441E] font-bold uppercase mt-0.5">
                {overall.total_correct || sections.vocab?.correct || 0} Correct Attempts
              </div>
            </div>
          </div>

          {/* Metric 3: Total Practice Time */}
          <div className="bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="w-full h-1 bg-[#2F441E] absolute top-0 left-0" />
            <div className="flex items-center justify-between font-mono">
              <span className="text-[10px] font-black text-[#62685E] uppercase">Study Time</span>
              <Clock className="w-4 h-4 text-[#42281D]" />
            </div>
            <div className="mt-3 font-mono">
              <div className="text-2xl sm:text-3xl font-black text-[#111410] truncate">
                {formatSeconds(totalSeconds)}
              </div>
              <div className="text-[10px] text-[#62685E] uppercase mt-0.5">
                {overall.total_attempts || sections.vocab?.total || 0} Telemetry Logs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
