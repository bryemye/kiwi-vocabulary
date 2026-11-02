/**
 * Study Session & Spaced Repetition Service
 * 
 * Manages custom practice session generation, localStorage spaced repetition tracking,
 * balanced root sampling, and morpheme variety interleaving.
 */

const STORAGE_KEY_PROGRESS = 'kiwi_word_progress';

export const SESSION_SIZE = 15;
export const MAX_SELECTED_ROOTS = 5;

// Classic high-yield SAT/ACT Latin & Greek root morphemes
export const HIGH_FREQUENCY_TIER1_MORPHEMES = [
  'ced / cess',
  'cur / curs / cour',
  'grad / gress',
  'mot / mov',
  'tract',
  'fer / lat',
  'pel / puls',
  'jac / ject',
  'pugn / pug',
  'bell / belli',
  'rupt',
  'tort / tors',
  'fract / frag',
  'sec / sect / seg',
  'theo / the',
  'cap / cip / cept',
  'duc / duct',
  'gen / gener',
  'mit / miss',
  'spec / spic'
];

/**
 * Retrieve word progress tracking from localStorage
 */
export function getWordProgressMap() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Failed to parse kiwi_word_progress from localStorage:', err);
    return {};
  }
}

/**
 * Record study attempt for a word in localStorage for spaced repetition
 * Status progression:
 * - 'struggling': recently missed
 * - 'learning': attempted with mixed or early success (< 2 consecutive correct)
 * - 'mastered': 2+ consecutive correct attempts
 */
export function recordWordAttempt(wordItem, isCorrect) {
  if (!wordItem || typeof window === 'undefined') return;
  const wordKey = (wordItem.word || '').toLowerCase().trim();
  if (!wordKey) return;

  const progress = getWordProgressMap();
  const current = progress[wordKey] || {
    wordId: wordItem.id,
    word: wordKey,
    status: 'learning',
    attempts: 0,
    correctCount: 0,
    missedCount: 0,
    consecutiveCorrect: 0,
    lastAttemptCorrect: null,
    lastPracticedAt: null,
  };

  current.attempts += 1;
  current.lastAttemptCorrect = Boolean(isCorrect);
  current.lastPracticedAt = new Date().toISOString();

  if (isCorrect) {
    current.correctCount += 1;
    current.consecutiveCorrect += 1;
    if (current.consecutiveCorrect >= 2) {
      current.status = 'mastered';
    } else {
      current.status = 'learning';
    }
  } else {
    current.missedCount += 1;
    current.consecutiveCorrect = 0;
    current.status = 'struggling';
  }

  progress[wordKey] = current;

  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  } catch (err) {
    console.warn('Failed to save kiwi_word_progress to localStorage:', err);
  }

  return current;
}

/**
 * Get all words eligible for Smart Review (status 'struggling', 'learning', or missed)
 */
export function getReviewEligibleWords(allWords) {
  const progress = getWordProgressMap();
  
  return allWords.filter(w => {
    const key = (w.word || '').toLowerCase().trim();
    const p = progress[key];
    if (p) {
      return p.status === 'struggling' || p.status === 'learning' || (p.missedCount > 0 && p.consecutiveCorrect < 2);
    }
    // Also check if word has review notes indicating struggle
    if (w.review && w.review.struggling) return true;
    return false;
  });
}

/**
 * Interleave deck to ensure morpheme variety and avoid showing variations of the
 * same root back-to-back.
 */
export function shuffleWithMorphemeVariety(cards) {
  if (!cards || cards.length <= 1) return [...(cards || [])];

  // Group cards by root identifier
  const groups = new Map();
  for (const card of cards) {
    const rootKey = card.root_details?.morpheme || card.root || card.root_details?.id || 'general';
    if (!groups.has(rootKey)) {
      groups.set(rootKey, []);
    }
    groups.get(rootKey).push(card);
  }

  // Shuffle within each root group first
  for (const list of groups.values()) {
    list.sort(() => 0.5 - Math.random());
  }

  const result = [];
  let lastRoot = null;

  while (result.length < cards.length) {
    // Get non-empty groups sorted by remaining count descending
    const activeGroups = Array.from(groups.entries())
      .filter(([_, list]) => list.length > 0)
      .sort((a, b) => b[1].length - a[1].length);

    if (activeGroups.length === 0) break;

    // Pick the largest group that differs from lastRoot
    let chosen = activeGroups.find(([key]) => key !== lastRoot);
    if (!chosen) {
      // If forced to repeat, pick the one with most remaining
      chosen = activeGroups[0];
    }

    const [key, list] = chosen;
    result.push(list.pop());
    lastRoot = key;
  }

  return result;
}

