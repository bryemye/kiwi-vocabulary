/**
 * Learning Pathway & Domain Management Service
 * 
 * Empowers students and educators to define and explore vocabulary expertise
 * across four distinct domain taxonomies:
 * 1. "Thematic Semantic Domains" (🧠): Meaning-based cognitive clusters
 * 2. "Core Yield Tiers" (⚡): Strategic 80/20 SAT/ACT frequency tiers
 * 3. "Linguistic Heritage" (📜): Classical Latin, Greek, and Romance/Germanic traditions
 * 4. "Academic Disciplines" (🔬): Passage contexts: STEM, Humanities, Law & Social Sciences, Rhetoric
 */

export const STORAGE_KEY_PATHWAY = 'kiwi_learning_pathway';
export const PATHWAY_CHANGE_EVENT = 'kiwi_learning_pathway_changed';

export const PATHWAY_THEMATIC = 'thematic';
export const PATHWAY_YIELD = 'yield';
export const PATHWAY_ORIGIN = 'origin';
export const PATHWAY_ACADEMIC = 'academic';

export const DOMAIN_LENSES = [
  {
    id: PATHWAY_THEMATIC,
    name: 'Thematic Semantic',
    shortLabel: 'Thematic',
    icon: '🧠',
    description: 'Semantic networks grouped by human conceptual experience (Motion, Force, Position, Senses, Cognition, Law)',
    badgeClass: 'bg-[#EDF5E5] text-[#2F441E] border-[#7BB33B]',
  },
  {
    id: PATHWAY_YIELD,
    name: 'SAT/ACT Yield Tiers',
    shortLabel: 'Test Yield',
    icon: '⚡',
    description: 'Strategic frequency tiers prioritizing maximum 80/20 leverage on reading and writing passages',
    badgeClass: 'bg-[#FFFBEB] text-[#92400E] border-[#F59E0B]',
  },
  {
    id: PATHWAY_ORIGIN,
    name: 'Linguistic Heritage',
    shortLabel: 'Etymology',
    icon: '📜',
    description: 'Historical language origins: Latin participles, Greek scientific terms & cognate stems',
    badgeClass: 'bg-[#EFF6FF] text-[#1E40AF] border-[#3B82F6]',
  },
  {
    id: PATHWAY_ACADEMIC,
    name: 'Academic Disciplines',
    shortLabel: 'Disciplines',
    icon: '🔬',
    description: 'Interdisciplinary domain application across STEM, Humanities, Law/Social Sciences & Rhetoric',
    badgeClass: 'bg-[#F5F3FF] text-[#5B21B6] border-[#8B5CF6]',
  },
];

export const PATHWAYS = {
  [PATHWAY_THEMATIC]: DOMAIN_LENSES[0],
  [PATHWAY_YIELD]: DOMAIN_LENSES[1],
  [PATHWAY_ORIGIN]: DOMAIN_LENSES[2],
  [PATHWAY_ACADEMIC]: DOMAIN_LENSES[3],
};

export const THEMATIC_CLUSTER_DEFS = [
  {
    id: 'Motion & Travel',
    name: 'Motion & Travel',
    icon: '🏃',
    accentColor: '#10b981',
    description: 'Locomotion, velocity, flow, approach, departure, and spatial paths',
  },
  {
    id: 'Force & Transformation',
    name: 'Force & Transformation',
    icon: '💥',
    accentColor: '#f97316',
    description: 'Physical force, throwing, breaking, cutting, bending, making, and altering',
  },
  {
    id: 'Position & Holding',
    name: 'Position & Holding',
    icon: '⚓',
    accentColor: '#0d9488',
    description: 'Standing, sitting, leaning, clinging, binding, seizing, placing, and enclosing',
  },
  {
    id: 'Senses & Perception',
    name: 'Senses & Perception',
    icon: '👁️',
    accentColor: '#0ea5e9',
    description: 'Sight, hearing, touch, taste, smell, light, shadow, clarity, and vigilance',
  },
  {
    id: 'Communication',
    name: 'Communication',
    icon: '💬',
    accentColor: '#3b82f6',
    description: 'Voice, dialogue, declarations, writing, questioning, silence, and expression',
  },
  {
    id: 'Cognition',
    name: 'Cognition',
    icon: '🧠',
    accentColor: '#8b5cf6',
    description: 'Intellect, memory, belief, teaching, inquiry, logic, and mystery',
  },
  {
    id: 'Emotion',
    name: 'Emotion',
    icon: '❤️',
    accentColor: '#ec4899',
    description: 'Affect, passion, affinity, fear, grief, humor, patience, and temperament',
  },
  {
    id: 'Power & Conflict',
    name: 'Power & Conflict',
    icon: '⚔️',
    accentColor: '#ef4444',
    description: 'Contest, combat, conquest, governance, civic power, and decisive strength',
  },
  {
    id: 'Law & Morality',
    name: 'Law & Morality',
    icon: '⚖️',
    accentColor: '#f59e0b',
    description: 'Truth, justice, ethics, oaths, sanctity, guilt, virtue, and civic standing',
  },
  {
    id: 'Form & Nature',
    name: 'Form & Nature',
    icon: '🌱',
    accentColor: '#14b8a6',
    description: 'Physical substance, organic life, birth, death, sleep, elements, and texture',
  },
  {
    id: 'Quantity & Relation',
    name: 'Quantity & Relation',
    icon: '📐',
    accentColor: '#6366f1',
    description: 'Time, magnitude, equality, similarity, and spatial/prefix relationships',
  },
];

