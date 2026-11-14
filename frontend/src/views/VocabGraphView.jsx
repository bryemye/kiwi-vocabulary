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
import { useCelestialTrajectory } from '../context/CelestialTrajectoryContext';
import PathwayToggle from '../components/PathwayToggle';
import {
  getStoredPathway,
  setStoredPathway,
  PATHWAY_CHANGE_EVENT,
  PATHWAY_THEMATIC,
  PATHWAY_YIELD,
  THEMATIC_CLUSTER_DEFS,
  SAT_TIER_DEFS,
  getClusterMeta,
  getTierMeta,
} from '../services/pathwayService';

/**
 * Deterministic Pseudo-Random Generator based on seed
 */
function pseudoRandom(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Trace a rounded rectangle path on the canvas context
 */
function traceRoundedRect(ctx, left, top, width, height, radius = 8) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(left + r, top);
  ctx.lineTo(left + width - r, top);
  ctx.quadraticCurveTo(left + width, top, left + width, top + r);
  ctx.lineTo(left + width, top + height - r);
  ctx.quadraticCurveTo(left + width, top + height, left + width - r, top + height);
  ctx.lineTo(left + r, top + height);
  ctx.quadraticCurveTo(left, top + height, left, top + height - r);
  ctx.lineTo(left, top + r);
  ctx.quadraticCurveTo(left, top, left + r, top);
  ctx.closePath();
}

/**
 * Softened Rounded Canvas Card with Diffused Shadow
 */
function drawGraphCard(ctx, x, y, width, height, options = {}) {
  const {
    fillColor = '#F3EEE7',
    borderColor = 'rgba(17, 20, 16, 0.25)',
    borderWidth = 1.5,
    borderRadius = 10,
    shadowColor = 'rgba(17, 20, 16, 0.10)',
    shadowBlur = 10,
    shadowOffsetX = 0,
    shadowOffsetY = 3,
    alpha = 1.0,
  } = options;

  const left = x - width / 2;
  const top = y - height / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // 1. Soft Diffused Shadow + Main Rounded Box Fill
  traceRoundedRect(ctx, left, top, width, height, borderRadius);
  if (shadowBlur > 0) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;
  }
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Reset shadow before drawing border so stroke stays clean
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 2. Soft Border
  if (borderWidth > 0) {
    traceRoundedRect(ctx, left, top, width, height, borderRadius);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Ambient background particles for gentle depth
 */
const AMBIENT_PARTICLES_COUNT = 55;
function createAmbientParticles() {
  const particles = [];
  for (let i = 0; i < AMBIENT_PARTICLES_COUNT; i++) {
    const angle = pseudoRandom(i * 13 + 1) * Math.PI * 2;
    const dist = 80 + pseudoRandom(i * 13 + 2) * 3000;
    particles.push({
      baseX: Math.cos(angle) * dist,
      baseY: Math.sin(angle) * dist,
      radius: 1.2 + pseudoRandom(i * 13 + 3) * 2.0,
      speedX: 0.04 + pseudoRandom(i * 13 + 4) * 0.06,
      speedY: 0.03 + pseudoRandom(i * 13 + 5) * 0.05,
      ampX: 28 + pseudoRandom(i * 13 + 6) * 42,
      ampY: 16 + pseudoRandom(i * 13 + 7) * 24,
      phaseX: pseudoRandom(i * 13 + 8) * Math.PI * 2,
      phaseY: pseudoRandom(i * 13 + 9) * Math.PI * 2,
      baseAlpha: 0.04 + pseudoRandom(i * 13 + 10) * 0.10,
      pulseFreq: 0.06 + pseudoRandom(i * 13 + 11) * 0.09,
      pulsePhase: pseudoRandom(i * 13 + 12) * Math.PI * 2,
    });
  }
  return particles;
}

/**
 * Deterministic map coordinates for each thematic cluster and SAT tier territory
 */
function getClusterTerritory(pathway, filterName) {
  if (!filterName || filterName === 'ALL') return null;

  if (pathway === PATHWAY_YIELD) {
    const idx = SAT_TIER_DEFS.findIndex(
      t => t.name.toLowerCase() === filterName.toLowerCase()
    );
    if (idx === -1) return null;
    const tier = SAT_TIER_DEFS[idx];
    const radius = 1650;
    const angle = (idx / SAT_TIER_DEFS.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.round(Math.cos(angle) * radius),
      y: Math.round(Math.sin(angle) * radius),
      label: tier.badge,
      icon: tier.icon,
      accentColor: tier.accentColor || '#7BB33B',
    };
  }

  const idx = THEMATIC_CLUSTER_DEFS.findIndex(
    c => c.name.toLowerCase() === filterName.toLowerCase()
  );
  if (idx === -1) return null;
  const cluster = THEMATIC_CLUSTER_DEFS[idx];
  const radius = 2000;
  const angle = (idx / THEMATIC_CLUSTER_DEFS.length) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
    label: cluster.name,
    icon: cluster.icon,
    accentColor: cluster.accentColor || '#7BB33B',
  };
}

/**
 * Compute radial outward placement of a word around its parent root
 */
function computeWordPosition(rootX, rootY, hubX, hubY, wordIdx, wordCount, orbitRadius = 140) {
  const outwardAngle = Math.atan2(rootY - hubY, rootX - hubX);
  let wordAngle;
  if (wordCount <= 1) {
    wordAngle = outwardAngle;
  } else {
    const span = Math.min(Math.PI * 1.3, (wordCount - 1) * 0.45);
    const step = span / (wordCount - 1);
    wordAngle = outwardAngle - span / 2 + wordIdx * step;
  }
  return {
    x: rootX + orbitRadius * Math.cos(wordAngle),
    y: rootY + orbitRadius * Math.sin(wordAngle),
  };
}

/**
 * Update targetBaseX/targetBaseY on all nodes to gather a filtered cluster or return home
 */
function assignClusterTargets(nodes, pathway, filterName) {
  if (!filterName || filterName === 'ALL') {
    nodes.forEach(node => {
      node.targetBaseX = node.homeX;
      node.targetBaseY = node.homeY;
      node.inActiveCluster = true;
    });
    return null;
  }

  const territory = getClusterTerritory(pathway, filterName);
  if (!territory) {
    nodes.forEach(node => {
      node.targetBaseX = node.homeX;
      node.targetBaseY = node.homeY;
      node.inActiveCluster = true;
    });
    return null;
  }

  const matchingRoots = [];
  const matchingRootIds = new Set();

  nodes.forEach(node => {
    if (node.type !== 'root') return;
    const matches = pathway === PATHWAY_YIELD
      ? (node.sat_tier || '').toLowerCase() === filterName.toLowerCase()
      : (node.thematic_cluster || '').toLowerCase() === filterName.toLowerCase();
    if (matches) {
      matchingRoots.push(node);
      matchingRootIds.add(node.id);
    }
  });

  const count = matchingRoots.length;
  let ringSpecs;
  let clusterZoom;
  if (count <= 10) {
    ringSpecs = [{ cap: count, radius: 170 }];
    clusterZoom = 0.95;
  } else if (count <= 26) {
    const r1 = Math.min(10, Math.ceil(count * 0.42));
    ringSpecs = [
      { cap: r1, radius: 165 },
      { cap: count - r1, radius: 300 },
    ];
    clusterZoom = 0.85;
  } else if (count <= 50) {
    const r1 = 12;
    const r2 = 20;
    ringSpecs = [
      { cap: r1, radius: 175 },
      { cap: r2, radius: 320 },
      { cap: count - r1 - r2, radius: 465 },
    ];
    clusterZoom = 0.72;
  } else {
    const r1 = 14;
    const r2 = 24;
    const r3 = 32;
    ringSpecs = [
      { cap: r1, radius: 180 },
      { cap: r2, radius: 335 },
      { cap: r3, radius: 490 },
      { cap: count - r1 - r2 - r3, radius: 645 },
    ];
    clusterZoom = 0.62;
  }

  // Place matching roots in concentric rings around territory center
  const rootPosMap = new Map();
  let cursor = 0;
  ringSpecs.forEach((spec, ringIdx) => {
    if (spec.cap <= 0) return;
    for (let i = 0; i < spec.cap && cursor < count; i++, cursor++) {
      const rootNode = matchingRoots[cursor];
      const angle = (i / spec.cap) * Math.PI * 2 + ringIdx * 0.42;
      const rx = territory.x + spec.radius * Math.cos(angle);
      const ry = territory.y + spec.radius * Math.sin(angle);
      rootNode.targetBaseX = rx;
      rootNode.targetBaseY = ry;
      rootNode.inActiveCluster = true;
      rootPosMap.set(rootNode.id, { x: rx, y: ry });
    }
  });

  // Group child words by rootNodeId so they fan out cleanly from cluster center
  const wordsByRoot = new Map();
  nodes.forEach(node => {
    if (node.type === 'word') {
      if (matchingRootIds.has(node.rootNodeId)) {
        if (!wordsByRoot.has(node.rootNodeId)) wordsByRoot.set(node.rootNodeId, []);
        wordsByRoot.get(node.rootNodeId).push(node);
      } else {
        node.targetBaseX = node.homeX;
        node.targetBaseY = node.homeY;
        node.inActiveCluster = false;
      }
    } else if (node.type === 'root' && !matchingRootIds.has(node.id)) {
      node.targetBaseX = node.homeX;
      node.targetBaseY = node.homeY;
      node.inActiveCluster = false;
    } else if (node.type === 'origin') {
      node.targetBaseX = node.homeX;
      node.targetBaseY = node.homeY;
      node.inActiveCluster = false;
    }
  });

  wordsByRoot.forEach((wordList, rootId) => {
    const rPos = rootPosMap.get(rootId);
    if (!rPos) return;
    wordList.forEach((wordNode, wIdx) => {
      const pos = computeWordPosition(
        rPos.x,
        rPos.y,
        territory.x,
        territory.y,
        wIdx,
        wordList.length,
        96
      );
      wordNode.targetBaseX = pos.x;
      wordNode.targetBaseY = pos.y;
      wordNode.inActiveCluster = true;
    });
  });

  return {
    ...territory,
    count,
    zoom: clusterZoom,
  };
}