/**
 * Balance word sampling across a list of selected roots up to targetCount
 */
function drawBalancedSampleFromRoots(selectedRootsWordsMap, targetCount = SESSION_SIZE) {
  const rootKeys = Object.keys(selectedRootsWordsMap).filter(k => selectedRootsWordsMap[k].length > 0);
  if (rootKeys.length === 0) return [];

  // Deep clone candidate pools
  const pools = {};
  rootKeys.forEach(k => {
    pools[k] = [...selectedRootsWordsMap[k]].sort(() => 0.5 - Math.random());
  });

  const selected = [];
  let index = 0;

  // Round-robin selection across available roots to maintain exact balance
  while (selected.length < targetCount) {
    const availableRoots = rootKeys.filter(k => pools[k].length > 0);
    if (availableRoots.length === 0) break; // Exhausted all words across selected roots

    const currentKey = availableRoots[index % availableRoots.length];
    selected.push(pools[currentKey].pop());
    index++;
  }

  return selected;
}

/**
 * Generate Deck - Option A: "Root Family Focus"
 * - 1 to 5 root families
 * - Balanced sample of up to 15 words
 * - Backfill related roots if < 15 and requested
 */
export function generateRootFamilyDeck({
  selectedRootIds = [],
  allWords = [],
  allRoots = [],
  backfillRelated = true,
  targetCount = SESSION_SIZE
}) {
  const rootIdSet = new Set(selectedRootIds.map(Number));
  
  // Group matching words by root
  const wordsByRoot = {};
  selectedRootIds.forEach(id => {
    wordsByRoot[id] = [];
  });

  allWords.forEach(w => {
    const rId = Number(w.root || w.root_details?.id);
    if (rootIdSet.has(rId)) {
      if (!wordsByRoot[rId]) wordsByRoot[rId] = [];
      wordsByRoot[rId].push(w);
    }
  });

  const totalEligible = Object.values(wordsByRoot).reduce((sum, arr) => sum + arr.length, 0);

  let chosenWords = [];

  if (totalEligible >= targetCount) {
    // Draw balanced sample across roots
    chosenWords = drawBalancedSampleFromRoots(wordsByRoot, targetCount);
  } else {
    // Take all eligible words from selected roots
    Object.values(wordsByRoot).forEach(arr => {
      chosenWords.push(...arr);
    });

    // If backfill is requested and we have room
    if (backfillRelated && chosenWords.length < targetCount) {
      const chosenWordIds = new Set(chosenWords.map(w => w.id));
      
      // Determine dominant language of selected roots
      const selectedRootsObjs = allRoots.filter(r => rootIdSet.has(Number(r.id)));
      const dominantLanguage = selectedRootsObjs[0]?.language || 'Latin';

      // Find related roots in same language
      const relatedCandidates = allWords.filter(w => {
        if (chosenWordIds.has(w.id)) return false;
        const wLang = w.root_details?.language || allRoots.find(r => r.id === w.root)?.language;
        return wLang && wLang.toLowerCase() === dominantLanguage.toLowerCase();
      }).sort(() => 0.5 - Math.random());

      const needed = targetCount - chosenWords.length;
      chosenWords.push(...relatedCandidates.slice(0, needed));

      // If still under targetCount, fill with any remaining words
      if (chosenWords.length < targetCount) {
        const stillNeeded = targetCount - chosenWords.length;
        const remainingChosenIds = new Set(chosenWords.map(w => w.id));
        const generalFill = allWords
          .filter(w => !remainingChosenIds.has(w.id))
          .sort(() => 0.5 - Math.random())
          .slice(0, stillNeeded);
        chosenWords.push(...generalFill);
      }
    }
  }

  return {
    deck: shuffleWithMorphemeVariety(chosenWords),
    totalEligible,
    exactCountUsed: !backfillRelated && totalEligible < targetCount,
  };
}

/**
 * Generate Deck - Option B: "Smart Review (Spaced Repetition / Missed Words)"
 * - Words marked struggling, learning, or missed in localStorage
 * - Backfill unstudied words if under targetCount and requested
 */