export const SAT_TIER_DEFS = [
  {
    id: 'Tier 1 High-Yield',
    name: 'Tier 1 High-Yield',
    badge: 'Tier 1 High-Yield',
    icon: '⚡',
    accentColor: '#7BB33B',
    bgColor: '#EDF5E5',
    textColor: '#2F441E',
    tagline: 'Essential 80/20 Test Foundation',
    description: 'The highest-frequency Latin & Greek morphemes appearing continuously across SAT and ACT reading & writing sections.',
  },
  {
    id: 'Tier 2 Multipliers',
    name: 'Tier 2 Multipliers',
    badge: 'Tier 2 Multipliers',
    icon: '🚀',
    accentColor: '#2563eb',
    bgColor: '#EFF6FF',
    textColor: '#1E40AF',
    tagline: 'Vocabulary Force Multipliers',
    description: 'High-leverage roots that expand technical, scientific, paired, and literary vocabulary across academic passages.',
  },
  {
    id: 'Tier 3 Advanced',
    name: 'Tier 3 Advanced',
    badge: 'Tier 3 Advanced',
    icon: '🎯',
    accentColor: '#7c3aed',
    bgColor: '#F5F3FF',
    textColor: '#5B21B6',
    tagline: '99th Percentile Distinction',
    description: 'Nuanced, high-difficulty morphemes frequently distinguishing top-percentile reading comprehension and rhetoric.',
  },
];

export const ORIGIN_DOMAIN_DEFS = [
  {
    id: 'Latin',
    name: 'Latin Tradition',
    badge: 'Latin Roots',
    icon: '📜',
    accentColor: '#42281D',
    bgColor: '#FAFBF8',
    textColor: '#42281D',
    description: 'Classical Roman verbal roots, supines, and legal/civic morphemes forming ~60% of elevated English lexicon.',
  },
  {
    id: 'Greek',
    name: 'Greek Tradition',
    badge: 'Greek Roots',
    icon: '🏛️',
    accentColor: '#2563eb',
    bgColor: '#EFF6FF',
    textColor: '#1E40AF',
    description: 'Hellenic scientific, philosophical, mathematical, and medical compounding elements.',
  },
  {
    id: 'Other',
    name: 'Romance & Germanic Cognates',
    badge: 'Cognates & Stems',
    icon: '🌍',
    accentColor: '#059669',
    bgColor: '#ECFDF5',
    textColor: '#065F46',
    description: 'Old French, Anglo-Saxon, Sanskrit, and cross-linguistic vocabulary roots in modern testing.',
  },
];

export const ACADEMIC_DOMAIN_DEFS = [
  {
    id: 'STEM',
    name: 'STEM & Natural Sciences',
    badge: 'STEM & Natural Sciences',
    icon: '🔬',
    accentColor: '#0284c7',
    bgColor: '#F0F9FF',
    textColor: '#075985',
    description: 'Roots underpinning biology, physics, perception, earth systems, physical transformations, and quantitative relationships.',
    clusters: ['Form & Nature', 'Quantity & Relation', 'Motion & Travel', 'Force & Transformation', 'Position & Holding', 'Senses & Perception'],
  },
  {
    id: 'Humanities',
    name: 'Humanities, Arts & Literature',
    badge: 'Humanities & Arts',
    icon: '🎨',
    accentColor: '#db2777',
    bgColor: '#FDF2F8',
    textColor: '#9D174D',
    description: 'Morphemes expressive of human emotion, aesthetic appraisal, vocalization, narrative, and poetic devices.',
    clusters: ['Emotion', 'Communication'],
  },
  {
    id: 'SocialSciences',
    name: 'Social Sciences, Law & Governance',
    badge: 'Law & Governance',
    icon: '⚖️',
    accentColor: '#d97706',
    bgColor: '#FFFBEB',
    textColor: '#92400E',
    description: 'Foundations of civil jurisprudence, political structures, ethical obligations, and societal conflict.',
    clusters: ['Law & Morality', 'Power & Conflict'],
  },
  {
    id: 'Rhetoric',
    name: 'Rhetoric, Logic & Cognition',
    badge: 'Rhetoric & Logic',
    icon: '🧠',
    accentColor: '#7c3aed',
    bgColor: '#F5F3FF',
    textColor: '#5B21B6',
    description: 'Morphemes essential to critical reasoning, philosophical argumentation, epistemological inquiry, and analytical synthesis.',
    clusters: ['Cognition'],
  },
];

