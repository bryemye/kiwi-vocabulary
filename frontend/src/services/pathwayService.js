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
    description: 'Semantic networks grouped by human conceptual experience (Cognition, Movement, Law, Emotion)',
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
    id: 'Movement',
    name: 'Movement',
    icon: '🏃',
    accentColor: '#10b981',
    description: 'Kinetic verbs, spatial trajectories, propulsion, and bodily motion',
  },
  {
    id: 'Communication',
    name: 'Communication',
    icon: '💬',
    accentColor: '#3b82f6',
    description: 'Voice, dialogue, declarations, sound, and linguistic expression',
  },
  {
    id: 'Cognition',
    name: 'Cognition',
    icon: '🧠',
    accentColor: '#8b5cf6',
    description: 'Intellect, perception, memory, inquiry, and critical judgment',
  },
  {
    id: 'Emotion',
    name: 'Emotion',
    icon: '❤️',
    accentColor: '#ec4899',
    description: 'Affect, passion, affinity, fear, empathy, and temperament',
  },
  {
    id: 'Power & Conflict',
    name: 'Power & Conflict',
    icon: '⚔️',
    accentColor: '#ef4444',
    description: 'Contest, combat, conquest, governance, and decisive resistance',
  },
  {
    id: 'Law & Morality',
    name: 'Law & Morality',
    icon: '⚖️',
    accentColor: '#f59e0b',
    description: 'Truth, justice, ethics, sanctity, civic rectitude, and blame',
  },
  {
    id: 'Form & Nature',
    name: 'Form & Nature',
    icon: '🌱',
    accentColor: '#14b8a6',
    description: 'Physical substance, organic life, illumination, transformation, and structural changes',
  },
  {
    id: 'Quantity & Relation',
    name: 'Quantity & Relation',
    icon: '📐',
    accentColor: '#6366f1',
    description: 'Time, magnitude, spatial proximity, hierarchy, and mathematical order',
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
    description: 'Roots underpinning biology, physics, earth systems, organic transformations, and quantitative relationships.',
    clusters: ['Form & Nature', 'Quantity & Relation', 'Movement'],
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

/**
 * Comprehensive grouping helper supporting all 4 domain lenses with filtering and sorting
 */
export function groupRootsByDomainLens(
  roots = [],
  lens = PATHWAY_THEMATIC,
  options = {}
) {
  const {
    maturityFilter = 'ALL', // 'ALL' | 'MASTERED' | 'DEVELOPING' | 'FOCUS'
    searchQuery = '',
    sortBy = 'DEFAULT',     // 'DEFAULT' | 'MASTERY_DESC' | 'MASTERY_ASC' | 'ALPHA' | 'WORDS_DESC'
  } = options;

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
        const cluster = r.thematic_cluster || 'Movement';
        return acad.clusters.includes(cluster);
      },
    }));
  } else {
    // Default: Thematic Clusters
    domainDefs = THEMATIC_CLUSTER_DEFS.map((cluster) => ({
      ...cluster,
      filterFn: (r) =>
        (r.thematic_cluster || 'Movement').toLowerCase() ===
        cluster.name.toLowerCase(),
    }));
  }

  // 2. Build grouped data with aggregate mastery statistics
  const cleanQuery = searchQuery.trim().toLowerCase();

  return domainDefs.map((domain) => {
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

    // Apply Maturity Filter (Outlined vs Filled Circles)
    if (maturityFilter === 'MASTERED') {
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
    if (sortBy === 'MASTERY_DESC') {
      matchedRoots.sort((a, b) => (b.mastery_percentage || 0) - (a.mastery_percentage || 0));
    } else if (sortBy === 'MASTERY_ASC') {
      matchedRoots.sort((a, b) => (a.mastery_percentage || 0) - (b.mastery_percentage || 0));
    } else if (sortBy === 'ALPHA') {
      matchedRoots.sort((a, b) => (a.morpheme || '').localeCompare(b.morpheme || ''));
    } else if (sortBy === 'WORDS_DESC') {
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
    };
  });
}

/**
 * Backwards compatibility wrapper for existing groupRootsByPathway callers
 */
export function groupRootsByPathway(roots = [], pathway = PATHWAY_THEMATIC) {
  return groupRootsByDomainLens(roots, pathway);
}
