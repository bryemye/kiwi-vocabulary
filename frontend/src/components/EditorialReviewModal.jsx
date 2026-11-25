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
  Loader2,
  History,
  Clock,
  Eye,
  EyeOff,
  Plus,
  ArrowUp,
  ArrowDown,
  Link2
} from 'lucide-react';
import {
  saveWordReview,
  getWordReview,
  buildUpdatedReview,
  formatVerificationTimestamp,
  normalizeHistoryEntries,
  getAllVerificationHistory,
} from '../services/editorialService';
import { updateVocabularyWord, createRoot } from '../services/api';
import VerificationHistoryList from './VerificationHistoryList';

const ROOT_LANGUAGES = [
  'Latin',
  'Greek',
  'French',
  'Old French',
  'German',
  'Old English',
  'Old Norse',
  'Arabic',
  'Sanskrit',
  'Tamil / Indian',
  'Latin / Greek',
  'Greek / Latin',
  'Latin / Old French',
  'Old English / Old Norse',
];

const ROOT_CLUSTERS = [
  'Motion & Travel',
  'Force & Transformation',
  'Position & Holding',
  'Senses & Perception',
  'Communication',
  'Cognition',
  'Emotion',
  'Power & Conflict',
  'Law & Morality',
  'Form & Nature',
  'Quantity & Relation',
];

const ROOT_TIERS = [
  'Tier 1 High-Yield',
  'Tier 2 Multipliers',
  'Tier 3 Advanced',
];

function extractInitialRootIds(wordObj) {
  if (!wordObj) return [];
  if (Array.isArray(wordObj.roots) && wordObj.roots.length > 0) {
    return wordObj.roots.map(Number).filter((id) => !Number.isNaN(id) && id > 0);
  }
  if (Array.isArray(wordObj.roots_details) && wordObj.roots_details.length > 0) {
    return wordObj.roots_details.map((r) => Number(r?.id)).filter((id) => !Number.isNaN(id) && id > 0);
  }
  const single = Number(wordObj.root || wordObj.root_details?.id);
  return single && !Number.isNaN(single) ? [single] : [];
}

function formatRootAffixLabel(rootObj, kind) {
  if (!rootObj) return '';
  const morph = String(rootObj.morpheme || '').split('/')[0].trim().toLowerCase();
  const meaning = String(rootObj.core_meaning || '').trim();
  const token = kind === 'prefix' ? `${morph}-` : `-${morph}`;
  return meaning ? `${token} (${meaning})` : token;
}

