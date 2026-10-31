import React, { useState } from 'react';
import { 
  Sparkles, 
  LineChart, 
  BookOpenCheck, 
  Clock, 
  Award, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Compass,
  Zap,
  Target
} from 'lucide-react';

export default function DashboardView({ stats, onSelectRoot, onNavigateMode }) {
  const [originFilter, setOriginFilter] = useState('ALL'); // 'ALL' | 'Latin' | 'Greek'

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading analytics...
      </div>
    );
  }

  const { overall = {}, sections = {}, root_mastery = [], recommendations = [], recent_logs = [] } = stats;

  const formatSeconds = (totalSecs) => {
    if (!totalSecs || totalSecs === 0) return '0 min';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const filteredRoots = root_mastery.filter((r) => {
    if (originFilter === 'ALL') return true;
    return r.language.toLowerCase() === originFilter.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900/60 via-indigo-900/40 to-slate-900 border border-sky-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Diagnostic Learning Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome to Your SAT/ACT Command Center
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Track real-time progress across root morphemes, geometric functions, and analytical reading passages.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => onNavigateMode('vocab')}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/20 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Review Vocabulary</span>
            </button>
            <button
              onClick={() => onNavigateMode('math')}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition active:scale-95"
            >
              <LineChart className="w-4 h-4" />
              <span>Practice Math</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Words Reviewed */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Words Reviewed
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {overall.unique_words_reviewed || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <span>{sections.vocab?.total || 0} flashcard attempts</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-medium">{sections.vocab?.accuracy_percentage || 0}% acc</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Math Accuracy % */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Math Accuracy
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <LineChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {sections.math?.accuracy_percentage || 0}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {sections.math?.correct || 0} of {sections.math?.total || 0} graphing questions solved
            </div>
          </div>
        </div>

        {/* Metric 3: Reading Accuracy % */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Reading Accuracy
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BookOpenCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {sections.reading?.accuracy_percentage || 0}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {sections.reading?.correct || 0} of {sections.reading?.total || 0} passage questions solved
            </div>
          </div>
        </div>

        {/* Metric 4: Total Study Time */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Study Time
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {formatSeconds(overall.total_seconds_spent)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Overall score: <strong className="text-sky-400">{overall.accuracy_percentage || 0}%</strong> ({overall.total_correct}/{overall.total_attempts})
            </div>
          </div>
        </div>
      </div>

      {/* Quick "Start Next Session" Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                <Target className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Recommended for Your Next Study Session
              </h2>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Targeting lowest mastery and unreinforced root families
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((root) => (
              <div
                key={root.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-sky-400 font-bold uppercase">
                      {root.morpheme}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
                      {root.language}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100">
                    "{root.core_meaning}"
                  </h4>
                  <p className="text-xs text-slate-400 italic line-clamp-1 mt-1">
                    {root.mnemonic}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                  <div className="text-xs font-mono text-slate-400">
                    Mastery: <span className="text-amber-400 font-bold">{root.mastery_percentage}%</span>
                  </div>
                  <button
                    onClick={() => onSelectRoot(root.id)}
                    className="flex items-center space-x-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
                  >
                    <span>Practice Root</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Root Mastery Tree / Matrix */}
      <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Compass className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Etymology Root Mastery Index
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visual morpheme matrix grouped by Classical Greek and Latin origins.
            </p>
          </div>

          {/* Origin filter buttons */}
          <div className="flex items-center space-x-1 p-1 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
            {['ALL', 'Latin', 'Greek'].map((origin) => (
              <button
                key={origin}
                onClick={() => setOriginFilter(origin)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  originFilter === origin
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {origin === 'ALL' ? 'All Roots' : `${origin} (${root_mastery.filter(r => r.language.toLowerCase() === origin.toLowerCase()).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoots.map((root) => {
            const isFullMastery = root.mastered_words === root.total_words && root.total_words > 0;
            return (
              <div
                key={root.id}
                className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      {root.morpheme}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {root.language}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {root.core_meaning}
                  </h3>
                  <p className="text-xs text-slate-400 italic mt-1 leading-relaxed">
                    "{root.mnemonic}"
                  </p>

                  {/* Progress Bar & Stat */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Mastery Progress:</span>
                      <span className={isFullMastery ? 'text-emerald-400 font-bold' : 'text-slate-200 font-bold'}>
                        {root.mastered_words} / {root.total_words} words ({root.mastery_percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFullMastery
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                        }`}
                        style={{ width: `${root.mastery_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Nested Words Pill List */}
                  <div className="mt-4 pt-3 border-t border-slate-900 flex flex-wrap gap-1.5">
                    {root.words && root.words.map((w) => (
                      <span
                        key={w.id}
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                          w.is_mastered
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                        }`}
                      >
                        {w.is_mastered ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                        <span>{w.word}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-5 pt-3 border-t border-slate-900">
                  <button
                    onClick={() => onSelectRoot(root.id)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                  >
                    <span>Launch Root Flashcards</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Log */}
      {recent_logs && recent_logs.length > 0 && (
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4">
            Recent Practice Activity
          </h3>
          <div className="divide-y divide-slate-800/80">
            {recent_logs.map((log) => {
              const isWord = log.item_type === 'WORD';
              const title = isWord
                ? `Vocabulary: ${log.word_details?.word || 'Word'}`
                : `Question: ${log.question_details?.section || 'Exam'} - ${log.question_details?.prompt?.slice(0, 50)}...`;

              return (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        log.is_correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {log.is_correct ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    </span>
                    <div>
                      <span className="font-medium text-slate-200">{title}</span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {log.seconds_spent}s elapsed · {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-md font-semibold text-[11px] ${
                      log.is_correct
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {log.is_correct ? 'Correct' : 'Needs Review'}
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
