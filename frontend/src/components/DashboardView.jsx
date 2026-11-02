import React, { useState } from 'react';
import { 
  Sparkles, 
  LineChart, 
  BookOpenCheck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Compass,
  Target,
  Zap
} from 'lucide-react';

export default function DashboardView({ stats, onSelectRoot, onNavigateMode }) {
  const [originFilter, setOriginFilter] = useState('ALL'); // 'ALL' | 'Latin' | 'Greek'

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#111410] font-mono">
        <div className="w-8 h-8 mx-auto border-4 border-[#111410] border-t-[#7BB33B] animate-spin mb-4" />
        <p className="uppercase text-xs font-bold">SYNCHRONIZING KIWI TELEMETRY...</p>
      </div>
    );
  }

  const { overall = {}, sections = {}, root_mastery = [], recommendations = [], recent_logs = [] } = stats;

  const formatSeconds = (totalSecs) => {
    if (!totalSecs || totalSecs === 0) return '0 MIN';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) return `${hrs}H ${mins}M`;
    if (mins > 0) return `${mins}M ${secs}S`;
    return `${secs}S`;
  };

  const filteredRoots = root_mastery.filter((r) => {
    if (originFilter === 'ALL') return true;
    return r.language.toLowerCase() === originFilter.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Neo-brutalist Bento Header Banner */}
      <div className="bg-white border-2 border-[#111410] shadow-[5px_5px_0px_0px_#111410] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-[#EDF5E5] border border-[#111410] text-[#2F441E] text-[10px] font-mono font-black uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5 text-[#7BB33B]" />
              <span>Diagnostic Learning Engine Online</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#111410] tracking-tight uppercase font-sans">
              Kiwi Learning Command Grid
            </h1>
            <p className="text-[#62685E] text-xs sm:text-sm mt-2 max-w-2xl font-mono uppercase">
              Adaptive etymological decomposition, Latin & Greek root families & SAT/ACT vocabulary mastery.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => onNavigateMode('vocab')}
              className="flex items-center space-x-2 px-5 py-3 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] font-mono font-black text-xs uppercase tracking-wider transition active:translate-x-[2px] active:translate-y-[2px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Study Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* High-Level Metric Cards (Modular Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Words Reviewed */}
        <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="w-full h-1.5 bg-[#7BB33B] absolute top-0 left-0" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-black text-[#62685E] uppercase tracking-wider">
              Words Mastered
            </span>
            <div className="w-8 h-8 bg-[#EDF5E5] border border-[#111410] text-[#2F441E] flex items-center justify-center font-mono font-bold text-xs">
              01
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-black font-mono text-[#111410]">
              {overall.unique_words_reviewed || 0}
            </div>
            <div className="text-xs font-mono text-[#62685E] mt-1 flex items-center space-x-1 uppercase">
              <span>{sections.vocab?.total || 0} attempts</span>
              <span>·</span>
              <span className="text-[#2F441E] font-bold">{sections.vocab?.accuracy_percentage || 0}% ACC</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Root Families Available */}
        <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="w-full h-1.5 bg-[#42281D] absolute top-0 left-0" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-black text-[#62685E] uppercase tracking-wider">
              Root Families Active
            </span>
            <div className="w-8 h-8 bg-[#EFE8DF] border border-[#111410] text-[#42281D] flex items-center justify-center font-mono font-bold text-xs">
              02
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-black font-mono text-[#111410]">
              {root_mastery.length}
            </div>
            <div className="text-xs font-mono text-[#62685E] mt-1 uppercase">
              LATIN & GREEK MORPHEME CLUSTERS
            </div>
          </div>
        </div>

        {/* Metric 3: Vocabulary Retention Rate */}
        <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="w-full h-1.5 bg-[#7BB33B] absolute top-0 left-0" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-black text-[#62685E] uppercase tracking-wider">
              Vocabulary Retention
            </span>
            <div className="w-8 h-8 bg-[#EDF5E5] border border-[#111410] text-[#2F441E] flex items-center justify-center font-mono font-bold text-xs">
              03
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-black font-mono text-[#111410]">
              {sections.vocab?.accuracy_percentage || 0}%
            </div>
            <div className="text-xs font-mono text-[#2F441E] mt-1 uppercase font-bold">
              {sections.vocab?.correct || 0} OF {sections.vocab?.total || 0} WORDS RETAINED
            </div>
          </div>
        </div>

        {/* Metric 4: Total Study Time */}
        <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="w-full h-1.5 bg-[#42281D] absolute top-0 left-0" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-black text-[#62685E] uppercase tracking-wider">
              Total Practice Time
            </span>
            <div className="w-8 h-8 bg-[#FAFBF8] border border-[#111410] text-[#111410] flex items-center justify-center font-mono font-bold text-xs">
              04
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-black font-mono text-[#111410]">
              {formatSeconds(overall.total_seconds_spent)}
            </div>
            <div className="text-xs font-mono text-[#62685E] mt-1 uppercase">
              COMPOSITE: <strong className="text-[#2F441E]">{overall.accuracy_percentage || 0}%</strong> ({overall.total_correct}/{overall.total_attempts})
            </div>
          </div>
        </div>
      </div>

      {/* Bento Section: "Start Next Session" Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b-2 border-[#111410] pb-2 font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-[#42281D]" />
              <h2 className="text-xs font-black uppercase text-[#111410] tracking-wider">
                Targeted Practice Recommendations
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#62685E] uppercase">
              AUTOMATICALLY IDENTIFIED LOW-MASTERY MORPHEME CLUSTERS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((root) => (
              <div
                key={root.id}
                className="p-4 bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-[#42281D] font-black uppercase">
                      [{root.morpheme}]
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#EFE8DF] text-[#42281D] border border-[#111410] text-[9px] font-bold uppercase">
                      {root.language}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-[#111410] font-sans">
                    "{root.core_meaning}"
                  </h4>
                  <p className="text-xs text-[#62685E] italic font-serif line-clamp-1 mt-1">
                    {root.mnemonic}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#111410]/20 flex items-center justify-between font-mono">
                  <div className="text-[10px] font-bold text-[#62685E]">
                    MASTERY: <span className="text-[#2F441E] font-black">{root.mastery_percentage}%</span>
                  </div>
                  <button
                    onClick={() => onSelectRoot(root.id)}
                    className="flex items-center space-x-1 text-xs font-black text-[#7BB33B] hover:text-[#84C341] uppercase transition"
                  >
                    <span>PRACTICE ROOT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Root Mastery Tree / Matrix (Greek vs. Latin Origin Blocks) */}
      <div className="bg-white border-2 border-[#111410] shadow-[5px_5px_0px_0px_#111410] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#111410] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-[#42281D] text-white flex items-center justify-center font-mono font-black text-xs">
                M
              </span>
              <h2 className="text-lg font-black text-[#111410] tracking-tight uppercase font-mono">
                Etymology Root Mastery Matrix
              </h2>
            </div>
            <p className="text-xs font-mono text-[#62685E] mt-1 uppercase">
              Morpheme families categorized by Classical Greek vs. Latin origin
            </p>
          </div>

          {/* Origin filter buttons */}
          <div className="flex items-center space-x-1 font-mono text-xs">
            {['ALL', 'Latin', 'Greek'].map((origin) => (
              <button
                key={origin}
                onClick={() => setOriginFilter(origin)}
                className={`px-3 py-1 font-black uppercase border-2 border-[#111410] transition ${
                  originFilter === origin
                    ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410]'
                    : 'bg-white text-[#111410] hover:bg-[#FAFBF8]'
                }`}
              >
                {origin === 'ALL' ? 'ALL ORIGINS' : `${origin.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Grid of Roots */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoots.map((root) => {
            const isFullMastery = root.mastered_words === root.total_words && root.total_words > 0;
            return (
              <div
                key={root.id}
                className="bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2 font-mono">
                    <span className="px-2 py-0.5 text-xs font-black bg-white text-[#111410] border border-[#111410]">
                      [{root.morpheme.toUpperCase()}]
                    </span>
                    <span className="text-[10px] font-bold text-[#42281D] uppercase">
                      {root.language}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[#111410] font-sans uppercase">
                    "{root.core_meaning}"
                  </h3>
                  <p className="text-xs text-[#62685E] italic font-serif mt-1">
                    "{root.mnemonic}"
                  </p>

                  {/* Progress Bar & Stat (Kiwi Green against Soft Cream Track) */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase">
                      <span className="text-[#62685E]">Progress:</span>
                      <span className={isFullMastery ? 'text-[#2F441E] font-black' : 'text-[#111410]'}>
                        {root.mastered_words} / {root.total_words} WORDS ({root.mastery_percentage}%)
                      </span>
                    </div>
                    {/* Linear Bar Meter in Kiwi Green against Cream Track */}
                    <div className="w-full h-3 bg-[#EFE8DF] border-2 border-[#111410] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isFullMastery ? 'bg-[#7BB33B]' : 'bg-[#84C341]'
                        }`}
                        style={{ width: `${root.mastery_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Words Pill List */}
                  <div className="mt-4 pt-3 border-t border-[#111410]/20 flex flex-wrap gap-1.5">
                    {root.words && root.words.map((w) => (
                      <span
                        key={w.id}
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-[#111410] flex items-center space-x-1 ${
                          w.is_mastered
                            ? 'bg-[#EDF5E5] text-[#2F441E]'
                            : 'bg-white text-[#62685E]'
                        }`}
                      >
                        {w.is_mastered ? <CheckCircle2 className="w-3 h-3 text-[#7BB33B]" /> : <span className="w-1.5 h-1.5 bg-[#42281D]" />}
                        <span>{w.word}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-5 pt-3 border-t border-[#111410]/20">
                  <button
                    onClick={() => onSelectRoot(root.id)}
                    className="w-full py-2 bg-white hover:bg-[#7BB33B] hover:text-white text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono font-black uppercase flex items-center justify-center space-x-1.5 transition active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    <span>Launch Root Cards</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Log (Bento Grid Style) */}
      {recent_logs && recent_logs.length > 0 && (
        <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-6">
          <div className="flex items-center justify-between mb-4 border-b-2 border-[#111410] pb-2 font-mono">
            <h3 className="text-xs font-black uppercase text-[#111410] tracking-wider">
              Recent Practice Telemetry Audit
            </h3>
            <span className="text-[10px] font-bold text-[#62685E] uppercase">
              REAL-TIME LOG PERSISTENCE
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
                      className={`w-6 h-6 border border-[#111410] flex items-center justify-center shrink-0 ${
                        log.is_correct ? 'bg-[#7BB33B] text-white' : 'bg-[#42281D] text-white'
                      }`}
                    >
                      {log.is_correct ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
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
                        : 'bg-[#FDF2F2] text-[#991B1B]'
                    }`}
                  >
                    {log.is_correct ? 'MASTERED' : 'NEEDS REVIEW'}
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