/**
 * Retrieve current learning pathway / domain lens from localStorage
 */
export function getStoredPathway() {
  if (typeof window === 'undefined') return PATHWAY_THEMATIC;
  try {
    const val = localStorage.getItem(STORAGE_KEY_PATHWAY);
    if (DOMAIN_LENSES.some((d) => d.id === val)) {
      return val;
    }
    return PATHWAY_THEMATIC;
  } catch (err) {
    console.warn('Failed to read kiwi_learning_pathway from localStorage:', err);
    return PATHWAY_THEMATIC;
  }
}

/**
 * Persist learning pathway preference to localStorage and broadcast change event
 */
export function setStoredPathway(pathway) {
  if (typeof window === 'undefined') return;
  const safePathway = DOMAIN_LENSES.some((d) => d.id === pathway)
    ? pathway
    : PATHWAY_THEMATIC;
  try {
    localStorage.setItem(STORAGE_KEY_PATHWAY, safePathway);
    window.dispatchEvent(
      new CustomEvent(PATHWAY_CHANGE_EVENT, { detail: { pathway: safePathway } })
    );
  } catch (err) {
    console.warn('Failed to save kiwi_learning_pathway to localStorage:', err);
  }
}

export function getClusterMeta(clusterName) {
  if (!clusterName) {
    return {
      name: 'General',
      icon: '🌿',
      accentColor: '#7BB33B',
      description: 'Foundational root families',
    };
  }
  const match = THEMATIC_CLUSTER_DEFS.find(
    (c) => c.name.toLowerCase() === clusterName.toLowerCase()
  );
  if (match) return match;
  return {
    name: clusterName,
    icon: '🌿',
    accentColor: '#7BB33B',
    description: `${clusterName} morpheme cluster`,
  };
}

export function getTierMeta(tierName) {
  if (!tierName) {
    return SAT_TIER_DEFS[0];
  }
  const match = SAT_TIER_DEFS.find(
    (t) => t.name.toLowerCase() === tierName.toLowerCase()
  );
  if (match) return match;
  if (tierName.includes('1')) return SAT_TIER_DEFS[0];
  if (tierName.includes('2')) return SAT_TIER_DEFS[1];
  if (tierName.includes('3')) return SAT_TIER_DEFS[2];
  return SAT_TIER_DEFS[0];
}

function parseTimestampMs(isoString) {
  if (!isoString) return 0;
  const ms = Date.parse(isoString);
  return Number.isFinite(ms) ? ms : 0;
}

export function hasBeenWorkedOn(root) {
  if (!root) return false;
  return Boolean(root.last_worked_at) || (root.attempts || 0) > 0 || (root.mastered_words || 0) > 0;
}

function compareByMostRecent(a, b) {
  const diff = parseTimestampMs(b?.last_worked_at) - parseTimestampMs(a?.last_worked_at);
  if (diff !== 0) return diff;
  const attemptDiff = (b?.attempts || 0) - (a?.attempts || 0);
  if (attemptDiff !== 0) return attemptDiff;
  return (a?.morpheme || '').localeCompare(b?.morpheme || '');
}

/**
 * Comprehensive grouping helper supporting all 4 domain lenses with filtering and sorting
 */