export default function EditorialReviewModal({
  isOpen,
  onClose,
  words = [],
  roots = [],
  initialWord = null,
  initialTab = 'LEXICON',
  onSaveReview,
  onUpdateWord,
  onCreateRoot
}) {
  const [selectedWordName, setSelectedWordName] = useState(() => {
    if (initialWord) {
      return typeof initialWord === 'string' ? initialWord : initialWord.word;
    }
    return words[0]?.word || 'intermittent';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'UNREVIEWED' | 'VERIFIED'
  const [activeTabMode, setActiveTabMode] = useState(initialTab || 'LEXICON'); // 'LEXICON' | 'CERTIFICATION' | 'HISTORY'
  const [historySearch, setHistorySearch] = useState('');
  const [historyActionFilter, setHistoryActionFilter] = useState('ALL');
  const [mobileView, setMobileView] = useState(() => (initialWord || initialTab === 'HISTORY' ? 'detail' : 'list'));
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
    prefixMode: 'custom',
    prefixRoot: '',
    suffix: '',
    suffixMode: 'custom',
    suffixRoot: '',
    roots: [],
    mnemonic: '',
    definition: '',
    sat_sentence: '',
    connotation: 'neutral',
    part_of_speech: 'adjective',
    pronunciation: '',
  });
  const [rootToAddId, setRootToAddId] = useState('');
  const [rootPickerFilter, setRootPickerFilter] = useState('');
  const [showNewRootForm, setShowNewRootForm] = useState(false);
  const [isCreatingRoot, setIsCreatingRoot] = useState(false);
  const [newRootForm, setNewRootForm] = useState({
    morpheme: '',
    language: 'Latin',
    core_meaning: '',
    mnemonic: '',
    thematic_cluster: 'Motion & Travel',
    sat_tier: 'Tier 1 High-Yield',
  });
  const [saveToast, setSaveToast] = useState(null);

  // Sync initial word and tab when modal opens
  useEffect(() => {
    if (initialWord) {
      const name = typeof initialWord === 'string' ? initialWord : initialWord.word;
      if (name) setSelectedWordName(name);
    }
  }, [initialWord]);

  useEffect(() => {
    if (isOpen) {
      const nextTab = initialTab || 'LEXICON';
      setActiveTabMode(nextTab);
      if (nextTab === 'HISTORY' || initialWord) {
        setMobileView('detail');
      }
    }
  }, [isOpen, initialTab, initialWord]);

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
      const prefixRootId = activeWord.prefix_root || activeWord.prefix_root_details?.id || '';
      const suffixRootId = activeWord.suffix_root || activeWord.suffix_root_details?.id || '';
      setWordFormData({
        word: activeWord.word || '',
        prefix: activeWord.prefix || '',
        prefixMode: prefixRootId ? 'root' : 'custom',
        prefixRoot: prefixRootId ? String(prefixRootId) : '',
        suffix: activeWord.suffix || '',
        suffixMode: suffixRootId ? 'root' : 'custom',
        suffixRoot: suffixRootId ? String(suffixRootId) : '',
        roots: extractInitialRootIds(activeWord),
        mnemonic: activeWord.mnemonic || '',
        definition: activeWord.definition || '',
        sat_sentence: activeWord.sat_sentence || '',
        connotation: activeWord.connotation || 'neutral',
        part_of_speech: activeWord.part_of_speech || 'adjective',
        pronunciation: activeWord.pronunciation || '',
      });
      setRootToAddId('');
      setRootPickerFilter('');
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
      const isPublished = w.is_published !== false;
      if (filterMode === 'VERIFIED' && !isVerified) return false;
      if (filterMode === 'UNREVIEWED' && (isVerified || !isPublished)) return false;
      if (filterMode === 'UNPUBLISHED' && isPublished) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return w.word?.toLowerCase().includes(q) || w.definition?.toLowerCase().includes(q);
    });
  }, [words, filterMode, searchTerm]);

  const unreviewedCount = useMemo(
    () => words.filter(w => !w.review?.verified && w.is_published !== false).length,
    [words]
  );

  const unpublishedCount = useMemo(
    () => words.filter(w => w.is_published === false).length,
    [words]
  );

  const activeWordHistory = useMemo(
    () => normalizeHistoryEntries(activeWord?.review),
    [activeWord]
  );

  const allHistoryEvents = useMemo(
    () => (isOpen ? getAllVerificationHistory(words) : []),
    [isOpen, words]
  );

  const filteredHistoryEvents = useMemo(() => {
    return allHistoryEvents.filter((entry) => {
      if (historyActionFilter !== 'ALL' && entry.action !== historyActionFilter) {
        return false;
      }
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase().trim();
      return (
        entry.word?.toLowerCase().includes(q) ||
        entry.by?.toLowerCase().includes(q) ||
        entry.notes?.toLowerCase().includes(q) ||
        entry.summary?.toLowerCase().includes(q)
      );
    });
  }, [allHistoryEvents, historyActionFilter, historySearch]);

  const sortedRoots = useMemo(() => {
    return [...roots].sort((a, b) => (a.morpheme || '').localeCompare(b.morpheme || ''));
  }, [roots]);

  const attachedRootObjects = useMemo(() => {
    const byId = new Map(roots.map((r) => [Number(r.id), r]));
    return (wordFormData.roots || [])
      .map((id) => byId.get(Number(id)))
      .filter(Boolean);
  }, [roots, wordFormData.roots]);

  const availableRootsToAdd = useMemo(() => {
    const attached = new Set((wordFormData.roots || []).map(Number));
    const q = rootPickerFilter.trim().toLowerCase();
    return sortedRoots.filter((r) => {
      if (attached.has(Number(r.id))) return false;
      if (!q) return true;
      return (
        (r.morpheme || '').toLowerCase().includes(q) ||
        (r.core_meaning || '').toLowerCase().includes(q) ||
        (r.language || '').toLowerCase().includes(q)
      );
    });
  }, [sortedRoots, wordFormData.roots, rootPickerFilter]);

  if (!isOpen) return null;

  const handleSave = async (moveToNext = false) => {
    if (!activeWord || isSavingWord) return;
    setIsSavingWord(true);
    try {
      const wordKey = activeWord.word;
      const isVerified = Boolean(reviewFormData.verified);

      const updatedReview = buildUpdatedReview(activeWord.review, {
        verified: isVerified,
        verifiedBy: reviewFormData.verifiedBy,
        notes: reviewFormData.notes,
      });

      let savedWordPayload = null;
      if (activeWord.id) {
        try {
          const updated = await updateVocabularyWord(activeWord.id, { review: updatedReview });
          savedWordPayload = {
            ...activeWord,
            ...updated,
            review: updated?.review || updatedReview,
          };
        } catch (err) {
          console.warn('Backend review sync failed, falling back to localStorage:', err);
        }
      }

      const finalReview = savedWordPayload?.review || updatedReview;
      saveWordReview(wordKey, finalReview);
      if (savedWordPayload && onUpdateWord) {
        onUpdateWord(savedWordPayload);
      }
      if (onSaveReview) {
        onSaveReview(wordKey, finalReview);
      }

      setSaveToast(`Verification & history saved for "${wordKey}"!`);
      setTimeout(() => setSaveToast(null), 3000);

      if (moveToNext) {
        const currentIndex = filteredWords.findIndex(w => w.word === activeWord.word);
        if (currentIndex !== -1 && currentIndex < filteredWords.length - 1) {
          setSelectedWordName(filteredWords[currentIndex + 1].word);
        }
      }
    } finally {
      setIsSavingWord(false);
    }
  };

  const handleQuickVerify = async (moveToNext = false) => {
    if (!activeWord || isSavingWord) return;
    setIsSavingWord(true);
    try {
      const isVerified = !reviewFormData.verified;
      const updatedReview = buildUpdatedReview(
        activeWord.review,
        {
          verified: isVerified,
          verifiedBy: reviewFormData.verifiedBy,
          notes: reviewFormData.notes,
        },
        {
          action: isVerified ? 'verified' : 'unverified',
        }
      );

      const updated = await updateVocabularyWord(activeWord.id, { review: updatedReview });
      const finalReview = updated?.review || updatedReview;
      const completeUpdatedWord = { ...activeWord, ...updated, review: finalReview };

      if (onUpdateWord) {
        onUpdateWord(completeUpdatedWord);
      }
      saveWordReview(activeWord.word, finalReview);
      if (onSaveReview) {
        onSaveReview(activeWord.word, finalReview);
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

  const handleTogglePublish = async () => {
    if (!activeWord || isSavingWord) return;
    setIsSavingWord(true);
    try {
      const nextPublished = activeWord.is_published === false;
      const updatedReview = buildUpdatedReview(
        activeWord.review,
        {
          verified: Boolean(activeWord.review?.verified),
          verifiedBy: reviewFormData.verifiedBy,
          notes: reviewFormData.notes,
        },
        {
          action: nextPublished ? 'published' : 'unpublished',
        }
      );

      let savedWordPayload = null;
      if (activeWord.id) {
        const updated = await updateVocabularyWord(activeWord.id, {
          is_published: nextPublished,
          review: updatedReview,
        });
        savedWordPayload = {
          ...activeWord,
          ...updated,
          is_published: updated?.is_published ?? nextPublished,
          review: updated?.review || updatedReview,
        };
      } else {
        savedWordPayload = {
          ...activeWord,
          is_published: nextPublished,
          review: updatedReview,
        };
      }

      const finalReview = savedWordPayload.review;
      if (onUpdateWord) {
        onUpdateWord(savedWordPayload);
      }
      saveWordReview(activeWord.word, finalReview);
      if (onSaveReview) {
        onSaveReview(activeWord.word, finalReview);
      }

      setSaveToast(
        nextPublished
          ? `"${activeWord.word}" re-published to student lexicon!`
          : `"${activeWord.word}" unpublished (hidden from students)`
      );
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      alert(`Failed to update publication status: ${err.message}`);
    } finally {
      setIsSavingWord(false);
    }
  };

  const handleAddRoot = (rootIdToAdd) => {
    const numId = Number(rootIdToAdd);
    if (!numId || Number.isNaN(numId)) return;
    setWordFormData((prev) => {
      if (prev.roots.includes(numId)) return prev;
      return { ...prev, roots: [...prev.roots, numId] };
    });
    setRootToAddId('');
  };

  const handleRemoveRoot = (rootIdToRemove) => {
    setWordFormData((prev) => {
      if (prev.roots.length <= 1) return prev;
      return {
        ...prev,
        roots: prev.roots.filter((id) => Number(id) !== Number(rootIdToRemove)),
      };
    });
  };

  const handleMoveRoot = (index, direction) => {
    setWordFormData((prev) => {
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= prev.roots.length) return prev;
      const nextRoots = [...prev.roots];
      const [moved] = nextRoots.splice(index, 1);
      nextRoots.splice(targetIdx, 0, moved);
      return { ...prev, roots: nextRoots };
    });
  };

  const handleSelectAffixRoot = (kind, rootIdStr) => {
    const chosenRoot = roots.find((r) => Number(r.id) === Number(rootIdStr));
    if (kind === 'prefix') {
      setWordFormData((prev) => {
        const prevRoot = roots.find((r) => Number(r.id) === Number(prev.prefixRoot));
        const prevAuto = prevRoot ? formatRootAffixLabel(prevRoot, 'prefix') : '';
        const shouldAutoFill = !prev.prefix.trim() || prev.prefix.trim() === prevAuto;
        return {
          ...prev,
          prefixMode: 'root',
          prefixRoot: rootIdStr,
          prefix: chosenRoot && shouldAutoFill ? formatRootAffixLabel(chosenRoot, 'prefix') : prev.prefix,
        };
      });
    } else {
      setWordFormData((prev) => {
        const prevRoot = roots.find((r) => Number(r.id) === Number(prev.suffixRoot));
        const prevAuto = prevRoot ? formatRootAffixLabel(prevRoot, 'suffix') : '';
        const shouldAutoFill = !prev.suffix.trim() || prev.suffix.trim() === prevAuto;
        return {
          ...prev,
          suffixMode: 'root',
          suffixRoot: rootIdStr,
          suffix: chosenRoot && shouldAutoFill ? formatRootAffixLabel(chosenRoot, 'suffix') : prev.suffix,
        };
      });
    }
  };

  const handleCreateInlineRoot = async () => {
    const morpheme = newRootForm.morpheme.trim();
    const coreMeaning = newRootForm.core_meaning.trim();
    if (!morpheme || !coreMeaning || isCreatingRoot) return;
    setIsCreatingRoot(true);
    try {
      const created = await createRoot({
        morpheme,
        language: newRootForm.language || 'Latin',
        core_meaning: coreMeaning,
        mnemonic: newRootForm.mnemonic.trim(),
        thematic_cluster: newRootForm.thematic_cluster,
        sat_tier: newRootForm.sat_tier,
      });
      if (onCreateRoot) {
        onCreateRoot(created);
      }
      if (created?.id) {
        setWordFormData((prev) => ({
          ...prev,
          roots: prev.roots.includes(Number(created.id)) ? prev.roots : [...prev.roots, Number(created.id)],
        }));
      }
      setShowNewRootForm(false);
      setNewRootForm({
        morpheme: '',
        language: 'Latin',
        core_meaning: '',
        mnemonic: '',
        thematic_cluster: 'Motion & Travel',
        sat_tier: 'Tier 1 High-Yield',
      });
      setSaveToast(`Created & attached root [${created.morpheme.toUpperCase()}]!`);
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err) {
      alert(`Failed to create root: ${err.message}`);
    } finally {
      setIsCreatingRoot(false);
    }
  };

  const handleSaveWordDetails = async (moveToNext = false) => {
    if (!activeWord || isSavingWord) return;
    const normalizedRoots = (wordFormData.roots || []).map(Number).filter((id) => !Number.isNaN(id) && id > 0);
    if (normalizedRoots.length === 0) {
      alert('A vocabulary word must have at least one root.');
      return;
    }

    const effectivePrefixRoot =
      wordFormData.prefixMode === 'root' && wordFormData.prefixRoot
        ? Number(wordFormData.prefixRoot)
        : null;
    const effectiveSuffixRoot =
      wordFormData.suffixMode === 'root' && wordFormData.suffixRoot
        ? Number(wordFormData.suffixRoot)
        : null;

    setIsSavingWord(true);
    try {
      const oldRoots = extractInitialRootIds(activeWord);
      const oldPrefixRoot = activeWord.prefix_root || activeWord.prefix_root_details?.id || null;
      const oldSuffixRoot = activeWord.suffix_root || activeWord.suffix_root_details?.id || null;

      const changedFields = [];
      if ((wordFormData.prefix || '').trim() !== (activeWord.prefix || '').trim()) changedFields.push('prefix');
      if (effectivePrefixRoot !== (oldPrefixRoot ? Number(oldPrefixRoot) : null)) changedFields.push('prefix_root');
      if ((wordFormData.suffix || '').trim() !== (activeWord.suffix || '').trim()) changedFields.push('suffix');
      if (effectiveSuffixRoot !== (oldSuffixRoot ? Number(oldSuffixRoot) : null)) changedFields.push('suffix_root');
      if (JSON.stringify(normalizedRoots) !== JSON.stringify(oldRoots)) changedFields.push('roots');
      if ((wordFormData.mnemonic || '').trim() !== (activeWord.mnemonic || '').trim()) changedFields.push('mnemonic');
      if ((wordFormData.definition || '').trim() !== (activeWord.definition || '').trim()) changedFields.push('definition');
      if ((wordFormData.sat_sentence || '').trim() !== (activeWord.sat_sentence || '').trim()) changedFields.push('sat_sentence');
      if (wordFormData.connotation !== (activeWord.connotation || 'neutral')) changedFields.push('connotation');
      if ((wordFormData.part_of_speech || '').trim() !== (activeWord.part_of_speech || '').trim()) changedFields.push('part_of_speech');
      if ((wordFormData.pronunciation || '').trim() !== (activeWord.pronunciation || '').trim()) changedFields.push('pronunciation');

      const isVerified = autoMarkVerified || Boolean(reviewFormData.verified);
      const wasVerified = Boolean(activeWord.review?.verified);
      const notesChanged = (reviewFormData.notes || '').trim() !== (activeWord.review?.notes || '').trim();

      const updatedReview =
        isVerified || wasVerified || notesChanged
          ? buildUpdatedReview(
              activeWord.review,
              {
                verified: isVerified,
                verifiedBy: reviewFormData.verifiedBy,
                notes: reviewFormData.notes,
              },
              {
                action: isVerified
                  ? (changedFields.length > 0 ? 'edited_and_verified' : 'verified')
                  : undefined,
                changedFields,
              }
            )
          : (activeWord.review || {});

      const payload = {
        word: (wordFormData.word || '').trim(),
        prefix: (wordFormData.prefix || '').trim(),
        prefix_root: effectivePrefixRoot,
        suffix: (wordFormData.suffix || '').trim(),
        suffix_root: effectiveSuffixRoot,
        root: normalizedRoots[0],
        roots: normalizedRoots,
        mnemonic: (wordFormData.mnemonic || '').trim(),
        definition: (wordFormData.definition || '').trim(),
        sat_sentence: (wordFormData.sat_sentence || '').trim(),
        connotation: wordFormData.connotation,
        part_of_speech: (wordFormData.part_of_speech || '').trim(),
        pronunciation: (wordFormData.pronunciation || '').trim(),
        review: updatedReview,
      };

      const updated = await updateVocabularyWord(activeWord.id, payload);
      const finalReview = updated?.review || updatedReview;
      const completeUpdatedWord = { ...activeWord, ...updated, review: finalReview };

      if (onUpdateWord) {
        onUpdateWord(completeUpdatedWord);
      }
      saveWordReview(activeWord.word, finalReview);
      if (onSaveReview) {
        onSaveReview(activeWord.word, finalReview);
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
    attachedRootObjects[0] ||
    activeWord?.roots_details?.[0] ||
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] font-mono font-bold">
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`py-1 px-1 border transition truncate ${
                    filterMode === 'ALL'
                      ? 'bg-[#111410] text-white border-[#111410]'
                      : 'bg-[#FAFBF8] hover:bg-white text-[#62685E] border-gray-300'
                  }`}
                >
                  All ({words.length})
                </button>
                <button
                  onClick={() => setFilterMode('UNREVIEWED')}
                  className={`py-1 px-1 border transition truncate ${
                    filterMode === 'UNREVIEWED'
                      ? 'bg-[#FEF3C7] text-[#92400E] border-[#111410] font-black'
                      : 'bg-[#FAFBF8] hover:bg-white text-[#62685E] border-gray-300'
                  }`}
                >
                  Unrev ({unreviewedCount})
                </button>
                <button
                  onClick={() => setFilterMode('VERIFIED')}
                  className={`py-1 px-1 border transition truncate ${
                    filterMode === 'VERIFIED'
                      ? 'bg-[#EDF5E5] text-[#2F441E] border-[#111410] font-black'
                      : 'bg-[#FAFBF8] hover:bg-white text-[#62685E] border-gray-300'
                  }`}
                >
                  Verif ({words.filter(w => w.review?.verified).length})
                </button>
                <button
                  onClick={() => setFilterMode('UNPUBLISHED')}
                  className={`py-1 px-1 border transition truncate ${
                    filterMode === 'UNPUBLISHED'
                      ? 'bg-[#FDF2F2] text-[#991B1B] border-[#111410] font-black'
                      : 'bg-[#FAFBF8] hover:bg-white text-[#62685E] border-gray-300'
                  }`}
                >
                  Hidden ({unpublishedCount})
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

                      <div className="shrink-0 flex items-center space-x-1">
                        {w.is_published === false && (
                          <span className="px-1.5 py-0.5 bg-[#FDF2F2] text-[#991B1B] border border-[#DC2626]/50 text-[9px] font-mono font-black uppercase" title="Unpublished (hidden from students)">
                            HIDDEN
                          </span>
                        )}
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

          {/* RIGHT: Active Entry Inspection, Verification Form & History */}
          <div className={`flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 bg-white ${
            mobileView === 'detail' ? 'block' : 'hidden md:block'
          }`}>
            {activeTabMode === 'HISTORY' ? (
              <div className="space-y-4 animate-fade-in">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden flex items-center space-x-1.5 px-3 py-1.5 bg-[#FAFBF8] border border-[#111410] text-xs font-mono font-bold uppercase text-[#111410] shadow-[1px_1px_0px_0px_#111410]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Word List</span>
                </button>

                {/* Sub-Tab Switcher at top when in HISTORY mode */}
                <div className="flex flex-wrap border-b-2 border-[#111410] font-mono text-xs bg-[#FAFBF8]">
                  <button
                    type="button"
                    onClick={() => setActiveTabMode('LEXICON')}
                    className="flex-1 sm:flex-none px-4 py-2.5 font-black uppercase flex items-center justify-center space-x-2 border-r-2 border-[#111410] text-[#111410] hover:bg-white transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Lexicon &amp; Affixes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabMode('CERTIFICATION')}
                    className="flex-1 sm:flex-none px-4 py-2.5 font-black uppercase flex items-center justify-center space-x-2 border-r-2 border-[#111410] text-[#111410] hover:bg-white transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Certification &amp; Notes</span>
                    {activeWordHistory.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-[#111410] text-white text-[9px] font-black">
                        {activeWordHistory.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabMode('HISTORY')}
                    className="flex-1 sm:flex-none px-4 py-2.5 font-black uppercase flex items-center justify-center space-x-2 bg-[#7BB33B] text-white shadow-[inset_0_-2px_0_0_#111410] transition"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Verification History</span>
                    <span className="px-1.5 py-0.2 bg-[#111410] text-white text-[9px] font-black">
                      {allHistoryEvents.length}
                    </span>
                  </button>
                </div>

                {/* Global Verification History Panel */}
                <div className="p-3.5 sm:p-5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#111410]/20 pb-3">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-mono font-black uppercase text-[#111410]">
                        <History className="w-4 h-4 text-[#7BB33B]" />
                        <span>GLOBAL VERIFICATION AUDIT LOG</span>
                      </div>
                      <p className="text-[11px] font-mono text-[#62685E] mt-0.5">
                        Chronological record of all word verifications, edits, and status changes with timestamps.
                      </p>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-[#111410] bg-white px-2.5 py-1 border border-[#111410] shrink-0">
                      {filteredHistoryEvents.length} of {allHistoryEvents.length} events
                    </div>
                  </div>

                  {/* Search & Action Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#62685E]" />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Filter by word, editor, or notes..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#111410] text-xs font-mono placeholder:text-[#62685E] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono font-bold">
                      {[
                        { key: 'ALL', label: 'All' },
                        { key: 'verified', label: 'Verified' },
                        { key: 'edited_and_verified', label: 'Edited & Verified' },
                        { key: 'unverified', label: 'Unverified' },
                        { key: 'unpublished', label: 'Unpublished' },
                        { key: 'published', label: 'Published' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setHistoryActionFilter(tab.key)}
                          className={`px-2.5 py-1.5 border transition ${
                            historyActionFilter === tab.key
                              ? 'bg-[#111410] text-white border-[#111410]'
                              : 'bg-white text-[#62685E] border-[#111410]/30 hover:border-[#111410]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <VerificationHistoryList
                    entries={filteredHistoryEvents}
                    showWord
                    onSelectWord={(wordName) => {
                      setSelectedWordName(wordName);
                      setActiveTabMode('CERTIFICATION');
                    }}
                    emptyMessage="No verification history events match the current filter."
                  />
                </div>
              </div>
            ) : activeWord ? (
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

                      {activeWord.is_published === false && (
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-[#FDF2F2] text-[#991B1B] border-2 border-[#111410] text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_#111410] inline-flex items-center space-x-1">
                          <EyeOff className="w-3 h-3" />
                          <span>UNPUBLISHED</span>
                        </span>
                      )}

                      {/* 1-Click Quick Verification & Publication Actions */}
                      <div className="flex items-center space-x-1.5 ml-0 sm:ml-2 flex-wrap gap-y-1">
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
                        <button
                          type="button"
                          onClick={handleTogglePublish}
                          disabled={isSavingWord}
                          className={`flex items-center space-x-1 px-2.5 py-1 border-2 border-[#111410] text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_#111410] active:translate-x-[1px] active:translate-y-[1px] transition ${
                            activeWord.is_published === false
                              ? 'bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E]'
                              : 'bg-[#FDF2F2] hover:bg-red-100 text-[#991B1B]'
                          }`}
                          title={
                            activeWord.is_published === false
                              ? 'Re-publish word so it appears for students'
                              : 'Unpublish word to hide it from student study decks, explorer, and graph'
                          }
                        >
                          {activeWord.is_published === false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-[#7BB33B]" />
                              <span>Publish</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-[#991B1B]" />
                              <span>Unpublish</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-1.5 font-mono text-xs text-[#62685E] flex-wrap gap-y-1">
                      <span>{activeWord.pronunciation || 'phonetic'}</span>
                      <span>·</span>
                      <span className="uppercase font-bold">{activeWord.part_of_speech || 'word'}</span>
                      {activeWord.connotation && (
                        <>
                          <span>·</span>
                          <span className="uppercase">{activeWord.connotation}</span>
                        </>
                      )}
                      {(activeWord.review?.verifiedAt || activeWordHistory[0]?.timestamp) && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center space-x-1 text-[11px] text-[#2F441E]">
                            <Clock className="w-3 h-3 text-[#7BB33B]" />
                            <span>
                              {activeWord.review?.verified && activeWord.review?.verifiedAt
                                ? `Verified ${formatVerificationTimestamp(activeWord.review.verifiedAt)}`
                                : `Last event ${formatVerificationTimestamp(activeWordHistory[0].timestamp)}`}
                            </span>
                          </span>
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

                {/* Sub-Tab Switcher: Word Lexicon Editor vs Editorial Certification vs History */}
                <div className="flex flex-wrap border-b-2 border-[#111410] font-mono text-xs bg-[#FAFBF8]">
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
                    className={`flex-1 sm:flex-none px-4 py-2.5 font-black uppercase flex items-center justify-center space-x-2 border-r-2 border-[#111410] transition ${
                      activeTabMode === 'CERTIFICATION'
                        ? 'bg-[#7BB33B] text-white shadow-[inset_0_-2px_0_0_#111410]'
                        : 'text-[#111410] hover:bg-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Certification &amp; Notes</span>
                    {activeWordHistory.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-[#111410] text-white text-[9px] font-black">
                        {activeWordHistory.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabMode('HISTORY')}
                    className="flex-1 sm:flex-none px-4 py-2.5 font-black uppercase flex items-center justify-center space-x-2 text-[#111410] hover:bg-white transition"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Verification History</span>
                    <span className="px-1.5 py-0.2 bg-[#111410] text-white text-[9px] font-black">
                      {allHistoryEvents.length}
                    </span>
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

                    {/* Morpheme Formula Row: Multi-Root + Custom/Root-Linked Prefix & Suffix */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono font-black uppercase text-[#62685E] block">
                        Morpheme Formula Deconstruction
                      </span>

                      {/* Ordered Multi-Root Manager */}
                      <div className="bg-white border-2 border-[#111410] p-3 space-y-2.5 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <label className="text-[9px] font-mono font-black uppercase text-[#42281D]">
                            Root Families ({attachedRootObjects.length} attached · #1 = Primary)
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowNewRootForm((prev) => !prev)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border border-[#111410] text-[10px] font-mono font-black uppercase transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{showNewRootForm ? 'Cancel New Root' : 'New Root'}</span>
                          </button>
                        </div>

                        {/* Attached Roots Ordered List */}
                        <div className="space-y-1.5">
                          {attachedRootObjects.map((r, idx) => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#EFE8DF]/70 border border-[#111410]"
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <span className={`px-1.5 py-0.5 text-[9px] font-mono font-black uppercase border border-[#111410] shrink-0 ${
                                  idx === 0 ? 'bg-[#7BB33B] text-white' : 'bg-white text-[#42281D]'
                                }`}>
                                  {idx === 0 ? '#1 Primary' : `#${idx + 1}`}
                                </span>
                                <span className="font-mono text-xs font-black text-[#42281D] shrink-0">
                                  [{r.morpheme.toUpperCase()}]
                                </span>
                                <span className="text-[11px] font-mono text-[#62685E] truncate">
                                  ({r.language} · {r.core_meaning})
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleMoveRoot(idx, -1)}
                                  disabled={idx === 0}
                                  className="p-1 bg-white border border-[#111410] disabled:opacity-35 hover:bg-[#FAFBF8]"
                                  title="Move root earlier"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveRoot(idx, 1)}
                                  disabled={idx === attachedRootObjects.length - 1}
                                  className="p-1 bg-white border border-[#111410] disabled:opacity-35 hover:bg-[#FAFBF8]"
                                  title="Move root later"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRoot(r.id)}
                                  disabled={attachedRootObjects.length <= 1}
                                  className="p-1 bg-white border border-[#111410] text-[#991B1B] disabled:opacity-35 hover:bg-[#FDF2F2]"
                                  title={attachedRootObjects.length <= 1 ? 'At least 1 root is required' : 'Remove root from word'}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Another Root Picker */}
                        <div className="flex flex-col lg:flex-row gap-2 pt-1 min-w-0">
                          <input
                            type="text"
                            value={rootPickerFilter}
                            onChange={(e) => setRootPickerFilter(e.target.value)}
                            placeholder="Filter roots to add..."
                            className="w-full lg:w-44 lg:shrink-0 text-xs font-mono px-2.5 py-1.5 bg-[#FAFBF8] border border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                          />
                          <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
                            <select
                              value={rootToAddId}
                              onChange={(e) => setRootToAddId(e.target.value)}
                              className="w-full min-w-0 flex-1 text-xs font-mono px-2 py-1.5 bg-[#FAFBF8] border border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                            >
                              <option value="">-- Select another root to add ({availableRootsToAdd.length}) --</option>
                              {availableRootsToAdd.map((r) => (
                                <option key={r.id} value={r.id}>
                                  [{r.morpheme.toUpperCase()}] ({r.language} · {r.core_meaning})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleAddRoot(rootToAddId)}
                              disabled={!rootToAddId}
                              className="px-3 py-1.5 bg-[#111410] hover:bg-[#2F441E] text-white text-[11px] font-mono font-black uppercase border border-[#111410] disabled:opacity-40 inline-flex items-center justify-center space-x-1 shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Root</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Quick-Create Root Form */}
                        {showNewRootForm && (
                          <div className="p-3 bg-[#EDF5E5]/60 border-2 border-[#111410] space-y-2.5 mt-2">
                            <div className="text-[10px] font-mono font-black uppercase text-[#2F441E]">
                              Create New Root &amp; Attach to Word
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={newRootForm.morpheme}
                                onChange={(e) => setNewRootForm((p) => ({ ...p, morpheme: e.target.value }))}
                                placeholder="Morpheme (e.g. metr / meter)"
                                className="text-xs font-mono px-2.5 py-1.5 bg-white border border-[#111410]"
                              />
                              <select
                                value={newRootForm.language}
                                onChange={(e) => setNewRootForm((p) => ({ ...p, language: e.target.value }))}
                                className="text-xs font-mono px-2 py-1.5 bg-white border border-[#111410]"
                              >
                                {ROOT_LANGUAGES.map((lang) => (
                                  <option key={lang} value={lang}>{lang}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={newRootForm.core_meaning}
                                onChange={(e) => setNewRootForm((p) => ({ ...p, core_meaning: e.target.value }))}
                                placeholder="Core meaning (e.g. measure)"
                                className="text-xs font-mono px-2.5 py-1.5 bg-white border border-[#111410]"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <select
                                value={newRootForm.thematic_cluster}
                                onChange={(e) => setNewRootForm((p) => ({ ...p, thematic_cluster: e.target.value }))}
                                className="text-xs font-mono px-2 py-1.5 bg-white border border-[#111410]"
                              >
                                {ROOT_CLUSTERS.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <select
                                value={newRootForm.sat_tier}
                                onChange={(e) => setNewRootForm((p) => ({ ...p, sat_tier: e.target.value }))}
                                className="text-xs font-mono px-2 py-1.5 bg-white border border-[#111410]"
                              >
                                {ROOT_TIERS.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={newRootForm.mnemonic}
                                onChange={(e) => setNewRootForm((p) => ({ ...p, mnemonic: e.target.value }))}
                                placeholder="Root mnemonic (optional)"
                                className="text-xs font-mono px-2.5 py-1.5 bg-white border border-[#111410]"
                              />
                            </div>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={handleCreateInlineRoot}
                                disabled={isCreatingRoot || !newRootForm.morpheme.trim() || !newRootForm.core_meaning.trim()}
                                className="px-3 py-1.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] text-[10px] font-mono font-black uppercase disabled:opacity-40"
                              >
                                {isCreatingRoot ? 'Creating...' : 'Create & Attach Root'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Prefix & Suffix (Custom vs. Belongs to a Root) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Prefix Card */}
                        <div className="bg-white border-2 border-[#111410] p-3 space-y-2 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[9px] font-mono font-black uppercase text-[#42281D]">
                              Prefix
                            </label>
                            <div className="inline-flex border border-[#111410] text-[9px] font-mono font-black uppercase">
                              <button
                                type="button"
                                onClick={() => setWordFormData((prev) => ({ ...prev, prefixMode: 'custom', prefixRoot: '' }))}
                                className={`px-2 py-0.5 transition ${
                                  wordFormData.prefixMode === 'custom'
                                    ? 'bg-[#111410] text-white'
                                    : 'bg-[#FAFBF8] text-[#62685E] hover:bg-white'
                                }`}
                              >
                                Custom
                              </button>
                              <button
                                type="button"
                                onClick={() => setWordFormData((prev) => ({ ...prev, prefixMode: 'root' }))}
                                className={`px-2 py-0.5 border-l border-[#111410] inline-flex items-center space-x-1 transition ${
                                  wordFormData.prefixMode === 'root'
                                    ? 'bg-[#7BB33B] text-white'
                                    : 'bg-[#FAFBF8] text-[#62685E] hover:bg-white'
                                }`}
                              >
                                <Link2 className="w-2.5 h-2.5" />
                                <span>Belongs to Root</span>
                              </button>
                            </div>
                          </div>

                          {wordFormData.prefixMode === 'root' && (
                            <select
                              value={wordFormData.prefixRoot}
                              onChange={(e) => handleSelectAffixRoot('prefix', e.target.value)}
                              className="w-full min-w-0 text-xs font-mono px-2 py-1.5 bg-[#EDF5E5]/50 border border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                            >
                              <option value="">-- Select linked root --</option>
                              {sortedRoots.map((r) => (
                                <option key={r.id} value={r.id}>
                                  [{r.morpheme.toUpperCase()}] ({r.language} · {r.core_meaning})
                                </option>
                              ))}
                            </select>
                          )}

                          <input
                            type="text"
                            value={wordFormData.prefix}
                            onChange={(e) => setWordFormData(prev => ({ ...prev, prefix: e.target.value }))}
                            placeholder={
                              wordFormData.prefixMode === 'root'
                                ? 'Display label (e.g. auto- (self))'
                                : 'e.g. dis- (apart, away)'
                            }
                            className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                          />
                        </div>

                        {/* Suffix Card */}
                        <div className="bg-white border-2 border-[#111410] p-3 space-y-2 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[9px] font-mono font-black uppercase text-[#42281D]">
                              Suffix
                            </label>
                            <div className="inline-flex border border-[#111410] text-[9px] font-mono font-black uppercase">
                              <button
                                type="button"
                                onClick={() => setWordFormData((prev) => ({ ...prev, suffixMode: 'custom', suffixRoot: '' }))}
                                className={`px-2 py-0.5 transition ${
                                  wordFormData.suffixMode === 'custom'
                                    ? 'bg-[#111410] text-white'
                                    : 'bg-[#FAFBF8] text-[#62685E] hover:bg-white'
                                }`}
                              >
                                Custom
                              </button>
                              <button
                                type="button"
                                onClick={() => setWordFormData((prev) => ({ ...prev, suffixMode: 'root' }))}
                                className={`px-2 py-0.5 border-l border-[#111410] inline-flex items-center space-x-1 transition ${
                                  wordFormData.suffixMode === 'root'
                                    ? 'bg-[#7BB33B] text-white'
                                    : 'bg-[#FAFBF8] text-[#62685E] hover:bg-white'
                                }`}
                              >
                                <Link2 className="w-2.5 h-2.5" />
                                <span>Belongs to Root</span>
                              </button>
                            </div>
                          </div>

                          {wordFormData.suffixMode === 'root' && (
                            <select
                              value={wordFormData.suffixRoot}
                              onChange={(e) => handleSelectAffixRoot('suffix', e.target.value)}
                              className="w-full min-w-0 text-xs font-mono px-2 py-1.5 bg-[#EDF5E5]/50 border border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                            >
                              <option value="">-- Select linked root --</option>
                              {sortedRoots.map((r) => (
                                <option key={r.id} value={r.id}>
                                  [{r.morpheme.toUpperCase()}] ({r.language} · {r.core_meaning})
                                </option>
                              ))}
                            </select>
                          )}

                          <input
                            type="text"
                            value={wordFormData.suffix}
                            onChange={(e) => setWordFormData(prev => ({ ...prev, suffix: e.target.value }))}
                            placeholder={
                              wordFormData.suffixMode === 'root'
                                ? 'Display label (e.g. -graph (write))'
                                : 'e.g. -ous (full of)'
                            }
                            className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
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
                          placeholder="fuh-NET-ik"
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

                {/* TAB 2: EDITORIAL CERTIFICATION FORM & WORD HISTORY */}
                {activeTabMode === 'CERTIFICATION' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="p-3.5 sm:p-5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] sm:shadow-[4px_4px_0px_0px_#111410] space-y-3.5 sm:space-y-4">
                      <div className="flex items-center justify-between border-b border-[#111410]/20 pb-2 flex-wrap gap-2">
                        <div className="flex items-center space-x-2 text-xs font-mono font-black uppercase text-[#111410]">
                          <ShieldCheck className="w-4 h-4 text-[#7BB33B]" />
                          <span>EDITORIAL VERIFICATION &amp; ATTESTATION</span>
                        </div>
                        {activeWord.review?.verifiedAt && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-[#62685E]">
                            <Clock className="w-3 h-3 text-[#7BB33B]" />
                            <span>{formatVerificationTimestamp(activeWord.review.verifiedAt)}</span>
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
                          disabled={isSavingWord}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 sm:py-2.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px] min-h-[44px] disabled:opacity-50"
                        >
                          {isSavingWord ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>{isSavingWord ? 'Saving...' : 'Save Verification'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSave(true)}
                          disabled={isSavingWord}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 sm:py-2.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px] min-h-[44px] disabled:opacity-50"
                        >
                          <span>Save &amp; Next Word</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Publication Visibility Control */}
                      <div className="pt-3 border-t border-[#111410]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 border border-[#111410]/30">
                        <div>
                          <div className="text-[10px] font-mono font-black uppercase text-[#111410] flex items-center space-x-1.5">
                            {activeWord.is_published === false ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-[#991B1B]" />
                                <span>Status: Unpublished (Hidden from Students)</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-[#7BB33B]" />
                                <span>Status: Published in Student Lexicon</span>
                              </>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-[#62685E] mt-0.5">
                            {activeWord.is_published === false
                              ? 'Excluded from student study decks, explorer, and root graph until re-published.'
                              : 'Visible in student study decks, explorer, and root graph. Unpublish to remove from circulation.'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleTogglePublish}
                          disabled={isSavingWord}
                          className={`shrink-0 flex items-center justify-center space-x-1.5 px-3 py-2 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase transition active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 ${
                            activeWord.is_published === false
                              ? 'bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E]'
                              : 'bg-[#FDF2F2] hover:bg-red-100 text-[#991B1B]'
                          }`}
                        >
                          {activeWord.is_published === false ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Re-publish Word</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Unpublish Word</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Per-word Verification History Timeline */}
                    <div className="p-3.5 sm:p-5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#111410]/20 pb-2">
                        <div className="flex items-center space-x-2 text-xs font-mono font-black uppercase text-[#111410]">
                          <History className="w-4 h-4 text-[#7BB33B]" />
                          <span>VERIFICATION HISTORY FOR &ldquo;{activeWord.word}&rdquo;</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#62685E]">
                          {activeWordHistory.length} {activeWordHistory.length === 1 ? 'event' : 'events'}
                        </span>
                      </div>

                      <VerificationHistoryList
                        entries={activeWordHistory}
                        emptyMessage={`No verification history recorded yet for "${activeWord.word}".`}
                      />
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
