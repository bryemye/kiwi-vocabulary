import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Layers, 
  Play, 
  Sparkles, 
  BookMarked, 
  Search, 
  X, 
  Volume2, 
  BookOpen, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function MorphemeDetailView({ 
  morphemeData, 
  onBack, 
  onStartPractice,
  onSelectWordCard
}) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!morphemeData) return null;

  const {
    type, // 'root' | 'prefix' | 'suffix'
    title, // e.g. "[PEL / PULS]" or "dis-" or "-el"
    cleanToken, // e.g. "dis-" or "pel / puls"
    meaning, // e.g. "to drive, push, urge" or "apart, away"
    language, // "Latin" | "Greek" | ""
    mnemonic,
    definitionText,
    sourceWord,
    matchedWords = []
  } = morphemeData;

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getConnotationBadge = (connotation) => {
    switch (connotation?.toLowerCase()) {
      case 'positive':
        return 'bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B]/40 rounded-full font-sans font-semibold';
      case 'negative':
        return 'bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-sans font-semibold';
      default:
        return 'bg-stone-100 text-stone-700 border border-stone-200 rounded-full font-sans font-semibold';
    }
  };

  const filteredWords = matchedWords.filter(w => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return w.word.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q);
  });

  const getBadgeStyle = () => {
    if (type === 'prefix') {
      return {
        bg: 'bg-[#EDF5E5]',
        text: 'text-[#2F441E]',
        label: 'PREFIX MORPHEME',
      };
    }
    if (type === 'suffix') {
      return {
        bg: 'bg-white',
        text: 'text-[#111410]',
        label: 'SUFFIX MORPHEME',
      };
    }
    return {
      bg: 'bg-[#EFE8DF]',
      text: 'text-[#42281D]',
      label: `ROOT MORPHEME · ${language?.toUpperCase() || 'LATIN'}`,
    };
  };

  const badgeStyle = getBadgeStyle();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in py-2">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 shadow-soft-xs text-xs font-sans font-bold rounded-xl transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-stone-700" />
          <span>
            {morphemeData.sourceTab === 'graph'
              ? 'Back to Root Graph'
              : morphemeData.sourceTab === 'explorer'
                ? 'Back to Root Explorer'
                : 'Back to Flashcard Deck'}
          </span>
        </button>

        {sourceWord && (
          <span className="text-xs font-sans text-stone-500 hidden sm:inline">
            From Word: <strong className="text-stone-900 font-bold">{sourceWord}</strong>
          </span>
        )}
      </div>

      {/* Morpheme Educational Definition Banner */}
      <div className="bg-white/80 border border-stone-200/90 rounded-2xl shadow-soft-xs p-5 flex items-start space-x-4">
        <div className="p-2.5 bg-[#EDF5E5] border border-[#7BB33B]/40 rounded-xl shadow-soft-xs shrink-0 text-[#2F441E]">
          <Layers className="w-5 h-5 text-[#7BB33B]" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-800 text-white rounded-md">
              Linguistics
            </span>
            <h2 className="text-xs font-sans font-bold tracking-wider text-stone-800">
              What is a Morpheme?
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-serif text-stone-600 leading-relaxed">
            A <strong>morpheme</strong> is the smallest meaningful constituent grammatical unit of a language that cannot be divided into further sub-parts without losing its semantic meaning. Every complex word in the SAT lexicon is built by compounding base <strong>root morphemes</strong> with <strong>affix morphemes</strong> (prefixes and suffixes).
          </p>
        </div>
      </div>

      {/* Morpheme Definition Hero Card */}
      <div className="bg-white border border-stone-200/90 rounded-3xl shadow-soft-md p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
              <span className={`text-[10px] font-sans font-bold uppercase px-2.5 py-0.5 rounded-full border border-stone-200 ${badgeStyle.bg} ${badgeStyle.text}`}>
                {badgeStyle.label}
              </span>
              {(morphemeData.root?.thematic_cluster || morphemeData.thematic_cluster) && (
                <span className="text-[10px] font-sans font-bold uppercase px-2.5 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B]/30 rounded-full">
                  🧠 {morphemeData.root?.thematic_cluster || morphemeData.thematic_cluster}
                </span>
              )}
              {(morphemeData.root?.sat_tier || morphemeData.sat_tier) && (
                <span className="text-[10px] font-sans font-bold uppercase px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                  ⚡ {morphemeData.root?.sat_tier || morphemeData.sat_tier}
                </span>
              )}
              <span className="text-xs font-mono font-medium text-stone-400">
                {matchedWords.length} {matchedWords.length === 1 ? 'Word' : 'Words'} in Lexicon
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-sans tracking-tight text-stone-900">
              {title}
            </h1>

            {meaning && (
              <p className="text-lg font-serif italic text-stone-700">
                Core Meaning: <strong className="font-sans font-bold not-italic text-stone-900">"{meaning}"</strong>
              </p>
            )}
          </div>

          {/* Primary Action: Practice Subset */}
          <button
            onClick={() => onStartPractice(matchedWords, title, morphemeData)}
            className="w-full md:w-auto min-h-[46px] flex items-center justify-center space-x-2 px-6 py-3 bg-[#7BB33B] hover:bg-[#6FA334] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-2xl shadow-soft-sm hover:shadow-soft-md transition-all shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Practice This Subset ({matchedWords.length})</span>
          </button>
        </div>

        {/* Morpheme Definition & Linguistic Role */}
        <div className="mt-5 space-y-3">
          <div className="p-4 bg-stone-50/70 border border-stone-200/80 rounded-2xl">
            <h2 className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-400 mb-1">
              Definition & Morphological Role
            </h2>
            <p className="text-xs sm:text-sm font-sans text-stone-700 leading-relaxed">
              {definitionText}
            </p>
          </div>

          {mnemonic && (
            <div className="p-3.5 bg-[#EFE8DF]/60 border border-[#C29B78]/40 rounded-2xl text-xs font-sans text-[#42281D] flex items-start space-x-2.5">
              <span className="font-bold uppercase text-[10px] bg-white px-2 py-0.5 rounded border border-stone-200 shrink-0 text-[#2F441E] font-mono">
                Memory Key
              </span>
              <span className="font-serif italic text-sm text-[#42281D]">
                "{mnemonic}"
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Words List Header with Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-2 font-sans text-xs">
          <Layers className="w-4 h-4 text-[#7BB33B]" />
          <h2 className="font-bold text-stone-800 tracking-wide text-sm">
            Words Featuring "{cleanToken || title}" ({filteredWords.length})
          </h2>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter subset words..."
            className="w-full bg-white text-stone-800 font-sans text-xs pl-8 pr-7 py-2 border border-stone-200 rounded-xl shadow-soft-xs focus:outline-none focus:border-[#7BB33B] focus:ring-2 focus:ring-[#7BB33B]/20 transition placeholder:text-stone-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 p-1 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Words Grid */}
      {filteredWords.length === 0 ? (
        <div className="p-8 text-center bg-white border border-stone-200 rounded-2xl shadow-soft-xs">
          <p className="text-xs font-sans text-stone-500">No words matched your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWords.map((wordItem) => (
            <div
              key={wordItem.id}
              className="bg-white border border-stone-200/90 rounded-2xl shadow-soft-xs hover:shadow-soft-md p-5 flex flex-col justify-between transition-all"
            >
              <div>
                {/* Header: Part of speech, Connotation, Audio */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 mb-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-sans font-bold uppercase px-2 py-0.5 bg-stone-800 text-white rounded-full">
                      {wordItem.part_of_speech || 'noun'}
                    </span>
                    <span className={`text-[10px] font-sans font-semibold uppercase px-2 py-0.5 ${getConnotationBadge(wordItem.connotation)}`}>
                      {wordItem.connotation}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSpeak(wordItem.word)}
                    className="p-1.5 bg-stone-50 hover:bg-[#EDF5E5] text-stone-600 rounded-lg border border-stone-200 transition"
                    title="Pronounce word"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#2F441E]" />
                  </button>
                </div>

                {/* Word & Pronunciation */}
                <h3 className="text-2xl font-bold font-sans text-stone-900 tracking-tight">
                  {wordItem.word}
                </h3>
                {wordItem.pronunciation && (
                  <p className="text-xs font-mono font-medium text-stone-400 mt-0.5">
                    /{wordItem.pronunciation}/
                  </p>
                )}

                {/* Definition */}
                <p className="text-sm font-serif text-stone-700 mt-2 leading-relaxed">
                  "{wordItem.definition}"
                </p>

                {/* Context Sentence */}
                <div className="mt-3 p-3 bg-stone-50/80 border-l-3 border-[#7BB33B] rounded-r-xl text-xs font-serif italic text-stone-600 leading-relaxed">
                  "{wordItem.sat_sentence}"
                </div>

                {/* Morpheme Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                  {wordItem.prefix && (
                    <span className="px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B]/30 rounded-md">
                      {wordItem.prefix}
                    </span>
                  )}
                  {wordItem.root_details?.morpheme && (
                    <span className="px-2 py-0.5 bg-[#EFE8DF] text-[#42281D] border border-[#C29B78]/40 font-bold rounded-md">
                      [{wordItem.root_details.morpheme}]
                    </span>
                  )}
                  {wordItem.suffix && (
                    <span className="px-2 py-0.5 bg-white text-stone-700 border border-stone-200 rounded-md">
                      {wordItem.suffix}
                    </span>
                  )}
                </div>
              </div>

              {/* Study Card Quick Action */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs font-sans text-stone-500">
                  Root: <strong className="font-mono text-stone-800">[{wordItem.root_details?.morpheme}]</strong>
                </span>
                {onSelectWordCard && (
                  <button
                    onClick={() => onSelectWordCard(wordItem)}
                    className="text-xs font-sans font-bold text-[#7BB33B] hover:text-[#2F441E] flex items-center space-x-1"
                  >
                    <span>Practice Word</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