export function groupRootsByDomainLens(
  roots = [],
  lens = PATHWAY_THEMATIC,
  options = {}
) {
  const {
    maturityFilter = 'ALL', // 'ALL' | 'RECENTLY_WORKED' | 'MASTERED' | 'DEVELOPING' | 'FOCUS'
    searchQuery = '',
    sortBy = 'DEFAULT',     // 'DEFAULT' | 'RECENT_DESC' | 'MASTERY_DESC' | 'MASTERY_ASC' | 'ALPHA' | 'WORDS_DESC'
  } = options;

  const effectiveSort =
    sortBy === 'DEFAULT' && maturityFilter === 'RECENTLY_WORKED'
      ? 'RECENT_DESC'
      : sortBy;

  // 1. Group definitions based on lens
  let domainDefs = [];

  if (lens === PATHWAY_YIELD) {
    domainDefs = SAT_TIER_DEFS.map((tier) => ({
      ...tier,
      filterFn: (r) => {
        const rt = (r.sat_tier || '').toLowerCase();
        return (
          rt === tier.name.toLowerCase() ||
          (tier.name.includes('1') && rt.includes('1')) ||
          (tier.name.includes('2') && rt.includes('2')) ||
          (tier.name.includes('3') && rt.includes('3'))
        );
      },
    }));
  } else if (lens === PATHWAY_ORIGIN) {
    domainDefs = ORIGIN_DOMAIN_DEFS.map((orig) => ({
      ...orig,
      filterFn: (r) => {
        const lang = (r.language || '').toLowerCase();
        if (orig.id === 'Latin') {
          return lang.startsWith('latin');
        }
        if (orig.id === 'Greek') {
          return lang.startsWith('greek');
        }
        return !lang.startsWith('latin') && !lang.startsWith('greek');
      },
    }));
  } else if (lens === PATHWAY_ACADEMIC) {
    domainDefs = ACADEMIC_DOMAIN_DEFS.map((acad) => ({
      ...acad,
      filterFn: (r) => {
        const cluster = r.thematic_cluster || 'Motion & Travel';
        return acad.clusters.includes(cluster);
      },
    }));
  } else {
    // Default: Thematic Clusters
    domainDefs = THEMATIC_CLUSTER_DEFS.map((cluster) => ({
      ...cluster,
      filterFn: (r) =>
        (r.thematic_cluster || 'Motion & Travel').toLowerCase() ===
        cluster.name.toLowerCase(),
    }));
  }

  // 2. Build grouped data with aggregate mastery statistics
  const cleanQuery = searchQuery.trim().toLowerCase();

  const groups = domainDefs.map((domain) => {
    // Filter roots belonging to this domain
    let matchedRoots = roots.filter(domain.filterFn);

    // Apply Search Query if present
    if (cleanQuery) {
      matchedRoots = matchedRoots.filter((r) => {
        const m = (r.morpheme || '').toLowerCase();
        const cm = (r.core_meaning || '').toLowerCase();
        const mn = (r.mnemonic || '').toLowerCase();
        const wordsMatch = (r.words || []).some((w) =>
          (typeof w === 'string' ? w : w.word || '').toLowerCase().includes(cleanQuery)
        );
        return m.includes(cleanQuery) || cm.includes(cleanQuery) || mn.includes(cleanQuery) || wordsMatch;
      });
    }

    // Apply Maturity / Activity Filter
    if (maturityFilter === 'RECENTLY_WORKED') {
      matchedRoots = matchedRoots.filter(hasBeenWorkedOn);
    } else if (maturityFilter === 'MASTERED') {
      // 80% to 100% circles filled
      matchedRoots = matchedRoots.filter((r) => (r.mastery_percentage || 0) >= 80);
    } else if (maturityFilter === 'DEVELOPING') {
      // 30% to 79% filled
      matchedRoots = matchedRoots.filter(
        (r) => (r.mastery_percentage || 0) >= 30 && (r.mastery_percentage || 0) < 80
      );
    } else if (maturityFilter === 'FOCUS') {
      // < 30% (mostly outlined circles)
      matchedRoots = matchedRoots.filter((r) => (r.mastery_percentage || 0) < 30);
    }

    // Apply Sorting
    if (effectiveSort === 'RECENT_DESC') {
      matchedRoots.sort(compareByMostRecent);
    } else if (effectiveSort === 'MASTERY_DESC') {
      matchedRoots.sort((a, b) => (b.mastery_percentage || 0) - (a.mastery_percentage || 0));
    } else if (effectiveSort === 'MASTERY_ASC') {
      matchedRoots.sort((a, b) => (a.mastery_percentage || 0) - (b.mastery_percentage || 0));
    } else if (effectiveSort === 'ALPHA') {
      matchedRoots.sort((a, b) => (a.morpheme || '').localeCompare(b.morpheme || ''));
    } else if (effectiveSort === 'WORDS_DESC') {
      matchedRoots.sort((a, b) => (b.total_words || 0) - (a.total_words || 0));
    }

    // Aggregate statistics
    const totalWords = matchedRoots.reduce((acc, r) => acc + (r.total_words || 0), 0);
    const masteredWords = matchedRoots.reduce((acc, r) => acc + (r.mastered_words || 0), 0);
    const domainMasteryPercentage =
      totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;
    const fullyMasteredRootsCount = matchedRoots.filter(
      (r) => r.mastered_words === r.total_words && r.total_words > 0
    ).length;

    let lastWorkedAt = null;
    let lastWorkedMs = 0;
    for (const r of matchedRoots) {
      const ms = parseTimestampMs(r.last_worked_at);
      if (ms > lastWorkedMs) {
        lastWorkedMs = ms;
        lastWorkedAt = r.last_worked_at;
      }
    }

    return {
      id: domain.id || domain.name,
      name: domain.name,
      icon: domain.icon,
      description: domain.description,
      tagline: domain.tagline || `${matchedRoots.length} Root Families`,
      accentColor: domain.accentColor || '#7BB33B',
      bgColor: domain.bgColor || '#FAFBF8',
      textColor: domain.textColor || '#111410',
      roots: matchedRoots,
      totalRoots: matchedRoots.length,
      fullyMasteredRootsCount,
      totalWords,
      masteredWords,
      masteryPercentage: domainMasteryPercentage,
      lastWorkedAt,
    };
  });

  if (effectiveSort === 'RECENT_DESC') {
    groups.sort((a, b) => {
      const diff = parseTimestampMs(b.lastWorkedAt) - parseTimestampMs(a.lastWorkedAt);
      if (diff !== 0) return diff;
      return b.totalRoots - a.totalRoots;
    });
  }

  return groups;
}

