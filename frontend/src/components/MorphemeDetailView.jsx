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
        return 'bg-[#EDF5E5] text-[#2F441E] border border-[#111410]';
      case 'negative':
        return 'bg-[#FDF2F2] text-[#991B1B] border border-[#111410]';
      default:
        return 'bg-[#EFE8DF] text-[#42281D] border border-[#111410]';
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3 py-1.5 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono font-bold uppercase transition active:translate-x-[1px] active:translate-y-[1px]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#111410]" />
          <span>{morphemeData.sourceTab === 'graph' ? 'Back to Root Graph' : 'Back to Flashcard Deck'}</span>
        </button>

        {sourceWord && (
          <span className="text-[11px] font-mono text-[#62685E] uppercase hidden sm:inline">
            From Word: <strong className="text-[#111410] font-black">{sourceWord}</strong>
          </span>
        )}
      </div>

      {/* Morpheme Educational Definition Banner */}
      <div className="bg-[#FAFBF8] border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-4 sm:p-5 flex items-start space-x-3.5">
        <div className="p-2.5 bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] shrink-0 text-[#2F441E]">
          <Layers className="w-5 h-5 text-[#7BB33B]" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#111410] text-white">
              LINGUISTICS 101
            </span>
            <h2 className="text-xs font-mono font-black uppercase tracking-wider text-[#111410]">
              What is a Morpheme?
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-serif text-[#42281D] leading-relaxed">
            A <strong>morpheme</strong> is the smallest meaningful constituent grammatical unit of a language that cannot be divided into further sub-parts without losing its semantic meaning. Every complex word in the SAT lexicon is built by compounding base <strong>root morphemes</strong> (which supply the core semantic concept) with <strong>affix morphemes</strong>: <strong>prefixes</strong> (attached to the beginning to alter direction, negation, or intensity) and <strong>suffixes</strong> (attached to the end to govern grammatical part of speech or nuance).
          </p>
        </div>
      </div>

      {/* Morpheme Definition Hero Bento Card */}
      <div className="bg-white border-2 border-[#111410] shadow-[6px_6px_0px_0px_#111410] p-4 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b-2 border-[#111410] pb-5">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 border border-[#111410] ${badgeStyle.bg} ${badgeStyle.text}`}>
                {badgeStyle.label}
              </span>
              {(morphemeData.root?.thematic_cluster || morphemeData.thematic_cluster) && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410]">
                  🧠 {morphemeData.root?.thematic_cluster || morphemeData.thematic_cluster}
                </span>
              )}
              {(morphemeData.root?.sat_tier || morphemeData.sat_tier) && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#FFFBEB] text-[#92400E] border border-[#111410]">
                  ⚡ {morphemeData.root?.sat_tier || morphemeData.sat_tier}
                </span>
              )}
              <span className="text-[10px] font-mono font-bold uppercase text-[#62685E]">
                {matchedWords.length} {matchedWords.length === 1 ? 'Word' : 'Words'} in Lexicon
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black font-sans uppercase tracking-tight text-[#111410]">
              {title}
            </h1>

            {meaning && (
              <p className="text-lg font-serif italic text-[#42281D]">
                Core Meaning: <strong className="font-sans font-bold not-italic text-[#111410]">"{meaning}"</strong>
              </p>
            )}
          </div>

          {/* Primary Action: Practice Subset */}
          <button
            onClick={() => onStartPractice(matchedWords, title, morphemeData)}
            className="w-full md:w-auto min-h-[44px] flex items-center justify-center space-x-2 px-6 py-3.5 bg-[#7BB33B] hover:bg-[#84C341] text-white font-mono font-black text-xs uppercase tracking-wider border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] active:translate-x-[2px] active:translate-y-[2px] transition shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Practice This Subset ({matchedWords.length})</span>
          </button>
        </div>

        {/* Morpheme Definition & Linguistic Role */}
        <div className="mt-5 space-y-3">
          <div className="p-4 bg-[#FAFBF8] border-2 border-[#111410]">
            <h2 className="text-[10px] font-mono font-black uppercase tracking-wider text-[#62685E] mb-1">
              Definition & Morphological Role
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[#111410] leading-relaxed">
              {definitionText}
            </p>
          </div>

          {mnemonic && (
            <div className="p-3 bg-[#EFE8DF] border-2 border-[#111410] text-xs font-mono text-[#42281D] flex items-start space-x-2">
              <span className="font-black uppercase bg-[#FAFBF8] px-1.5 py-0.5 border border-[#111410] shrink-0 text-[#2F441E]">
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
        <div className="flex items-center space-x-2 font-mono text-xs">
          <Layers className="w-4 h-4 text-[#7BB33B]" />
          <h2 className="font-black uppercase text-[#111410] tracking-wide">
            Words Featuring "{cleanToken || title}" ({filteredWords.length})
          </h2>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 sm:top-2.5 text-[#62685E]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="FILTER SUBSET WORDS..."
            className="w-full bg-white text-[#111410] font-mono font-bold text-base sm:text-xs pl-8 pr-7 py-2 sm:py-1.5 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] focus:outline-none uppercase placeholder:text-[#A8AAA6]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 p-1 text-[#42281D]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Words Grid */}
      {filteredWords.length === 0 ? (
        <div className="p-8 text-center bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410]">
          <p className="text-xs font-mono uppercase text-[#62685E]">No words matched your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWords.map((wordItem) => (
            <div
              key={wordItem.id}
              className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5 flex flex-col justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#111410] transition-all"
            >
              <div>
                {/* Header: Part of speech, Connotation, Audio */}
                <div className="flex items-center justify-between border-b-2 border-[#111410] pb-2.5 mb-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 bg-[#111410] text-white">
                      {wordItem.part_of_speech || 'noun'}
                    </span>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 ${getConnotationBadge(wordItem.connotation)}`}>
                      {wordItem.connotation}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSpeak(wordItem.word)}
                    className="p-1 bg-[#FAFBF8] hover:bg-[#EDF5E5] text-[#111410] border border-[#111410] transition"
                    title="Pronounce word"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#2F441E]" />
                  </button>
                </div>

                {/* Word & Pronunciation */}
                <h3 className="text-2xl font-black font-sans uppercase text-[#111410]">
                  {wordItem.word}
                </h3>
                {wordItem.pronunciation && (
                  <p className="text-xs font-mono font-bold text-[#62685E] mt-0.5">
                    /{wordItem.pronunciation}/
                  </p>
                )}

                {/* Definition */}
                <p className="text-sm font-serif text-[#111410] mt-2 leading-relaxed">
                  "{wordItem.definition}"
                </p>

                {/* Context Sentence */}
                <div className="mt-3 p-2.5 bg-[#FAFBF8] border border-[#111410] text-xs font-serif italic text-[#42281D]">
                  "{wordItem.sat_sentence}"
                </div>

                {/* Morpheme Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                  {wordItem.prefix && (
                    <span className="px-1.5 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410]">
                      {wordItem.prefix}
                    </span>
                  )}
                  {wordItem.root_details?.morpheme && (
                    <span className="px-1.5 py-0.5 bg-[#EFE8DF] text-[#42281D] border border-[#111410] font-bold">
                      [{wordItem.root_details.morpheme}]
                    </span>
                  )}
                  {wordItem.suffix && (
                    <span className="px-1.5 py-0.5 bg-white text-[#111410] border border-[#111410]">
                      {wordItem.suffix}
                    </span>
                  )}
                </div>
              </div>

              {/* Study Card Quick Action */}
              <div className="mt-4 pt-3 border-t border-[#111410]/20 flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#62685E] uppercase">
                  Root: <strong>{wordItem.root_details?.morpheme}</strong>
                </span>
                {onSelectWordCard && (
                  <button
                    onClick={() => onSelectWordCard(wordItem)}
                    className="text-xs font-mono font-black uppercase text-[#7BB33B] hover:text-[#2F441E] flex items-center space-x-1"
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