export function generateSmartReviewDeck({
  allWords = [],
  backfillUnstudied = true,
  targetCount = SESSION_SIZE
}) {
  const reviewWords = getReviewEligibleWords(allWords);
  const reviewWordIds = new Set(reviewWords.map(w => w.id));

  let chosenWords = [];

  if (reviewWords.length >= targetCount) {
    // Sort struggling first, then learning
    const progress = getWordProgressMap();
    const sorted = [...reviewWords].sort((a, b) => {
      const pA = progress[(a.word || '').toLowerCase()];
      const pB = progress[(b.word || '').toLowerCase()];
      const scoreA = pA?.status === 'struggling' ? 2 : 1;
      const scoreB = pB?.status === 'struggling' ? 2 : 1;
      return scoreB - scoreA;
    });

    chosenWords = sorted.slice(0, targetCount);
  } else {
    chosenWords = [...reviewWords];

    if (backfillUnstudied && chosenWords.length < targetCount) {
      const progress = getWordProgressMap();
      const needed = targetCount - chosenWords.length;

      // Unstudied words = words without any logged attempts in progress map
      const unstudied = allWords.filter(w => {
        if (reviewWordIds.has(w.id)) return false;
        const key = (w.word || '').toLowerCase().trim();
        return !progress[key];
      }).sort(() => 0.5 - Math.random());

      chosenWords.push(...unstudied.slice(0, needed));

      // If still needed (e.g. all words have been attempted), backfill from remaining general pool
      if (chosenWords.length < targetCount) {
        const currentIds = new Set(chosenWords.map(w => w.id));
        const generalPool = allWords
          .filter(w => !currentIds.has(w.id))
          .sort(() => 0.5 - Math.random())
          .slice(0, targetCount - chosenWords.length);
        chosenWords.push(...generalPool);
      }
    }
  }

  return {
    deck: shuffleWithMorphemeVariety(chosenWords),
    reviewCount: reviewWords.length,
    backfilledCount: Math.max(0, chosenWords.length - reviewWords.length),
  };
}

/**
 * Generate Deck - Option C: "High-Frequency SAT/ACT Tier 1"
 * - Prioritizes top recurring roots and high-yield academic vocabulary
 */
export function generateTier1Deck({
  allWords = [],
  allRoots = [],
  targetCount = SESSION_SIZE
}) {
  // Find top root IDs matching Tier 1 morphemes or roots with highest frequency in seed
  const tier1MorphemeSet = new Set(HIGH_FREQUENCY_TIER1_MORPHEMES.map(m => m.toLowerCase()));
  
  // Categorize words into Tier 1 root words and general words
  const tier1WordsByRoot = {};
  
  allWords.forEach(w => {
    const rootMorpheme = (w.root_details?.morpheme || '').toLowerCase();
    const isTier1Root = tier1MorphemeSet.has(rootMorpheme) || 
      HIGH_FREQUENCY_TIER1_MORPHEMES.some(m => rootMorpheme.includes(m.split(' ')[0]));

    if (isTier1Root) {
      const rootKey = w.root || w.root_details?.id || rootMorpheme;
      if (!tier1WordsByRoot[rootKey]) {
        tier1WordsByRoot[rootKey] = [];
      }
      tier1WordsByRoot[rootKey].push(w);
    }
  });

  // Sample balanced words across Tier 1 roots
  let chosenWords = drawBalancedSampleFromRoots(tier1WordsByRoot, targetCount);

  // If tier 1 roots yielded fewer than targetCount, fill with highest-yield words
  if (chosenWords.length < targetCount) {
    const chosenIds = new Set(chosenWords.map(w => w.id));
    const remainder = allWords
      .filter(w => !chosenIds.has(w.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, targetCount - chosenWords.length);
    chosenWords.push(...remainder);
  }

  return {
    deck: shuffleWithMorphemeVariety(chosenWords.slice(0, targetCount)),
  };
}

/**
 * Quick Start 15-Card Deck
 */
export function generateQuickStartDeck({ allWords = [], targetCount = SESSION_SIZE }) {
  const shuffled = [...allWords].sort(() => 0.5 - Math.random());
  return {
    deck: shuffleWithMorphemeVariety(shuffled.slice(0, targetCount)),
  };
}
