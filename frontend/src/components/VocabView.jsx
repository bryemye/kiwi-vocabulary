import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Volume2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  BookMarked,
  Layers,
  Filter,
  CheckCircle,
  HelpCircle,
  Search,
  X,
  ArrowRight,
  RotateCcw,
  Award,
  Compass,
  Target,
  Zap,
  BookOpen,
  Network,
  Sliders,
  AlertTriangle,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { logStudyAttempt, fetchVocabStats } from '../services/api';
import MorphemeDetailView from './MorphemeDetailView';
import VocabGraphView from '../views/VocabGraphView';
import StudyDeck from './StudyDeck';
import CustomPracticeModal from './CustomPracticeModal';
import EditorialReviewModal from './EditorialReviewModal';
import PathwayToggle from './PathwayToggle';
import {
  getStoredPathway,
  setStoredPathway,
  groupRootsByPathway,
  getClusterMeta,
  getTierMeta,
  PATHWAYS,
  PATHWAY_THEMATIC,
  PATHWAY_YIELD,
  PATHWAY_CHANGE_EVENT,
} from '../services/pathwayService';
import {
  recordWordAttempt,
  shuffleWithMorphemeVariety,
  SESSION_SIZE,
  extractMorphemesFromWords,
  wordMatchesPrefix,
  wordMatchesSuffix
} from '../services/studySessionService';
import { useCelestialTrajectory } from '../context/CelestialTrajectoryContext';