/**
 * Backwards compatibility wrapper for existing groupRootsByPathway callers
 */
export function groupRootsByPathway(roots = [], pathway = PATHWAY_THEMATIC) {
  return groupRootsByDomainLens(roots, pathway);
}

export const MAX_WHEEL_PARTITIONS = 12;

function getTierRank(satTier = '') {
  const lower = String(satTier).toLowerCase();
  if (lower.includes('1')) return 1;
  if (lower.includes('2')) return 2;
  if (lower.includes('3')) return 3;
  return 4;
}

function matchesTierFilter(root, tierFilter) {
  if (!tierFilter || tierFilter === 'ALL') return true;
  const rank = getTierRank(root?.sat_tier);
  if (tierFilter === 'TIER_1') return rank === 1;
  if (tierFilter === 'TIER_2') return rank === 2;
  if (tierFilter === 'TIER_3') return rank === 3;
  return true;
}

function matchesThemeFilter(root, themeFilter) {
  if (!themeFilter || themeFilter === 'ALL') return true;
  return (root?.thematic_cluster || 'Motion & Travel').toLowerCase() === themeFilter.toLowerCase();
}

function matchesOriginFilter(root, originFilter) {
  if (!originFilter || originFilter === 'ALL') return true;
  const lang = (root?.language || '').toLowerCase();
  if (originFilter === 'Latin') return lang.startsWith('latin');
  if (originFilter === 'Greek') return lang.startsWith('greek');
  if (originFilter === 'Other') return !lang.startsWith('latin') && !lang.startsWith('greek');
  return true;
}

function findMatchingWords(root, cleanQuery) {
  if (!cleanQuery) return [];
  return (root?.words || [])
    .map((w) => (typeof w === 'string' ? w : w?.word || ''))
    .filter((wordText) => wordText.toLowerCase().includes(cleanQuery));
}

function matchesSearchQuery(root, cleanQuery) {
  if (!cleanQuery) return true;
  const m = (root?.morpheme || '').toLowerCase();
  const cm = (root?.core_meaning || '').toLowerCase();
  const mn = (root?.mnemonic || '').toLowerCase();
  if (m.includes(cleanQuery) || cm.includes(cleanQuery) || mn.includes(cleanQuery)) {
    return true;
  }
  return findMatchingWords(root, cleanQuery).length > 0;
}

function matchesMaturityFilter(root, maturityFilter) {
  if (!maturityFilter || maturityFilter === 'ALL') return true;
  if (maturityFilter === 'RECENTLY_WORKED') return hasBeenWorkedOn(root);
  const pct = root?.mastery_percentage || 0;
  if (maturityFilter === 'MASTERED') return pct >= 80;
  if (maturityFilter === 'DEVELOPING') return pct >= 30 && pct < 80;
  if (maturityFilter === 'FOCUS') return pct < 30;
  return true;
}

function sortRootsForSampling(roots = []) {
  return [...roots].sort((a, b) => {
    // Highest test yield (Tier 1 -> 2 -> 3), then lowest mastery so priority roots surface first
    const tierDiff = getTierRank(a.sat_tier) - getTierRank(b.sat_tier);
    if (tierDiff !== 0) return tierDiff;
    const masteryDiff = (a.mastery_percentage || 0) - (b.mastery_percentage || 0);
    if (masteryDiff !== 0) return masteryDiff;
    return (a.morpheme || '').localeCompare(b.morpheme || '');
  });
}

function takeSampleSlice(roots = [], sampleLimit = 'ALL', sampleOffset = 0) {
  const sorted = sortRootsForSampling(roots);
  const total = sorted.length;
  if (total === 0) {
    return { active: [], latent: [], total: 0 };
  }
  if (sampleLimit === 'ALL' || sampleLimit >= total) {
    return { active: sorted, latent: [], total };
  }
  const safeOffset = ((sampleOffset % total) + total) % total;
  const rotated = [...sorted.slice(safeOffset), ...sorted.slice(0, safeOffset)];
  return {
    active: rotated.slice(0, sampleLimit),
    latent: rotated.slice(sampleLimit),
    total,
  };
}

function computeAggregateFromRoots(roots = []) {
  const totalWords = roots.reduce((acc, r) => acc + (r.total_words || 0), 0);
  const masteredWords = roots.reduce((acc, r) => acc + (r.mastered_words || 0), 0);
  const pct = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;
  return { totalWords, masteredWords, pct };
}