/**
 * Deterministic 2D Node-Link Layout Generator with Slow Sway & Breathing Parameters
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
    homeX: -1020,
    homeY: 0,
    targetBaseX: -1020,
    targetBaseY: 0,
    baseX: -1020,
    baseY: 0,
    x: -1020,
    y: 0,
    inActiveCluster: true,
    width: 174,
    height: 54,
    driftSpeedX: 0.045,
    driftSpeedY: 0.035,
    driftAmpX: 10,
    driftAmpY: 5,
    driftPhaseX: 0.5,
    driftPhaseY: 1.2,
    fadeFreq: 0.05,
    fadePhase: 0,
    minFadeOpacity: 0.55,
    maxFadeOpacity: 0.88,
    opacity: 0.88,
  };

  const originGreek = {
    id: 'origin-greek',
    type: 'origin',
    label: 'GREEK ROOTS',
    language: 'Greek',
    homeX: 1020,
    homeY: 0,
    targetBaseX: 1020,
    targetBaseY: 0,
    baseX: 1020,
    baseY: 0,
    x: 1020,
    y: 0,
    inActiveCluster: true,
    width: 174,
    height: 54,
    driftSpeedX: 0.05,
    driftSpeedY: 0.04,
    driftAmpX: 10,
    driftAmpY: 5,
    driftPhaseX: 2.1,
    driftPhaseY: 0.8,
    fadeFreq: 0.05,
    fadePhase: 1.5,
    minFadeOpacity: 0.55,
    maxFadeOpacity: 0.88,
    opacity: 0.88,
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
    const ringRadii = [400, 720, 1040];

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
      const rootWords = root.words || [];
      const masteredCount = rootWords.filter(w => masteredSet && masteredSet.has(w.id)).length;
      const masteryPct = rootWords.length > 0 ? Math.round((masteredCount / rootWords.length) * 100) : 0;

      const rootNode = {
        id: rootNodeId,
        rawId: root.id,
        type: 'root',
        morpheme: root.morpheme,
        language: root.language,
        core_meaning: root.core_meaning,
        mnemonic: root.mnemonic,
        thematic_cluster: root.thematic_cluster || 'Motion & Travel',
        sat_tier: root.sat_tier || 'Tier 1 High-Yield',
        total_words: rootWords.length,
        masteredCount,
        masteryPct,
        data: root,
        homeX: rootX,
        homeY: rootY,
        targetBaseX: rootX,
        targetBaseY: rootY,
        baseX: rootX,
        baseY: rootY,
        x: rootX,
        y: rootY,
        inActiveCluster: true,
        width: 102,
        height: 46,
        originId: origin.id,
        // Gentle Fish-Like Sway Parameters
        driftSpeedX: 0.05 + pseudoRandom(seed * 7 + 1) * 0.05,
        driftSpeedY: 0.04 + pseudoRandom(seed * 7 + 2) * 0.04,
        driftAmpX: 14 + pseudoRandom(seed * 7 + 3) * 12,
        driftAmpY: 7 + pseudoRandom(seed * 7 + 4) * 7,
        driftPhaseX: pseudoRandom(seed * 7 + 5) * Math.PI * 2,
        driftPhaseY: pseudoRandom(seed * 7 + 6) * Math.PI * 2,
        // Slow Breathing Fade Parameters
        fadeFreq: 0.032 + pseudoRandom(seed * 7 + 7) * 0.025,
        fadePhase: pseudoRandom(seed * 7 + 8) * Math.PI * 2,
        minFadeOpacity: 0,
        maxFadeOpacity: 0.78 + pseudoRandom(seed * 7 + 10) * 0.16,
        opacity: 0,
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

      childWords.forEach((word, wIdx) => {
        const { x: wordX, y: wordY } = computeWordPosition(
          rootX,
          rootY,
          origin.baseX,
          origin.baseY,
          wIdx,
          wordCount,
          140
        );

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
          homeX: wordX,
          homeY: wordY,
          targetBaseX: wordX,
          targetBaseY: wordY,
          baseX: wordX,
          baseY: wordY,
          x: wordX,
          y: wordY,
          inActiveCluster: true,
          width: Math.max(86, word.word.length * 8.5 + 24),
          height: 28,
          rootNodeId,
          // Gentle Secondary Tail-Sway Parameters (follows parent root drift)
          driftSpeedX: 0.07 + pseudoRandom(wordSeed + 1) * 0.06,
          driftSpeedY: 0.05 + pseudoRandom(wordSeed + 2) * 0.05,
          driftAmpX: 5 + pseudoRandom(wordSeed + 3) * 4,
          driftAmpY: 3 + pseudoRandom(wordSeed + 4) * 3,
          driftPhaseX: pseudoRandom(wordSeed + 5) * Math.PI * 2,
          driftPhaseY: pseudoRandom(wordSeed + 6) * Math.PI * 2,
          // Slow Breathing Fade Parameters
          fadeFreq: 0.05 + pseudoRandom(wordSeed + 7) * 0.05,
          fadePhase: pseudoRandom(wordSeed + 8) * Math.PI * 2,
          minFadeOpacity: 0,
          maxFadeOpacity: 0.65 + pseudoRandom(wordSeed + 10) * 0.20,
          opacity: 0,
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
      homeX: 0,
      homeY: 1120,
      targetBaseX: 0,
      targetBaseY: 1120,
      baseX: 0,
      baseY: 1120,
      x: 0,
      y: 1120,
      inActiveCluster: true,
      width: 174,
      height: 54,
      driftSpeedX: 0.045,
      driftSpeedY: 0.035,
      driftAmpX: 10,
      driftAmpY: 5,
      driftPhaseX: 1.0,
      driftPhaseY: 1.0,
      fadeFreq: 0.05,
      fadePhase: 0,
      minFadeOpacity: 0.55,
      maxFadeOpacity: 0.88,
      opacity: 0.88,
    };
    nodes.push(originOther);
    positionRoots(otherRoots, originOther);
  }

  return { nodes, edges };
}

export default function VocabGraphView({ 
  onNavigateStudy, 
  onNavigateExplorer, 
  onSelectRootPractice,
  initialRoots = [],
  isAdminMode = false,
  onUpdateWordReview,
  onOpenMorpheme,
  trajectoryRestoreTarget = null
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

  // Dual Learning Pathway State & User Preference Persistence
  const [learningPathway, setLearningPathway] = useState(getStoredPathway);
  const [pathwayFilter, setPathwayFilter] = useState('ALL');
  const [masteryThreshold, setMasteryThreshold] = useState(100);
  const [masteryComparator, setMasteryComparator] = useState('lte'); // 'lte' (<=) | 'gte' (>=)
  const isMasteryFilterActive = !(masteryComparator === 'lte' && masteryThreshold === 100);

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
    setPathwayFilter('ALL');
  }, []);

  // Focus & Search States
  // When focusedRootId is set, that root and its connections come into focus
  // while peripheral nodes dim gently into the background
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

  // Ambient background particles
  const ambientParticlesRef = useRef(createAmbientParticles());

  // Celestial Trajectory History Tracking
  const { recordWaypoint } = useCelestialTrajectory();

  // Mini-Flashcard Study Modal State
  const [studyWordModal, setStudyWordModal] = useState(null);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [cardStartTime, setCardStartTime] = useState(Date.now());

  // Record Specimen Node when mini study modal is opened
  useEffect(() => {
    if (studyWordModal) {
      recordWaypoint({
        type: 'SATELLITE',
        title: studyWordModal.word?.toUpperCase() || 'SPECIMEN',
        subtitle: studyWordModal.definition ? `"${studyWordModal.definition.slice(0, 35)}..."` : 'WORD SPECIMEN NODE',
        system: studyWordModal.root_details?.morpheme ? `Root [${studyWordModal.root_details.morpheme.toUpperCase()}]` : 'Root Graph',
        depth: 3,
        state: {
          app: 'vocab',
          tab: 'graph',
          wordName: studyWordModal.word,
        },
      });
    }
  }, [studyWordModal, recordWaypoint]);

  // Camera & Canvas Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const cameraRef = useRef({ x: 0, y: 0, zoom: 0.56 });
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

  const learningPathwayRef = useRef(learningPathway);
  useEffect(() => {
    learningPathwayRef.current = learningPathway;
  }, [learningPathway]);

  const pathwayFilterRef = useRef(pathwayFilter);
  useEffect(() => {
    pathwayFilterRef.current = pathwayFilter;
  }, [pathwayFilter]);

  const masteryThresholdRef = useRef(masteryThreshold);
  useEffect(() => {
    masteryThresholdRef.current = masteryThreshold;
  }, [masteryThreshold]);

  const masteryComparatorRef = useRef(masteryComparator);
  useEffect(() => {
    masteryComparatorRef.current = masteryComparator;
  }, [masteryComparator]);

  const isMasteryFilterActiveRef = useRef(isMasteryFilterActive);
  useEffect(() => {
    isMasteryFilterActiveRef.current = isMasteryFilterActive;
  }, [isMasteryFilterActive]);

  const activeClusterMetaRef = useRef(null);
  const lastAppliedClusterKeyRef = useRef('init');

  // Gather roots into spatial map clusters and glide camera when filter/pathway changes
  useEffect(() => {
    if (!graphData.nodes || graphData.nodes.length === 0) return;
    const key = `${learningPathway}::${pathwayFilter}`;
    const clusterMeta = assignClusterTargets(graphData.nodes, learningPathway, pathwayFilter);
    activeClusterMetaRef.current = clusterMeta;

    const prevKey = lastAppliedClusterKeyRef.current;
    lastAppliedClusterKeyRef.current = key;

    // On initial mount with default 'ALL' filter, keep existing camera / restore target intact
    if (prevKey === 'init' && (!pathwayFilter || pathwayFilter === 'ALL')) {
      return;
    }

    if (prevKey !== key) {
      setFocusedRootId(null);
      setSelectedNode(null);
      if (clusterMeta) {
        targetCameraRef.current = {
          x: -clusterMeta.x * clusterMeta.zoom,
          y: -clusterMeta.y * clusterMeta.zoom + 24,
          zoom: clusterMeta.zoom,
        };
      } else {
        targetCameraRef.current = { x: 0, y: 0, zoom: 0.56 };
      }
    }
  }, [pathwayFilter, learningPathway, graphData]);

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
    const zoom = 1.05;
    const targetX = rootNode.targetBaseX ?? rootNode.baseX;
    const targetY = rootNode.targetBaseY ?? rootNode.baseY;
    targetCameraRef.current = {
      x: -targetX * zoom - drawerOffset,
      y: -targetY * zoom,
      zoom,
    };
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedRootId(null);
    setSelectedNode(null);
    setSearchQuery('');
    const cluster = activeClusterMetaRef.current;
    if (cluster) {
      targetCameraRef.current = {
        x: -cluster.x * cluster.zoom,
        y: -cluster.y * cluster.zoom + 24,
        zoom: cluster.zoom,
      };
    } else {
      targetCameraRef.current = { x: 0, y: 0, zoom: 0.56 };
    }
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
    const zoom = node.type === 'word' ? 1.15 : 1.05;
    const targetX = node.targetBaseX ?? node.baseX;
    const targetY = node.targetBaseY ?? node.baseY;
    targetCameraRef.current = {
      x: -targetX * zoom - drawerOffset,
      y: -targetY * zoom,
      zoom,
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

  const matchingMasteryCount = useMemo(() => {
    return allRoots.filter(rootNode => {
      if (pathwayFilter && pathwayFilter !== 'ALL') {
        const matchesCluster = learningPathway === PATHWAY_YIELD
          ? (rootNode.sat_tier || '').toLowerCase() === pathwayFilter.toLowerCase()
          : (rootNode.thematic_cluster || '').toLowerCase() === pathwayFilter.toLowerCase();
        if (!matchesCluster) return false;
      }
      const pct = rootNode.masteryPct ?? 0;
      return masteryComparator === 'gte' ? pct >= masteryThreshold : pct <= masteryThreshold;
    }).length;
  }, [allRoots, pathwayFilter, learningPathway, masteryComparator, masteryThreshold]);

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
        if (focusedRootIdRef.current || selectedNode) {
          clearFocus();
          return;
        }
        if (pathwayFilterRef.current && pathwayFilterRef.current !== 'ALL') {
          setPathwayFilter('ALL');
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
  }, [clearFocus, resetCamera, studyWordModal, selectedNode]);

  // ---------------------------------------------------------------------------
  // 4. ANIMATION FRAME LOOP: CALM SWAY & FOCUS ENGINE
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
          cam.x += (tc.x - cam.x) * 0.075;
          cam.y += (tc.y - cam.y) * 0.075;
          cam.zoom += (tc.zoom - cam.zoom) * 0.075;

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

        const nodeMap = new Map();
        graphData.nodes.forEach(n => nodeMap.set(n.id, n));

        const activeFilter = pathwayFilterRef.current;
        const hasActiveFilter = Boolean(activeFilter && activeFilter !== 'ALL');
        const activeCluster = activeClusterMetaRef.current;
        const mComparator = masteryComparatorRef.current;
        const mThreshold = masteryThresholdRef.current;
        const isMasteryActive = isMasteryFilterActiveRef.current;

        const rootMatchesMastery = (rootNode) => {
          const pct = rootNode.masteryPct ?? 0;
          return mComparator === 'gte' ? pct >= mThreshold : pct <= mThreshold;
        };

        // Helper for slow smoothstep breathing
        const computeSparseBreath = (node, threshold) => {
          const wave = Math.sin(time * node.fadeFreq + node.fadePhase);
          if (wave <= threshold) return 0;
          const t = (wave - threshold) / (1 - threshold);
          return t * t * (3 - 2 * t);
        };

        // Determine cluster root breathing threshold scaled by cluster size
        let clusterRootThreshold = 0.05;
        if (activeCluster) {
          if (activeCluster.count <= 18) clusterRootThreshold = -0.15;
          else if (activeCluster.count <= 45) clusterRootThreshold = 0.15;
          else clusterRootThreshold = 0.45;
        }

        // 4. Update Node Positions (Spatial Swimming + Sway + Breathing Opacities)
        const updateNodeMotion = (node, parentNode = null) => {
          // Smoothly migrate base coordinates toward targetBaseX/Y (cluster formation or home)
          const targetX = node.targetBaseX ?? node.baseX;
          const targetY = node.targetBaseY ?? node.baseY;
          const dx = targetX - node.baseX;
          const dy = targetY - node.baseY;
          if (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25) {
            node.baseX += dx * 0.055;
            node.baseY += dy * 0.055;
          } else {
            node.baseX = targetX;
            node.baseY = targetY;
          }

          const parentDriftX = parentNode?._driftX || 0;
          const parentDriftY = parentNode?._driftY || 0;
          const isFocalRoot = currentFocusedId && node.id === currentFocusedId;
          const isFocalChildWord = currentFocusedId && node.rootNodeId === currentFocusedId;
          const isFocalFamily = isFocalRoot || isFocalChildWord;

          if (node.type === 'root') {
            node._matchesMastery = rootMatchesMastery(node);
          } else if (node.type === 'word') {
            node._matchesMastery = parentNode ? Boolean(parentNode._matchesMastery) : true;
          } else {
            node._matchesMastery = true;
          }

          if (!currentFocusedId) {
            // Calm fish-like swaying: slow lateral glide + gentle secondary vertical motion
            const localDriftX = Math.sin(time * node.driftSpeedX + node.driftPhaseX) * node.driftAmpX;
            const localDriftY = Math.cos(time * node.driftSpeedY + node.driftPhaseY) * node.driftAmpY;
            const totalDriftX = parentDriftX * 0.85 + localDriftX;
            const totalDriftY = parentDriftY * 0.85 + localDriftY;
            node._driftX = totalDriftX;
            node._driftY = totalDriftY;
            node.x = node.baseX + totalDriftX;
            node.y = node.baseY + totalDriftY;

            if (node.type === 'origin') {
              if (hasActiveFilter) {
                node.opacity = 0;
              } else {
                const breath = 0.5 + 0.5 * Math.sin(time * node.fadeFreq + node.fadePhase);
                const eased = breath * breath * (3 - 2 * breath);
                node.opacity = node.minFadeOpacity + eased * (node.maxFadeOpacity - node.minFadeOpacity);
              }
            } else if (node.type === 'root') {
              if (!node._matchesMastery || (hasActiveFilter && !node.inActiveCluster)) {
                node.opacity = 0;
              } else if (hasActiveFilter || isMasteryActive) {
                const breath = 0.5 + 0.5 * Math.sin(time * node.fadeFreq * 1.4 + node.fadePhase);
                const eased = breath * breath * (3 - 2 * breath);
                node.opacity = 0.30 + eased * (node.maxFadeOpacity - 0.30);
              } else {
                // ~28% of roots gently visible at a time in unfiltered ALL mode
                const sparse = computeSparseBreath(node, 0.62);
                node.opacity = sparse * node.maxFadeOpacity;
              }
            } else {
              // Child word surfaces softly alongside a surfaced parent root
              if (!node._matchesMastery || (hasActiveFilter && !node.inActiveCluster)) {
                node.opacity = 0;
              } else if (hasActiveFilter || isMasteryActive) {
                const parentAlpha = parentNode?.opacity || 0;
                const breath = 0.5 + 0.5 * Math.sin(time * node.fadeFreq * 1.3 + node.fadePhase);
                const eased = breath * breath * (3 - 2 * breath);
                node.opacity = Math.min(parentAlpha, 0.20 + eased * (node.maxFadeOpacity - 0.20));
              } else {
                const parentAlpha = parentNode?.opacity || 0;
                if (parentAlpha <= 0.25) {
                  node.opacity = 0;
                } else {
                  const parentGate = (parentAlpha - 0.25) / 0.75;
                  const wordSparse = computeSparseBreath(node, 0.05);
                  node.opacity = parentGate * wordSparse * node.maxFadeOpacity;
                }
              }
            }
          } else if (isFocalFamily) {
            // Focused Mode: anchored calmly with subtle slow sway
            const microDriftX = Math.sin(time * 0.12 + node.driftPhaseX) * 1.5;
            const microDriftY = Math.cos(time * 0.10 + node.driftPhaseY) * 1.0;
            node._driftX = microDriftX;
            node._driftY = microDriftY;
            node.x = node.baseX + microDriftX;
            node.y = node.baseY + microDriftY;
            node.opacity = 1.0;
          } else {
            // Peripheral nodes during Focus Mode: slow sway, sparsely & faintly visible
            const localDriftX = Math.sin(time * node.driftSpeedX * 0.6 + node.driftPhaseX) * node.driftAmpX;
            const localDriftY = Math.cos(time * node.driftSpeedY * 0.6 + node.driftPhaseY) * node.driftAmpY;
            const totalDriftX = parentDriftX * 0.85 + localDriftX;
            const totalDriftY = parentDriftY * 0.85 + localDriftY;
            node._driftX = totalDriftX;
            node._driftY = totalDriftY;
            node.x = node.baseX + totalDriftX;
            node.y = node.baseY + totalDriftY;

            if (node.type === 'origin') {
              node.opacity = hasActiveFilter ? 0 : 0.20;
            } else if (node.type === 'root') {
              if (!node._matchesMastery || (hasActiveFilter && !node.inActiveCluster)) {
                node.opacity = 0;
              } else {
                node.opacity = computeSparseBreath(node, hasActiveFilter ? clusterRootThreshold : 0.62) * 0.12;
              }
            } else {
              node.opacity = 0;
            }
          }
        };

        // Pass 1: Origins & Roots
        graphData.nodes.forEach(node => {
          if (node.type !== 'word') {
            updateNodeMotion(node, null);
          }
        });

        // Pass 2: Child Words follow their parent root's sway & visibility
        graphData.nodes.forEach(node => {
          if (node.type === 'word') {
            const parentRoot = nodeMap.get(node.rootNodeId);
            updateNodeMotion(node, parentRoot || null);
          }
        });

        // 5. Draw Technical Grid & Subtle Background Rings
        drawGraphBackgroundMotif(ctx, width, height, cameraRef.current, time);

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

        // 7. Draw Connector Edges
        // First pass: ambient or background edges
        graphData.edges.forEach(edge => {
          if (hasActiveFilter && edge.type === 'origin-to-root') return;
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
            ctx.lineWidth = 1.1;
            ctx.globalAlpha = Math.min(fromNode.opacity, toNode.opacity) * 0.22;
          }
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        });

        // Subtle constellation threads from active cluster center to visible cluster roots
        if (hasActiveFilter && activeCluster) {
          graphData.nodes.forEach(node => {
            if (node.type !== 'root' || !node.inActiveCluster || node.opacity <= 0.01) return;
            if (currentFocusedId && node.id === currentFocusedId) return;
            ctx.beginPath();
            ctx.moveTo(activeCluster.x, activeCluster.y);
            ctx.lineTo(node.x, node.y);
            ctx.strokeStyle = activeCluster.accentColor || '#42281D';
            ctx.lineWidth = 1;
            ctx.globalAlpha = currentFocusedId ? 0.03 : node.opacity * 0.14;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          });
        }

        // Second pass: Focused Edges for selected root family
        if (currentFocusedId) {
          graphData.edges.forEach(edge => {
            if (hasActiveFilter && edge.type === 'origin-to-root') return;
            if (edge.rootId !== currentFocusedId) return;
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return;

            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.strokeStyle = '#7BB33B'; // Vivid Kiwi Green
            ctx.lineWidth = 2.25;
            ctx.globalAlpha = 0.9;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          });
        }

        // 7b. Draw Active Cluster Landmark Hub
        if (hasActiveFilter && activeCluster && isVisible(activeCluster.x, activeCluster.y)) {
          drawClusterLandmark(ctx, activeCluster, time, Boolean(currentFocusedId));
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
  // 5. BACKGROUND RINGS, GRID & AMBIENT PARTICLES
  // ---------------------------------------------------------------------------

  const drawGraphBackgroundMotif = (ctx, width, height, cam, time) => {
    // 1. Subtle Technical Grid
    const gridSize = 60 * cam.zoom;
    if (gridSize >= 15) {
      const offsetX = (width / 2 + cam.x) % gridSize;
      const offsetY = (height / 2 + cam.y) % gridSize;
      ctx.strokeStyle = '#111410';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.05;
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

    // 2. Faint Concentric Graph Rings
    const centerX = width / 2 + cam.x;
    const centerY = height / 2 + cam.y;
    const graphRadius = 900 * cam.zoom;

    ctx.save();
    // Inner primary ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, graphRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#111410';
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.06;
    ctx.stroke();

    // Secondary concentric dashed ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, graphRadius * 1.35, 0, Math.PI * 2);
    ctx.strokeStyle = '#7BB33B';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 12]);
    ctx.globalAlpha = 0.05;
    ctx.stroke();

    // Faint center crosshairs
    ctx.beginPath();
    ctx.moveTo(centerX - graphRadius * 1.4, centerY);
    ctx.lineTo(centerX + graphRadius * 1.4, centerY);
    ctx.moveTo(centerX, centerY - graphRadius * 1.4);
    ctx.lineTo(centerX, centerY + graphRadius * 1.4);
    ctx.strokeStyle = '#111410';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 10]);
    ctx.globalAlpha = 0.035;
    ctx.stroke();
    ctx.restore();

    // 3. Slow Floating Ambient Particles
    const particles = ambientParticlesRef.current;
    ctx.fillStyle = '#42281D';
    particles.forEach(m => {
      const worldX = m.baseX + Math.sin(time * m.speedX + m.phaseX) * m.ampX;
      const worldY = m.baseY + Math.cos(time * m.speedY + m.phaseY) * m.ampY;

      const screenX = width / 2 + cam.x + worldX * cam.zoom;
      const screenY = height / 2 + cam.y + worldY * cam.zoom;

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
  // 6. NODE RENDERING HELPERS
  // ---------------------------------------------------------------------------

  const drawClusterLandmark = (ctx, cluster, time, hasFocus) => {
    const swayX = Math.sin(time * 0.045) * 6;
    const swayY = Math.cos(time * 0.035) * 3;
    const cx = cluster.x + swayX;
    const cy = cluster.y + swayY;
    const alpha = hasFocus ? 0.22 : 0.88;

    // Subtle territory halo ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cluster.x, cluster.y, 108, 0, Math.PI * 2);
    ctx.strokeStyle = cluster.accentColor || '#7BB33B';
    ctx.lineWidth = 1.25;
    ctx.setLineDash([6, 10]);
    ctx.globalAlpha = hasFocus ? 0.05 : 0.16;
    ctx.stroke();
    ctx.restore();

    const titleText = `${cluster.icon || ''} ${cluster.label.toUpperCase()}`.trim();
    const subText = `${cluster.count} ROOTS`;
    ctx.save();
    ctx.font = '900 12px "JetBrains Mono", Menlo, Consolas, monospace';
    const cardWidth = Math.max(185, ctx.measureText(titleText).width + 44);
    const cardHeight = 56;
    ctx.restore();

    drawGraphCard(ctx, cx, cy, cardWidth, cardHeight, {
      fillColor: '#1C211B',
      borderColor: 'rgba(255, 255, 255, 0.16)',
      borderWidth: 1.25,
      borderRadius: 16,
      shadowColor: 'rgba(17, 20, 16, 0.14)',
      shadowBlur: 16,
      shadowOffsetY: 4,
      alpha,
    });

    ctx.save();
    ctx.globalAlpha = alpha;
    traceRoundedRect(ctx, cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 16);
    ctx.clip();
    ctx.fillStyle = cluster.accentColor || '#7BB33B';
    ctx.fillRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, 4);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FAFBF8';
    ctx.font = '900 12px "JetBrains Mono", Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, cx, cy - 6);

    ctx.fillStyle = '#B8C4B0';
    ctx.font = 'bold 9.5px "JetBrains Mono", Menlo, Consolas, monospace';
    ctx.fillText(subText, cx, cy + 12);
    ctx.restore();
  };

  const drawOriginNode = (ctx, node, isSelected, isHovered, currentFocusedId) => {
    const isLatin = node.language === 'Latin';
    const isGreek = node.language === 'Greek';
    const bgFill = isLatin ? '#1C211B' : isGreek ? '#4A3126' : '#2F441E';
    const effectiveAlpha = currentFocusedId ? 0.25 : node.opacity;
    const borderRadius = 14;

    drawGraphCard(ctx, node.x, node.y, node.width, node.height, {
      fillColor: bgFill,
      borderColor: isSelected || isHovered ? '#7BB33B' : 'rgba(255, 255, 255, 0.14)',
      borderWidth: isSelected || isHovered ? 2 : 1.25,
      borderRadius,
      shadowColor: 'rgba(17, 20, 16, 0.14)',
      shadowBlur: 14,
      shadowOffsetY: 4,
      alpha: effectiveAlpha,
    });

    ctx.save();
    ctx.globalAlpha = effectiveAlpha;
    // Rounded-clipped green top accent bar
    traceRoundedRect(
      ctx,
      node.x - node.width / 2,
      node.y - node.height / 2,
      node.width,
      node.height,
      borderRadius
    );
    ctx.clip();
    ctx.fillStyle = '#84C341';
    ctx.fillRect(node.x - node.width / 2, node.y - node.height / 2, node.width, 4);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = effectiveAlpha;
    ctx.fillStyle = '#FAFBF8';
    ctx.font = '900 12px "JetBrains Mono", Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x, node.y + 2);
    ctx.restore();
  };

  const drawRootNode = (ctx, node, isSelected, isHovered, isFocal) => {
    const isHighlighted = isSelected || isHovered;
    const filter = pathwayFilterRef.current;
    const pathway = learningPathwayRef.current;

    let matchesFilter = true;
    if (filter && filter !== 'ALL') {
      if (pathway === PATHWAY_YIELD) {
        matchesFilter = (node.sat_tier || '').toLowerCase() === filter.toLowerCase();
      } else {
        matchesFilter = (node.thematic_cluster || '').toLowerCase() === filter.toLowerCase();
      }
    }

    let effectiveAlpha = isFocal ? 1.0 : isHighlighted ? 1.0 : node.opacity;
    if (!matchesFilter && !isFocal && !isHighlighted) {
      effectiveAlpha = 0;
    }

    const borderColor = isFocal || isHighlighted
      ? '#7BB33B'
      : matchesFilter && filter !== 'ALL'
        ? 'rgba(17, 20, 16, 0.34)'
        : 'rgba(17, 20, 16, 0.18)';
    const borderWidth = isFocal ? 2.5 : isHighlighted ? 2 : 1.25;
    const borderRadius = 10;

    drawGraphCard(ctx, node.x, node.y, node.width, node.height, {
      fillColor: isFocal || isHighlighted ? '#FAFBF8' : '#F3EEE7',
      borderColor,
      borderWidth,
      borderRadius,
      shadowColor: isFocal || isHighlighted ? 'rgba(123, 179, 59, 0.24)' : 'rgba(66, 40, 29, 0.09)',
      shadowBlur: isFocal || isHighlighted ? 14 : 8,
      shadowOffsetY: isFocal ? 4 : 2,
      alpha: effectiveAlpha,
    });

    ctx.save();
    ctx.globalAlpha = effectiveAlpha;

    // Accent top stripe representing active pathway attribute (clipped to rounded top corners)
    let stripeColor = '#7BB33B';
    if (pathway === PATHWAY_YIELD) {
      stripeColor = (node.sat_tier || '').includes('1') ? '#7BB33B' : (node.sat_tier || '').includes('2') ? '#2563eb' : '#7c3aed';
    } else {
      stripeColor = getClusterMeta(node.thematic_cluster).accentColor || '#7BB33B';
    }
    ctx.save();
    traceRoundedRect(
      ctx,
      node.x - node.width / 2,
      node.y - node.height / 2,
      node.width,
      node.height,
      borderRadius
    );
    ctx.clip();
    ctx.fillStyle = stripeColor;
    ctx.fillRect(node.x - node.width / 2, node.y - node.height / 2, node.width, 3);
    ctx.restore();

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
    ctx.fillText(displayMorpheme, node.x, node.y - 4);

    // Subtitle badge showing pathway context & mastery percentage
    ctx.fillStyle = isFocal ? '#2F441E' : '#62685E';
    ctx.font = 'bold 8.5px "JetBrains Mono", Menlo, Consolas, monospace';
    const masteryBadge = (node.masteryPct > 0 || isMasteryFilterActiveRef.current)
      ? ` · ${node.masteryPct ?? 0}%`
      : '';
    const pathwaySubtext = pathway === PATHWAY_YIELD
      ? `${(node.sat_tier || 'T1').replace('Tier ', 'T')} · ${node.total_words}W${masteryBadge}`
      : `${(node.thematic_cluster || 'Core').slice(0, 8)} · ${node.total_words}W${masteryBadge}`;
    ctx.fillText(pathwaySubtext, node.x, node.y + 12);
    ctx.restore();
  };

  const drawWordNode = (ctx, node, isSelected, isHovered, isFocal) => {
    const isHighlighted = isSelected || isHovered;
    const effectiveAlpha = isFocal ? 1.0 : isHighlighted ? 1.0 : node.opacity;

    const borderColor = isFocal || isHighlighted ? '#7BB33B' : 'rgba(17, 20, 16, 0.18)';
    const borderWidth = isFocal ? 2 : isHighlighted ? 1.75 : 1;

    drawGraphCard(ctx, node.x, node.y, node.width, node.height, {
      fillColor: isHighlighted ? '#EDF5E5' : '#FFFFFF',
      borderColor,
      borderWidth,
      borderRadius: 14,
      shadowColor: isFocal || isHighlighted ? 'rgba(123, 179, 59, 0.18)' : 'rgba(17, 20, 16, 0.07)',
      shadowBlur: isFocal || isHighlighted ? 10 : 6,
      shadowOffsetY: 2,
      alpha: effectiveAlpha,
    });

    ctx.save();
    ctx.globalAlpha = effectiveAlpha;

    // Mastered Green Dot
    if (node.isMastered) {
      ctx.beginPath();
      ctx.arc(node.x - node.width / 2 + 10, node.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#7BB33B';
      ctx.fill();
      ctx.strokeStyle = 'rgba(17, 20, 16, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Word Text
    ctx.fillStyle = '#111410';
    ctx.font = isFocal ? '700 11px Inter, system-ui, sans-serif' : '600 11px Inter, system-ui, sans-serif';
    ctx.textAlign = node.isMastered ? 'left' : 'center';
    ctx.textBaseline = 'middle';

    const textX = node.isMastered ? node.x - node.width / 2 + 18 : node.x;
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
          // Clicked background: if a root was focused, clear back to ambient overview
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

  // ---------------------------------------------------------------------------
  // MOBILE TOUCH GESTURES (DRAG PAN, PINCH-TO-ZOOM, TAP SELECTION)
  // ---------------------------------------------------------------------------
  const touchStartRef = useRef(null);
  const pinchStartRef = useRef(null);
  const touchDistanceRef = useRef(0);

  const handleTouchStart = (e) => {
    targetCameraRef.current = null;
    setIsSearchFocused(false);

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      cameraStartRef.current = { ...cameraRef.current };
      touchDistanceRef.current = 0;
      pinchStartRef.current = null;
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;
      pinchStartRef.current = {
        dist,
        zoom: cameraRef.current.zoom,
        centerX,
        centerY,
      };
      touchStartRef.current = null;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchDistanceRef.current += Math.hypot(dx, dy);

      cameraRef.current.x = cameraStartRef.current.x + dx;
      cameraRef.current.y = cameraStartRef.current.y + dy;
    } else if (e.touches.length === 2 && pinchStartRef.current && containerRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const rect = containerRef.current.getBoundingClientRect();
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      
      const { dist: startDist, zoom: startZoom, centerX, centerY } = pinchStartRef.current;
      if (startDist > 0) {
        const scale = currentDist / startDist;
        const newZoom = Math.min(2.5, Math.max(0.18, startZoom * scale));
        
        const mouseX = centerX - rect.left;
        const mouseY = centerY - rect.top;
        const cam = cameraRef.current;
        const worldXBefore = (mouseX - rect.width / 2 - cam.x) / cam.zoom;
        const worldYBefore = (mouseY - rect.height / 2 - cam.y) / cam.zoom;

        cam.zoom = newZoom;
        cam.x = mouseX - rect.width / 2 - worldXBefore * newZoom;
        cam.y = mouseY - rect.height / 2 - worldYBefore * newZoom;
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current) {
      const elapsed = Date.now() - touchStartRef.current.time;
      const wasTap = touchDistanceRef.current < 12 && elapsed < 350;
      
      if (wasTap && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const screenX = touchStartRef.current.x - rect.left;
        const screenY = touchStartRef.current.y - rect.top;
        const hitNode = getNodeAtScreenPos(screenX, screenY);

        if (hitNode) {
          if (hitNode.type === 'root') {
            focusRoot(hitNode);
          } else {
            smoothPanToNode(hitNode);
          }
        } else {
          if (focusedRootIdRef.current) {
            clearFocus();
          } else {
            setSelectedNode(null);
          }
        }
      }
      touchStartRef.current = null;
    }

    if (e.touches.length < 2) {
      pinchStartRef.current = null;
    }
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
  const handleOpenMiniFlashcard = useCallback((wordData, parentRoot = null) => {
    const rootDetails = wordData?.root_details || parentRoot || (selectedNode?.type === 'word' ? selectedNode.parentRoot : null);
    setStudyWordModal({
      ...wordData,
      root_details: rootDetails
    });
    setFlashcardFlipped(false);
    setCardStartTime(Date.now());
  }, [selectedNode]);

  const lastRestoredNonceRef = useRef(null);

  useEffect(() => {
    if (!trajectoryRestoreTarget || trajectoryRestoreTarget.tab !== 'graph') return;
    if (trajectoryRestoreTarget.nonce && lastRestoredNonceRef.current === trajectoryRestoreTarget.nonce) return;

    if (trajectoryRestoreTarget.wordName) {
      if (graphData.nodes.length === 0) return;
      const targetWordLower = trajectoryRestoreTarget.wordName.toLowerCase();
      const wordNode = graphData.nodes.find(
        (n) =>
          n.type === 'word' &&
          (n.word?.toLowerCase() === targetWordLower || n.data?.word?.toLowerCase() === targetWordLower)
      );
      if (wordNode) {
        lastRestoredNonceRef.current = trajectoryRestoreTarget.nonce;
        smoothPanToNode(wordNode);
        handleOpenMiniFlashcard(wordNode.data, wordNode.parentRoot);
      }
      return;
    }

    if (trajectoryRestoreTarget.rootId) {
      if (graphData.nodes.length === 0) return;
      const rootNode = graphData.nodes.find(
        (n) => n.type === 'root' && Number(n.rawId) === Number(trajectoryRestoreTarget.rootId)
      );
      if (rootNode) {
        lastRestoredNonceRef.current = trajectoryRestoreTarget.nonce;
        setStudyWordModal(null);
        focusRoot(rootNode);
      }
      return;
    }

    lastRestoredNonceRef.current = trajectoryRestoreTarget.nonce;
    setStudyWordModal(null);
  }, [trajectoryRestoreTarget, graphData.nodes, smoothPanToNode, focusRoot, handleOpenMiniFlashcard]);

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
        const nextMastered = new Set(masteredWordIds);
        nextMastered.add(studyWordModal.id);
        setMasteredWordIds(nextMastered);
        setGraphData(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => {
            if (n.id === `word-${studyWordModal.id}`) {
              return { ...n, isMastered: true };
            }
            if (n.type === 'root' && Array.isArray(n.data?.words)) {
              const masteredCount = n.data.words.filter(w => nextMastered.has(w.id)).length;
              const masteryPct = n.data.words.length > 0
                ? Math.round((masteredCount / n.data.words.length) * 100)
                : 0;
              return { ...n, masteredCount, masteryPct };
            }
            return n;
          })
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} className="block w-full h-full" style={{ touchAction: 'none' }} />
      </div>

      {/* RESPONSIVE TOP GRAPH CONTROL BAR */}
      <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: Return to Study Deck + Pathway Toggle */}
        <div className="pointer-events-auto shrink-0 flex items-center space-x-2">
          <button
            onClick={() => onNavigateStudy && onNavigateStudy()}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase text-[#111410] transition active:translate-x-[1px] active:translate-y-[1px]"
            title="Return to Flashcards Study Deck"
          >
            <Layers className="w-3.5 h-3.5 text-[#7BB33B]" />
            <span className="hidden sm:inline">← Back to Flashcards</span>
            <span className="sm:hidden">← Deck</span>
          </button>

          <PathwayToggle
            currentPathway={learningPathway}
            onPathwayChange={handlePathwayChange}
            compact
          />
        </div>

        {/* Center: Search Bar with Autocomplete Dropdown */}
        <div className="pointer-events-auto flex-1 max-w-md relative">
          <div className="relative bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] sm:shadow-[4px_4px_0px_0px_#111410] p-1 flex items-center">
            <div className="pl-1.5 sm:pl-2 pr-1 flex items-center text-[#111410]">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#111410]" />
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
                  ? `Focused on ${currentlyFocusedRoot?.morpheme || 'root'}...`
                  : "Search roots or words..."
              }
              className="flex-1 bg-transparent text-base sm:text-xs font-mono font-bold text-[#111410] placeholder-[#62685E] focus:outline-none px-1.5 py-1 min-w-0"
            />

            {/* Active Focus Capsule */}
            {focusedRootId && !searchQuery && (
              <div className="flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 bg-[#EDF5E5] border border-[#111410] text-[#2F441E] text-[10px] font-mono font-black uppercase shrink-0 mr-1 animate-fade-in">
                <Eye className="w-3 h-3 text-[#7BB33B]" />
                <span className="truncate max-w-[70px] sm:max-w-none">
                  {currentlyFocusedRoot?.morpheme}
                </span>
                <button 
                  onClick={clearFocus} 
                  className="hover:text-[#991B1B] ml-0.5 p-0.5" 
                  title="Clear focus (Esc)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="text-[#111410] hover:text-[#991B1B] p-1 mr-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="hidden md:flex items-center pl-1 pr-2 border-l border-[#111410]/20 text-[10px] font-mono text-[#62685E]">
              <kbd className="px-1.5 py-0.5 bg-[#FAFBF8] border border-[#111410] text-[#111410]">ESC</kbd>
            </div>
          </div>

          {/* Autocomplete Dropdown List with Roots & Vocabulary Words */}
          {(isSearchFocused || searchQuery) && searchResults.total > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border-2 border-[#111410] shadow-[5px_5px_0px_0px_#111410] z-40 max-h-72 sm:max-h-80 overflow-y-auto">
              
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
                          <span>FOCUS</span>
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
                          <span>FOCUS</span>
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

        {/* Right: Zoom Controls */}
        <div className="pointer-events-auto flex items-center space-x-1 shrink-0">
          <button
            onClick={() => {
              targetCameraRef.current = null;
              cameraRef.current.zoom = Math.min(2.5, cameraRef.current.zoom * 1.25);
            }}
            title="Zoom In"
            className="p-1.5 sm:p-2 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[#111410] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => {
              targetCameraRef.current = null;
              cameraRef.current.zoom = Math.max(0.18, cameraRef.current.zoom / 1.25);
            }}
            title="Zoom Out"
            className="p-1.5 sm:p-2 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[#111410] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={resetCamera}
            title="Reset Camera"
            className="p-1.5 sm:p-2 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[#111410] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* PERSPECTIVE FILTER PILLS & MASTERY SLIDER RIBBON */}
      <div className="absolute top-14 sm:top-16 left-2.5 sm:left-4 right-2.5 sm:right-4 z-20 pointer-events-none flex flex-wrap items-center gap-1.5">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xs border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] p-1 inline-flex items-center space-x-1 font-mono text-[10px] sm:text-[11px] font-black uppercase max-w-full overflow-x-auto no-scrollbar">
          <span className="text-[9px] text-[#62685E] px-1.5 select-none shrink-0">
            {learningPathway === PATHWAY_YIELD ? '⚡ FREQUENCY TIERS:' : '🧠 SEMANTIC CLUSTERS:'}
          </span>
          <button
            type="button"
            onClick={() => setPathwayFilter('ALL')}
            className={`px-2 py-0.5 border text-center whitespace-nowrap transition ${
              pathwayFilter === 'ALL'
                ? 'bg-[#111410] text-white border-[#111410]'
                : 'bg-transparent text-[#111410] border-transparent hover:bg-[#FAFBF8]'
            }`}
          >
            ALL
          </button>
          {learningPathway === PATHWAY_YIELD
            ? SAT_TIER_DEFS.map((tier) => (
                <button
                  key={tier.name}
                  type="button"
                  onClick={() => setPathwayFilter(pathwayFilter === tier.name ? 'ALL' : tier.name)}
                  className={`px-2 py-0.5 border whitespace-nowrap transition ${
                    pathwayFilter === tier.name
                      ? 'bg-[#F59E0B] text-black border-[#111410] font-black shadow-[1px_1px_0px_0px_#111410]'
                      : 'bg-white text-[#111410] border-[#111410]/20 hover:border-[#111410]'
                  }`}
                >
                  {tier.icon} {tier.badge}
                </button>
              ))
            : THEMATIC_CLUSTER_DEFS.map((cluster) => (
                <button
                  key={cluster.name}
                  type="button"
                  onClick={() => setPathwayFilter(pathwayFilter === cluster.name ? 'ALL' : cluster.name)}
                  className={`px-2 py-0.5 border whitespace-nowrap transition ${
                    pathwayFilter === cluster.name
                      ? 'bg-[#7BB33B] text-white border-[#111410] font-black shadow-[1px_1px_0px_0px_#111410]'
                      : 'bg-white text-[#111410] border-[#111410]/20 hover:border-[#111410]'
                  }`}
                >
                  {cluster.icon} {cluster.name}
                </button>
              ))}
        </div>

        {/* MASTERY RANGE FILTER (1-100% + <= / >= TOGGLE) */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xs border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] px-2 py-1 inline-flex items-center space-x-2 font-mono text-[10px] sm:text-[11px] font-black uppercase shrink-0">
          <span className="text-[9px] text-[#62685E] select-none shrink-0">
            MASTERY
          </span>
          <button
            type="button"
            onClick={() => setMasteryComparator(prev => (prev === 'lte' ? 'gte' : 'lte'))}
            title={
              masteryComparator === 'lte'
                ? 'Showing roots with mastery ≤ threshold (click to switch to ≥)'
                : 'Showing roots with mastery ≥ threshold (click to switch to ≤)'
            }
            className="px-1.5 py-0.5 bg-[#EFE8DF] hover:bg-[#EDF5E5] border border-[#111410] text-[#111410] font-black text-[11px] leading-none cursor-pointer transition"
          >
            {masteryComparator === 'lte' ? '≤' : '≥'}
          </button>
          <input
            type="range"
            min={1}
            max={100}
            value={masteryThreshold}
            onChange={(e) => setMasteryThreshold(Number(e.target.value))}
            aria-label="Mastery percentage threshold"
            className="w-20 sm:w-28 accent-[#7BB33B] cursor-pointer h-1.5"
          />
          <span className="w-8 text-right text-[#111410] tabular-nums">
            {masteryThreshold}%
          </span>
          <span className="text-[9px] text-[#62685E] tabular-nums">
            ({matchingMasteryCount})
          </span>
          {isMasteryFilterActive && (
            <button
              type="button"
              onClick={() => {
                setMasteryComparator('lte');
                setMasteryThreshold(100);
              }}
              title="Reset mastery filter"
              className="text-[#62685E] hover:text-[#991B1B] font-black leading-none px-0.5 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* MOBILE TOUCH HINT BAR */}
      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none sm:hidden flex justify-center">
        <div className="bg-white/95 backdrop-blur-xs border border-[#111410] shadow-[2px_2px_0px_0px_#111410] px-3 py-1 font-mono text-[10px] text-[#111410] font-bold">
          Drag to Pan · Pinch to Zoom · Tap to Focus
        </div>
      </div>

      {/* CONTROLS HUD (BOTTOM-LEFT HEADS-UP DISPLAY - DESKTOP ONLY) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:block">
        <div className="bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] px-3.5 py-2 font-mono text-xs text-[#111410] flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 font-black">
            <span className={`w-2 h-2 inline-block border border-[#111410] mr-1 ${
              focusedRootId ? 'bg-[#7BB33B] animate-pulse' : pathwayFilter !== 'ALL' ? 'bg-[#F59E0B]' : 'bg-[#EFE8DF]'
            }`} />
            <span>
              {focusedRootId
                ? 'FOCUSED ROOT:'
                : pathwayFilter !== 'ALL'
                  ? `CLUSTER · ${pathwayFilter.toUpperCase()}:`
                  : 'ROOT GRAPH:'}
            </span>
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
            <span className="text-[#62685E] ml-1">
              {focusedRootId ? 'Back to Map' : pathwayFilter !== 'ALL' ? 'Show All' : 'Reset'}
            </span>
          </div>

          <span className="text-[#111410]/30 hidden lg:inline">|</span>
          <span className="text-[#62685E] hidden lg:inline">
            {focusedRootId ? 'Peripheral nodes dimmed' : 'Click any root to focus its family'}
          </span>
        </div>
      </div>

      {/* NODE INSPECTION SLIDEOUT DRAWER */}
      {selectedNode && (
        <div className="absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white border-l-2 border-[#111410] shadow-[-5px_0px_0px_0px_#111410] z-40 flex flex-col animate-slide-left overflow-hidden">
          
          {/* Drawer Header */}
          <div className="p-4 border-b-2 border-[#111410] bg-[#FAFBF8] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#111410] text-white">
                {selectedNode.type === 'origin' 
                  ? 'ETYMOLOGY ORIGIN' 
                  : selectedNode.type === 'root' 
                    ? 'FOCUSED ROOT' 
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
                    {selectedNode.language} Morpheme · {selectedNode.total_words} Derivative Words
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410]">
                      🧠 {selectedNode.thematic_cluster || selectedNode.data?.thematic_cluster || 'Motion & Travel'}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#FFFBEB] text-[#92400E] border border-[#111410]">
                      ⚡ {selectedNode.sat_tier || selectedNode.data?.sat_tier || 'Tier 1 High-Yield'}
                    </span>
                  </div>
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

                  <div className="space-y-2.5">
                    {(selectedNode.data?.words || []).map(w => {
                      const isMastered = masteredWordIds.has(w.id);
                      return (
                        <div
                          key={w.id}
                          onClick={() => {
                            const wordNode = graphData.nodes.find(n => n.id === `word-${w.id}`);
                            if (wordNode) smoothPanToNode(wordNode);
                          }}
                          className="p-3 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition group"
                        >
                          <div 
                            className="flex items-start justify-between cursor-pointer"
                            onClick={() => {
                              const wordNode = graphData.nodes.find(n => n.id === `word-${w.id}`);
                              if (wordNode) smoothPanToNode(wordNode);
                            }}
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-sans font-black text-sm text-[#111410] group-hover:text-[#2F441E]">
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
                            <ChevronRight className="w-4 h-4 text-[#111410] group-hover:translate-x-1 transition-transform shrink-0 ml-2 mt-0.5" />
                          </div>

                          {/* Clickable Morphology Decomposition */}
                          <div 
                            className="mt-2.5 pt-2 border-t border-[#111410]/15 flex flex-wrap items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[9px] font-mono font-bold uppercase text-[#62685E] mr-0.5 shrink-0">
                              Morphemes:
                            </span>

                            {w.prefix && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenMorpheme) {
                                    onOpenMorpheme({
                                      type: 'prefix',
                                      raw: w.prefix,
                                      word: { ...w, root_details: selectedNode.data },
                                    });
                                  }
                                }}
                                className="px-2 py-0.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border border-[#111410] shadow-[1px_1px_0px_0px_#111410] hover:shadow-[2px_2px_0px_0px_#111410] active:translate-y-0 transition cursor-pointer text-left group/chip"
                                title={`Click to explore Prefix "${w.prefix}"`}
                              >
                                <div className="flex items-center space-x-1">
                                  <span className="text-[8px] uppercase font-mono font-bold text-[#2F441E]/70 block leading-none">Prefix</span>
                                  <span className="text-[8px] opacity-60 group-hover/chip:opacity-100 font-mono">↗</span>
                                </div>
                                <span className="font-mono font-black text-xs leading-tight">
                                  {w.prefix}
                                </span>
                              </button>
                            )}

                            {w.prefix && <span className="text-[#111410] font-black font-mono text-xs">+</span>}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenMorpheme) {
                                  onOpenMorpheme({
                                    type: 'root',
                                    root: selectedNode.data,
                                    word: { ...w, root_details: selectedNode.data },
                                  });
                                }
                              }}
                              className="px-2 py-0.5 bg-[#EFE8DF] hover:bg-[#E5DCD1] text-[#42281D] border border-[#111410] shadow-[1px_1px_0px_0px_#111410] hover:shadow-[2px_2px_0px_0px_#111410] active:translate-y-0 transition cursor-pointer text-left group/chip"
                              title={`Click to explore Root "[${selectedNode.morpheme?.toUpperCase()}]"`}
                            >
                              <div className="flex items-center space-x-1">
                                <span className="text-[8px] uppercase font-mono font-bold text-[#42281D]/70 block leading-none">
                                  Root ({selectedNode.language || 'Latin'})
                                </span>
                                <span className="text-[8px] opacity-60 group-hover/chip:opacity-100 font-mono">↗</span>
                              </div>
                              <span className="font-mono font-black text-xs text-[#42281D] leading-tight">
                                [{selectedNode.morpheme?.toUpperCase()}]
                              </span>
                            </button>

                            {w.suffix && <span className="text-[#111410] font-black font-mono text-xs">+</span>}

                            {w.suffix && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenMorpheme) {
                                    onOpenMorpheme({
                                      type: 'suffix',
                                      raw: w.suffix,
                                      word: { ...w, root_details: selectedNode.data },
                                    });
                                  }
                                }}
                                className="px-2 py-0.5 bg-white hover:bg-[#FAFBF8] text-[#111410] border border-[#111410] shadow-[1px_1px_0px_0px_#111410] hover:shadow-[2px_2px_0px_0px_#111410] active:translate-y-0 transition cursor-pointer text-left group/chip"
                                title={`Click to explore Suffix "${w.suffix}"`}
                              >
                                <div className="flex items-center space-x-1">
                                  <span className="text-[8px] uppercase font-mono font-bold text-[#62685E] block leading-none">Suffix</span>
                                  <span className="text-[8px] opacity-60 group-hover/chip:opacity-100 font-mono">↗</span>
                                </div>
                                <span className="font-mono font-black text-xs leading-tight">
                                  {w.suffix}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Action: Study Root in Flashcards Deck */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const rootId = selectedNode.rawId || selectedNode.data?.id;
                      if (onSelectRootPractice && rootId) {
                        onSelectRootPractice(rootId);
                      } else if (onNavigateStudy) {
                        onNavigateStudy(selectedNode.data?.words?.[0] || null);
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] font-mono text-xs font-black uppercase tracking-wider transition active:translate-x-[1px] active:translate-y-[1px]"
                    title="Open custom deck selector with this root added"
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
                              className="w-full text-base sm:text-xs font-mono px-2 py-1.5 bg-white border border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B]"
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
                              className="w-full text-base sm:text-xs font-sans p-2 bg-white border border-[#111410] focus:outline-none focus:ring-1 focus:ring-[#7BB33B] resize-y"
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
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-mono font-black uppercase text-[#62685E] flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#7BB33B]" />
                      <span>Morpheme Decomposition Formula</span>
                    </span>
                    <span className="text-[9px] font-mono text-[#62685E] uppercase hidden sm:inline">
                      Click piece to inspect
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {selectedNode.data?.prefix && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenMorpheme) {
                            onOpenMorpheme({
                              type: 'prefix',
                              raw: selectedNode.data.prefix,
                              word: {
                                ...selectedNode.data,
                                root_details: selectedNode.parentRoot,
                              },
                            });
                          }
                        }}
                        className="px-2.5 sm:px-3 py-1.5 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] hover:shadow-[3px_3px_0px_0px_#111410] active:translate-y-0 transition cursor-pointer text-left group"
                        title={`Click to explore Prefix "${selectedNode.data.prefix}" & practice subset`}
                      >
                        <div className="flex items-center justify-between space-x-1">
                          <span className="text-[9px] block uppercase font-mono font-bold text-[#2F441E]/70">Prefix</span>
                          <span className="text-[9px] font-mono font-bold opacity-60 group-hover:opacity-100">↗</span>
                        </div>
                        <span className="font-mono font-extrabold text-xs">{selectedNode.data.prefix}</span>
                      </button>
                    )}

                    {selectedNode.data?.prefix && <span className="text-[#111410] font-black font-mono text-base">+</span>}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenMorpheme) {
                          onOpenMorpheme({
                            type: 'root',
                            root: selectedNode.parentRoot,
                            word: {
                              ...selectedNode.data,
                              root_details: selectedNode.parentRoot,
                            },
                          });
                        }
                      }}
                      className="px-2.5 sm:px-3 py-1.5 bg-[#EFE8DF] hover:bg-[#E5DCD1] text-[#42281D] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] hover:shadow-[3px_3px_0px_0px_#111410] active:translate-y-0 transition cursor-pointer text-left group"
                      title={`Click to explore Root "[${selectedNode.parentRoot?.morpheme?.toUpperCase()}]" & practice subset`}
                    >
                      <div className="flex items-center justify-between space-x-1">
                        <span className="text-[9px] block uppercase font-mono font-bold text-[#42281D]/70">
                          Root ({selectedNode.parentRoot?.language || 'Latin'})
                        </span>
                        <div className="flex items-center space-x-1">
                          {selectedNode.parentRoot?.thematic_cluster && (
                            <span className="text-[8px] font-mono px-1 py-0.2 bg-white/80 border border-[#111410]/40">
                              🧠 {selectedNode.parentRoot.thematic_cluster}
                            </span>
                          )}
                          {selectedNode.parentRoot?.sat_tier && (
                            <span className="text-[8px] font-mono px-1 py-0.2 bg-[#FFFBEB] text-[#92400E] border border-[#111410]/40">
                              ⚡ {selectedNode.parentRoot.sat_tier}
                            </span>
                          )}
                          <span className="text-[9px] font-mono font-bold opacity-60 group-hover:opacity-100">↗</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-xs text-[#42281D]">
                        [{selectedNode.parentRoot?.morpheme?.toUpperCase() || 'ROOT'}]
                      </span>
                      {selectedNode.parentRoot?.core_meaning && (
                        <span className="text-[#42281D] text-xs ml-1.5 font-sans font-bold">
                          = "{selectedNode.parentRoot.core_meaning}"
                        </span>
                      )}
                    </button>

                    {selectedNode.data?.suffix && <span className="text-[#111410] font-black font-mono text-base">+</span>}

                    {selectedNode.data?.suffix && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenMorpheme) {
                            onOpenMorpheme({
                              type: 'suffix',
                              raw: selectedNode.data.suffix,
                              word: {
                                ...selectedNode.data,
                                root_details: selectedNode.parentRoot,
                              },
                            });
                          }
                        }}
                        className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] hover:shadow-[3px_3px_0px_0px_#111410] active:translate-y-0 transition cursor-pointer text-left group"
                        title={`Click to explore Suffix "${selectedNode.data.suffix}" & practice subset`}
                      >
                        <div className="flex items-center justify-between space-x-1">
                          <span className="text-[9px] block uppercase font-mono font-bold text-[#62685E]">Suffix</span>
                          <span className="text-[9px] font-mono font-bold opacity-60 group-hover:opacity-100">↗</span>
                        </div>
                        <span className="font-mono font-extrabold text-xs">{selectedNode.data.suffix}</span>
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#111410]/20 flex items-center justify-between text-[11px] font-mono text-[#62685E]">
                    <span>
                      Parent Root: <strong className="text-[#111410]">{selectedNode.parentRoot?.morpheme}</strong> ({selectedNode.parentRoot?.language} · "{selectedNode.parentRoot?.core_meaning}")
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const rootNode = graphData.nodes.find(n => n.id === selectedNode.rootNodeId);
                        if (rootNode) focusRoot(rootNode);
                      }}
                      className="text-[#2F441E] font-bold hover:underline flex items-center gap-1"
                    >
                      Focus Root →
                    </button>
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
                    onClick={() => handleOpenMiniFlashcard(selectedNode.data, selectedNode.parentRoot)}
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
                  Over 60% of academic English and SAT/ACT vocabulary originates from {selectedNode.language} morphemic components. Pick any root morpheme in this cluster to focus its word family.
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

                  {/* Morpheme Decomposition in Mini-Flashcard */}
                  <div className="pt-3 border-t border-[#111410]/20" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-mono font-black uppercase text-[#62685E] block mb-1.5">
                      Morpheme Decomposition:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {studyWordModal.prefix && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetWord = studyWordModal;
                            setStudyWordModal(null);
                            if (onOpenMorpheme) {
                              onOpenMorpheme({
                                type: 'prefix',
                                raw: targetWord.prefix,
                                word: targetWord,
                              });
                            }
                          }}
                          className="px-2 py-1 bg-[#EDF5E5] hover:bg-[#DCEDD0] text-[#2F441E] border border-[#111410] shadow-[1px_1px_0px_0px_#111410] text-left group cursor-pointer"
                          title={`Explore Prefix "${studyWordModal.prefix}"`}
                        >
                          <span className="text-[8px] uppercase font-mono font-bold text-[#2F441E]/70 block leading-none">Prefix</span>
                          <span className="font-mono font-black text-xs leading-tight flex items-center gap-0.5">
                            {studyWordModal.prefix} <span className="text-[8px] opacity-60 group-hover:opacity-100">↗</span>
                          </span>
                        </button>
                      )}
                      {studyWordModal.prefix && <span className="text-[#111410] font-black font-mono text-xs">+</span>}
                      {studyWordModal.root_details && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetWord = studyWordModal;
                            setStudyWordModal(null);
                            if (onOpenMorpheme) {
                              onOpenMorpheme({
                                type: 'root',
                                root: targetWord.root_details,
                                word: targetWord,
                              });
                            }
                          }}
                          className="px-2 py-1 bg-[#EFE8DF] hover:bg-[#E5DCD1] text-[#42281D] border border-[#111410] shadow-[1px_1px_0px_0px_#111410] text-left group cursor-pointer"
                          title={`Explore Root "[${studyWordModal.root_details.morpheme?.toUpperCase()}]"`}
                        >
                          <span className="text-[8px] uppercase font-mono font-bold text-[#42281D]/70 block leading-none">
                            Root ({studyWordModal.root_details.language || 'Latin'})
                          </span>
                          <span className="font-mono font-black text-xs text-[#42281D] leading-tight flex items-center gap-0.5">
                            [{studyWordModal.root_details.morpheme?.toUpperCase()}] <span className="text-[8px] opacity-60 group-hover:opacity-100">↗</span>
                          </span>
                        </button>
                      )}
                      {studyWordModal.suffix && <span className="text-[#111410] font-black font-mono text-xs">+</span>}
                      {studyWordModal.suffix && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetWord = studyWordModal;
                            setStudyWordModal(null);
                            if (onOpenMorpheme) {
                              onOpenMorpheme({
                                type: 'suffix',
                                raw: targetWord.suffix,
                                word: targetWord,
                              });
                            }
                          }}
                          className="px-2 py-1 bg-white hover:bg-[#FAFBF8] text-[#111410] border border-[#111410] shadow-[1px_1px_0px_0px_#111410] text-left group cursor-pointer"
                          title={`Explore Suffix "${studyWordModal.suffix}"`}
                        >
                          <span className="text-[8px] uppercase font-mono font-bold text-[#62685E] block leading-none">Suffix</span>
                          <span className="font-mono font-black text-xs leading-tight flex items-center gap-0.5">
                            {studyWordModal.suffix} <span className="text-[8px] opacity-60 group-hover:opacity-100">↗</span>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
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
            Loading Root Graph...
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