export default function VocabView({
  words = [],
  roots = [],
  stats = null,
  onAttemptLogged,
  initialRootId,
  initialSubTab = 'study',
  activeTab: propActiveTab,
  onTabChange,
  onSubTabChange,
  onNavigateDashboard,
  isAdminMode = false,
  onUpdateWordReview,
  externalMorphemeView,
  onClearExternalMorphemeView
}) {
  const { recordWaypoint } = useCelestialTrajectory();

  // Navigation Sub-tab state
  const [subTab, setSubTab] = useState(initialSubTab);

  useEffect(() => {
    const target = propActiveTab || initialSubTab;
    if (target) {
      setSubTab(target);
      setActiveMorphemeView(null);
    }
  }, [propActiveTab, initialSubTab]);

  const handleSubTabChange = useCallback((newTab) => {
    setSubTab(newTab);
    setActiveMorphemeView(null);
    if (onClearExternalMorphemeView) onClearExternalMorphemeView();
    if (onTabChange) {
      onTabChange(newTab);
    } else if (onSubTabChange) {
      onSubTabChange(newTab);
    }
  }, [onTabChange, onSubTabChange, onClearExternalMorphemeView]);

  // Dedicated Morpheme Detail & Subset Practice States
  const [activeMorphemeView, setActiveMorphemeView] = useState(null);
  const [subsetPracticeInfo, setSubsetPracticeInfo] = useState(null);

  // Sync externalMorphemeView from celestial trajectory fast-travel
  useEffect(() => {
    if (externalMorphemeView !== undefined) {
      setActiveMorphemeView(externalMorphemeView);
    }
  }, [externalMorphemeView]);

  // Record Root Node when a morpheme detail is opened
  useEffect(() => {
    if (activeMorphemeView) {
      recordWaypoint({
        type: 'PRIMARY_STAR',
        title: activeMorphemeView.title || `[${activeMorphemeView.cleanToken?.toUpperCase()}]`,
        subtitle: activeMorphemeView.meaning ? `"${activeMorphemeView.meaning.slice(0, 35)}..."` : 'ROOT MORPHEME NODE',
        system: `${activeMorphemeView.language || 'Core'} Morphemes`,
        language: activeMorphemeView.language,
        depth: 2,
        state: {
          app: 'vocab',
          tab: subTab,
          morphemeData: activeMorphemeView,
          morphemeToken: activeMorphemeView.cleanToken,
        },
      });
    }
  }, [activeMorphemeView, recordWaypoint, subTab]);

  // Record Session Node when subset practice is active
  useEffect(() => {
    if (subsetPracticeInfo) {
      recordWaypoint({
        type: 'ANOMALY',
        title: subsetPracticeInfo.title ? subsetPracticeInfo.title.toUpperCase() : 'SUBSET PRACTICE',
        subtitle: `${subsetPracticeInfo.totalCount || 5} Words · Targeted Run`,
        system: 'Practice Session',
        depth: 2,
        state: {
          app: 'vocab',
          tab: 'study',
          subsetPracticeInfo,
        },
      });
    }
  }, [subsetPracticeInfo, recordWaypoint]);

  // Editorial Review Modal State
  const [editingReviewWord, setEditingReviewWord] = useState(null);

  // Custom Practice Session Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customModalInitialRoots, setCustomModalInitialRoots] = useState([]);
  const [customModalInitialMorpheme, setCustomModalInitialMorpheme] = useState(null);
  const [customModalInitialMorphemes, setCustomModalInitialMorphemes] = useState([]);

  // Morpheme Explorer Sub-type State ('ROOT' | 'PREFIX' | 'SUFFIX')
  const [explorerMorphemeType, setExplorerMorphemeType] = useState('ROOT');

  // Extract all catalog morphemes
  const allMorphemes = useMemo(() => extractMorphemesFromWords(words, roots), [words, roots]);
  const prefixMorphemes = useMemo(() => allMorphemes.filter(m => m.type === 'prefix'), [allMorphemes]);
  const suffixMorphemes = useMemo(() => allMorphemes.filter(m => m.type === 'suffix'), [allMorphemes]);

  // Tab switch confirmation modal state (if leaving an active study session)
  const [pendingTab, setPendingTab] = useState(null);
  const [showTabConfirm, setShowTabConfirm] = useState(false);

  // Dual Learning Pathway State & User Preference Persistence ('thematic' | 'yield')
  const [learningPathway, setLearningPathway] = useState(getStoredPathway);

  useEffect(() => {
    const handlePathwaySync = (e) => {
      const next = e.detail?.pathway;
      if (next && (next === PATHWAY_THEMATIC || next === PATHWAY_YIELD)) {
        setLearningPathway(next);
      }
    };
    window.addEventListener(PATHWAY_CHANGE_EVENT, handlePathwaySync);
    return () => window.removeEventListener(PATHWAY_CHANGE_EVENT, handlePathwaySync);
  }, []);

  const handlePathwayChange = useCallback((newPathway) => {
    setLearningPathway(newPathway);
    setStoredPathway(newPathway);
  }, []);

  // Filter States
  const [selectedLanguage, setSelectedLanguage] = useState('ALL'); // 'ALL' | 'Latin' | 'Greek'
  const [selectedRootId, setSelectedRootId] = useState(initialRootId || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Deck & Session States (Study Deck)
  const [sessionDeck, setSessionDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [sessionRound, setSessionRound] = useState(1);
  const [roundStats, setRoundStats] = useState({ correct: 0, total: 0 });
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // Dedicated Vocab Stats from backend
  const [vocabStats, setVocabStats] = useState(null);

  useEffect(() => {
    fetchVocabStats()
      .then(data => setVocabStats(data))
      .catch(err => console.warn('Vocab stats fetch note:', err));
  }, []);

  // Sync initialRootId if passed
  useEffect(() => {
    if (initialRootId) {
      setSelectedRootId(initialRootId);
      const matchingRoot = roots.find(r => r.id === Number(initialRootId));
      if (matchingRoot) {
        setSelectedLanguage(matchingRoot.language);
      }
      handleSubTabChange('study');
    }
  }, [initialRootId, roots, handleSubTabChange]);

  // Filter available roots based on selected language
  const availableRoots = useMemo(() => {
    if (selectedLanguage === 'ALL') return roots;
    return roots.filter(r => r.language.toLowerCase() === selectedLanguage.toLowerCase());
  }, [roots, selectedLanguage]);

  // Grouped roots for the Root select in Study tab (grouped by active pathway)
  const groupedRootsForSelect = useMemo(() => {
    return groupRootsByPathway(availableRoots, learningPathway);
  }, [availableRoots, learningPathway]);

  // Filtered roots for Explorer view
  const filteredExplorerRoots = useMemo(() => {
    return availableRoots.filter((root) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const mMatch = (root.morpheme || '').toLowerCase().includes(q);
      const cMatch = (root.core_meaning || '').toLowerCase().includes(q);
      const clusterMatch = (root.thematic_cluster || '').toLowerCase().includes(q);
      const tierMatch = (root.sat_tier || '').toLowerCase().includes(q);
      const wMatch = root.words?.some((w) => (w.word || '').toLowerCase().includes(q));
      return mMatch || cMatch || clusterMatch || tierMatch || wMatch;
    });
  }, [availableRoots, searchTerm]);

  // Filtered prefixes for Explorer view
  const filteredExplorerPrefixes = useMemo(() => {
    return prefixMorphemes.filter(p => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const mMatch = p.morpheme.toLowerCase().includes(q);
      const cMatch = p.core_meaning.toLowerCase().includes(q);
      const wMatch = p.words?.some(w => w.word.toLowerCase().includes(q));
      return mMatch || cMatch || wMatch;
    });
  }, [prefixMorphemes, searchTerm]);

  // Filtered suffixes for Explorer view
  const filteredExplorerSuffixes = useMemo(() => {
    return suffixMorphemes.filter(s => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const mMatch = s.morpheme.toLowerCase().includes(q);
      const cMatch = s.core_meaning.toLowerCase().includes(q);
      const wMatch = s.words?.some(w => w.word.toLowerCase().includes(q));
      return mMatch || cMatch || wMatch;
    });
  }, [suffixMorphemes, searchTerm]);

  // Grouped roots for Explorer bento grid (Thematic Clusters or Core Yield Tiers)
  const groupedExplorerRoots = useMemo(() => {
    return groupRootsByPathway(filteredExplorerRoots, learningPathway);
  }, [filteredExplorerRoots, learningPathway]);

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    if (selectedRootId !== 'ALL' && !String(selectedRootId).startsWith('prefix:') && !String(selectedRootId).startsWith('suffix:')) {
      const rootBelongs = roots.find(r => r.id === Number(selectedRootId) && (lang === 'ALL' || r.language.toLowerCase() === lang.toLowerCase()));
      if (!rootBelongs) {
        setSelectedRootId('ALL');
      }
    }
  };

  // Build filtered master list (supporting root, prefix, and suffix filtering)
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      if (selectedLanguage !== 'ALL') {
        const rootLang = w.root_details?.language || roots.find(r => r.id === w.root)?.language;
        if (rootLang && rootLang.toLowerCase() !== selectedLanguage.toLowerCase()) {
          return false;
        }
      }
      if (selectedRootId !== 'ALL') {
        if (String(selectedRootId).startsWith('prefix:')) {
          const pToken = String(selectedRootId).slice(7);
          if (!wordMatchesPrefix(w, pToken)) return false;
        } else if (String(selectedRootId).startsWith('suffix:')) {
          const sToken = String(selectedRootId).slice(7);
          if (!wordMatchesSuffix(w, sToken)) return false;
        } else if (w.root !== Number(selectedRootId)) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const wordMatch = w.word.toLowerCase().includes(query);
        const defMatch = w.definition.toLowerCase().includes(query);
        const rootMatch = w.root_details?.morpheme?.toLowerCase().includes(query);
        const prefixMatch = w.prefix && w.prefix.toLowerCase().includes(query);
        const suffixMatch = w.suffix && w.suffix.toLowerCase().includes(query);
        if (!wordMatch && !defMatch && !rootMatch && !prefixMatch && !suffixMatch) {
          return false;
        }
      }
      return true;
    });
  }, [words, selectedLanguage, selectedRootId, searchTerm, roots]);

  // Initialize or re-shuffle session deck (15-word slice with morpheme variety)
  const initializeSession = useCallback((advanceRound = false) => {
    if (subsetPracticeInfo) return; // Preserve active targeted subset session

    if (filteredWords.length === 0) {
      setSessionDeck([]);
      setCurrentIndex(0);
      setIsSessionComplete(false);
      return;
    }

    const shuffled = [...filteredWords].sort(() => 0.5 - Math.random());
    const slice = shuffled.slice(0, SESSION_SIZE);
    const variedDeck = shuffleWithMorphemeVariety(slice);

    setSessionDeck(variedDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStartTime(Date.now());
    setIsSessionComplete(false);
    setRoundStats({ correct: 0, total: 0 });

    if (advanceRound) {
      setSessionRound(prev => prev + 1);
    }
  }, [filteredWords, subsetPracticeInfo]);

  // Open Morpheme Detail View (for prefix, root, or suffix)
  const handleOpenMorpheme = useCallback(({ type, raw = '', root = null, word = null }) => {
    let title = '';
    let cleanToken = '';
    let meaning = '';
    let language = 'Latin';
    let mnemonic = '';
    let definitionText = '';
    let matchedWords = [];
    let rootObj = null;

    if (type === 'root') {
      rootObj = root || word?.root_details || roots.find(r => r.id === word?.root);
      const morpheme = rootObj?.morpheme || 'UNKNOWN ROOT';
      title = `[${morpheme.toUpperCase()}]`;
      cleanToken = morpheme;
      meaning = rootObj?.core_meaning || '';
      language = rootObj?.language || 'Latin';
      mnemonic = rootObj?.mnemonic || '';
      definitionText = `A root is the foundational base morpheme of a word that carries its primary semantic essence. Roots cannot be reduced to smaller grammatical units without destroying their conceptual core. The root "[${morpheme.toUpperCase()}]" originates from classical ${language} and embodies the core meaning "${meaning}".`;

      matchedWords = words.filter(w => {
        if (word && w.id === word.id) return true;
        if (rootObj?.id && (w.root === rootObj.id || w.root_details?.id === rootObj.id)) return true;
        if (morpheme && w.root_details?.morpheme?.toLowerCase() === morpheme.toLowerCase()) return true;
        return false;
      });
    } else if (type === 'prefix') {
      let token = raw;
      const parenMatch = raw.match(/^([^(]+)\s*(?:\(([^)]+)\))?/);
      if (parenMatch) {
        token = parenMatch[1].trim();
        meaning = parenMatch[2]?.trim() || '';
      }
      cleanToken = token.trim();
      title = raw || cleanToken;
      definitionText = `A prefix is an affix morpheme attached to the front of a stem or root word to alter its meaning by conveying direction, negation, relationship, or intensity. In this context, the prefix morpheme "${cleanToken}" introduces the modifier "${meaning || 'derivational prefix'}" to construct specialized words.`;

      const basePrefix = cleanToken.toLowerCase().replace(/[^a-z]/g, '');
      matchedWords = words.filter(w => {
        if (word && w.id === word.id) return true;
        if (!w.prefix) return false;
        const pRaw = w.prefix.toLowerCase();
        const pToken = (pRaw.split(' ')[0] || '').replace(/[^a-z]/g, '');
        return pToken === basePrefix || pRaw.startsWith(cleanToken.toLowerCase()) || (basePrefix.length >= 2 && w.word.toLowerCase().startsWith(basePrefix));
      });
    } else if (type === 'suffix') {
      let token = raw;
      const parenMatch = raw.match(/^([^(]+)\s*(?:\(([^)]+)\))?/);
      if (parenMatch) {
        token = parenMatch[1].trim();
        meaning = parenMatch[2]?.trim() || '';
      }
      cleanToken = token.trim();
      title = raw || cleanToken;
      definitionText = `A suffix is a bound affix morpheme joined to the conclusion of a root or base stem to establish its grammatical role (such as noun, adjective, or verb) or impart fine shades of meaning. Here, the suffix morpheme "${cleanToken}" functions as "${meaning || 'derivational ending'}" across related English terms.`;

      const baseSuffix = cleanToken.toLowerCase().replace(/[^a-z]/g, '');
      matchedWords = words.filter(w => {
        if (word && w.id === word.id) return true;
        if (!w.suffix) return false;
        const sRaw = w.suffix.toLowerCase();
        const sToken = (sRaw.split(' ')[0] || '').replace(/[^a-z]/g, '');
        return sToken === baseSuffix || sRaw.startsWith(cleanToken.toLowerCase()) || (baseSuffix.length >= 2 && w.word.toLowerCase().endsWith(baseSuffix));
      });
    }

    // Ensure source word is placed first in the list
    if (word && matchedWords.some(w => w.id === word.id)) {
      matchedWords = [word, ...matchedWords.filter(w => w.id !== word.id)];
    }

    setActiveMorphemeView({
      type,
      title,
      cleanToken,
      meaning,
      language,
      mnemonic,
      definitionText,
      sourceWord: word?.word || '',
      matchedWords,
      rootId: rootObj?.id || null,
      root: rootObj,
      sourceTab: subTab,
    });
  }, [roots, words, subTab]);

  // Open Custom Practice Session Modal (supports root IDs or morpheme descriptors)
  const handleOpenCustomSession = useCallback((config = []) => {
    if (Array.isArray(config)) {
      setCustomModalInitialRoots(config);
      setCustomModalInitialMorpheme(null);
      setCustomModalInitialMorphemes([]);
    } else if (config && typeof config === 'object') {
      setCustomModalInitialRoots(config.rootIds || []);
      setCustomModalInitialMorpheme(config.morpheme || config.morphemeData || null);
      setCustomModalInitialMorphemes(config.morphemes || []);
    } else {
      setCustomModalInitialRoots([]);
      setCustomModalInitialMorpheme(null);
      setCustomModalInitialMorphemes([]);
    }
    setIsCustomModalOpen(true);
  }, []);

  // Launch a generated custom session (from CustomPracticeModal)
  const handleLaunchCustomSession = useCallback((sessionData) => {
    if (!sessionData || !sessionData.deck || sessionData.deck.length === 0) return;

    setSubsetPracticeInfo({
      title: sessionData.title,
      mode: sessionData.mode,
      modeLabel: sessionData.modeLabel,
      details: sessionData.details,
      count: sessionData.deck.length
    });
    setSessionDeck(sessionData.deck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStartTime(Date.now());
    setRoundStats({ correct: 0, total: 0 });
    setIsSessionComplete(false);
    handleSubTabChange('study');
    setActiveMorphemeView(null);
  }, [handleSubTabChange]);

  // Start targeted subset practice (called from MorphemeDetailView launcher)
  const handleStartSubsetPractice = useCallback((subsetWords, subsetTitle, morphemeData) => {
    const rootId = morphemeData?.rootId || morphemeData?.root?.id;
    if (rootId) {
      handleOpenCustomSession({ rootIds: [Number(rootId)], morpheme: morphemeData });
    } else if (morphemeData) {
      handleOpenCustomSession({ morpheme: morphemeData });
    } else {
      handleOpenCustomSession([]);
    }
  }, [handleOpenCustomSession]);

  const handleLaunchPrefixPractice = useCallback((prefixToken) => {
    handleOpenCustomSession({ morpheme: { type: 'prefix', cleanToken: prefixToken } });
  }, [handleOpenCustomSession]);

  const handleLaunchSuffixPractice = useCallback((suffixToken) => {
    handleOpenCustomSession({ morpheme: { type: 'suffix', cleanToken: suffixToken } });
  }, [handleOpenCustomSession]);

  // Exit targeted subset practice and restore full 15-card session
  const handleClearSubsetPractice = useCallback(() => {
    setSubsetPracticeInfo(null);
    if (filteredWords.length === 0) {
      setSessionDeck([]);
      setCurrentIndex(0);
      setIsSessionComplete(false);
      return;
    }
    const shuffled = [...filteredWords].sort(() => 0.5 - Math.random());
    setSessionDeck(shuffleWithMorphemeVariety(shuffled.slice(0, SESSION_SIZE)));
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStartTime(Date.now());
    setIsSessionComplete(false);
    setRoundStats({ correct: 0, total: 0 });
  }, [filteredWords]);

  // Select a single word to practice from the morpheme word list
  const handleSelectSingleWord = useCallback((wordItem) => {
    if (!wordItem) return;
    recordWaypoint({
      type: 'SATELLITE',
      title: wordItem.word?.toUpperCase() || 'SPECIMEN',
      subtitle: wordItem.definition ? `"${wordItem.definition.slice(0, 35)}..."` : 'WORD SPECIMEN NODE',
      system: wordItem.root_details?.morpheme ? `Root [${wordItem.root_details.morpheme.toUpperCase()}]` : 'Vocab Domain',
      depth: 3,
      state: {
        app: 'vocab',
        tab: 'study',
        wordName: wordItem.word,
      },
    });
    const remainingWords = words.filter(w => w.id !== wordItem.id);
    const customDeck = [wordItem, ...remainingWords.slice(0, SESSION_SIZE - 1)];
    setSubsetPracticeInfo({
      title: `Word Focus: ${wordItem.word}`,
      mode: 'word_focus',
      modeLabel: 'Word Focus',
      details: `1 specific word + 14 general practice words`,
      count: 1
    });
    setSessionDeck(shuffleWithMorphemeVariety(customDeck));
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStartTime(Date.now());
    setRoundStats({ correct: 0, total: 0 });
    setIsSessionComplete(false);
    handleSubTabChange('study');
    setActiveMorphemeView(null);
  }, [words, handleSubTabChange]);

  // Safe Tab Navigation handling confirmation if active session in progress
  const handleAttemptTabChange = useCallback((targetTab) => {
    if (targetTab === subTab) return;
    if (subTab === 'study' && currentIndex > 0 && !isSessionComplete) {
      setPendingTab(targetTab);
      setShowTabConfirm(true);
    } else {
      handleSubTabChange(targetTab);
    }
  }, [subTab, currentIndex, isSessionComplete, handleSubTabChange]);

  const handleConfirmTabChange = useCallback(() => {
    setShowTabConfirm(false);
    if (pendingTab) {
      setCurrentIndex(0);
      setIsFlipped(false);
      handleSubTabChange(pendingTab);
      setPendingTab(null);
    }
  }, [pendingTab, handleSubTabChange]);

  const handleCancelTabChange = useCallback(() => {
    setShowTabConfirm(false);
    setPendingTab(null);
  }, []);

  useEffect(() => {
    initializeSession(false);
  }, [initializeSession]);

  const currentWord = sessionDeck[currentIndex] || null;

  // Reset timer on card change
  useEffect(() => {
    setCardStartTime(Date.now());
    setIsFlipped(false);
  }, [currentIndex]);

  // Pronunciation speech synthesis
  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Submit study response
  const handleResponse = useCallback(async (isKnown) => {
    if (!currentWord || submitting || isSessionComplete) return;

    const secondsSpent = Math.max(1, Math.round((Date.now() - cardStartTime) / 1000));
    setSubmitting(true);

    try {
      await logStudyAttempt({
        item_type: 'WORD',
        word_id: currentWord.id,
        is_correct: isKnown,
        seconds_spent: secondsSpent,
      });

      // Update localStorage spaced repetition progress tracking
      recordWordAttempt(currentWord, isKnown);

      if (onAttemptLogged) {
        onAttemptLogged();
      }

      setRoundStats(prev => ({
        correct: prev.correct + (isKnown ? 1 : 0),
        total: prev.total + 1
      }));

      setFeedback({
        type: isKnown ? 'success' : 'review',
        text: isKnown ? 'MASTERED · LOGGED' : 'NEEDS PRACTICE · LOGGED'
      });

      if (!isFlipped) {
        setIsFlipped(true);
      }

      setTimeout(() => {
        setFeedback(null);
        if (currentIndex < sessionDeck.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setIsSessionComplete(true);
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#7BB33B', '#84C341', '#2F441E', '#C29B78']
          });
        }
      }, 1000);
    } catch (err) {
      console.error('Error logging study attempt:', err);
    } finally {
      setSubmitting(false);
    }
  }, [currentWord, submitting, isSessionComplete, cardStartTime, onAttemptLogged, isFlipped, currentIndex, sessionDeck.length]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag)) return;
      if (activeMorphemeView || isCustomModalOpen || showTabConfirm) return; // Disable flashcard shortcuts while modal is open
      if (subTab !== 'study' || isSessionComplete) return;

      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        handleResponse(false);
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        handleResponse(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subTab, isSessionComplete, activeMorphemeView, isCustomModalOpen, showTabConfirm, handleResponse]);

  const handleLaunchRootPractice = (rootId) => {
    handleOpenCustomSession([Number(rootId)]);
  };

  // If a morpheme detail view is active, render dedicated Morpheme Definition page
  if (activeMorphemeView) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <MorphemeDetailView
          morphemeData={activeMorphemeView}
          onBack={() => {
            setActiveMorphemeView(null);
            if (onClearExternalMorphemeView) onClearExternalMorphemeView();
          }}
          onStartPractice={handleStartSubsetPractice}
          onSelectWordCard={handleSelectSingleWord}
        />
        <CustomPracticeModal
          isOpen={isCustomModalOpen}
          onClose={() => {
            setIsCustomModalOpen(false);
            setCustomModalInitialMorpheme(null);
            setCustomModalInitialMorphemes([]);
          }}
          roots={roots}
          words={words}
          initialSelectedRootIds={customModalInitialRoots}
          initialSelectedMorphemes={customModalInitialMorphemes}
          initialMorpheme={customModalInitialMorpheme}
          onLaunchSession={handleLaunchCustomSession}
        />
      </div>
    );
  }

  return (
    <div className={`mx-auto px-3 sm:px-4 ${subTab === 'graph' ? 'max-w-7xl py-3 sm:py-4 space-y-4' : 'max-w-6xl py-4 sm:py-6 space-y-4 sm:space-y-6'}`}>

      {/* FLAGSHIP HUB HEADER & DEDICATED SUB-NAVIGATION */}
      <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] sm:shadow-[5px_5px_0px_0px_#111410] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b-2 border-[#111410] pb-4 sm:pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#7BB33B] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] sm:shadow-[3px_3px_0px_0px_#111410] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-3xl font-black font-sans uppercase tracking-tight text-[#111410]">
                  Kiwi Vocabulary
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs font-mono uppercase text-[#62685E] mt-0.5">
                SAT/ACT Spaced Repetition
              </p>
            </div>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-mono">
            <div className="flex-1 sm:flex-none text-center px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
              <span className="text-[#62685E] font-bold">LEXICON: </span>
              <strong>{words.length} WORDS</strong>
            </div>
            <div className="flex-1 sm:flex-none text-center px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[#2F441E]">
              <span className="font-bold">ROOTS: </span>
              <strong>{roots.length} FAMILIES</strong>
            </div>
          </div>
        </div>

        {/* DEDICATED SUB-NAVIGATION BAR (HORIZONTALLY SCROLLABLE SEGMENTED BAR ON MOBILE) */}
        <div className="flex items-center gap-2 pt-3 sm:pt-4 overflow-x-auto no-scrollbar scroll-smooth pb-1 -mx-1 px-1 sm:overflow-visible sm:flex-wrap">
          <button
            onClick={() => handleAttemptTabChange('study')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 font-mono text-xs font-black uppercase tracking-wider border-2 border-[#111410] whitespace-nowrap shrink-0 transition ${subTab === 'study'
                ? 'bg-[#7BB33B] text-white shadow-[3px_3px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white hover:bg-[#FAFBF8] text-[#111410] shadow-[2px_2px_0px_0px_#111410]'
              }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Study Deck (15-Card Session)</span>
            <span className="sm:hidden">Study Deck</span>
          </button>

          <button
            onClick={() => handleAttemptTabChange('explorer')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 font-mono text-xs font-black uppercase tracking-wider border-2 border-[#111410] whitespace-nowrap shrink-0 transition ${subTab === 'explorer'
                ? 'bg-[#7BB33B] text-white shadow-[3px_3px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white hover:bg-[#FAFBF8] text-[#111410] shadow-[2px_2px_0px_0px_#111410]'
              }`}
          >
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Etymology Root Explorer</span>
            <span className="sm:hidden">Explorer</span>
          </button>

          <button
            onClick={() => handleAttemptTabChange('progress')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 font-mono text-xs font-black uppercase tracking-wider border-2 border-[#111410] whitespace-nowrap shrink-0 transition ${subTab === 'progress'
                ? 'bg-[#7BB33B] text-white shadow-[3px_3px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white hover:bg-[#FAFBF8] text-[#111410] shadow-[2px_2px_0px_0px_#111410]'
              }`}
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Vocab Progress & Mastery</span>
            <span className="sm:hidden">Mastery</span>
          </button>

          <button
            onClick={() => handleAttemptTabChange('graph')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 font-mono text-xs font-black uppercase tracking-wider border-2 border-[#111410] whitespace-nowrap shrink-0 transition ${subTab === 'graph'
                ? 'bg-[#7BB33B] text-white shadow-[3px_3px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white hover:bg-[#FAFBF8] text-[#111410] shadow-[2px_2px_0px_0px_#111410]'
              }`}
          >
            <Network className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Root Graph</span>
          </button>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR TAB SWITCH DURING ACTIVE STUDY */}
      {showTabConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111410]/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white border-3 border-[#111410] shadow-[6px_6px_0px_0px_#111410] p-6 space-y-4">
            <div className="flex items-center space-x-3 text-[#991B1B]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-black font-sans uppercase text-[#111410]">
                Active Session In Progress
              </h3>
            </div>
            <p className="text-xs font-mono text-[#42281D] leading-relaxed">
              You are currently on <strong>Card {currentIndex + 1} of {sessionDeck.length}</strong>.
              Leaving this view will reset your active study round. Do you want to proceed?
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCancelTabChange}
                className="px-4 py-2 bg-white hover:bg-[#FAFBF8] text-[#111410] font-mono font-bold text-xs uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]"
              >
                Keep Studying
              </button>
              <button
                type="button"
                onClick={handleConfirmTabChange}
                className="px-4 py-2 bg-[#991B1B] hover:bg-red-700 text-white font-mono font-bold text-xs uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]"
              >
                Reset & Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 1: STUDY DECK (FLASHCARD ENGINE) */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'study' && (
        <div className="max-w-4xl mx-auto space-y-4">

          {/* FILTER & CUSTOM SESSION TOOLBAR */}
          <div className="bg-[#FAFBF8] border-2 border-[#111410] p-3 shadow-[3px_3px_0px_0px_#111410]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Left: Dual Learning Pathway Segmented Control & Origin Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <PathwayToggle
                  currentPathway={learningPathway}
                  onPathwayChange={handlePathwayChange}
                  compact
                />

                <div className="flex items-center space-x-1 font-mono text-xs">
                  <span className="text-[10px] font-black uppercase text-[#62685E] mr-1 hidden sm:inline">ORIGIN:</span>
                  {['ALL', 'Latin', 'Greek'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`px-2.5 py-1 font-black uppercase border-2 border-[#111410] text-center transition ${selectedLanguage.toLowerCase() === lang.toLowerCase()
                          ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410]'
                          : 'bg-white text-[#111410] hover:bg-[#FAFBF8]'
                        }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Root Select, Search & Custom Session Trigger */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 lg:justify-end">
                <div className="bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] px-2 py-1 flex items-center flex-1 sm:flex-none min-w-[150px]">
                  <Filter className="w-3.5 h-3.5 text-[#42281D] mr-1.5 shrink-0" />
                  <select
                    value={selectedRootId}
                    onChange={(e) => setSelectedRootId(e.target.value)}
                    className="bg-transparent text-[#111410] text-base sm:text-xs font-mono font-bold uppercase focus:outline-none cursor-pointer w-full max-w-full sm:max-w-[200px] truncate"
                  >
                    <option value="ALL">ALL MORPHEMES ({availableRoots.length} ROOTS)</option>
                    {groupedRootsForSelect.map((group) => {
                      if (group.roots.length === 0) return null;
                      return (
                        <optgroup
                          key={group.id}
                          label={`${group.icon} ${group.name.toUpperCase()} (${group.roots.length})`}
                        >
                          {group.roots.map((root) => (
                            <option key={root.id} value={root.id}>
                              [{root.morpheme.toUpperCase()}] {root.core_meaning.toUpperCase()}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                    {prefixMorphemes.length > 0 && (
                      <optgroup label={`🧩 PREFIXES (${prefixMorphemes.slice(0, 15).length})`}>
                        {prefixMorphemes.slice(0, 15).map((p) => (
                          <option key={p.id} value={`prefix:${p.cleanToken}`}>
                            PREFIX {p.cleanToken} ({p.wordCount} WORDS)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {suffixMorphemes.length > 0 && (
                      <optgroup label={`🏷️ SUFFIXES (${suffixMorphemes.slice(0, 15).length})`}>
                        {suffixMorphemes.slice(0, 15).map((s) => (
                          <option key={s.id} value={`suffix:${s.cleanToken}`}>
                            SUFFIX {s.cleanToken} ({s.wordCount} WORDS)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="relative flex-1 sm:max-w-[150px] min-w-[120px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#62685E]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="SEARCH WORDS..."
                    className="w-full bg-white text-[#111410] font-mono font-bold text-base sm:text-xs pl-8 pr-7 py-1 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] focus:outline-none uppercase placeholder:text-[#A8AAA6]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-2 text-[#42281D] hover:text-[#111410]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Primary Launcher Button: Custom Practice Session */}
                <button
                  type="button"
                  onClick={() => {
                    if (String(selectedRootId).startsWith('prefix:')) {
                      handleOpenCustomSession({ morpheme: { type: 'prefix', cleanToken: String(selectedRootId).slice(7) } });
                    } else if (String(selectedRootId).startsWith('suffix:')) {
                      handleOpenCustomSession({ morpheme: { type: 'suffix', cleanToken: String(selectedRootId).slice(7) } });
                    } else if (selectedRootId !== 'ALL') {
                      handleOpenCustomSession([Number(selectedRootId)]);
                    } else {
                      handleOpenCustomSession([]);
                    }
                  }}
                  className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-[#7BB33B] hover:bg-[#84C341] text-white font-mono font-black text-xs uppercase tracking-wider border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] active:translate-x-[1px] active:translate-y-[1px] transition shrink-0"
                  title="Configure custom 15-card practice session"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Start Custom Session</span>
                  <span className="sm:hidden">Custom</span>
                </button>
              </div>
            </div>
          </div>

          {/* DEDICATED STUDY DECK COMPONENT */}
          <StudyDeck
            sessionDeck={sessionDeck}
            currentIndex={currentIndex}
            isFlipped={isFlipped}
            setIsFlipped={setIsFlipped}
            submitting={submitting}
            feedback={feedback}
            onSpeak={handleSpeak}
            onOpenMorpheme={handleOpenMorpheme}
            onResponse={handleResponse}
            isAdminMode={isAdminMode}
            onEditWordVerification={(w) => setEditingReviewWord(w)}
            subsetPracticeInfo={subsetPracticeInfo}
            isSessionComplete={isSessionComplete}
            roundStats={roundStats}
            sessionRound={sessionRound}
            onNextRound={() => initializeSession(true)}
            onRestartSession={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
              setIsSessionComplete(false);
              setRoundStats({ correct: 0, total: 0 });
              setSessionDeck(prev => shuffleWithMorphemeVariety(prev));
            }}
            onReviewProgress={() => handleAttemptTabChange('progress')}
            onOpenCustomModal={() => handleOpenCustomSession(selectedRootId !== 'ALL' ? [Number(selectedRootId)] : [])}
            onExitSession={handleClearSubsetPractice}
            onResetFilters={() => {
              setSelectedLanguage('ALL');
              setSelectedRootId('ALL');
              setSearchTerm('');
            }}
          />

        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 2: MORPHEME EXPLORER (ROOTS, PREFIXES, SUFFIXES) */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'explorer' && (
        <div className="space-y-6">
          {/* Explorer Filter Bar with Morpheme Switcher, Pathway & Search */}
          <div className="bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Morpheme Type Switcher (Roots / Prefixes / Suffixes) */}
              <div className="flex items-center space-x-1 font-mono text-xs">
                {[
                  { key: 'ROOT', label: 'ROOTS', count: filteredExplorerRoots.length },
                  { key: 'PREFIX', label: 'PREFIXES', count: filteredExplorerPrefixes.length },
                  { key: 'SUFFIX', label: 'SUFFIXES', count: filteredExplorerSuffixes.length },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setExplorerMorphemeType(f.key)}
                    className={`px-3 py-1.5 font-black uppercase border-2 border-[#111410] transition ${
                      explorerMorphemeType === f.key
                        ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410]'
                        : 'bg-[#FAFBF8] text-[#111410] hover:bg-white'
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              {explorerMorphemeType === 'ROOT' && (
                <>
                  {/* Dual Learning Mode Pathway Segmented Control */}
                  <PathwayToggle
                    currentPathway={learningPathway}
                    onPathwayChange={handlePathwayChange}
                  />

                  {/* Origin Filter */}
                  <div className="flex items-center space-x-1 font-mono text-xs">
                    <span className="font-black uppercase text-[#62685E] mr-1 hidden sm:inline">ORIGIN:</span>
                    {['ALL', 'Latin', 'Greek'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-3 py-1 font-black uppercase border-2 border-[#111410] transition ${
                          selectedLanguage.toLowerCase() === lang.toLowerCase()
                            ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410]'
                            : 'bg-[#FAFBF8] text-[#111410] hover:bg-white'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#62685E]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="SEARCH ROOTS, PREFIXES, SUFFIXES, OR WORDS..."
                className="w-full bg-[#FAFBF8] text-[#111410] font-mono font-bold text-xs pl-9 pr-8 py-2 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] focus:outline-none uppercase"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-[#42281D]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* VIEW 1: PREFIX EXPLORER */}
          {explorerMorphemeType === 'PREFIX' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#EDF5E5] border-2 border-[#111410] p-4 shadow-[4px_4px_0px_0px_#111410] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="w-10 h-10 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center justify-center shrink-0 text-xl">
                    🧩
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-sm font-black font-sans uppercase text-[#2F441E] tracking-tight">
                        Prefix Morphemes · Direction, Negation & Intensity
                      </h2>
                      <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 bg-[#7BB33B] text-white border border-[#111410]">
                        Prefix Lexicon
                      </span>
                    </div>
                    <p className="text-xs font-mono text-[#42281D] mt-0.5">
                      Prefixes attach to the front of base roots to convey direction, negation, or intensity. Click "Study This Prefix" to practice flashcards for its words.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 bg-white border border-[#111410] text-[#2F441E]">
                    {filteredExplorerPrefixes.length} Prefixes
                  </span>
                </div>
              </div>

              {filteredExplorerPrefixes.length === 0 ? (
                <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-[#FAFBF8] border-2 border-[#111410] flex items-center justify-center mx-auto text-xl">
                    🔍
                  </div>
                  <h3 className="text-sm font-black font-mono uppercase text-[#111410]">
                    No Prefixes Found
                  </h3>
                  <p className="text-xs font-mono text-[#62685E]">
                    No prefixes matched your search query "{searchTerm}".
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-[#7BB33B] text-white font-mono text-xs font-black uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredExplorerPrefixes.map(p => (
                    <div
                      key={p.id}
                      className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5 flex flex-col justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] transition"
                    >
                      <div>
                        <div className="border-b-2 border-[#111410] pb-2.5 mb-3 flex items-center justify-between">
                          <span className="font-mono text-base font-black text-[#111410] uppercase tracking-wider">
                            {p.title}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] uppercase font-bold">
                              PREFIX
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#FAFBF8] border border-[#111410] font-bold text-[#62685E]">
                              {p.wordCount} Words
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-sm font-serif italic text-[#42281D] leading-snug">
                            "{p.core_meaning}"
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono font-bold uppercase text-[#62685E] block">
                            Derivative Words:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {p.words.slice(0, 6).map((w, i) => (
                              <span
                                key={w.id || i}
                                className="px-2 py-0.5 bg-[#FAFBF8] border border-[#111410] text-[10px] font-mono font-bold uppercase text-[#111410]"
                              >
                                {w.word}
                              </span>
                            ))}
                            {p.words.length > 6 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono text-[#62685E]">
                                +{p.words.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLaunchPrefixPractice(p.cleanToken)}
                        className="mt-5 w-full flex items-center justify-center space-x-2 py-2 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Study This Prefix ({p.wordCount})</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: SUFFIX EXPLORER */}
          {explorerMorphemeType === 'SUFFIX' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#FAFBF8] border-2 border-[#111410] p-4 shadow-[4px_4px_0px_0px_#111410] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="w-10 h-10 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center justify-center shrink-0 text-xl">
                    🏷️
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-sm font-black font-sans uppercase text-[#111410] tracking-tight">
                        Suffix Morphemes · Grammatical Roles & Nuance
                      </h2>
                      <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 bg-[#111410] text-white border border-[#111410]">
                        Suffix Lexicon
                      </span>
                    </div>
                    <p className="text-xs font-mono text-[#42281D] mt-0.5">
                      Suffixes govern grammatical parts of speech (noun, adjective, verb) or convey condition, degree, or capacity. Click "Study This Suffix" to practice flashcards for its words.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 bg-white border border-[#111410] text-[#111410]">
                    {filteredExplorerSuffixes.length} Suffixes
                  </span>
                </div>
              </div>

              {filteredExplorerSuffixes.length === 0 ? (
                <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-[#FAFBF8] border-2 border-[#111410] flex items-center justify-center mx-auto text-xl">
                    🔍
                  </div>
                  <h3 className="text-sm font-black font-mono uppercase text-[#111410]">
                    No Suffixes Found
                  </h3>
                  <p className="text-xs font-mono text-[#62685E]">
                    No suffixes matched your search query "{searchTerm}".
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-[#7BB33B] text-white font-mono text-xs font-black uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredExplorerSuffixes.map(s => (
                    <div
                      key={s.id}
                      className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5 flex flex-col justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] transition"
                    >
                      <div>
                        <div className="border-b-2 border-[#111410] pb-2.5 mb-3 flex items-center justify-between">
                          <span className="font-mono text-base font-black text-[#111410] uppercase tracking-wider">
                            {s.title}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#FAFBF8] text-[#111410] border border-[#111410] uppercase font-bold">
                              SUFFIX
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] font-bold">
                              {s.wordCount} Words
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-sm font-serif italic text-[#42281D] leading-snug">
                            "{s.core_meaning}"
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono font-bold uppercase text-[#62685E] block">
                            Derivative Words:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {s.words.slice(0, 6).map((w, i) => (
                              <span
                                key={w.id || i}
                                className="px-2 py-0.5 bg-[#FAFBF8] border border-[#111410] text-[10px] font-mono font-bold uppercase text-[#111410]"
                              >
                                {w.word}
                              </span>
                            ))}
                            {s.words.length > 6 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono text-[#62685E]">
                                +{s.words.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLaunchSuffixPractice(s.cleanToken)}
                        className="mt-5 w-full flex items-center justify-center space-x-2 py-2 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Study This Suffix ({s.wordCount})</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: ROOTS EXPLORER */}
          {explorerMorphemeType === 'ROOT' && (
            <div className="space-y-6 animate-fade-in">
              {/* Active Learning Mode Perspective Explanation Banner */}
          {learningPathway === PATHWAY_THEMATIC ? (
            <div className="bg-[#EDF5E5] border-2 border-[#111410] p-4 shadow-[4px_4px_0px_0px_#111410] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-start sm:items-center space-x-3">
                <div className="w-10 h-10 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center justify-center shrink-0 text-xl">
                  🧠
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-black font-sans uppercase text-[#2F441E] tracking-tight">
                      Thematic Pathways · Semantic Network Perspective
                    </h2>
                    <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 bg-[#7BB33B] text-white border border-[#111410]">
                      Active Mode
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#42281D] mt-0.5">
                    Root families grouped into semantic conceptual clusters (Movement, Communication, Cognition, Emotion, etc.) to build an interconnected narrative network.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 bg-white border border-[#111410] text-[#2F441E]">
                  {filteredExplorerRoots.length} Roots · {groupedExplorerRoots.filter(g => g.roots.length > 0).length} Clusters
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#FFFBEB] border-2 border-[#111410] p-4 shadow-[4px_4px_0px_0px_#111410] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-start sm:items-center space-x-3">
                <div className="w-10 h-10 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center justify-center shrink-0 text-xl">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-black font-sans uppercase text-[#92400E] tracking-tight">
                      Core Yield · 80/20 SAT & ACT Frequency Tiers
                    </h2>
                    <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 bg-[#F59E0B] text-black border border-[#111410]">
                      Active Mode
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#78350F] mt-0.5">
                    Roots organized by SAT/ACT frequency tiers (Tier 1 High-Yield, Tier 2 Multipliers, Tier 3 Advanced) for a direct, high-leverage 80/20 test-prep strategy.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 bg-white border border-[#111410] text-[#92400E]">
                  {filteredExplorerRoots.length} Roots · 3 Yield Tiers
                </span>
              </div>
            </div>
          )}

          {/* Grouped Root Sections (Semantic Clusters or Yield Tiers) */}
          {groupedExplorerRoots.filter(group => group.roots.length > 0).length === 0 ? (
            <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-[#FAFBF8] border-2 border-[#111410] flex items-center justify-center mx-auto text-xl">
                🔍
              </div>
              <h3 className="text-sm font-black font-mono uppercase text-[#111410]">
                No Root Families Found
              </h3>
              <p className="text-xs font-mono text-[#62685E]">
                No roots matched your search query "{searchTerm}" under the {selectedLanguage} origin filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLanguage('ALL');
                }}
                className="px-4 py-2 bg-[#7BB33B] text-white font-mono text-xs font-black uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedExplorerRoots
                .filter(group => group.roots.length > 0)
                .map((group) => (
                  <div key={group.id} className="space-y-4">
                    {/* Group Header Banner */}
                    <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center space-x-3">
                        <span className="text-2xl select-none shrink-0">{group.icon}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-black font-sans uppercase text-[#111410]">
                              {group.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#FAFBF8] border border-[#111410] uppercase text-[#62685E]">
                              {group.roots.length} {group.roots.length === 1 ? 'Root Family' : 'Root Families'}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-[#42281D] mt-0.5">
                            {group.description}
                          </p>
                        </div>
                      </div>

                      {/* Quick Practice Launcher for this Group */}
                      <button
                        type="button"
                        onClick={() => handleOpenCustomSession(group.roots.map(r => r.id))}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#FAFBF8] hover:bg-[#EDF5E5] text-[#111410] hover:text-[#2F441E] font-mono text-xs font-black uppercase border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] active:translate-x-[1px] active:translate-y-[1px] transition shrink-0 self-start sm:self-auto"
                        title={`Start custom practice with all ${group.roots.length} roots in this ${learningPathway === PATHWAY_THEMATIC ? 'cluster' : 'tier'}`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#7BB33B]" />
                        <span>Practice {learningPathway === PATHWAY_THEMATIC ? 'Cluster' : 'Tier'} ({group.roots.length})</span>
                      </button>
                    </div>

                    {/* Root Bento Grid for this group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {group.roots.map((root) => {
                        const rootWords = words.filter(w => w.root === root.id || w.root_details?.id === root.id);

                        return (
                          <div
                            key={root.id}
                            className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5 flex flex-col justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] transition"
                          >
                            <div>
                              {/* Card Header with Morpheme, Origin, and Pathway Badges */}
                              <div className="border-b-2 border-[#111410] pb-2.5 mb-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-sm font-black text-[#111410] uppercase tracking-wider">
                                    [{root.morpheme.toUpperCase()}]
                                  </span>
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] uppercase font-bold">
                                      {root.language}
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#FAFBF8] border border-[#111410] font-bold text-[#62685E]">
                                      {rootWords.length} Words
                                    </span>
                                  </div>
                                </div>

                                {/* Pathway Dual Tagging Badges */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  <span
                                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 border border-[#111410] ${
                                      learningPathway === PATHWAY_THEMATIC
                                        ? 'bg-[#EDF5E5] text-[#2F441E] font-black'
                                        : 'bg-[#FAFBF8] text-[#42281D]'
                                    }`}
                                    title={`Thematic Cluster: ${root.thematic_cluster}`}
                                  >
                                    🧠 {root.thematic_cluster || 'Movement'}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono uppercase px-2 py-0.5 border border-[#111410] ${
                                      learningPathway === PATHWAY_YIELD
                                        ? 'bg-[#FFFBEB] text-[#92400E] font-black'
                                        : 'bg-[#FAFBF8] text-[#62685E] font-bold'
                                    }`}
                                    title={`SAT/ACT Frequency Tier: ${root.sat_tier}`}
                                  >
                                    ⚡ {root.sat_tier || 'Tier 1 High-Yield'}
                                  </span>
                                </div>
                              </div>

                              {/* Core Meaning & Key */}
                              <div className="space-y-2 mb-4">
                                <p className="text-sm font-serif italic text-[#42281D] leading-snug">
                                  "{root.core_meaning}"
                                </p>
                                {root.mnemonic && (
                                  <div className="text-[11px] font-mono text-[#62685E] bg-[#FAFBF8] p-2 border border-[#111410]/30">
                                    <span className="font-bold text-[#2F441E] uppercase mr-1">Key:</span>
                                    {root.mnemonic}
                                  </div>
                                )}
                              </div>

                              {/* Word Families Sample */}
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-mono font-bold uppercase text-[#62685E] block">
                                  Family Derivatives:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {rootWords.slice(0, 5).map((w, i) => (
                                    <button
                                      key={w.id || i}
                                      type="button"
                                      onClick={() => {
                                        if (isAdminMode) {
                                          setEditingReviewWord(w);
                                        }
                                      }}
                                      className={`px-2 py-0.5 border text-[10px] font-mono font-bold uppercase transition ${
                                        isAdminMode
                                          ? 'hover:bg-[#EDF5E5] hover:border-[#7BB33B] cursor-pointer active:translate-x-[1px]'
                                          : 'cursor-default'
                                      } ${
                                        w.review?.verified
                                          ? 'bg-[#EDF5E5] text-[#2F441E] border-[#7BB33B]'
                                          : 'bg-[#FAFBF8] border-[#111410] text-[#111410]'
                                      }`}
                                      title={isAdminMode ? `Click to review and verify "${w.word}"` : undefined}
                                    >
                                      {w.review?.verified && <span className="mr-1 text-[#7BB33B]">✓</span>}
                                      {w.word}
                                    </button>
                                  ))}
                                  {rootWords.length > 5 && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-mono text-[#62685E]">
                                      +{rootWords.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Launch Practice for this root */}
                            <button
                              onClick={() => handleLaunchRootPractice(root.id)}
                              className="mt-5 w-full flex items-center justify-center space-x-2 py-2 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px]"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Study This Root</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
              </div>
            )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 3: VOCAB PROGRESS & MASTERY */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'progress' && (
        <div className="space-y-6">
          {/* High-Level Stats Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5">
              <span className="text-[10px] font-mono font-black uppercase text-[#62685E]">Total Vocabulary</span>
              <div className="text-3xl font-black font-mono text-[#111410] mt-1">{words.length}</div>
              <span className="text-[10px] font-mono text-[#42281D] mt-1 block">Full SAT/ACT Lexicon</span>
            </div>

            <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5">
              <span className="text-[10px] font-mono font-black uppercase text-[#62685E]">Roots Available</span>
              <div className="text-3xl font-black font-mono text-[#111410] mt-1">{roots.length}</div>
              <span className="text-[10px] font-mono text-[#42281D] mt-1 block">Latin & Greek Families</span>
            </div>

            <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5">
              <span className="text-[10px] font-mono font-black uppercase text-[#62685E]">Words Reviewed</span>
              <div className="text-3xl font-black font-mono text-[#7BB33B] mt-1">
                {vocabStats?.words_reviewed ?? (stats?.sections?.vocab?.unique_reviewed || 0)}
              </div>
              <span className="text-[10px] font-mono text-[#62685E] mt-1 block">Unique Words Attempted</span>
            </div>

            <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5">
              <span className="text-[10px] font-mono font-black uppercase text-[#62685E]">Retention Accuracy</span>
              <div className="text-3xl font-black font-mono text-[#111410] mt-1">
                {vocabStats?.retention_rate ?? (stats?.sections?.vocab?.accuracy_percentage || 0)}%
              </div>
              <span className="text-[10px] font-mono text-[#2F441E] mt-1 block font-bold">Session Accuracy Rate</span>
            </div>
          </div>

          {/* Root Mastery List */}
          <div className="bg-white border-2 border-[#111410] shadow-[5px_5px_0px_0px_#111410] p-6">
            <div className="flex items-center justify-between border-b-2 border-[#111410] pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black font-sans uppercase text-[#111410]">
                  Etymology Root Mastery Index
                </h3>
                <p className="text-xs font-mono text-[#62685E]">
                  Continuous tracking of root families, mastery rings, and retention rate.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(vocabStats?.root_mastery || stats?.root_mastery || []).slice(0, 12).map((r) => (
                <div
                  key={r.id}
                  className="bg-[#FAFBF8] border-2 border-[#111410] p-4 shadow-[2px_2px_0px_0px_#111410] flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-black uppercase text-[#111410]">
                        {r.morpheme}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] uppercase font-bold">
                        {r.language}
                      </span>
                    </div>
                    <p className="text-xs font-serif italic text-[#42281D] truncate mt-0.5">
                      "{r.core_meaning}"
                    </p>
                    <div className="w-full bg-[#EFE8DF] border border-[#111410] h-2 mt-2">
                      <div
                        className="bg-[#7BB33B] h-full"
                        style={{ width: `${r.mastery_percentage || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black font-mono text-[#111410]">
                      {r.mastery_percentage || 0}%
                    </div>
                    <span className="text-[10px] font-mono text-[#62685E] block uppercase">
                      {r.mastered_words || 0}/{r.total_words} Words
                    </span>
                    <button
                      onClick={() => handleLaunchRootPractice(r.id)}
                      className="mt-1 text-[10px] font-mono font-bold uppercase text-[#7BB33B] hover:underline"
                    >
                      Practice →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 4: ROOT GRAPH (ETYMOLOGY KNOWLEDGE GRAPH) */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'graph' && (
        <VocabGraphView
          initialRoots={roots}
          isAdminMode={isAdminMode}
          onUpdateWordReview={onUpdateWordReview}
          onNavigateStudy={(word) => {
            if (word) {
              handleSelectSingleWord(word);
            } else {
              handleAttemptTabChange('study');
            }
          }}
          onSelectRootPractice={(rootId) => {
            handleOpenCustomSession([Number(rootId)]);
          }}
          onOpenMorpheme={handleOpenMorpheme}
        />
      )}

      {/* CONFIGURABLE CUSTOM PRACTICE SESSION MODAL */}
      <CustomPracticeModal
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false);
          setCustomModalInitialMorpheme(null);
          setCustomModalInitialMorphemes([]);
        }}
        roots={roots}
        words={words}
        initialSelectedRootIds={customModalInitialRoots}
        initialSelectedMorphemes={customModalInitialMorphemes}
        initialMorpheme={customModalInitialMorpheme}
        onLaunchSession={handleLaunchCustomSession}
      />

      {/* DEDICATED EDITORIAL REVIEW MODAL (ACTIVE IN REVIEW MODE) */}
      <EditorialReviewModal
        isOpen={Boolean(editingReviewWord)}
        onClose={() => setEditingReviewWord(null)}
        words={words}
        roots={roots}
        initialWord={editingReviewWord}
        onSaveReview={(wordKey, review) => {
          if (onUpdateWordReview) {
            onUpdateWordReview(wordKey, review);
          }
        }}
      />

    </div>
  );
}