function buildRootOrbs(roots = [], accentColor = '#7BB33B', overflowPage = 0, cleanQuery = '') {
  const mapRootNode = (r) => ({
    id: `root:${r.id}`,
    kind: 'ROOT',
    rootId: r.id,
    label: r.morpheme.toUpperCase(),
    subtitle: r.core_meaning,
    tier: r.sat_tier,
    language: r.language,
    cluster: r.thematic_cluster,
    percentage: Math.round(r.mastery_percentage || 0),
    masteredWords: r.mastered_words || 0,
    totalWords: r.total_words || 0,
    accentColor: accentColor || getClusterMeta(r.thematic_cluster).accentColor || '#7BB33B',
    matchedWords: cleanQuery ? findMatchingWords(r, cleanQuery) : [],
    root: r,
  });

  if (roots.length <= MAX_WHEEL_PARTITIONS) {
    return {
      nodes: roots.map(mapRootNode),
      hasOverflow: false,
      totalPages: 1,
      currentPage: 0,
    };
  }

  // Cap strictly at 12: 11 individual root orbs + 12th "More (+N)" pod (or paginated 11-item window)
  const pageSize = MAX_WHEEL_PARTITIONS - 1;
  const totalPages = Math.ceil(roots.length / pageSize);
  const safePage = ((overflowPage % totalPages) + totalPages) % totalPages;
  const start = safePage * pageSize;
  const pageRoots = roots.slice(start, start + pageSize);
  const remainingCount = roots.length - pageRoots.length;
  const remainingRoots = [...roots.slice(0, start), ...roots.slice(start + pageSize)];
  const remAgg = computeAggregateFromRoots(remainingRoots);

  const nodes = pageRoots.map(mapRootNode);

  nodes.push({
    id: `overflow:page:${safePage + 1}`,
    kind: 'OVERFLOW',
    nextPage: (safePage + 1) % totalPages,
    label: `+${remainingCount} MORE`,
    subtitle: `Cycle next ${Math.min(pageSize, remainingCount)} roots (${safePage + 1}/${totalPages})`,
    percentage: remAgg.pct,
    masteredWords: remAgg.masteredWords,
    totalWords: remAgg.totalWords,
    totalRoots: remainingCount,
    accentColor: '#C29B78',
  });

  return {
    nodes,
    hasOverflow: true,
    totalPages,
    currentPage: safePage,
  };
}

/**
 * Build a progressive-disclosure Harmonic Wheel model guaranteed to have <= 12 partitions.
 * Supports simultaneous multi-axis filtering (Theme × Tier × Origin × Maturity × Search),
 * sample-size scooping, and drill-down.
 */
