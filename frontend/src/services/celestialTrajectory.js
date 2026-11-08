/**
 * Navigation Trajectory & Node History Service
 *
 * Models navigation history as an interconnected trajectory of nodes,
 * tracking domains, system views, root morphemes, and word specimens.
 */

const STORAGE_KEY = 'kiwi_navigation_trajectory_v1';
const MAX_TRAJECTORY_LENGTH = 30;

/**
 * Deterministic hash to generate consistent coordinates for any title/id
 */
function hashString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates a clean technical node coordinate string
 * e.g. "COORD [412, 680] · LEVEL 2"
 */
export function generateNodeCoordinates(key = '', depth = 1) {
  const hash = hashString(key);
  const gridX = (hash % 900) + 100;
  const gridY = ((hash >> 4) % 900) + 100;
  return `COORD [${gridX}, ${gridY}] · LEVEL ${depth}`;
}

/**
 * Determines clean node classification based on type and metadata
 */
export function getNodeClassification(type, language = '') {
  switch (type) {
    case 'SECTOR':
      return 'PRIMARY DOMAIN';
    case 'STAR_SYSTEM':
      return 'WORKSPACE VIEW';
    case 'PRIMARY_STAR':
      return language ? `${language.toUpperCase()} ROOT NODE` : 'ROOT MORPHEME NODE';
    case 'SATELLITE':
      return 'WORD SPECIMEN NODE';
    case 'ANOMALY':
      return 'TARGETED SESSION';
    default:
      return 'TRAJECTORY NODE';
  }
}

/**
 * Calculate node color palette based on recency index
 * Index 0 is active (bright kiwi emerald); older indices cool down
 */
export function getNodePalette(indexFromEnd = 0) {
  if (indexFromEnd === 0) {
    return {
      glow: '#7BB33B', // Kiwi vivid
      fill: '#EDF5E5',
      border: '#111410',
      text: '#111410',
      halo: 'rgba(123, 179, 59, 0.45)',
      isLive: true,
    };
  }
  if (indexFromEnd <= 2) {
    return {
      glow: '#84C341', // Kiwi lime
      fill: '#FFFFFF',
      border: '#111410',
      text: '#111410',
      halo: 'rgba(132, 195, 65, 0.25)',
      isLive: false,
    };
  }
  if (indexFromEnd <= 5) {
    return {
      glow: '#C29B78', // Warm caramel
      fill: '#FAFBF8',
      border: '#42281D',
      text: '#42281D',
      halo: 'rgba(194, 155, 120, 0.2)',
      isLive: false,
    };
  }
  return {
    glow: '#62685E', // Muted cooled node
    fill: '#EFE8DF',
    border: '#62685E',
    text: '#62685E',
    halo: 'transparent',
    isLive: false,
  };
}

/**
 * Read stored trajectory from localStorage
 */
export function loadStoredTrajectory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load navigation trajectory:', err);
    return [];
  }
}

/**
 * Save trajectory to localStorage
 */
export function saveTrajectory(trajectory = []) {
  if (typeof window === 'undefined') return;
  try {
    const bounded = trajectory.slice(-MAX_TRAJECTORY_LENGTH);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
  } catch (err) {
    console.warn('Failed to save navigation trajectory:', err);
  }
}

/**
 * Helper to create a standardized trajectory waypoint object
 */
export function createCelestialWaypoint({
  type = 'STAR_SYSTEM', // 'SECTOR' | 'STAR_SYSTEM' | 'PRIMARY_STAR' | 'SATELLITE' | 'ANOMALY'
  title = '',
  subtitle = '',
  system = 'Vocab Sector',
  depth = 1,
  language = '',
  state = {},
}) {
  const coordinateKey = `${type}-${title}-${system}`;
  return {
    id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    type,
    title,
    subtitle: subtitle || getNodeClassification(type, language),
    system,
    depth, // 0: Domain, 1: System, 2: Root, 3: Word, 4: Session
    language,
    coordinates: generateNodeCoordinates(coordinateKey, depth),
    state: { ...state },
  };
}
