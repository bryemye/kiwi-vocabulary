import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Network, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  Eye,
  Compass,
  Check,
  AlertCircle,
  Edit3,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchRoots, fetchVocabStats, logStudyAttempt } from '../services/api';
import { 
  saveWordReview, 
  getWordReview, 
  mergeReviewsIntoRoots 
} from '../services/editorialService';

/**
 * Deterministic Pseudo-Random Generator based on seed
 */
function pseudoRandom(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Geometric Neo-Brutalist Canvas Rectangle with Hard Drop Shadow
 */
function drawNeoCard(ctx, x, y, width, height, options = {}) {
  const {
    fillColor = '#EFE8DF',
    borderColor = '#111410',
    borderWidth = 2,
    shadowColor = '#42281D',
    shadowOffsetX = 3,
    shadowOffsetY = 3,
    alpha = 1.0,
  } = options;

  const left = x - width / 2;
  const top = y - height / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // 1. Hard Shadow
  if ((shadowOffsetX || shadowOffsetY) && alpha > 0.3) {
    ctx.fillStyle = shadowColor;
    ctx.fillRect(left + shadowOffsetX, top + shadowOffsetY, width, height);
  }

  // 2. Main Box Fill
  ctx.fillStyle = fillColor;
  ctx.fillRect(left, top, width, height);

  // 3. Crisp Border
  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(left, top, width, height);
  }

  ctx.restore();
}

/**
 * Ambient background dust motes inside the cavern of the mind
 */
const AMBIENT_MOTES_COUNT = 75;
function createAmbientDustMotes() {
  const motes = [];
  for (let i = 0; i < AMBIENT_MOTES_COUNT; i++) {
    const angle = pseudoRandom(i * 13 + 1) * Math.PI * 2;
    const dist = 80 + pseudoRandom(i * 13 + 2) * 1350;
    motes.push({
      baseX: Math.cos(angle) * dist,
      baseY: Math.sin(angle) * dist,
      radius: 1 + pseudoRandom(i * 13 + 3) * 2.2,
      speedX: 0.15 + pseudoRandom(i * 13 + 4) * 0.25,
      speedY: 0.12 + pseudoRandom(i * 13 + 5) * 0.22,
      ampX: 25 + pseudoRandom(i * 13 + 6) * 40,
      ampY: 20 + pseudoRandom(i * 13 + 7) * 35,
      phaseX: pseudoRandom(i * 13 + 8) * Math.PI * 2,
      phaseY: pseudoRandom(i * 13 + 9) * Math.PI * 2,
      baseAlpha: 0.08 + pseudoRandom(i * 13 + 10) * 0.22,
      pulseFreq: 0.25 + pseudoRandom(i * 13 + 11) * 0.35,
      pulsePhase: pseudoRandom(i * 13 + 12) * Math.PI * 2,
    });
  }
  return motes;
}

/**
 * Deterministic 2D Node-Link Layout Generator with Dust-Mote Drift Parameters
 */
function buildGraphLayout(roots, masteredSet) {
  const nodes = [];
  const edges = [];

  // 1. Origin Nodes
  const originLatin = {
    id: 'origin-latin',
    type: 'origin',
    label: 'LATIN ROOTS',
    language: 'Latin',
    baseX: -800,
    baseY: 0,
    x: -800,
    y: 0,
    width: 170,
    height: 52,
    driftSpeedX: 0.15,
    driftSpeedY: 0.12,
    driftAmpX: 8,
    driftAmpY: 6,
    driftPhaseX: 0.5,
    driftPhaseY: 1.2,
    fadeFreq: 0.15,
    fadePhase: 0,
    minFadeOpacity: 0.45,
    maxFadeOpacity: 0.85,
    opacity: 0.85,
  };

  const originGreek = {
    id: 'origin-greek',
    type: 'origin',
    label: 'GREEK ROOTS',
    language: 'Greek',
    baseX: 800,
    baseY: 0,
    x: 800,
    y: 0,
    width: 170,
    height: 52,
    driftSpeedX: 0.18,
    driftSpeedY: 0.14,
    driftAmpX: 8,
    driftAmpY: 6,
    driftPhaseX: 2.1,
    driftPhaseY: 0.8,
    fadeFreq: 0.15,
    fadePhase: 1.5,
    minFadeOpacity: 0.45,
    maxFadeOpacity: 0.85,
    opacity: 0.85,
  };

  nodes.push(originLatin, originGreek);

  const latinRoots = roots.filter(r => (r.language || '').toLowerCase() === 'latin');
  const greekRoots = roots.filter(r => (r.language || '').toLowerCase() === 'greek');
  const otherRoots = roots.filter(r => {
    const l = (r.language || '').toLowerCase();
    return l !== 'latin' && l !== 'greek';
  });

  const positionRoots = (rootList, origin) => {
    const total = rootList.length;
    if (total === 0) return;

    const ring1Cap = Math.min(14, Math.ceil(total * 0.35));
    const ring2Cap = Math.min(26, Math.ceil(total * 0.40));
    const ringRadii = [380, 680, 980];

    rootList.forEach((root, idx) => {
      let ringIdx = 0;
      let posInRing = idx;
      let countInRing = ring1Cap;

      if (idx >= ring1Cap && idx < ring1Cap + ring2Cap) {
        ringIdx = 1;
        posInRing = idx - ring1Cap;
        countInRing = ring2Cap;
      } else if (idx >= ring1Cap + ring2Cap) {
        ringIdx = 2;
        posInRing = idx - ring1Cap - ring2Cap;
        countInRing = total - (ring1Cap + ring2Cap);
      }

      const radius = ringRadii[ringIdx];
      const angle = (posInRing / countInRing) * 2 * Math.PI + (ringIdx * 0.35);

      const rootX = origin.baseX + radius * Math.cos(angle);
      const rootY = origin.baseY + radius * Math.sin(angle);

      const seed = idx * 11 + (origin.id === 'origin-greek' ? 500 : 0);
      const rootNodeId = `root-${root.id}`;

      const rootNode = {
        id: rootNodeId,
        rawId: root.id,
        type: 'root',
        morpheme: root.morpheme,
        language: root.language,
        core_meaning: root.core_meaning,
        mnemonic: root.mnemonic,
        total_words: (root.words || []).length,
        data: root,
        baseX: rootX,
        baseY: rootY,
        x: rootX,
        y: rootY,
        width: 95,
        height: 46,
        originId: origin.id,
        // Harmonic Dust Mote Drift Parameters
        driftSpeedX: 0.25 + pseudoRandom(seed * 7 + 1) * 0.35,
        driftSpeedY: 0.20 + pseudoRandom(seed * 7 + 2) * 0.30,
        driftAmpX: 14 + pseudoRandom(seed * 7 + 3) * 16,
        driftAmpY: 12 + pseudoRandom(seed * 7 + 4) * 14,
        driftPhaseX: pseudoRandom(seed * 7 + 5) * Math.PI * 2,
        driftPhaseY: pseudoRandom(seed * 7 + 6) * Math.PI * 2,
        // Breathing Fade Parameters
        fadeFreq: 0.18 + pseudoRandom(seed * 7 + 7) * 0.25,
        fadePhase: pseudoRandom(seed * 7 + 8) * Math.PI * 2,
        minFadeOpacity: 0.20 + pseudoRandom(seed * 7 + 9) * 0.15,
        maxFadeOpacity: 0.75 + pseudoRandom(seed * 7 + 10) * 0.25,
        opacity: 0.75,
      };
      nodes.push(rootNode);

      // Edge: Origin -> Root
      edges.push({
        id: `edge-${origin.id}-${rootNodeId}`,
        from: origin.id,
        to: rootNodeId,
        type: 'origin-to-root',
        rootId: rootNodeId,
      });

      // Child Word Leaf Nodes
      const childWords = root.words || [];
      const wordCount = childWords.length;
      const wordOrbitRadius = 140;
      const outwardAngle = Math.atan2(rootY - origin.baseY, rootX - origin.baseX);

      childWords.forEach((word, wIdx) => {
        let wordAngle;
        if (wordCount === 1) {
          wordAngle = outwardAngle;
        } else {
          const span = Math.min(Math.PI * 1.3, (wordCount - 1) * 0.45);
          const step = span / (wordCount - 1);
          wordAngle = outwardAngle - span / 2 + wIdx * step;
        }

        const wordX = rootX + wordOrbitRadius * Math.cos(wordAngle);
        const wordY = rootY + wordOrbitRadius * Math.sin(wordAngle);

        const wordSeed = seed * 100 + wIdx * 13;
        const wordNodeId = `word-${word.id}`;
        const isMastered = masteredSet && masteredSet.has(word.id);

        const wordNode = {
          id: wordNodeId,
          rawId: word.id,
          type: 'word',
          word: word.word,
          isMastered,
          data: word,
          parentRoot: root,
          baseX: wordX,
          baseY: wordY,
          x: wordX,
          y: wordY,
          width: Math.max(86, word.word.length * 8.5 + 24),
          height: 28,
          rootNodeId,
          // Harmonic Dust Mote Drift Parameters
          driftSpeedX: 0.35 + pseudoRandom(wordSeed + 1) * 0.45,
          driftSpeedY: 0.30 + pseudoRandom(wordSeed + 2) * 0.40,
          driftAmpX: 10 + pseudoRandom(wordSeed + 3) * 12,
          driftAmpY: 9 + pseudoRandom(wordSeed + 4) * 11,
          driftPhaseX: pseudoRandom(wordSeed + 5) * Math.PI * 2,
          driftPhaseY: pseudoRandom(wordSeed + 6) * Math.PI * 2,
          // Breathing Fade Parameters
          fadeFreq: 0.25 + pseudoRandom(wordSeed + 7) * 0.30,
          fadePhase: pseudoRandom(wordSeed + 8) * Math.PI * 2,
          minFadeOpacity: 0.15 + pseudoRandom(wordSeed + 9) * 0.15,
          maxFadeOpacity: 0.70 + pseudoRandom(wordSeed + 10) * 0.25,
          opacity: 0.70,
        };
        nodes.push(wordNode);

        // Edge: Root -> Word
        edges.push({
          id: `edge-${rootNodeId}-${wordNodeId}`,
          from: rootNodeId,
          to: wordNodeId,
          type: 'root-to-word',
          rootId: rootNodeId,
        });
      });
    });
  };

  positionRoots(latinRoots, originLatin);
  positionRoots(greekRoots, originGreek);

  if (otherRoots.length > 0) {
    const originOther = {
      id: 'origin-other',
      type: 'origin',
      label: 'OTHER ROOTS',
      language: 'Other',
      baseX: 0,
      baseY: 850,
      x: 0,
      y: 850,
      width: 170,
      height: 52,
      driftSpeedX: 0.15,
      driftSpeedY: 0.12,
      driftAmpX: 8,
      driftAmpY: 6,
      driftPhaseX: 1.0,
      driftPhaseY: 1.0,
      fadeFreq: 0.15,
      fadePhase: 0,
      minFadeOpacity: 0.45,
      maxFadeOpacity: 0.85,
      opacity: 0.85,
    };
    nodes.push(originOther);
    positionRoots(otherRoots, originOther);
  }

  return { nodes, edges };
}