export function buildHarmonicWheelModel(allRoots = [], options = {}) {
  const {
    primaryLens = PATHWAY_THEMATIC,
    tierFilter = 'ALL',       // 'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'
    themeFilter = 'ALL',      // 'ALL' | thematic cluster name
    originFilter = 'ALL',     // 'ALL' | 'Latin' | 'Greek' | 'Other'
    maturityFilter = 'ALL',   // 'ALL' | 'FOCUS' | 'DEVELOPING' | 'MASTERED' | 'RECENTLY_WORKED'
    searchQuery = '',
    drillDomainId = null,
    drillSubId = null,        // Tier id (when drilling Theme -> Tier) or Theme id (when drilling Yield -> Theme)
    sampleLimit = 5,          // 1..12 or 'ALL'
    sampleOffset = 0,
    overflowPage = 0,
  } = options;

  const cleanQuery = (searchQuery || '').trim().toLowerCase();

  // Apply all orthogonal filters simultaneously
  const filteredRoots = allRoots.filter(
    (r) =>
      matchesTierFilter(r, tierFilter) &&
      matchesThemeFilter(r, themeFilter) &&
      matchesOriginFilter(r, originFilter) &&
      matchesMaturityFilter(r, maturityFilter) &&
      matchesSearchQuery(r, cleanQuery)
  );

  // Direct Search Mode: surface matching root orbs immediately on the wheel
  if (cleanQuery) {
    const sortedMatches = sortRootsForSampling(filteredRoots);
    const agg = computeAggregateFromRoots(sortedMatches);
    const { nodes, hasOverflow, totalPages, currentPage } = buildRootOrbs(
      sortedMatches,
      null,
      overflowPage,
      cleanQuery
    );

    return {
      depth: 0,
      isSearchMode: true,
      searchQuery: searchQuery.trim(),
      title: `Matches for “${searchQuery.trim()}”`,
      subtitle:
        sortedMatches.length === 0
          ? 'No roots or words match the current search and filters'
          : `${sortedMatches.length} matching ${sortedMatches.length === 1 ? 'root' : 'roots'} across your active filters`,
      centerPct: agg.pct,
      centerLabel: `${sortedMatches.length} FOUND`,
      activeCount: sortedMatches.length,
      latentCount: 0,
      totalPoolCount: sortedMatches.length,
      hasOverflow,
      totalPages,
      currentPage,
      nodes,
      breadcrumbs: [{ depth: 0, label: `Search: “${searchQuery.trim()}”` }],
    };
  }

  // Build base groups for the primary lens
  const rawGroups = groupRootsByDomainLens(filteredRoots, primaryLens);
  const hasActiveFilter =
    tierFilter !== 'ALL' ||
    themeFilter !== 'ALL' ||
    originFilter !== 'ALL' ||
    maturityFilter !== 'ALL';

  // Smart shortcut: if user pinned a single domain on the matching primary lens, auto-step into it
  let effectiveDrillDomainId = drillDomainId;
  if (!effectiveDrillDomainId) {
    if (primaryLens === PATHWAY_THEMATIC && themeFilter !== 'ALL') {
      effectiveDrillDomainId = themeFilter;
    } else if (primaryLens === PATHWAY_ORIGIN && originFilter !== 'ALL') {
      effectiveDrillDomainId = originFilter;
    } else if (primaryLens === PATHWAY_YIELD && tierFilter !== 'ALL') {
      const tierMap = {
        TIER_1: 'Tier 1 High-Yield',
        TIER_2: 'Tier 2 Multipliers',
        TIER_3: 'Tier 3 Advanced',
      };
      effectiveDrillDomainId = tierMap[tierFilter] || null;
    }
  }

  // Depth 0: Domain Overview (3 to 11 orbs — always <= 12)
  if (!effectiveDrillDomainId) {
    let totalLatentCount = 0;
    let totalActiveCount = 0;
    const sampledAllRoots = [];

    const nodes = rawGroups
      .filter((g) => g.roots.length > 0 || !hasActiveFilter)
      .slice(0, MAX_WHEEL_PARTITIONS)
      .map((group) => {
        const sample = takeSampleSlice(group.roots, sampleLimit, sampleOffset);
        totalLatentCount += sample.latent.length;
        totalActiveCount += sample.active.length;
        sampledAllRoots.push(...sample.active);

        const agg = computeAggregateFromRoots(sample.active);
        return {
          id: `domain:${group.id}`,
          kind: 'DOMAIN',
          domainId: group.id,
          label: group.name,
          shortLabel: group.name.split('&')[0].trim(),
          icon: group.icon,
          subtitle: group.description,
          percentage: agg.pct,
          fullPercentage: group.masteryPercentage,
          masteredWords: agg.masteredWords,
          totalWords: agg.totalWords,
          activeRootsCount: sample.active.length,
          totalRootsCount: group.roots.length,
          latentRootsCount: sample.latent.length,
          accentColor: group.accentColor || '#7BB33B',
          isEmpty: group.roots.length === 0,
          sampledRoots: sample.active,
        };
      });

    const centerAgg = computeAggregateFromRoots(
      sampleLimit === 'ALL' ? filteredRoots : sampledAllRoots
    );

    return {
      depth: 0,
      title: 'Lexicon Constellation',
      subtitle:
        sampleLimit === 'ALL'
          ? `${filteredRoots.length} roots across ${nodes.filter((n) => !n.isEmpty).length} clusters`
          : `Sampling up to ${sampleLimit} per cluster (${totalActiveCount} drawn, ${totalLatentCount} resting)`,
      centerPct: centerAgg.pct,
      centerLabel: sampleLimit === 'ALL' ? 'OVERALL' : 'SAMPLED',
      activeCount: totalActiveCount,
      latentCount: totalLatentCount,
      totalPoolCount: filteredRoots.length,
      nodes,
      breadcrumbs: [{ depth: 0, label: 'All Clusters' }],
    };
  }

  // Depth 1+: A domain is selected
  const selectedDomain = rawGroups.find((g) => g.id === effectiveDrillDomainId) || rawGroups[0];
  if (!selectedDomain) {
    return buildHarmonicWheelModel(allRoots, { ...options, drillDomainId: null, drillSubId: null });
  }

  const domainRoots = selectedDomain.roots;

  // If primaryLens === 'yield' (Tier first) and no sub-theme is selected yet, partition by Thematic Clusters (<= 11)
  if (primaryLens === PATHWAY_YIELD && !drillSubId && domainRoots.length > MAX_WHEEL_PARTITIONS && sampleLimit === 'ALL') {
    const themeGroups = groupRootsByDomainLens(domainRoots, PATHWAY_THEMATIC).filter((g) => g.roots.length > 0);
    const nodes = themeGroups.slice(0, MAX_WHEEL_PARTITIONS).map((tg) => ({
      id: `sub:${tg.id}`,
      kind: 'SUB_DOMAIN',
      subId: tg.id,
      label: tg.name,
      shortLabel: tg.name.split('&')[0].trim(),
      icon: tg.icon,
      subtitle: tg.description,
      percentage: tg.masteryPercentage,
      masteredWords: tg.masteredWords,
      totalWords: tg.totalWords,
      activeRootsCount: tg.roots.length,
      totalRootsCount: tg.roots.length,
      latentRootsCount: 0,
      accentColor: tg.accentColor || selectedDomain.accentColor,
    }));
    return {
      depth: 1,
      title: selectedDomain.name,
      subtitle: `${domainRoots.length} roots organized by theme`,
      centerPct: selectedDomain.masteryPercentage,
      centerLabel: 'CLUSTER',
      activeCount: domainRoots.length,
      latentCount: 0,
      totalPoolCount: domainRoots.length,
      selectedDomain,
      nodes,
      breadcrumbs: [
        { depth: 0, label: 'All Tiers' },
        { depth: 1, label: selectedDomain.name },
      ],
    };
  }

  // If a non-yield domain has >12 roots, user wants ALL, and no Tier filter/sub-drill is active -> partition by SAT Tiers (3 orbs)
  if (
    primaryLens !== PATHWAY_YIELD &&
    !drillSubId &&
    tierFilter === 'ALL' &&
    sampleLimit === 'ALL' &&
    domainRoots.length > MAX_WHEEL_PARTITIONS
  ) {
    const tierGroups = groupRootsByDomainLens(domainRoots, PATHWAY_YIELD).filter((g) => g.roots.length > 0);
    const nodes = tierGroups.map((tg) => ({
      id: `sub:${tg.id}`,
      kind: 'SUB_DOMAIN',
      subId: tg.id,
      label: tg.name,
      shortLabel: tg.name.replace('High-Yield', '').replace('Multipliers', '').replace('Advanced', '').trim(),
      icon: tg.icon,
      subtitle: `${tg.roots.length} roots in ${selectedDomain.name}`,
      percentage: tg.masteryPercentage,
      masteredWords: tg.masteredWords,
      totalWords: tg.totalWords,
      activeRootsCount: tg.roots.length,
      totalRootsCount: tg.roots.length,
      latentRootsCount: 0,
      accentColor: tg.accentColor || '#7BB33B',
    }));

    return {
      depth: 1,
      title: selectedDomain.name,
      subtitle: `${domainRoots.length} roots grouped by test relevance`,
      centerPct: selectedDomain.masteryPercentage,
      centerLabel: 'BY TIER',
      activeCount: domainRoots.length,
      latentCount: 0,
      totalPoolCount: domainRoots.length,
      selectedDomain,
      nodes,
      breadcrumbs: [
        { depth: 0, label: 'All Clusters' },
        { depth: 1, label: selectedDomain.name },
      ],
    };
  }

  // Determine the final root pool (either direct domainRoots or filtered by drillSubId)
  let targetRoots = domainRoots;
  let subLabel = null;
  let subAccent = selectedDomain.accentColor || '#7BB33B';

  if (drillSubId) {
    if (primaryLens === PATHWAY_YIELD) {
      const matchTheme = groupRootsByDomainLens(domainRoots, PATHWAY_THEMATIC).find((g) => g.id === drillSubId);
      if (matchTheme) {
        targetRoots = matchTheme.roots;
        subLabel = matchTheme.name;
        subAccent = matchTheme.accentColor || subAccent;
      }
    } else {
      const matchTier = groupRootsByDomainLens(domainRoots, PATHWAY_YIELD).find((g) => g.id === drillSubId);
      if (matchTier) {
        targetRoots = matchTier.roots;
        subLabel = matchTier.name;
        subAccent = matchTier.accentColor || subAccent;
      }
    }
  }

  const sample = takeSampleSlice(targetRoots, sampleLimit, sampleOffset);
  const agg = computeAggregateFromRoots(sample.active);
  const { nodes, hasOverflow, totalPages, currentPage } = buildRootOrbs(
    sample.active,
    subAccent,
    overflowPage
  );

  const breadcrumbs = [
    { depth: 0, label: primaryLens === PATHWAY_YIELD ? 'All Tiers' : 'All Clusters' },
    { depth: 1, label: selectedDomain.name },
  ];
  if (subLabel) {
    breadcrumbs.push({ depth: 2, label: subLabel });
  }

  return {
    depth: subLabel ? 2 : 1,
    title: subLabel ? `${selectedDomain.name} · ${subLabel}` : selectedDomain.name,
    subtitle:
      sample.latent.length > 0
        ? `${sample.active.length} drawn into focus · ${sample.latent.length} resting in core`
        : `${sample.active.length} ${sample.active.length === 1 ? 'root' : 'roots'} in focus`,
    centerPct: agg.pct,
    centerLabel: sample.latent.length > 0 ? 'DRAWN' : 'MASTERY',
    activeCount: sample.active.length,
    latentCount: sample.latent.length,
    totalPoolCount: sample.total,
    selectedDomain,
    subLabel,
    hasOverflow,
    totalPages,
    currentPage,
    nodes,
    breadcrumbs,
  };
}
