/**
 * Learning Pathway Management & Persistence Service
 * 
 * Empowers students with dual learning pathways across Kiwi Vocabulary:
 * 1. "Thematic Pathways" (🧠): Groups root families into semantic clusters (Movement, Communication, Cognition, Emotion, etc.)
 * 2. "Core Yield" (⚡): Organizes roots into SAT/ACT frequency tiers (Tier 1 High-Yield, Tier 2 Multipliers, Tier 3 Advanced)
 */

export const STORAGE_KEY_PATHWAY = 'kiwi_learning_pathway';
export const PATHWAY_CHANGE_EVENT = 'kiwi_learning_pathway_changed';

export const PATHWAY_THEMATIC = 'thematic';
export const PATHWAY_YIELD = 'yield';

export const PATHWAYS = {
  [PATHWAY_THEMATIC]: {
    id: PATHWAY_THEMATIC,
    label: 'Thematic Pathways',
    shortLabel: 'Thematic',
    icon: '🧠',
    subtext: 'Semantic Network',
    description: 'Interconnected semantic clusters building cognitive narrative networks',
    badgeClass: 'bg-[#EDF5E5] text-[#2F441E] border-[#7BB33B]',
  },
  [PATHWAY_YIELD]: {
    id: PATHWAY_YIELD,
    label: 'Core Yield',
    shortLabel: 'Core Yield',
    icon: '⚡',
    subtext: '80/20 Test Prep',
    description: 'High-leverage 80/20 SAT/ACT frequency tiers for direct test-prep optimization',
    badgeClass: 'bg-[#FFFBEB] text-[#92400E] border-[#F59E0B]',
  },
};

export const THEMATIC_CLUSTER_DEFS = [
  {
    name: 'Movement',
    icon: '🏃',
    accentColor: '#10b981',
    description: 'Kinetic verbs, spatial trajectories, propulsion, and bodily motion',
  },
  {
    name: 'Communication',
    icon: '💬',
    accentColor: '#3b82f6',
    description: 'Voice, dialogue, declarations, sound, and linguistic expression',
  },
  {
    name: 'Cognition',
    icon: '🧠',
    accentColor: '#8b5cf6',
    description: 'Intellect, perception, memory, inquiry, and critical judgment',
  },
  {
    name: 'Emotion',
    icon: '❤️',
    accentColor: '#ec4899',
    description: 'Affect, passion, affinity, fear, empathy, and temperament',
  },
  {
    name: 'Power & Conflict',
    icon: '⚔️',
    accentColor: '#ef4444',
    description: 'Contest, combat, conquest, governance, and decisive resistance',
  },
  {
    name: 'Law & Morality',
    icon: '⚖️',
    accentColor: '#f59e0b',
    description: 'Truth, justice, ethics, sanctity, civic rectitude, and blame',
  },
  {
    name: 'Form & Nature',
    icon: '🌱',
    accentColor: '#14b8a6',
    description: 'Physical substance, organic life, illumination, transformation, and structural changes',
  },
  {
    name: 'Quantity & Relation',
    icon: '📐',
    accentColor: '#6366f1',
    description: 'Time, magnitude, spatial proximity, hierarchy, and mathematical order',
  },
];

export const SAT_TIER_DEFS = [
  {
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

/**
 * Retrieve current learning pathway from localStorage
 * Defaults to 'thematic'
 */
export function getStoredPathway() {
  if (typeof window === 'undefined') return PATHWAY_THEMATIC;
  try {
    const val = localStorage.getItem(STORAGE_KEY_PATHWAY);
    if (val === PATHWAY_YIELD || val === PATHWAY_THEMATIC) {
      return val;
    }
    // Default fallback
    localStorage.setItem(STORAGE_KEY_PATHWAY, PATHWAY_THEMATIC);
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
  const safePathway = pathway === PATHWAY_YIELD ? PATHWAY_YIELD : PATHWAY_THEMATIC;
  try {
    localStorage.setItem(STORAGE_KEY_PATHWAY, safePathway);
    // Broadcast event for live synchronization across components
    window.dispatchEvent(
      new CustomEvent(PATHWAY_CHANGE_EVENT, { detail: { pathway: safePathway } })
    );
  } catch (err) {
    console.warn('Failed to save kiwi_learning_pathway to localStorage:', err);
  }
}

/**
 * Retrieve metadata for a thematic cluster
 */
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

/**
 * Retrieve metadata for a SAT/ACT tier
 */
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
 * Group an array of root objects according to the active pathway
 * @param {Array} roots - list of root objects
 * @param {string} pathway - 'thematic' | 'yield'
 * @returns {Array} List of group objects: [{ id, name, icon, description, tagline, roots }]
 */
export function groupRootsByPathway(roots = [], pathway = PATHWAY_THEMATIC) {
  if (pathway === PATHWAY_YIELD) {
    return SAT_TIER_DEFS.map((tierDef) => {
      const tierRoots = roots.filter((r) => {
        const rTier = (r.sat_tier || '').toLowerCase();
        return rTier === tierDef.name.toLowerCase() || (tierDef.name.includes('1') && rTier.includes('1')) || (tierDef.name.includes('2') && rTier.includes('2')) || (tierDef.name.includes('3') && rTier.includes('3'));
      });
      return {
        id: tierDef.name,
        name: tierDef.name,
        icon: tierDef.icon,
        tagline: tierDef.tagline,
        description: tierDef.description,
        accentColor: tierDef.accentColor,
        bgColor: tierDef.bgColor,
        textColor: tierDef.textColor,
        roots: tierRoots,
        totalRoots: tierRoots.length,
      };
    });
  }

  // Thematic Pathways
  return THEMATIC_CLUSTER_DEFS.map((clusterDef) => {
    const clusterRoots = roots.filter(
      (r) => (r.thematic_cluster || '').toLowerCase() === clusterDef.name.toLowerCase()
    );
    return {
      id: clusterDef.name,
      name: clusterDef.name,
      icon: clusterDef.icon,
      tagline: `${clusterRoots.length} Root Families`,
      description: clusterDef.description,
      accentColor: clusterDef.accentColor,
      roots: clusterRoots,
      totalRoots: clusterRoots.length,
    };
  });
}