export default function VocabGraphView({ 
  onNavigateStudy, 
  onNavigateExplorer, 
  initialRoots = [],
  isAdminMode = false,
  onUpdateWordReview
}) {
  // Data States
  const [rootsData, setRootsData] = useState(() => mergeReviewsIntoRoots(initialRoots));
  const [masteredWordIds, setMasteredWordIds] = useState(new Set());
  const [loading, setLoading] = useState(!initialRoots || initialRoots.length === 0);
  const [error, setError] = useState(null);

  // Editorial Review & Verification State
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    verified: false,
    notes: '',
    verifiedBy: 'Admin',
  });
  const [saveSuccessToast, setSaveSuccessToast] = useState(null);

  // Focus & Search States
  // When focusedRootId is set, that root and its connections enter SHARP FOCUS
  // While all other nodes become ambient floating dust motes
  const [focusedRootId, setFocusedRootId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Graph Structure
  const [graphData, setGraphData] = useState(() => {
    if (initialRoots && initialRoots.length > 0) {
      const merged = mergeReviewsIntoRoots(initialRoots);
      return buildGraphLayout(merged, new Set());
    }
    return { nodes: [], edges: [] };
  });

  // Sync review form data when a word node is selected
  useEffect(() => {
    if (selectedNode && selectedNode.type === 'word') {
      const stored = getWordReview(selectedNode.word);
      const rev = selectedNode.data?.review || stored;
      setIsEditingReview(false);
      setReviewFormData({
        verified: Boolean(rev?.verified),
        notes: rev?.notes || '',
        verifiedBy: rev?.verifiedBy || 'Admin',
      });
      if (rev && !selectedNode.data?.review) {
        selectedNode.data.review = rev;
      }
    } else {
      setIsEditingReview(false);
    }
  }, [selectedNode]);

  // Listen to cross-component review update events
  useEffect(() => {
    const handleReviewUpdated = (e) => {
      const { word, review } = e.detail || {};
      if (!word) return;
      if (selectedNode && selectedNode.type === 'word' && selectedNode.word?.toLowerCase() === word.toLowerCase()) {
        setSelectedNode(prev => prev ? ({
          ...prev,
          data: { ...prev.data, review }
        }) : null);
      }
      setGraphData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => {
          if (n.type === 'word' && n.word?.toLowerCase() === word.toLowerCase()) {
            return {
              ...n,
              data: { ...n.data, review }
            };
          }
          return n;
        })
      }));
    };

    window.addEventListener('kiwi_editorial_review_updated', handleReviewUpdated);
    return () => window.removeEventListener('kiwi_editorial_review_updated', handleReviewUpdated);
  }, [selectedNode]);

  // Handler to save verification review
  const handleSaveReview = () => {
    if (!selectedNode || selectedNode.type !== 'word') return;
    const wordKey = selectedNode.word;
    const isVerified = Boolean(reviewFormData.verified);
    const updatedReview = {
      verified: isVerified,
      verifiedAt: isVerified 
        ? (selectedNode.data?.review?.verifiedAt || new Date().toISOString())
        : null,
      verifiedBy: (reviewFormData.verifiedBy || 'Admin').trim(),
      notes: (reviewFormData.notes || '').trim(),
    };

    saveWordReview(wordKey, updatedReview);

    // Update locally in selectedNode
    const updatedWordData = { ...selectedNode.data, review: updatedReview };
    setSelectedNode(prev => ({
      ...prev,
      data: updatedWordData,
    }));

    // Update in graph topology
    setGraphData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => {
        if (n.id === selectedNode.id) {
          return { ...n, data: updatedWordData };
        }
        return n;
      }),
    }));

    // Update in rootsData
    setRootsData(prev => {
      if (!prev) return prev;
      return prev.map(r => ({
        ...r,
        words: (r.words || []).map(w => {
          if (w.word?.toLowerCase() === wordKey.toLowerCase()) {
            return { ...w, review: updatedReview };
          }
          return w;
        })
      }));
    });

    if (onUpdateWordReview) {
      onUpdateWordReview(wordKey, updatedReview);
    }

    setIsEditingReview(false);
    setSaveSuccessToast('Editorial verification saved to localStorage!');
    setTimeout(() => {
      setSaveSuccessToast(null);
    }, 3500);
  };

  // Ambient Dust Specks in Cavern of Mind
  const ambientDustMotesRef = useRef(createAmbientDustMotes());

  // Mini-Flashcard Study Modal State
  const [studyWordModal, setStudyWordModal] = useState(null);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [cardStartTime, setCardStartTime] = useState(Date.now());

  // Camera & Canvas Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const cameraRef = useRef({ x: 0, y: 0, zoom: 0.68 });
  const targetCameraRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cameraStartRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const keysPressedRef = useRef(new Set());
  const animationFrameIdRef = useRef(null);
  const isComponentMountedRef = useRef(true);

  // Ref to hold focusedRootId for direct access inside the 60fps render loop
  const focusedRootIdRef = useRef(focusedRootId);
  useEffect(() => {
    focusedRootIdRef.current = focusedRootId;
  }, [focusedRootId]);

  // Sync initialRoots if passed or changed
  useEffect(() => {
    if (initialRoots && initialRoots.length > 0 && graphData.nodes.length === 0) {
      const merged = mergeReviewsIntoRoots(initialRoots);
      setRootsData(merged);
      setGraphData(buildGraphLayout(merged, masteredWordIds));
      setLoading(false);
    }
  }, [initialRoots, graphData.nodes.length, masteredWordIds]);

  // ---------------------------------------------------------------------------
  // 1. DATA INGESTION & GRAPH TOPOLOGY SYNTHESIS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    isComponentMountedRef.current = true;
    let isCancelled = false;

    async function loadData() {
      try {
        if (graphData.nodes.length === 0) {
          setLoading(true);
        }
        setError(null);

        const [rootsRes, statsRes] = await Promise.allSettled([
          fetchRoots(),
          fetchVocabStats()
        ]);

        if (rootsRes.status !== 'fulfilled') {
          throw new Error('Failed to retrieve etymological roots data.');
        }

        const rawRoots = rootsRes.value || [];
        const roots = mergeReviewsIntoRoots(rawRoots);
        if (isCancelled) return;
        setRootsData(roots);

        const mastered = new Set();
        if (statsRes.status === 'fulfilled' && statsRes.value) {
          const stats = statsRes.value;
          if (Array.isArray(stats.root_mastery)) {
            stats.root_mastery.forEach(rm => {
              if (rm.mastered_words && rm.words) {
                rm.words.forEach(w => {
                  if (w.is_mastered) mastered.add(w.id);
                });
              }
            });
          }
        }
        setMasteredWordIds(mastered);

        const layout = buildGraphLayout(roots, mastered);
        setGraphData(layout);
      } catch (err) {
        console.error('Error initializing Vocab Graph:', err);
        if (!isCancelled) {
          setError(err.message || 'Unable to load etymology graph data.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      isCancelled = true;
      isComponentMountedRef.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 2. ROOT FOCUS ENGINE & CAMERA GLIDE
  // ---------------------------------------------------------------------------

  const focusRoot = useCallback((rootNode) => {
    if (!rootNode) return;
    setFocusedRootId(rootNode.id);
    setSelectedNode(rootNode);

    // Smoothly pan camera to center the focused root with comfortable zoom
    const drawerOffset = 180;
    targetCameraRef.current = {
      x: -rootNode.baseX - drawerOffset,
      y: -rootNode.baseY,
      zoom: 1.05,
    };
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedRootId(null);
    setSelectedNode(null);
    setSearchQuery('');
    targetCameraRef.current = { x: 0, y: 0, zoom: 0.65 };
  }, []);

  const smoothPanToNode = useCallback((node) => {
    if (!node) return;
    setSelectedNode(node);

    if (node.type === 'root') {
      setFocusedRootId(node.id);
    } else if (node.type === 'word' && node.rootNodeId) {
      setFocusedRootId(node.rootNodeId);
    }

    const drawerOffset = 180;
    targetCameraRef.current = {
      x: -node.baseX - drawerOffset,
      y: -node.baseY,
      zoom: node.type === 'word' ? 1.15 : 1.05,
    };
  }, []);

  const resetCamera = useCallback(() => {
    clearFocus();
  }, [clearFocus]);

  // Search Results filtering (Roots + Derivative Vocabulary Words)
  const allRoots = useMemo(() => {
    return graphData.nodes.filter(n => n.type === 'root');
  }, [graphData.nodes]);

  const allWords = useMemo(() => {
    return graphData.nodes.filter(n => n.type === 'word');
  }, [graphData.nodes]);

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return {
        roots: allRoots.slice(0, 5),
        words: allWords.slice(0, 5),
        total: Math.min(10, allRoots.length + allWords.length),
      };
    }

    // Matching Roots
    const matchingRoots = allRoots.filter(r => 
      r.morpheme.toLowerCase().includes(q) || 
      (r.core_meaning && r.core_meaning.toLowerCase().includes(q)) ||
      (r.language && r.language.toLowerCase().includes(q))
    ).slice(0, 5);

    // Matching Words
    const matchingWords = allWords.filter(w => 
      w.word.toLowerCase().includes(q) || 
      (w.data?.definition && w.data.definition.toLowerCase().includes(q)) ||
      (w.data?.prefix && w.data.prefix.toLowerCase().includes(q)) ||
      (w.data?.suffix && w.data.suffix.toLowerCase().includes(q)) ||
      (w.parentRoot?.morpheme && w.parentRoot.morpheme.toLowerCase().includes(q))
    ).slice(0, 8);

    return {
      roots: matchingRoots,
      words: matchingWords,
      total: matchingRoots.length + matchingWords.length,
    };
  }, [allRoots, allWords, searchQuery]);

  const currentlyFocusedRoot = useMemo(() => {
    if (!focusedRootId) return null;
    return graphData.nodes.find(n => n.id === focusedRootId && n.type === 'root') || null;
  }, [graphData.nodes, focusedRootId]);

  const handlePickRoot = useCallback((rootNode) => {
    focusRoot(rootNode);
    setSearchQuery('');
    setIsSearchFocused(false);
  }, [focusRoot]);

  const handlePickWord = useCallback((wordNode) => {
    const parentRootNode = graphData.nodes.find(n => n.id === wordNode.rootNodeId);
    if (parentRootNode) {
      focusRoot(parentRootNode);
    }
    setSelectedNode(wordNode);
    setSearchQuery('');
    setIsSearchFocused(false);
  }, [graphData.nodes, focusRoot]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.roots.length > 0) {
        handlePickRoot(searchResults.roots[0]);
      } else if (searchResults.words.length > 0) {
        handlePickWord(searchResults.words[0]);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 3. KEYBOARD LISTENERS (WASD, ARROWS, Q/E, R, ESC)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputActive = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (isInputActive) {
          document.activeElement.blur();
          setIsSearchFocused(false);
        }
        if (studyWordModal) {
          setStudyWordModal(null);
          return;
        }
        clearFocus();
        return;
      }

      if (isInputActive) return;

      const key = e.key.toLowerCase();

      // Quick shortcut to focus search: '/' or 'f'
      if (e.key === '/' || key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
        return;
      }

      if (key === 'r') {
        e.preventDefault();
        resetCamera();
        return;
      }

      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', 'q', 'e', '+', '=', '-'].includes(key)) {
        e.preventDefault();
        keysPressedRef.current.add(key);
        targetCameraRef.current = null;
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      keysPressedRef.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [clearFocus, resetCamera, studyWordModal]);

  // ---------------------------------------------------------------------------
  // 4. ANIMATION FRAME LOOP: DUST MOTES & SHARP FOCUS ENGINE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      if (!isComponentMountedRef.current) return;

      const container = containerRef.current;
      if (container) {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        const displayWidth = Math.round(rect.width);
        const displayHeight = Math.round(rect.height);

        if (displayWidth <= 0 || displayHeight <= 0) {
          animationFrameIdRef.current = requestAnimationFrame(render);
          return;
        }

        if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
          canvas.style.width = `${displayWidth}px`;
          canvas.style.height = `${displayHeight}px`;
        }

        ctx.resetTransform?.();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const width = displayWidth;
        const height = displayHeight;
        const time = performance.now() * 0.001;
        const currentFocusedId = focusedRootIdRef.current;

        // 1. Process Active Keyboard WASD Navigation
        const keys = keysPressedRef.current;
        const panSpeed = 16 / cameraRef.current.zoom;
        const zoomStep = 1.025;

        if (keys.has('w') || keys.has('arrowup')) cameraRef.current.y += panSpeed;
        if (keys.has('s') || keys.has('arrowdown')) cameraRef.current.y -= panSpeed;
        if (keys.has('a') || keys.has('arrowleft')) cameraRef.current.x += panSpeed;
        if (keys.has('d') || keys.has('arrowright')) cameraRef.current.x -= panSpeed;
        if (keys.has('q') || keys.has('-')) cameraRef.current.zoom = Math.max(0.18, cameraRef.current.zoom / zoomStep);
        if (keys.has('e') || keys.has('+') || keys.has('=')) cameraRef.current.zoom = Math.min(2.5, cameraRef.current.zoom * zoomStep);

        // 2. Smooth Auto-Pan Interpolation
        if (targetCameraRef.current) {
          const tc = targetCameraRef.current;
          const cam = cameraRef.current;
          cam.x += (tc.x - cam.x) * 0.12;
          cam.y += (tc.y - cam.y) * 0.12;
          cam.zoom += (tc.zoom - cam.zoom) * 0.12;

          if (
            Math.abs(tc.x - cam.x) < 0.5 &&
            Math.abs(tc.y - cam.y) < 0.5 &&
            Math.abs(tc.zoom - cam.zoom) < 0.005
          ) {
            cam.x = tc.x;
            cam.y = tc.y;
            cam.zoom = tc.zoom;
            targetCameraRef.current = null;
          }
        }

        // 3. Clear Canvas & Fill Background with Off-White (#FAFBF8)
        ctx.fillStyle = '#FAFBF8';
        ctx.fillRect(0, 0, width, height);

        // 4. Update Node Positions & Breathing Opacities
        // - Ambient Mode (no focus): Nodes drift organically and breathe in/out
        // - Focus Mode: The selected root & its children lock in 100% sharp focus
        //   while unrelated nodes fade down into subtle floating dust motes
        graphData.nodes.forEach(node => {
          const isFocalRoot = currentFocusedId && node.id === currentFocusedId;
          const isFocalChildWord = currentFocusedId && node.rootNodeId === currentFocusedId;
          const isFocalFamily = isFocalRoot || isFocalChildWord;

          if (!currentFocusedId) {
            // Ambient Floating Dust Mote Mode
            const driftX = Math.sin(time * node.driftSpeedX + node.driftPhaseX) * node.driftAmpX;
            const driftY = Math.cos(time * node.driftSpeedY + node.driftPhaseY) * node.driftAmpY;
            node.x = node.baseX + driftX;
            node.y = node.baseY + driftY;

            // Enforce ~80% of nodes having opacity 0 at any given moment
            // Sine wave threshold: values <= 0.60 stay strictly at 0
            const wave = Math.sin(time * node.fadeFreq + node.fadePhase);
            const threshold = 0.60;
            if (wave <= threshold) {
              node.opacity = 0;
            } else {
              const normalized = (wave - threshold) / (1 - threshold);
              const smoothCurve = normalized * normalized * (3 - 2 * normalized);
              node.opacity = smoothCurve * node.maxFadeOpacity;
            }
          } else if (isFocalFamily) {
            // Sharp Focus Mode: anchored firmly with subtle micro-levitation
            const microDriftX = Math.sin(time * 0.3 + node.driftPhaseX) * 1.5;
            const microDriftY = Math.cos(time * 0.3 + node.driftPhaseY) * 1.5;
            node.x = node.baseX + microDriftX;
            node.y = node.baseY + microDriftY;
            node.opacity = 1.0; // 100% sharp & solid
          } else {
            // Background Dust Motes during Focus Mode
            const driftX = Math.sin(time * node.driftSpeedX * 0.6 + node.driftPhaseX) * (node.driftAmpX * 1.3);
            const driftY = Math.cos(time * node.driftSpeedY * 0.6 + node.driftPhaseY) * (node.driftAmpY * 1.3);
            node.x = node.baseX + driftX;
            node.y = node.baseY + driftY;

            // 80% completely invisible, remaining 20% faint background dust
            const bgWave = Math.sin(time * node.fadeFreq + node.fadePhase);
            if (bgWave <= 0.60) {
              node.opacity = 0;
            } else {
              node.opacity = 0.08;
            }
          }
        });

        // 5. Draw Technical Grid & Cavern Circle Motif
        drawCavernBackgroundMotif(ctx, width, height, cameraRef.current, time);

        // 6. Viewport Transform
        ctx.save();
        ctx.translate(width / 2 + cameraRef.current.x, height / 2 + cameraRef.current.y);
        ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);

        // Frustum Culling Boundary
        const cam = cameraRef.current;
        const visibleLeft = (-width / 2 - cam.x) / cam.zoom - 140;
        const visibleRight = (width / 2 - cam.x) / cam.zoom + 140;
        const visibleTop = (-height / 2 - cam.y) / cam.zoom - 140;
        const visibleBottom = (height / 2 - cam.y) / cam.zoom + 140;

        const isVisible = (x, y) => {
          return x >= visibleLeft && x <= visibleRight && y >= visibleTop && y <= visibleBottom;
        };

        const nodeMap = new Map();
        graphData.nodes.forEach(n => nodeMap.set(n.id, n));

        // 7. Draw Connector Edges
        // First pass: ambient or background edges
        graphData.edges.forEach(edge => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return;
          if (!isVisible(fromNode.x, fromNode.y) && !isVisible(toNode.x, toNode.y)) return;
          if (fromNode.opacity <= 0.01 || toNode.opacity <= 0.01) return;

          const isFocalEdge = currentFocusedId && edge.rootId === currentFocusedId;
          if (isFocalEdge) return; // Drawn on top in second pass

          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);

          if (currentFocusedId) {
            // Unfocused background edge: very faint
            ctx.strokeStyle = '#111410';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.04;
          } else {
            // Ambient breathing edge
            ctx.strokeStyle = edge.type === 'origin-to-root' ? '#42281D' : '#111410';
            ctx.lineWidth = 1.2;
            ctx.globalAlpha = Math.min(fromNode.opacity, toNode.opacity) * 0.35;
          }
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        });

        // Second pass: Sharp Focus Edges for selected root family
        if (currentFocusedId) {
          graphData.edges.forEach(edge => {
            if (edge.rootId !== currentFocusedId) return;
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return;

            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.strokeStyle = '#7BB33B'; // Vivid Kiwi Green
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = 0.95;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          });
        }

        // 8. Draw Nodes
        graphData.nodes.forEach(node => {
          if (!isVisible(node.x, node.y)) return;
          if (node.opacity <= 0.005) return;

          const isFocal = currentFocusedId && (node.id === currentFocusedId || node.rootNodeId === currentFocusedId);
          const isSelected = selectedNode?.id === node.id;
          const isHovered = hoveredNodeId === node.id;

          if (node.type === 'origin') {
            drawOriginNode(ctx, node, isSelected, isHovered, currentFocusedId);
          } else if (node.type === 'root') {
            drawRootNode(ctx, node, isSelected, isHovered, isFocal);
          } else if (node.type === 'word') {
            drawWordNode(ctx, node, isSelected, isHovered, isFocal);
          }
        });

        ctx.restore();
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [graphData, selectedNode, hoveredNodeId]);

  // ---------------------------------------------------------------------------
  // 5. CAVERN OF THE MIND BACKGROUND CIRCLE & DUST MOTES
  // ---------------------------------------------------------------------------

  const drawCavernBackgroundMotif = (ctx, width, height, cam, time) => {
    // 1. Subtle CAD Technical Grid
    const gridSize = 60 * cam.zoom;
    if (gridSize >= 15) {
      const offsetX = (width / 2 + cam.x) % gridSize;
      const offsetY = (height / 2 + cam.y) % gridSize;
      ctx.strokeStyle = '#111410';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.06;
      ctx.beginPath();
      const crossSize = 2.5;
      for (let x = offsetX; x < width; x += gridSize) {
        for (let y = offsetY; y < height; y += gridSize) {
          ctx.moveTo(x - crossSize, y);
          ctx.lineTo(x + crossSize, y);
          ctx.moveTo(x, y - crossSize);
          ctx.lineTo(x, y + crossSize);
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // 2. Faint Cavern Circle Motif (Orb of Memory)
    const centerX = width / 2 + cam.x;
    const centerY = height / 2 + cam.y;
    const cavernRadius = 900 * cam.zoom;

    ctx.save();
    // Inner primary cavern circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, cavernRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#111410';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.08;
    ctx.stroke();

    // Secondary concentric dashed aura
    ctx.beginPath();
    ctx.arc(centerX, centerY, cavernRadius * 1.35, 0, Math.PI * 2);
    ctx.strokeStyle = '#7BB33B';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 12]);
    ctx.globalAlpha = 0.06;
    ctx.stroke();

    // Dual cardinal crosshairs in center of cavern
    ctx.beginPath();
    ctx.moveTo(centerX - cavernRadius * 1.4, centerY);
    ctx.lineTo(centerX + cavernRadius * 1.4, centerY);
    ctx.moveTo(centerX, centerY - cavernRadius * 1.4);
    ctx.lineTo(centerX, centerY + cavernRadius * 1.4);
    ctx.strokeStyle = '#111410';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 10]);
    ctx.globalAlpha = 0.04;
    ctx.stroke();
    ctx.restore();

    // 3. Floating Ambient Micro-Dust Specks
    const motes = ambientDustMotesRef.current;
    ctx.fillStyle = '#42281D';
    motes.forEach(m => {
      const moteWorldX = m.baseX + Math.sin(time * m.speedX + m.phaseX) * m.ampX;
      const moteWorldY = m.baseY + Math.cos(time * m.speedY + m.phaseY) * m.ampY;

      const screenX = width / 2 + cam.x + moteWorldX * cam.zoom;
      const screenY = height / 2 + cam.y + moteWorldY * cam.zoom;

      if (screenX >= -10 && screenX <= width + 10 && screenY >= -10 && screenY <= height + 10) {
        const pulse = 0.5 + 0.5 * Math.sin(time * m.pulseFreq + m.pulsePhase);
        const alpha = m.baseAlpha * pulse;
        ctx.beginPath();
        ctx.arc(screenX, screenY, m.radius * Math.max(0.6, cam.zoom), 0, Math.PI * 2);
        ctx.globalAlpha = alpha;
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1.0;
  };

  // ---------------------------------------------------------------------------
  // 6. NODE RENDERING HELPERS (RESPECTING DUST-MOTE OPACITY)
  // ---------------------------------------------------------------------------

  const drawOriginNode = (ctx, node, isSelected, isHovered, currentFocusedId) => {
    const isLatin = node.language === 'Latin';
    const isGreek = node.language === 'Greek';
    const bgFill = isLatin ? '#111410' : isGreek ? '#42281D' : '#2F441E';
    const effectiveAlpha = currentFocusedId ? 0.25 : node.opacity;

    drawNeoCard(ctx, node.x, node.y, node.width, node.height, {
      fillColor: bgFill,
      borderColor: isSelected || isHovered ? '#7BB33B' : '#111410',
      borderWidth: 2,
      shadowColor: '#111410',
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      alpha: effectiveAlpha,
    });

    ctx.save();
    ctx.globalAlpha = effectiveAlpha;
    // Green accent line
    ctx.fillStyle = '#84C341';
    ctx.fillRect(node.x - node.width / 2, node.y - node.height / 2, node.width, 4);

    ctx.fillStyle = '#FAFBF8';
    ctx.font = '900 12px "JetBrains Mono", Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x, node.y + 2);
    ctx.restore();
  };

  const drawRootNode = (ctx, node, isSelected, isHovered, isFocal) => {
    const isHighlighted = isSelected || isHovered;
    const effectiveAlpha = isFocal ? 1.0 : isHighlighted ? 1.0 : node.opacity;

    const borderColor = isFocal || isHighlighted ? '#7BB33B' : '#111410';
    const borderWidth = isFocal ? 3 : isHighlighted ? 2.5 : 2;
    const shadowColor = isFocal || isHighlighted ? '#7BB33B' : '#42281D';

    drawNeoCard(ctx, node.x, node.y, node.width, node.height, {
      fillColor: isFocal ? '#FAFBF8' : isHighlighted ? '#FAFBF8' : '#EFE8DF',
      borderColor,
      borderWidth,
      shadowColor,
      shadowOffsetX: isFocal ? 4 : 3,
      shadowOffsetY: isFocal ? 4 : 3,
      alpha: effectiveAlpha,
    });

    ctx.save();
    ctx.globalAlpha = effectiveAlpha;

    // Root Morpheme Typography
    ctx.fillStyle = '#111410';
    ctx.font = isFocal 
      ? 'bold 13px "JetBrains Mono", Menlo, Consolas, monospace' 
      : 'bold 12px "JetBrains Mono", Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let displayMorpheme = node.morpheme;
    if (displayMorpheme.length > 12) {
      displayMorpheme = displayMorpheme.slice(0, 11) + '…';
    }
    ctx.fillText(displayMorpheme, node.x, node.y - 6);

    // Subtitle badge
    ctx.fillStyle = isFocal ? '#2F441E' : '#62685E';
    ctx.font = 'bold 9px "JetBrains Mono", Menlo, Consolas, monospace';
    ctx.fillText(`${node.total_words} WORDS`, node.x, node.y + 11);
    ctx.restore();
  };

  const drawWordNode = (ctx, node, isSelected, isHovered, isFocal) => {
    const isHighlighted = isSelected || isHovered;
    const effectiveAlpha = isFocal ? 1.0 : isHighlighted ? 1.0 : node.opacity;

    const borderColor = isFocal || isHighlighted ? '#7BB33B' : '#111410';
    const borderWidth = isFocal ? 2.5 : isHighlighted ? 2 : 1.5;

    drawNeoCard(ctx, node.x, node.y, node.width, node.height, {
      fillColor: isHighlighted ? '#EDF5E5' : '#FFFFFF',
      borderColor,
      borderWidth,
      shadowColor: '#111410',
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      alpha: effectiveAlpha,
    });

    ctx.save();
    ctx.globalAlpha = effectiveAlpha;

    // Mastered Green Dot
    if (node.isMastered) {
      ctx.beginPath();
      ctx.arc(node.x - node.width / 2 + 8, node.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#7BB33B';
      ctx.fill();
      ctx.strokeStyle = '#111410';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Word Text
    ctx.fillStyle = '#111410';
    ctx.font = isFocal ? '700 11px Inter, system-ui, sans-serif' : '600 11px Inter, system-ui, sans-serif';
    ctx.textAlign = node.isMastered ? 'left' : 'center';
    ctx.textBaseline = 'middle';

    const textX = node.isMastered ? node.x - node.width / 2 + 16 : node.x;
    ctx.fillText(node.word, textX, node.y);
    ctx.restore();
  };

  // ---------------------------------------------------------------------------
  // 7. MOUSE CONTROLS & DYNAMIC HIT-TESTING
  // ---------------------------------------------------------------------------

  const screenToWorld = useCallback((screenX, screenY) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const cam = cameraRef.current;
    const worldX = (screenX - rect.width / 2 - cam.x) / cam.zoom;
    const worldY = (screenY - rect.height / 2 - cam.y) / cam.zoom;
    return { x: worldX, y: worldY };
  }, []);

  const getNodeAtScreenPos = useCallback((screenX, screenY) => {
    const { x, y } = screenToWorld(screenX, screenY);
    // Hit-test against floating positions (only visible nodes)
    for (let i = graphData.nodes.length - 1; i >= 0; i--) {
      const node = graphData.nodes[i];
      if (node.opacity <= 0.05) continue;
      const halfW = node.width / 2;
      const halfH = node.height / 2;
      if (
        x >= node.x - halfW &&
        x <= node.x + halfW &&
        y >= node.y - halfH &&
        y <= node.y + halfH
      ) {
        return node;
      }
    }
    return null;
  }, [graphData.nodes, screenToWorld]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    cameraStartRef.current = { ...cameraRef.current };
    dragDistanceRef.current = 0;
    targetCameraRef.current = null;
    setIsSearchFocused(false);

    const onWindowMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;
      dragDistanceRef.current += Math.hypot(dx, dy);

      cameraRef.current.x = cameraStartRef.current.x + dx;
      cameraRef.current.y = cameraStartRef.current.y + dy;
    };

    const onWindowMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);

      const wasDragging = dragDistanceRef.current > 5;
      isDraggingRef.current = false;

      if (!wasDragging) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const screenX = upEvent.clientX - rect.left;
        const screenY = upEvent.clientY - rect.top;
        const hitNode = getNodeAtScreenPos(screenX, screenY);

        if (hitNode) {
          if (hitNode.type === 'root') {
            focusRoot(hitNode);
          } else if (hitNode.type === 'word') {
            smoothPanToNode(hitNode);
          } else {
            smoothPanToNode(hitNode);
          }
        } else {
          // Clicked background: if a root was focused, clear back to ambient dust motes
          if (focusedRootIdRef.current) {
            clearFocus();
          } else {
            setSelectedNode(null);
          }
        }
      }
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
  };

  const handleMouseMove = (e) => {
    if (isDraggingRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const hitNode = getNodeAtScreenPos(screenX, screenY);
    setHoveredNodeId(hitNode ? hitNode.id : null);
  };

  // Dedicated non-passive wheel listener with strict containment
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = container.getBoundingClientRect();
      targetCameraRef.current = null;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const cam = cameraRef.current;
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(2.5, Math.max(0.18, cam.zoom * zoomFactor));

      const worldXBefore = (mouseX - rect.width / 2 - cam.x) / cam.zoom;
      const worldYBefore = (mouseY - rect.height / 2 - cam.y) / cam.zoom;

      cam.zoom = newZoom;
      cam.x = mouseX - rect.width / 2 - worldXBefore * newZoom;
      cam.y = mouseY - rect.height / 2 - worldYBefore * newZoom;
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // ---------------------------------------------------------------------------
  // 8. STUDY ATTEMPT & MINI-FLASHCARD HANDLER
  // ---------------------------------------------------------------------------
  const handleOpenMiniFlashcard = (wordData) => {
    setStudyWordModal(wordData);
    setFlashcardFlipped(false);
    setCardStartTime(Date.now());
  };

  const handleLogCardAttempt = async (isCorrect) => {
    if (!studyWordModal) return;
    const elapsed = Math.round((Date.now() - cardStartTime) / 1000);

    try {
      await logStudyAttempt({
        item_type: 'WORD',
        word_id: studyWordModal.id,
        is_correct: isCorrect,
        seconds_spent: elapsed,
        metadata: { source: 'VOCAB_GRAPH_VIEW' }
      });

      if (isCorrect) {
        confetti({
          particleCount: 50,
          spread: 65,
          origin: { y: 0.6 }
        });
        setMasteredWordIds(prev => new Set(prev).add(studyWordModal.id));
        setGraphData(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => 
            n.id === `word-${studyWordModal.id}` ? { ...n, isMastered: true } : n
          )
        }));
      }
    } catch (err) {
      console.warn('Logging study attempt in graph:', err);
    } finally {
      setStudyWordModal(null);
    }
  };

  // ---------------------------------------------------------------------------
  // 9. RENDER VIEW
  // ---------------------------------------------------------------------------

  return (
    <div 
      className="relative w-full h-[calc(100vh-230px)] min-h-[580px] bg-[#FAFBF8] border-2 border-[#111410] shadow-[5px_5px_0px_0px_#111410] overflow-hidden select-none"
      style={{ overscrollBehavior: 'contain' }}
    >
      
      {/* Canvas Viewport */}
      <div 
        ref={containerRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <canvas ref={canvasRef} className="block w-full h-full" style={{ touchAction: 'none' }} />
      </div>

      {/* TOP-LEFT RETURN TO STUDY DECK ACTION */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => onNavigateStudy && onNavigateStudy()}
          className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase text-[#111410] transition hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]"
          title="Return to Flashcards Study Deck"
        >
          <Layers className="w-3.5 h-3.5 text-[#7BB33B]" />
          <span className="hidden sm:inline">← Back to Flashcards</span>
          <span className="sm:hidden">← Deck</span>
        </button>
      </div>

      {/* PROMINENT TOP SEARCH BAR */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
        <div className="relative bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-1.5 flex items-center">
          <div className="pl-2 pr-1.5 flex items-center text-[#111410]">
            <Search className="w-4 h-4 text-[#111410]" />
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder={
              focusedRootId
                ? `Focused on ${currentlyFocusedRoot?.morpheme || 'root'} (Search root or word)...`
                : "Search roots (e.g. voc, spect) or words (e.g. circumspect)..."
            }
            className="flex-1 bg-transparent text-xs font-mono font-bold text-[#111410] placeholder-[#62685E] focus:outline-none px-2 py-1 min-w-0"
          />

          {/* Active Focus Capsule */}
          {focusedRootId && !searchQuery && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#EDF5E5] border border-[#111410] text-[#2F441E] text-[10px] font-mono font-black uppercase shrink-0 mr-1 animate-fade-in">
              <Eye className="w-3 h-3 text-[#7BB33B]" />
              <span className="truncate max-w-[110px] sm:max-w-none">
                FOCUSED: {currentlyFocusedRoot?.morpheme}
              </span>
              <button 
                onClick={clearFocus} 
                className="hover:text-[#991B1B] ml-1 p-0.5" 
                title="Return to ambient dust motes (Esc)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="text-[#111410] hover:text-[#991B1B] p-1 mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="hidden sm:flex items-center pl-1 pr-2 border-l border-[#111410]/20 text-[10px] font-mono text-[#62685E]">
            <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] text-[#111410]">ESC</kbd>
            <span className="ml-1">reset</span>
          </div>
        </div>

        {/* Autocomplete Dropdown List with Roots & Vocabulary Words */}
        {(isSearchFocused || searchQuery) && searchResults.total > 0 && (
          <div className="absolute top-full left-4 right-4 mt-1.5 bg-white border-2 border-[#111410] shadow-[5px_5px_0px_0px_#111410] z-40 max-h-80 overflow-y-auto">
            
            {/* 1. ROOT MORPHEMES SECTION */}
            {searchResults.roots.length > 0 && (
              <div>
                <div className="px-3 py-1.5 bg-[#FAFBF8] border-b border-[#111410] flex items-center justify-between text-[10px] font-mono font-black uppercase text-[#62685E]">
                  <span>Roots ({searchResults.roots.length}):</span>
                  <span>Select to focus family</span>
                </div>

                {searchResults.roots.map(rootNode => {
                  const isCurrent = rootNode.id === focusedRootId;
                  return (
                    <div
                      key={rootNode.id}
                      onClick={() => handlePickRoot(rootNode)}
                      className={`px-3 py-2 border-b border-[#111410]/20 cursor-pointer flex items-center justify-between transition ${
                        isCurrent ? 'bg-[#EDF5E5]' : 'hover:bg-[#FAFBF8]'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-black uppercase text-[#111410]">
                            {rootNode.morpheme}
                          </span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 border border-[#111410] bg-[#FAFBF8] font-bold">
                            {rootNode.language}
                          </span>
                          <span className="text-[10px] font-mono text-[#62685E]">
                            {rootNode.total_words} derivatives
                          </span>
                        </div>
                        <p className="text-[11px] font-serif italic text-[#42281D] truncate mt-0.5">
                          "{rootNode.core_meaning}"
                        </p>
                      </div>

                      <span className="text-[10px] font-mono font-black uppercase text-[#7BB33B] shrink-0 flex items-center space-x-1">
                        <span>FOCUS ROOT</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. VOCABULARY WORDS SECTION */}
            {searchResults.words.length > 0 && (
              <div>
                <div className="px-3 py-1.5 bg-[#FAFBF8] border-b border-t border-[#111410] flex items-center justify-between text-[10px] font-mono font-black uppercase text-[#42281D]">
                  <span>Vocabulary Words ({searchResults.words.length}):</span>
                  <span>Picks parent root & focuses</span>
                </div>

                {searchResults.words.map(wordNode => {
                  const isSelected = selectedNode?.id === wordNode.id;
                  return (
                    <div
                      key={wordNode.id}
                      onClick={() => handlePickWord(wordNode)}
                      className={`px-3 py-2 border-b border-[#111410]/20 cursor-pointer flex items-center justify-between transition ${
                        isSelected ? 'bg-[#EDF5E5]' : 'hover:bg-[#FAFBF8]'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-sans text-xs font-black text-[#111410]">
                            {wordNode.word}
                          </span>
                          {wordNode.isMastered && (
                            <span className="w-2 h-2 rounded-full bg-[#7BB33B] border border-[#111410]" title="Mastered" />
                          )}
                          <span className="text-[10px] font-mono px-1.5 py-0.2 border border-[#111410] bg-[#EFE8DF] font-bold text-[#42281D]">
                            Root: {wordNode.parentRoot?.morpheme || 'root'}
                          </span>
                        </div>
                        <p className="text-[11px] font-sans text-[#62685E] truncate mt-0.5">
                          {wordNode.data?.definition}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono font-black uppercase text-[#7BB33B] shrink-0 flex items-center space-x-1">
                        <span>FOCUS ROOT</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}
      </div>

      {/* TOP-RIGHT VIEWPORT CONTROLS */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-1.5">
        <button
          onClick={() => {
            targetCameraRef.current = null;
            cameraRef.current.zoom = Math.min(2.5, cameraRef.current.zoom * 1.25);
          }}
          title="Zoom In (E or +)"
          className="p-2 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[#111410] active:translate-x-[1px] active:translate-y-[1px]"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            targetCameraRef.current = null;
            cameraRef.current.zoom = Math.max(0.18, cameraRef.current.zoom / 1.25);
          }}
          title="Zoom Out (Q or -)"
          className="p-2 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[#111410] active:translate-x-[1px] active:translate-y-[1px]"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetCamera}
          title="Reset Camera (R)"
          className="p-2 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[#111410] active:translate-x-[1px] active:translate-y-[1px]"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* CONTROLS HUD (BOTTOM-LEFT HEADS-UP DISPLAY) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] px-3.5 py-2 font-mono text-xs text-[#111410] flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 font-black">
            <span className={`w-2 h-2 inline-block border border-[#111410] mr-1 ${
              focusedRootId ? 'bg-[#7BB33B] animate-pulse' : 'bg-[#EFE8DF]'
            }`} />
            <span>{focusedRootId ? 'SHARP FOCUS MODE:' : 'CAVERN OF THE MIND:'}</span>
          </div>

          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] font-bold text-[10px]">W</kbd>
            <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] font-bold text-[10px]">A</kbd>
            <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] font-bold text-[10px]">S</kbd>
            <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] font-bold text-[10px]">D</kbd>
            <span className="text-[#62685E] ml-1">Pan</span>
          </div>

          <span className="text-[#111410]/30">|</span>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] font-bold text-[10px]">Q</kbd>
            <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] font-bold text-[10px]">E</kbd>
            <span className="text-[#62685E] ml-1">Zoom</span>
          </div>

          <span className="text-[#111410]/30">|</span>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] font-bold text-[10px]">ESC</kbd>
            <span className="text-[#62685E] ml-1">{focusedRootId ? 'Clear Focus' : 'Reset'}</span>
          </div>

          <span className="text-[#111410]/30 hidden lg:inline">|</span>
          <span className="text-[#62685E] hidden lg:inline">
            {focusedRootId ? 'Peripheral nodes dimmed as dust motes' : 'Floating ambient dust motes'}
          </span>
        </div>
      </div>

      {/* NODE INSPECTION SLIDEOUT DRAWER */}
      {selectedNode && (
        <div className="absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white border-l-2 border-[#111410] shadow-[-5px_0px_0px_0px_#111410] z-30 flex flex-col animate-slide-left overflow-hidden">
          
          {/* Drawer Header */}
          <div className="p-4 border-b-2 border-[#111410] bg-[#FAFBF8] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#111410] text-white">
                {selectedNode.type === 'origin' 
                  ? 'ETYMOLOGY ORIGIN' 
                  : selectedNode.type === 'root' 
                    ? 'SHARP FOCUS ROOT' 
                    : 'VOCABULARY WORD'}
              </span>
              {selectedNode.type === 'root' && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410]">
                  {selectedNode.language}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => onNavigateStudy && onNavigateStudy(selectedNode.type === 'word' ? selectedNode.data : null)}
                className="px-2.5 py-1 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border border-[#111410] text-[10px] font-mono font-black uppercase transition flex items-center space-x-1"
                title="Return to Flashcards Study Deck"
              >
                <Layers className="w-3 h-3 text-[#7BB33B]" />
                <span>Deck</span>
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 hover:bg-[#FDF2F2] hover:text-[#991B1B] border border-[#111410] transition"
                title="Close Panel (Esc)"
              >
                <X className="w-4 h-4 text-[#111410]" />
              </button>
            </div>
          </div>

          {/* Drawer Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* ---------------- ROOT NODE DETAIL ---------------- */}
            {selectedNode.type === 'root' && (
              <>
                <div>
                  <div className="text-3xl font-black font-mono tracking-tight text-[#111410] uppercase">
                    {selectedNode.morpheme}
                  </div>
                  <p className="text-xs font-mono uppercase text-[#62685E] mt-1 font-bold">
                    {selectedNode.language} Morpheme · {selectedNode.total_words} Derivative Words in Sharp Focus
                  </p>
                </div>

                {/* Core Meaning Box */}
                <div className="p-3.5 bg-[#EFE8DF] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410]">
                  <span className="text-[10px] font-mono font-black uppercase text-[#42281D] block mb-1">
                    Core Etymological Meaning
                  </span>
                  <p className="text-sm font-sans font-extrabold text-[#111410]">
                    "{selectedNode.core_meaning}"
                  </p>
                </div>

                {/* Mnemonic Aid */}
                {selectedNode.mnemonic && (
                  <div className="p-3.5 bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410]">
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono font-black uppercase text-[#7BB33B] mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mnemonic Anchor</span>
                    </div>
                    <p className="text-xs font-sans text-[#111410] leading-relaxed">
                      {selectedNode.mnemonic}
                    </p>
                  </div>
                )}

                {/* Derivative Words List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black uppercase text-[#111410]">
                      Connected Derivatives ({selectedNode.data?.words?.length || 0})
                    </span>
                    <span className="text-[10px] font-mono text-[#62685E]">Click to inspect</span>
                  </div>

                  <div className="space-y-2">
                    {(selectedNode.data?.words || []).map(w => {
                      const isMastered = masteredWordIds.has(w.id);
                      return (
                        <div
                          key={w.id}
                          onClick={() => {
                            const wordNode = graphData.nodes.find(n => n.id === `word-${w.id}`);
                            if (wordNode) smoothPanToNode(wordNode);
                          }}
                          className="p-3 bg-white hover:bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] cursor-pointer transition flex items-center justify-between group"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-sans font-bold text-sm text-[#111410] group-hover:text-[#2F441E]">
                                {w.word}
                              </span>
                              {isMastered && (
                                <span className="w-2 h-2 rounded-full bg-[#7BB33B] border border-[#111410]" title="Mastered" />
                              )}
                              <span className="text-[10px] font-mono text-[#62685E]">
                                {w.part_of_speech}
                              </span>
                            </div>
                            <p className="text-xs text-[#42281D] line-clamp-1 mt-0.5 font-sans">
                              {w.definition}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#111410] group-hover:translate-x-1 transition-transform" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Action: Study Root in Flashcards Deck */}
                <div className="pt-2">
                  <button
                    onClick={() => onNavigateStudy && onNavigateStudy(selectedNode.data?.words?.[0] || null)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px]"
                    title="Study words with this root in the Study Deck"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#7BB33B]" />
                    <span>Practice Root in Flashcards Deck</span>
                  </button>
                </div>
              </>
            )}

            {/* ---------------- WORD NODE DETAIL ---------------- */}
            {selectedNode.type === 'word' && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-black font-sans tracking-tight text-[#111410]">
                      {selectedNode.word}
                    </div>
                    {selectedNode.isMastered && (
                      <span className="px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] text-[10px] font-mono font-bold uppercase">
                        ✓ Mastered
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mt-1.5 font-mono text-xs text-[#62685E]">
                    <span>{selectedNode.data?.pronunciation || '/phonetic/'}</span>
                    <span>·</span>
                    <span className="uppercase font-bold">{selectedNode.data?.part_of_speech || 'word'}</span>
                  </div>

                  {/* Student View Trust Badge (Non-Admin View: Notes strictly hidden) */}
                  {!isAdminMode && selectedNode.data?.review?.verified && (
                    <div className="mt-2.5">
                      <span 
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B] text-[10px] font-mono font-bold uppercase cursor-help shadow-[1px_1px_0px_0px_#2F441E] transition hover:bg-[#DCEDD0]"
                        title="Independently verified for SAT/ACT accuracy"
                      >
                        <Check className="w-3.5 h-3.5 text-[#7BB33B] stroke-[3]" />
                        <span>✓ Verified Morpheme &amp; Definition</span>
                      </span>
                    </div>
                  )}

                  {/* Toast Feedback upon saving editorial review */}
                  {saveSuccessToast && (
                    <div className="mt-2 p-2 bg-[#EDF5E5] border border-[#7BB33B] text-[#2F441E] text-xs font-mono font-bold flex items-center space-x-1.5 animate-fade-in">
                      <Check className="w-3.5 h-3.5 text-[#7BB33B]" />
                      <span>{saveSuccessToast}</span>
                    </div>
                  )}

                  {/* Admin / Reviewer Mode Verification Panel */}
                  {isAdminMode && (
                    <div className="mt-3 p-3.5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        {/* Editorial Status Badge */}
                        {selectedNode.data?.review?.verified ? (
                          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] text-[10px] font-mono font-black uppercase">
                            <Check className="w-3 h-3 text-[#7BB33B] stroke-[3]" />
                            <span>EDITORIAL STATUS: VERIFIED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] border border-[#111410] text-[10px] font-mono font-black uppercase">
                            <AlertCircle className="w-3 h-3 text-[#D97706]" />
                            <span>EDITORIAL STATUS: UNREVIEWED</span>
                          </span>
                        )}

                        {/* [Edit Verification] button */}
                        <button
                          onClick={() => setIsEditingReview(prev => !prev)}
                          className="px-2.5 py-1 bg-white hover:bg-[#EDF5E5] text-[#111410] hover:text-[#2F441E] border border-[#111410] shadow-[1px_1px_0px_0px_#111410] text-[10px] font-mono font-black uppercase flex items-center space-x-1 transition active:translate-x-[1px] active:translate-y-[1px]"
                          title="Edit verification status and editorial notes"
                        >
                          <Edit3 className="w-3 h-3 text-[#7BB33B]" />
                          <span>{isEditingReview ? 'Close Editor' : 'Edit Verification'}</span>
                        </button>
                      </div>

                      {/* Read-Only Editorial Details when not editing */}
                      {!isEditingReview && (
                        <div className="text-[11px] font-mono text-[#62685E] pt-1 border-t border-[#111410]/15 space-y-1.5">
                          {selectedNode.data?.review?.verified ? (
                            <>
                              <div className="flex items-center justify-between text-[10px]">
                                <span>Attested by: <strong className="text-[#111410]">{selectedNode.data.review.verifiedBy || 'Admin'}</strong></span>
                                {selectedNode.data.review.verifiedAt && (
                                  <span>{new Date(selectedNode.data.review.verifiedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                              {selectedNode.data.review.notes && (
                                <div className="mt-1 bg-white p-2 border border-[#111410] text-[#111410] font-sans text-xs italic">
                                  <span className="block text-[9px] font-mono not-italic uppercase font-bold text-[#62685E] mb-0.5">
                                    Editorial Notes / Source Attestation:
                                  </span>
                                  "{selectedNode.data.review.notes}"
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-[10px] italic text-[#62685E]">
                              AI-generated entry has not yet been verified by an editor. Click <strong>[Edit Verification]</strong> to certify.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Review Panel / UI Form when editing */}
                      {isEditingReview && (
                        <div className="pt-2 border-t border-[#111410]/20 space-y-3">
                          {/* Checkbox: Mark as Independently Verified */}
                          <label className="flex items-start space-x-2.5 cursor-pointer select-none bg-white p-2.5 border border-[#111410]">
                            <input
                              type="checkbox"
                              checked={reviewFormData.verified}
                              onChange={(e) => setReviewFormData(prev => ({ ...prev, verified: e.target.checked }))}
                              className="mt-0.5 w-4 h-4 text-[#7BB33B] border border-[#111410] rounded-none focus:ring-0 accent-[#7BB33B]"
                            />
                            <div>
                              <span className="text-xs font-mono font-black uppercase text-[#111410] block">
                                Mark as Independently Verified
                              </span>
                              <span className="text-[10px] font-mono text-[#62685E] leading-tight block mt-0.5">
                                Certifies accurate definition, morpheme decomposition &amp; SAT/ACT accuracy.
                              </span>
                            </div>
                          </label>

                          {/* Reviewer / Attested By */}
                          <div>
                            <label className="text-[9px] font-mono font-black uppercase text-[#62685E] block mb-1">
                              Verified By (Editor Name / Role)
                            </label>
                            <input
                              type="text"
                              value={reviewFormData.verifiedBy}
                              onChange={(e) => setReviewFormData(prev => ({ ...prev, verifiedBy: e.target.value }))}
                              placeholder="e.g. Admin, Senior Lexicographer"
                              className="w-full text-xs font-mono px-2 py-1.5 bg-white border border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
                            />
                          </div>

                          {/* Text area: Editorial Notes / Source Attestation */}
                          <div>
                            <label className="text-[9px] font-mono font-black uppercase text-[#62685E] block mb-1">
                              Editorial Notes / Source Attestation
                            </label>
                            <textarea
                              rows={3}
                              value={reviewFormData.notes}
                              onChange={(e) => setReviewFormData(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="e.g. Checked against Merriam-Webster / Latin etymology confirmed"
                              className="w-full text-xs font-sans p-2 bg-white border border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B] resize-y"
                            />
                            <span className="text-[9px] font-mono text-[#62685E] mt-0.5 block">
                              Internal notes are hidden from regular students.
                            </span>
                          </div>

                          {/* Save & Cancel Buttons */}
                          <div className="flex items-center space-x-2 pt-1">
                            <button
                              onClick={handleSaveReview}
                              className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#7BB33B] hover:bg-[#84C341] text-white border border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase transition active:translate-x-[1px] active:translate-y-[1px]"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save Verification</span>
                            </button>
                            <button
                              onClick={() => setIsEditingReview(false)}
                              className="px-3 py-2 bg-white hover:bg-[#FAFBF8] text-[#111410] border border-[#111410] shadow-[1px_1px_0px_0px_#111410] font-mono text-xs font-bold uppercase transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Morpheme Decomposition Formula */}
                <div className="p-3.5 bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410]">
                  <span className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-2">
                    Morpheme Formula Deconstruction
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                    {selectedNode.data?.prefix && (
                      <>
                        <span className="px-2 py-1 bg-[#FAFBF8] border border-[#111410] font-bold text-[#42281D]">
                          [{selectedNode.data.prefix}-]
                        </span>
                        <span className="font-black text-[#111410]">+</span>
                      </>
                    )}

                    <span className="px-2.5 py-1 bg-[#EFE8DF] border-2 border-[#111410] font-black text-[#111410] shadow-[1px_1px_0px_0px_#111410]">
                      [{selectedNode.parentRoot?.morpheme || 'root'}]
                    </span>

                    {selectedNode.data?.suffix && (
                      <>
                        <span className="font-black text-[#111410]">+</span>
                        <span className="px-2 py-1 bg-[#FAFBF8] border border-[#111410] font-bold text-[#42281D]">
                          [-{selectedNode.data.suffix}]
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-2 text-[11px] font-mono text-[#62685E]">
                    Parent Root: <strong>{selectedNode.parentRoot?.morpheme}</strong> ({selectedNode.parentRoot?.language} · "{selectedNode.parentRoot?.core_meaning}")
                  </div>
                </div>

                {/* Definition Box */}
                <div className="p-3.5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-black uppercase text-[#62685E]">
                      Lexical Definition
                    </span>
                    {selectedNode.data?.connotation && (
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 border border-[#111410] ${
                        selectedNode.data.connotation.toLowerCase() === 'positive'
                          ? 'bg-[#EDF5E5] text-[#2F441E]'
                          : selectedNode.data.connotation.toLowerCase() === 'negative'
                            ? 'bg-[#FDF2F2] text-[#991B1B]'
                            : 'bg-[#EFE8DF] text-[#42281D]'
                      }`}>
                        {selectedNode.data.connotation}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-sans font-bold text-[#111410] leading-snug">
                    {selectedNode.data?.definition}
                  </p>
                </div>

                {/* SAT Sentence Usage */}
                {selectedNode.data?.sat_sentence && (
                  <div className="p-3.5 bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410]">
                    <span className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-1">
                      SAT / ACT Contextual Exemplar
                    </span>
                    <p className="text-xs font-sans italic text-[#111410] leading-relaxed">
                      "{selectedNode.data.sat_sentence}"
                    </p>
                  </div>
                )}

                {/* Quick Action: Study Flashcard Button */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => handleOpenMiniFlashcard(selectedNode.data)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>STUDY THIS WORD (MINI-FLASHCARD)</span>
                  </button>

                  <button
                    onClick={() => onNavigateStudy && onNavigateStudy(selectedNode.data)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px]"
                    title="Open and practice in full flashcards deck"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#7BB33B]" />
                    <span>Practice in Full Flashcards Deck</span>
                  </button>

                  <button
                    onClick={() => {
                      const rootNode = graphData.nodes.find(n => n.id === selectedNode.rootNodeId);
                      if (rootNode) focusRoot(rootNode);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-bold uppercase transition"
                  >
                    <Network className="w-3.5 h-3.5 text-[#42281D]" />
                    <span>Focus Parent Root Family</span>
                  </button>
                </div>
              </>
            )}

            {/* ---------------- ORIGIN NODE DETAIL ---------------- */}
            {selectedNode.type === 'origin' && (
              <>
                <div>
                  <div className="text-2xl font-black font-mono text-[#111410] uppercase">
                    {selectedNode.label}
                  </div>
                  <p className="text-xs font-mono uppercase text-[#62685E] mt-1 font-bold">
                    Primary Linguistic Cluster
                  </p>
                </div>

                <div className="p-3.5 bg-[#FAFBF8] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] text-xs font-sans leading-relaxed text-[#111410]">
                  Over 60% of academic English and SAT/ACT vocabulary originates from {selectedNode.language} morphemic components. Pick any root morpheme in this cluster to bring it into sharp focus.
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* MINI-FLASHCARD MODAL INTERACTION */}
      {studyWordModal && (
        <div className="absolute inset-0 bg-[#111410]/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAFBF8] border-2 border-[#111410] shadow-[8px_8px_0px_0px_#111410] w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#111410] mb-4">
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#7BB33B] text-white">
                MINI STUDY FLASHCARD
              </span>
              <button
                onClick={() => setStudyWordModal(null)}
                className="text-[#111410] hover:text-[#991B1B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div 
              onClick={() => setFlashcardFlipped(prev => !prev)}
              className="min-h-[220px] bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-6 flex flex-col justify-between cursor-pointer hover:bg-[#FAFBF8] transition relative"
            >
              {!flashcardFlipped ? (
                <div className="my-auto text-center space-y-2">
                  <span className="text-[10px] font-mono font-black uppercase text-[#62685E] tracking-wider">
                    DECONSTRUCT & RECALL
                  </span>
                  <div className="text-3xl font-black font-sans text-[#111410]">
                    {studyWordModal.word}
                  </div>
                  <div className="font-mono text-xs text-[#62685E]">
                    {studyWordModal.pronunciation} · {studyWordModal.part_of_speech}
                  </div>
                  <div className="pt-4 text-[10px] font-mono text-[#7BB33B] font-bold uppercase animate-pulse">
                    Click Card to Flip Definition ➔
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase text-[#62685E] block">
                      DEFINITION
                    </span>
                    <p className="text-sm font-bold text-[#111410] leading-snug">
                      {studyWordModal.definition}
                    </p>
                  </div>

                  {studyWordModal.sat_sentence && (
                    <p className="text-xs font-sans italic text-[#42281D] bg-[#FAFBF8] p-2 border border-[#111410]/20">
                      "{studyWordModal.sat_sentence}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {flashcardFlipped && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t-2 border-[#111410]">
                <button
                  onClick={() => handleLogCardAttempt(false)}
                  className="px-3 py-2 bg-white hover:bg-[#FDF2F2] hover:text-[#991B1B] text-[#42281D] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-bold uppercase transition"
                >
                  Need Practice
                </button>
                <button
                  onClick={() => handleLogCardAttempt(true)}
                  className="px-3 py-2 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase transition"
                >
                  Mastered ✓
                </button>
              </div>
            )}

            {/* Link to Full Study Deck Session */}
            <div className="mt-3 pt-2 text-center border-t border-[#111410]/20">
              <button
                type="button"
                onClick={() => {
                  const word = studyWordModal;
                  setStudyWordModal(null);
                  if (onNavigateStudy) onNavigateStudy(word);
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-mono font-black text-[#2F441E] hover:underline uppercase"
              >
                <Layers className="w-3.5 h-3.5 text-[#7BB33B]" />
                <span>Practice in Full Flashcards Deck →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#FAFBF8]/90 z-40 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#111410] border-t-[#7BB33B] animate-spin" />
          <span className="text-xs font-mono font-bold uppercase text-[#111410]">
            Illuminating the Cavern of the Mind...
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-[#FAFBF8]/95 z-40 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <span className="text-sm font-mono font-black text-[#991B1B] uppercase">
            Graph Data Error: {error}
          </span>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-bold uppercase"
          >
            Reload Page
          </button>
        </div>
      )}

    </div>
  );
}
