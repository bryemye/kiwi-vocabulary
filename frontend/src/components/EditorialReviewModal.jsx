import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  AlertCircle, 
  Search, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { saveWordReview, getWordReview } from '../services/editorialService';

export default function EditorialReviewModal({
  isOpen,
  onClose,
  words = [],
  roots = [],
  initialWord = null,
  onSaveReview
}) {
  const [selectedWordName, setSelectedWordName] = useState(() => {
    if (initialWord) {
      return typeof initialWord === 'string' ? initialWord : initialWord.word;
    }
    return words[0]?.word || 'intermittent';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'UNREVIEWED' | 'VERIFIED'
  const [reviewFormData, setReviewFormData] = useState({
    verified: false,
    notes: '',
    verifiedBy: 'Admin'
  });
  const [saveToast, setSaveToast] = useState(null);

  // Sync initial word if passed
  useEffect(() => {
    if (initialWord) {
      const name = typeof initialWord === 'string' ? initialWord : initialWord.word;
      if (name) setSelectedWordName(name);
    }
  }, [initialWord]);

  // Find active word object
  const activeWord = useMemo(() => {
    if (!selectedWordName) return words[0] || null;
    const lower = selectedWordName.toLowerCase().trim();
    return words.find(w => w.word?.toLowerCase().trim() === lower) || words[0] || null;
  }, [words, selectedWordName]);

  // Sync form data when active word changes
  useEffect(() => {
    if (activeWord) {
      const stored = getWordReview(activeWord.word);
      const rev = activeWord.review || stored;
      setReviewFormData({
        verified: Boolean(rev?.verified),
        notes: rev?.notes || '',
        verifiedBy: rev?.verifiedBy || 'Admin'
      });
    }
  }, [activeWord]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter word list
  const filteredWords = useMemo(() => {
    return words.filter(w => {
      const isVerified = Boolean(w.review?.verified);
      if (filterMode === 'VERIFIED' && !isVerified) return false;
      if (filterMode === 'UNREVIEWED' && isVerified) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return w.word?.toLowerCase().includes(q) || w.definition?.toLowerCase().includes(q);
    });
  }, [words, filterMode, searchTerm]);

  if (!isOpen) return null;

  const handleSave = (moveToNext = false) => {
    if (!activeWord) return;
    const wordKey = activeWord.word;
    const isVerified = Boolean(reviewFormData.verified);

    const updatedReview = {
      verified: isVerified,
      verifiedAt: isVerified 
        ? (activeWord.review?.verifiedAt || new Date().toISOString())
        : null,
      verifiedBy: (reviewFormData.verifiedBy || 'Admin').trim(),
      notes: (reviewFormData.notes || '').trim()
    };

    saveWordReview(wordKey, updatedReview);
    if (onSaveReview) {
      onSaveReview(wordKey, updatedReview);
    }

    setSaveToast(`Attestation saved for "${wordKey}"!`);
    setTimeout(() => setSaveToast(null), 3000);

    if (moveToNext) {
      const currentIndex = filteredWords.findIndex(w => w.word === activeWord.word);
      if (currentIndex !== -1 && currentIndex < filteredWords.length - 1) {
        setSelectedWordName(filteredWords[currentIndex + 1].word);
      }
    }
  };

  const parentRoot = activeWord?.root_details || roots.find(r => r.id === activeWord?.root);

  return (
    <div className="fixed inset-0 z-50 bg-[#111410]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div 
        className="bg-white border-2 border-[#111410] shadow-[8px_8px_0px_0px_#111410] w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-[#FAFBF8] border-b-2 border-[#111410] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#7BB33B] text-white border border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-black font-mono uppercase text-[#111410] tracking-tight">
                  Editorial / Admin Lexicon Reviewer
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#111410] text-white">
                  CERTIFICATION PANEL
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#62685E] mt-0.5">
                Review AI-generated entries & attach editorial source attestations for SAT/ACT accuracy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#FDF2F2] hover:text-[#991B1B] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition"
            title="Close Reviewer (Esc)"
          >
            <X className="w-4 h-4 text-[#111410]" />
          </button>
        </div>

        {/* Modal Body: Master-Detail Split Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* LEFT: Word Selection Sidebar (Desktop width: 340px) */}
          <div className="w-full md:w-[340px] border-b-2 md:border-b-0 md:border-r-2 border-[#111410] bg-[#FAFBF8] flex flex-col shrink-0 max-h-[35vh] md:max-h-none overflow-hidden">
            
            {/* Search and Filters */}
            <div className="p-3 border-b-2 border-[#111410] space-y-2 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#62685E]" />
                <input
                  type="text"
                  placeholder="Filter vocabulary..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#FAFBF8] border border-[#111410] text-xs font-mono placeholder:text-[#62685E] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1 text-[10px] font-mono font-bold">
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`flex-1 py-1 border transition ${
                    filterMode === 'ALL'
                      ? 'bg-[#111410] text-white border-[#111410]'
                      : 'bg-[#FAFBF8] hover:bg-white text-[#62685E] border-gray-300'
                  }`}
                >
                  All ({words.length})
                </button>
                <button
                  onClick={() => setFilterMode('UNREVIEWED')}
                  className={`flex-1 py-1 border transition ${
                    filterMode === 'UNREVIEWED'
                      ? 'bg-[#FEF3C7] text-[#92400E] border-[#111410] font-black'
                      : 'bg-[#FAFBF8] hover:bg-white text-[#62685E] border-gray-300'
                  }`}
                >
                  Unreviewed ({words.filter(w => !w.review?.verified).length})
                </button>
                <button
                  onClick={() => setFilterMode('VERIFIED')}
                  className={`flex-1 py-1 border transition ${
                    filterMode === 'VERIFIED'
                      ? 'bg-[#EDF5E5] text-[#2F441E] border-[#111410] font-black'
                      : 'bg-[#FAFBF8] hover:bg-white text-[#62685E] border-gray-300'
                  }`}
                >
                  Verified ({words.filter(w => w.review?.verified).length})
                </button>
              </div>
            </div>

            {/* Scrollable Word List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#111410]/15">
              {filteredWords.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-[#62685E]">
                  No matching words found.
                </div>
              ) : (
                filteredWords.map((w) => {
                  const isSelected = activeWord?.word?.toLowerCase() === w.word?.toLowerCase();
                  const isVerified = Boolean(w.review?.verified);

                  return (
                    <div
                      key={w.word || w.id}
                      onClick={() => setSelectedWordName(w.word)}
                      className={`p-3 cursor-pointer transition flex items-center justify-between ${
                        isSelected 
                          ? 'bg-[#EDF5E5] text-[#111410] border-l-4 border-l-[#7BB33B] font-bold'
                          : 'hover:bg-white bg-[#FAFBF8]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-sans font-bold uppercase truncate">
                            {w.word}
                          </span>
                          <span className="text-[10px] font-mono text-[#62685E]">
                            {w.part_of_speech}
                          </span>
                        </div>
                        <p className="text-[11px] font-sans text-[#62685E] truncate mt-0.5">
                          {w.definition}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isVerified ? (
                          <span className="px-1.5 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B] text-[9px] font-mono font-black uppercase" title="Verified by editor">
                            ✓
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" title="Unreviewed entry" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Active Entry Inspection & Verification Form */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-white">
            {activeWord ? (
              <>
                {/* Word Title & Live Status Header */}
                <div className="border-b-2 border-[#111410] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h1 className="text-3xl sm:text-4xl font-black font-sans tracking-tight text-[#111410] uppercase">
                        {activeWord.word}
                      </h1>
                      {reviewFormData.verified ? (
                        <span className="px-2.5 py-1 bg-[#EDF5E5] text-[#2F441E] border-2 border-[#111410] text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_#111410]">
                          ✓ STATUS: VERIFIED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] border-2 border-[#111410] text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_#111410]">
                          ⚠ STATUS: UNREVIEWED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-1.5 font-mono text-xs text-[#62685E]">
                      <span>{activeWord.pronunciation || '/phonetic/'}</span>
                      <span>·</span>
                      <span className="uppercase font-bold">{activeWord.part_of_speech || 'word'}</span>
                      {activeWord.connotation && (
                        <>
                          <span>·</span>
                          <span className="uppercase">{activeWord.connotation} connotation</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Toast Save Alert */}
                  {saveToast && (
                    <div className="px-3 py-1.5 bg-[#EDF5E5] border border-[#7BB33B] text-[#2F441E] text-xs font-mono font-bold flex items-center space-x-1.5 animate-fade-in shadow-[2px_2px_0px_0px_#7BB33B]">
                      <CheckCircle2 className="w-4 h-4 text-[#7BB33B]" />
                      <span>{saveToast}</span>
                    </div>
                  )}
                </div>

                {/* Morpheme & Etymology Reference Box */}
                <div className="p-3.5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
                  <span className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-1.5">
                    Morpheme Deconstruction &amp; Root Origin
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                    {activeWord.prefix && (
                      <span className="px-2 py-0.5 bg-white border border-[#111410] font-bold text-[#42281D]">
                        [{activeWord.prefix}]
                      </span>
                    )}
                    {parentRoot && (
                      <span className="px-2.5 py-0.5 bg-[#EFE8DF] border-2 border-[#111410] font-black text-[#111410]">
                        [{parentRoot.morpheme}] ({parentRoot.language} · "{parentRoot.core_meaning}")
                      </span>
                    )}
                    {activeWord.suffix && (
                      <span className="px-2 py-0.5 bg-white border border-[#111410] font-bold text-[#42281D]">
                        [{activeWord.suffix}]
                      </span>
                    )}
                  </div>
                </div>

                {/* Lexical Definition & Sentence Exemplar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
                    <span className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-1">
                      Lexical Definition
                    </span>
                    <p className="text-xs sm:text-sm font-sans font-bold text-[#111410] leading-snug">
                      {activeWord.definition}
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
                    <span className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-1">
                      Contextual SAT Exemplar
                    </span>
                    <p className="text-xs sm:text-sm font-serif italic text-[#111410] leading-snug">
                      "{activeWord.sat_sentence}"
                    </p>
                  </div>
                </div>

                {/* EDITORIAL CERTIFICATION FORM (Interactive Form) */}
                <div className="p-4 sm:p-5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#111410]/20 pb-2">
                    <div className="flex items-center space-x-2 text-xs font-mono font-black uppercase text-[#111410]">
                      <ShieldCheck className="w-4 h-4 text-[#7BB33B]" />
                      <span>EDITORIAL VERIFICATION ATTESTATION</span>
                    </div>
                    {activeWord.review?.verifiedAt && (
                      <span className="text-[10px] font-mono text-[#62685E]">
                        Last certified: {new Date(activeWord.review.verifiedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* 1. Checkbox: Mark as Independently Verified */}
                  <label className="flex items-start space-x-3 cursor-pointer select-none bg-white p-3 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] hover:bg-[#FAFBF8] transition">
                    <input
                      type="checkbox"
                      checked={reviewFormData.verified}
                      onChange={(e) => setReviewFormData(prev => ({ ...prev, verified: e.target.checked }))}
                      className="mt-0.5 w-5 h-5 text-[#7BB33B] border-2 border-[#111410] rounded-none focus:ring-0 accent-[#7BB33B] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-mono font-black uppercase text-[#111410] block">
                        Mark as Independently Verified by Editor
                      </span>
                      <span className="text-xs font-mono text-[#62685E] leading-relaxed block mt-0.5">
                        Certifies definition accuracy, morpheme formula decomposition, and SAT/ACT relevance.
                      </span>
                    </div>
                  </label>

                  {/* 2. Reviewer Name Input */}
                  <div>
                    <label className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-1">
                      Verified By (Editor Name / Affiliation)
                    </label>
                    <input
                      type="text"
                      value={reviewFormData.verifiedBy}
                      onChange={(e) => setReviewFormData(prev => ({ ...prev, verifiedBy: e.target.value }))}
                      placeholder="e.g. Admin, Senior Lexicographer"
                      className="w-full text-xs font-mono px-3 py-2 bg-white border-2 border-[#111410] focus:outline-none focus:ring-2 focus:ring-[#7BB33B]"
                    />
                  </div>

                  {/* 3. Text area: Editorial Notes / Source Attestation */}
                  <div>
                    <label className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-1">
                      Editorial Notes / Source Attestation
                    </label>
                    <textarea
                      rows={3}
                      value={reviewFormData.notes}
                      onChange={(e) => setReviewFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="e.g. Checked against Merriam-Webster Unabridged; Latin root and etymology verified for exam nuance."
                      className="w-full text-xs font-sans p-3 bg-white border-2 border-[#111410] focus:outline-none focus:ring-2 focus:ring-[#7BB33B] resize-y"
                    />
                    <span className="text-[10px] font-mono text-[#62685E] mt-1 block">
                      Internal editorial notes are strictly hidden from student views and preserved in exports.
                    </span>
                  </div>

                  {/* Commit Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <button
                      onClick={() => handleSave(false)}
                      className="w-full sm:flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Verification</span>
                    </button>

                    <button
                      onClick={() => handleSave(true)}
                      className="w-full sm:flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      <span>Save &amp; Next Word</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-xs font-mono text-[#62685E]">
                Select a word from the left sidebar to inspect and review.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
