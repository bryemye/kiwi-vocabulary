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
  CheckCircle2,
  Edit3,
  Database,
  Loader2
} from 'lucide-react';
import { saveWordReview, getWordReview } from '../services/editorialService';
import { updateVocabularyWord } from '../services/api';

export default function EditorialReviewModal({
  isOpen,
  onClose,
  words = [],
  roots = [],
  initialWord = null,
  onSaveReview,
  onUpdateWord
}) {
  const [selectedWordName, setSelectedWordName] = useState(() => {
    if (initialWord) {
      return typeof initialWord === 'string' ? initialWord : initialWord.word;
    }
    return words[0]?.word || 'intermittent';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'UNREVIEWED' | 'VERIFIED'
  const [activeTabMode, setActiveTabMode] = useState('LEXICON'); // 'LEXICON' | 'CERTIFICATION'
  const [mobileView, setMobileView] = useState(() => (initialWord ? 'detail' : 'list'));
  const [isSavingWord, setIsSavingWord] = useState(false);
  const [autoMarkVerified, setAutoMarkVerified] = useState(true);
  const [reviewFormData, setReviewFormData] = useState({
    verified: false,
    notes: '',
    verifiedBy: 'Admin'
  });
  const [wordFormData, setWordFormData] = useState({
    word: '',
    prefix: '',
    suffix: '',
    root: '',
    mnemonic: '',
    definition: '',
    sat_sentence: '',
    connotation: 'neutral',
    part_of_speech: 'adjective',
    pronunciation: '',
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
      setWordFormData({
        word: activeWord.word || '',
        prefix: activeWord.prefix || '',
        suffix: activeWord.suffix || '',
        root: activeWord.root || activeWord.root_details?.id || '',
        mnemonic: activeWord.mnemonic || '',
        definition: activeWord.definition || '',
        sat_sentence: activeWord.sat_sentence || '',
        connotation: activeWord.connotation || 'neutral',
        part_of_speech: activeWord.part_of_speech || 'adjective',
        pronunciation: activeWord.pronunciation || '',
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

  const handleQuickVerify = async (moveToNext = false) => {
    if (!activeWord || isSavingWord) return;
    setIsSavingWord(true);
    try {
      const isVerified = !reviewFormData.verified;
      const updatedReview = {
        verified: isVerified,
        verifiedAt: isVerified ? new Date().toISOString() : null,
        verifiedBy: (reviewFormData.verifiedBy || 'Admin').trim(),
        notes: (reviewFormData.notes || '').trim()
      };

      const updated = await updateVocabularyWord(activeWord.id, { review: updatedReview });
      const completeUpdatedWord = { ...activeWord, ...updated, review: updatedReview };

      if (onUpdateWord) {
        onUpdateWord(completeUpdatedWord);
      }
      saveWordReview(activeWord.word, updatedReview);
      if (onSaveReview) {
        onSaveReview(activeWord.word, updatedReview);
      }
      setReviewFormData(prev => ({ ...prev, verified: isVerified }));
      setSaveToast(isVerified ? `"${activeWord.word}" marked as verified!` : `"${activeWord.word}" marked unverified`);
      setTimeout(() => setSaveToast(null), 3000);

      if (moveToNext) {
        const currentIndex = filteredWords.findIndex(w => w.word === activeWord.word);
        if (currentIndex !== -1 && currentIndex < filteredWords.length - 1) {
          setSelectedWordName(filteredWords[currentIndex + 1].word);
        }
      }
    } catch (err) {
      alert(`Failed to verify word: ${err.message}`);
    } finally {
      setIsSavingWord(false);
    }
  };

  const handleSaveWordDetails = async (moveToNext = false) => {
    if (!activeWord || isSavingWord) return;
    setIsSavingWord(true);
    try {
      const isVerified = autoMarkVerified || Boolean(reviewFormData.verified);
      const updatedReview = {
        verified: isVerified,
        verifiedAt: isVerified 
          ? (activeWord.review?.verifiedAt || new Date().toISOString())
          : null,
        verifiedBy: (reviewFormData.verifiedBy || 'Admin').trim(),
        notes: (reviewFormData.notes || '').trim()
      };

      const payload = {
        word: (wordFormData.word || '').trim(),
        prefix: (wordFormData.prefix || '').trim(),
        suffix: (wordFormData.suffix || '').trim(),
        root: Number(wordFormData.root),
        mnemonic: (wordFormData.mnemonic || '').trim(),
        definition: (wordFormData.definition || '').trim(),
        sat_sentence: (wordFormData.sat_sentence || '').trim(),
        connotation: wordFormData.connotation,
        part_of_speech: (wordFormData.part_of_speech || '').trim(),
        pronunciation: (wordFormData.pronunciation || '').trim(),
        review: updatedReview,
      };

      const updated = await updateVocabularyWord(activeWord.id, payload);
      const completeUpdatedWord = { ...activeWord, ...updated, review: updatedReview };

      if (onUpdateWord) {
        onUpdateWord(completeUpdatedWord);
      }
      saveWordReview(activeWord.word, updatedReview);
      if (onSaveReview) {
        onSaveReview(activeWord.word, updatedReview);
      }
      setReviewFormData(prev => ({ ...prev, verified: isVerified }));

      setSaveToast(isVerified ? `Saved & verified "${updated.word}"!` : `Saved changes for "${updated.word}"!`);
      setTimeout(() => setSaveToast(null), 3000);

      if (moveToNext) {
        const currentIndex = filteredWords.findIndex(w => w.word === activeWord.word);
        if (currentIndex !== -1 && currentIndex < filteredWords.length - 1) {
          setSelectedWordName(filteredWords[currentIndex + 1].word);
        }
      }
    } catch (err) {
      alert(`Failed to save word to database: ${err.message}`);
    } finally {
      setIsSavingWord(false);
    }
  };

  const parentRoot =
    roots.find(r => r.id === Number(wordFormData.root)) ||
    activeWord?.root_details ||
    roots.find(r => r.id === activeWord?.root);

  return (
    <div className="fixed inset-0 z-50 bg-[#111410]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div 
        className="bg-white border-2 border-[#111410] shadow-[6px_6px_0px_0px_#111410] sm:shadow-[8px_8px_0px_0px_#111410] w-full max-w-5xl h-full sm:h-[92vh] max-h-[100dvh] sm:max-h-[850px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3 sm:p-4 bg-[#FAFBF8] border-b-2 border-[#111410] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#7BB33B] text-white border border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-black font-mono uppercase text-[#111410] tracking-tight">
                  Editorial / Admin Lexicon Reviewer
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#111410] text-white hidden sm:inline-block">
                  CERTIFICATION PANEL
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#62685E] mt-0.5 hidden sm:block">
                Review AI-generated entries & attach editorial source attestations for SAT/ACT accuracy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 hover:bg-[#FDF2F2] hover:text-[#991B1B] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition"
            title="Close Reviewer (Esc)"
          >
            <X className="w-4 h-4 text-[#111410]" />
          </button>
        </div>

        {/* MOBILE VIEW TOGGLE TABS (< md) */}
        <div className="md:hidden flex border-b-2 border-[#111410] bg-[#FAFBF8] shrink-0 font-mono text-xs font-bold uppercase">
          <button
            onClick={() => setMobileView('list')}
            className={`flex-1 py-2.5 text-center flex items-center justify-center space-x-1.5 transition ${
              mobileView === 'list'
                ? 'bg-white text-[#111410] border-b-2 border-[#7BB33B] font-black'
                : 'text-[#62685E] hover:bg-[#FAFBF8]'
            }`}
          >
            <span>Words ({filteredWords.length})</span>
          </button>
          <button
            onClick={() => setMobileView('detail')}
            className={`flex-1 py-2.5 text-center flex items-center justify-center space-x-1.5 transition ${
              mobileView === 'detail'
                ? 'bg-white text-[#111410] border-b-2 border-[#7BB33B] font-black'
                : 'text-[#62685E] hover:bg-[#FAFBF8]'
            }`}
          >
            <span className="truncate">{activeWord?.word ? `Edit: ${activeWord.word}` : 'Edit Entry'}</span>
          </button>
        </div>

        {/* Modal Body: Master-Detail Split Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* LEFT: Word Selection Sidebar (Desktop width: 340px) */}
          <div className={`w-full md:w-[340px] border-b-2 md:border-b-0 md:border-r-2 border-[#111410] bg-[#FAFBF8] flex flex-col shrink-0 overflow-hidden ${
            mobileView === 'list' ? 'flex-1 h-full' : 'hidden md:flex'
          }`}>
            
            {/* Search and Filters */}
            <div className="p-3 border-b-2 border-[#111410] space-y-2 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#62685E]" />
                <input
                  type="text"
                  placeholder="Filter vocabulary..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#FAFBF8] border border-[#111410] text-base sm:text-xs font-mono placeholder:text-[#62685E] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
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
                      onClick={() => {
                        setSelectedWordName(w.word);
                        setMobileView('detail');
                      }}
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
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 bg-white ${
            mobileView === 'detail' ? 'block' : 'hidden md:block'
          }`}>
            {activeWord ? (
              <>
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden flex items-center space-x-1.5 px-3 py-1.5 bg-[#FAFBF8] border border-[#111410] text-xs font-mono font-bold uppercase text-[#111410] shadow-[1px_1px_0px_0px_#111410]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Word List</span>
                </button>

                {/* Word Title & Live Status Header */}
                <div className="border-b-2 border-[#111410] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1">
                      <h1 className="text-2xl sm:text-4xl font-black font-sans tracking-tight text-[#111410] uppercase break-words">
                        {activeWord.word}
                      </h1>
                      {reviewFormData.verified ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-[#EDF5E5] text-[#2F441E] border-2 border-[#111410] text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_#111410]">
                            ✓ VERIFIED
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickVerify(false)}
                            disabled={isSavingWord}
                            className="text-[10px] font-mono underline text-[#62685E] hover:text-[#991B1B] ml-1"
                            title="Click to unmark verification"
                          >
                            Unverify
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-[#FEF3C7] text-[#92400E] border-2 border-[#111410] text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_#111410]">
                          ⚠ UNREVIEWED
                        </span>
                      )}

                      {/* 1-Click Quick Verification Actions */}
                      <div className="flex items-center space-x-1.5 ml-0 sm:ml-2">
                        {!reviewFormData.verified && (
                          <button
                            type="button"
                            onClick={() => handleQuickVerify(false)}
                            disabled={isSavingWord}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_#111410] active:translate-x-[1px] active:translate-y-[1px] transition"
                            title="Verify this word as-is without making edits"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Verified</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleQuickVerify(true)}
                          disabled={isSavingWord}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-[#FAFBF8] hover:bg-white text-[#111410] border-2 border-[#111410] text-[10px] font-mono font-bold uppercase shadow-[2px_2px_0px_0px_#111410] active:translate-x-[1px] active:translate-y-[1px] transition"
                          title="Verify this word and jump immediately to the next word in the list"
                        >
                          <Check className="w-3.5 h-3.5 text-[#7BB33B]" />
                          <span>Verify &amp; Next</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-1.5 font-mono text-xs text-[#62685E]">
                      <span>{activeWord.pronunciation || '/phonetic/'}</span>
                      <span>·</span>
                      <span className="uppercase font-bold">{activeWord.part_of_speech || 'word'}</span>
                      {activeWord.connotation && (
                        <>
                          <span>·</span>
                          <span className="uppercase">{activeWord.connotation}</span>
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

                {/* Sub-Tab Switcher: Word Lexicon Editor vs Editorial Certification */}
                <div className="flex border-b-2 border-[#111410] font-mono text-xs bg-[#FAFBF8]">
                  <button
                    type="button"
                    onClick={() => setActiveTabMode('LEXICON')}
                    className={`flex-1 sm:flex-none px-4 py-2.5 font-black uppercase flex items-center justify-center space-x-2 border-r-2 border-[#111410] transition ${
                      activeTabMode === 'LEXICON'
                        ? 'bg-[#7BB33B] text-white shadow-[inset_0_-2px_0_0_#111410]'
                        : 'text-[#111410] hover:bg-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Lexicon &amp; Affixes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabMode('CERTIFICATION')}
                    className={`flex-1 sm:flex-none px-4 py-2.5 font-black uppercase flex items-center justify-center space-x-2 transition ${
                      activeTabMode === 'CERTIFICATION'
                        ? 'bg-[#7BB33B] text-white shadow-[inset_0_-2px_0_0_#111410]'
                        : 'text-[#111410] hover:bg-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Certification &amp; Notes</span>
                  </button>
                </div>

                {/* TAB 1: INTERACTIVE WORD LEXICON & AFFIXES EDITOR */}
                {activeTabMode === 'LEXICON' && (
                  <div className="p-3.5 sm:p-5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] sm:shadow-[4px_4px_0px_0px_#111410] space-y-4 animate-fade-in">
                    <div className="border-b border-[#111410]/20 pb-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-mono font-black uppercase text-[#111410]">
                        <Database className="w-4 h-4 text-[#7BB33B]" />
                        <span>MANUAL WORD ADJUSTMENTS · DATABASE PERSISTED</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#62685E]">
                        Staff / Editor Mode
                      </span>
                    </div>

                    {/* Morpheme Formula Row: Prefix, Root, Suffix */}
                    <div>
                      <span className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-1">
                        Morpheme Formula Deconstruction
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* Prefix Input */}
                        <div>
                          <label className="text-[9px] font-mono font-bold uppercase text-[#42281D] block mb-0.5">
                            Prefix (with gloss)
                          </label>
                          <input
                            type="text"
                            value={wordFormData.prefix}
                            onChange={(e) => setWordFormData(prev => ({ ...prev, prefix: e.target.value }))}
                            placeholder="e.g. dis- (apart, away)"
                            className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border-2 border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                          />
                        </div>

                        {/* Root Dropdown */}
                        <div>
                          <label className="text-[9px] font-mono font-bold uppercase text-[#42281D] block mb-0.5">
                            Root Family
                          </label>
                          <select
                            value={wordFormData.root}
                            onChange={(e) => setWordFormData(prev => ({ ...prev, root: e.target.value }))}
                            className="w-full text-xs font-mono px-2 py-1.5 bg-white border-2 border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                          >
                            {roots.map(r => (
                              <option key={r.id} value={r.id}>
                                [{r.morpheme.toUpperCase()}] ({r.language} · {r.core_meaning})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Suffix Input */}
                        <div>
                          <label className="text-[9px] font-mono font-bold uppercase text-[#42281D] block mb-0.5">
                            Suffix (with gloss)
                          </label>
                          <input
                            type="text"
                            value={wordFormData.suffix}
                            onChange={(e) => setWordFormData(prev => ({ ...prev, suffix: e.target.value }))}
                            placeholder="e.g. -ous (full of)"
                            className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border-2 border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Word Key / Memory Mnemonic Override */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="text-[10px] font-mono font-black uppercase text-[#62685E]">
                          Word Key / Mnemonic (Optional Override)
                        </label>
                        <div className="flex items-center space-x-2">
                          {!wordFormData.mnemonic?.trim() && parentRoot?.mnemonic && (
                            <button
                              type="button"
                              onClick={() => setWordFormData(prev => ({ ...prev, mnemonic: parentRoot.mnemonic }))}
                              className="text-[10px] font-mono font-bold text-[#2F441E] bg-[#EDF5E5] hover:bg-[#DCEDD0] border border-[#7BB33B] px-2 py-0.5 transition"
                            >
                              Copy Root Key
                            </button>
                          )}
                          {wordFormData.mnemonic?.trim() && (
                            <button
                              type="button"
                              onClick={() => setWordFormData(prev => ({ ...prev, mnemonic: '' }))}
                              className="text-[10px] font-mono font-bold text-[#62685E] hover:text-[#991B1B] bg-white border border-[#111410]/40 px-2 py-0.5 transition"
                            >
                              {parentRoot?.mnemonic ? 'Reset to Root Key' : 'Clear Key'}
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={wordFormData.mnemonic}
                        onChange={(e) => setWordFormData(prev => ({ ...prev, mnemonic: e.target.value }))}
                        placeholder={
                          parentRoot?.mnemonic
                            ? `Leave blank to fall back to root key: "${parentRoot.mnemonic}"`
                            : 'Enter a word-specific memory key / mnemonic...'
                        }
                        className="w-full text-xs font-serif italic p-2.5 bg-white border-2 border-[#111410] focus:outline-none focus:ring-2 focus:ring-[#7BB33B] resize-y"
                      />
                      <span className="text-[10px] font-mono text-[#62685E] mt-1 block">
                        {wordFormData.mnemonic?.trim()
                          ? `Custom word key active for "${activeWord.word}" (overrides root key).`
                          : parentRoot?.mnemonic
                            ? `Inheriting root key: "${parentRoot.mnemonic}"`
                            : 'No root key or word key set.'}
                      </span>
                    </div>

                    {/* Lexical Definition Textarea */}
                    <div>
                      <label className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-1">
                        Lexical Definition
                      </label>
                      <textarea
                        rows={3}
                        value={wordFormData.definition}
                        onChange={(e) => setWordFormData(prev => ({ ...prev, definition: e.target.value }))}
                        placeholder="Definition formatted cleanly for SAT/ACT students..."
                        className="w-full text-xs font-sans font-bold p-2.5 bg-white border-2 border-[#111410] focus:outline-none focus:ring-2 focus:ring-[#7BB33B] resize-y"
                      />
                    </div>

                    {/* SAT Exemplar Sentence Textarea */}
                    <div>
                      <label className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-1">
                        Contextual SAT Exemplar Sentence
                      </label>
                      <textarea
                        rows={3}
                        value={wordFormData.sat_sentence}
                        onChange={(e) => setWordFormData(prev => ({ ...prev, sat_sentence: e.target.value }))}
                        placeholder="SAT sentence demonstrating usage and context clues..."
                        className="w-full text-xs font-serif italic p-2.5 bg-white border-2 border-[#111410] focus:outline-none focus:ring-2 focus:ring-[#7BB33B] resize-y"
                      />
                    </div>

                    {/* Additional Linguistic Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[9px] font-mono font-bold uppercase text-[#42281D] block mb-0.5">
                          Part of Speech
                        </label>
                        <input
                          type="text"
                          value={wordFormData.part_of_speech}
                          onChange={(e) => setWordFormData(prev => ({ ...prev, part_of_speech: e.target.value }))}
                          placeholder="adjective, noun, verb"
                          className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border-2 border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-mono font-bold uppercase text-[#42281D] block mb-0.5">
                          Emotional Connotation
                        </label>
                        <select
                          value={wordFormData.connotation}
                          onChange={(e) => setWordFormData(prev => ({ ...prev, connotation: e.target.value }))}
                          className="w-full text-xs font-mono px-2 py-1.5 bg-white border-2 border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                        >
                          <option value="neutral">Neutral</option>
                          <option value="positive">Positive</option>
                          <option value="negative">Negative</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-mono font-bold uppercase text-[#42281D] block mb-0.5">
                          Phonetic Pronunciation
                        </label>
                        <input
                          type="text"
                          value={wordFormData.pronunciation}
                          onChange={(e) => setWordFormData(prev => ({ ...prev, pronunciation: e.target.value }))}
                          placeholder="/fəˈnɛtɪk/"
                          className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border-2 border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                        />
                      </div>
                    </div>

                    {/* Auto-verification toggle */}
                    <div className="pt-2 border-t border-[#111410]/15 flex items-center justify-between">
                      <label className="flex items-center space-x-2 text-xs font-mono font-bold cursor-pointer select-none text-[#111410]">
                        <input
                          type="checkbox"
                          checked={autoMarkVerified}
                          onChange={(e) => setAutoMarkVerified(e.target.checked)}
                          className="w-4 h-4 text-[#7BB33B] border-2 border-[#111410] rounded-none focus:ring-0 accent-[#7BB33B] cursor-pointer"
                        />
                        <span>Mark as Verified when saving</span>
                      </label>
                      <span className="text-[10px] font-mono text-[#62685E] hidden sm:inline">
                        {autoMarkVerified ? '✓ Word will be certified' : 'Word will remain unreviewed'}
                      </span>
                    </div>

                    {/* Word Save Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveWordDetails(false)}
                        disabled={isSavingWord}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 sm:py-2.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px] min-h-[44px] disabled:opacity-50"
                      >
                        {isSavingWord ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>{isSavingWord ? 'Saving & Verifying...' : (autoMarkVerified ? 'Save & Verify Word' : 'Save Word Changes')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveWordDetails(true)}
                        disabled={isSavingWord}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 sm:py-2.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px] min-h-[44px] disabled:opacity-50"
                      >
                        <span>{autoMarkVerified ? 'Save, Verify & Next' : 'Save & Next Word'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: EDITORIAL CERTIFICATION FORM */}
                {activeTabMode === 'CERTIFICATION' && (
                  <div className="p-3.5 sm:p-5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] sm:shadow-[4px_4px_0px_0px_#111410] space-y-3.5 sm:space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-[#111410]/20 pb-2">
                      <div className="flex items-center space-x-2 text-xs font-mono font-black uppercase text-[#111410]">
                        <ShieldCheck className="w-4 h-4 text-[#7BB33B]" />
                        <span>EDITORIAL VERIFICATION &amp; ATTESTATION</span>
                      </div>
                      {activeWord.review?.verifiedAt && (
                        <span className="text-[10px] font-mono text-[#62685E]">
                          {new Date(activeWord.review.verifiedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* 1. Checkbox: Mark as Independently Verified */}
                    <label className="flex items-start space-x-3 cursor-pointer select-none bg-white p-3 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] hover:bg-[#FAFBF8] transition">
                      <input
                        type="checkbox"
                        checked={reviewFormData.verified}
                        onChange={(e) => setReviewFormData(prev => ({ ...prev, verified: e.target.checked }))}
                        className="mt-0.5 w-5 h-5 text-[#7BB33B] border-2 border-[#111410] rounded-none focus:ring-0 accent-[#7BB33B] cursor-pointer shrink-0"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-mono font-black uppercase text-[#111410] block">
                          Mark as Independently Verified by Editor
                        </span>
                        <span className="text-[11px] sm:text-xs font-mono text-[#62685E] leading-relaxed block mt-0.5">
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
                        className="w-full text-base sm:text-xs font-mono px-3 py-2 bg-white border-2 border-[#111410] focus:outline-none focus:ring-2 focus:ring-[#7BB33B]"
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
                        placeholder="e.g. Checked against Merriam-Webster Unabridged; Latin root and etymology verified."
                        className="w-full text-base sm:text-xs font-sans p-2.5 sm:p-3 bg-white border-2 border-[#111410] focus:outline-none focus:ring-2 focus:ring-[#7BB33B] resize-y"
                      />
                      <span className="text-[10px] font-mono text-[#62685E] mt-1 block">
                        Internal editorial notes are strictly hidden from student views and preserved in exports.
                      </span>
                    </div>

                    {/* Commit Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-[#111410]/15">
                      <button
                        type="button"
                        onClick={() => handleSave(false)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 sm:py-2.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px] min-h-[44px]"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save Verification</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSave(true)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 sm:py-2.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px] min-h-[44px]"
                      >
                        <span>Save &amp; Next Word</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 sm:p-12 text-center text-xs font-mono text-[#62685E]">
                Select a word from the list to inspect and review.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
