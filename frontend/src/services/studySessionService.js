/**
 * Study Session & Spaced Repetition Service
 * 
 * Manages custom practice session generation, localStorage spaced repetition tracking,
 * balanced root sampling, and morpheme variety interleaving.
 */

const STORAGE_KEY_PROGRESS = 'kiwi_word_progress';

export const SESSION_SIZE = 15;
export const MAX_SELECTED_ROOTS = 5;
export const MAX_SELECTED_MORPHEMES = 5;

/**
 * Parse an affix string into clean token, alphanumeric base, and meaning.
 * e.g. "dis- (apart, away)" -> { cleanToken: "dis-", base: "dis", meaning: "apart, away" }
 * e.g. "-ous (full of)" -> { cleanToken: "-ous", base: "ous", meaning: "full of" }
 */
export function parseAffixToken(raw = '') {
  if (!raw) return { cleanToken: '', base: '', meaning: '' };
  const str = String(raw).trim();
  const parenMatch = str.match(/^([^(]+)\s*(?:\(([^)]+)\))?/);
  const tokenPart = (parenMatch ? parenMatch[1] : str).trim();
  const meaning = parenMatch?.[2]?.trim() || '';
  const base = tokenPart.toLowerCase().replace(/[^a-z0-9]/g, '');
  return {
    cleanToken: tokenPart,
    base,
    meaning
  };
}

/**
 * Check if a word item matches a prefix token or base string.
 */
export function wordMatchesPrefix(word, targetPrefix) {
  if (!word || !word.prefix || !targetPrefix) return false;
  const targetParsed = parseAffixToken(targetPrefix);
  const targetBase = targetParsed.base;
  const targetClean = targetParsed.cleanToken.toLowerCase().replace(/-$/, '');

  const wRaw = word.prefix.toLowerCase();
  const wParsed = parseAffixToken(word.prefix);

  if (wParsed.base && targetBase && wParsed.base === targetBase) return true;
  if (targetClean && wRaw.startsWith(targetClean)) return true;
  if (targetBase && targetBase.length >= 2 && word.word?.toLowerCase().startsWith(targetBase)) return true;
  return false;
}

/**
 * Check if a word item matches a suffix token or base string.
 */
export function wordMatchesSuffix(word, targetSuffix) {
  if (!word || !word.suffix || !targetSuffix) return false;
  const targetParsed = parseAffixToken(targetSuffix);
  const targetBase = targetParsed.base;
  const targetClean = targetParsed.cleanToken.toLowerCase().replace(/^-/, '');

  const sRaw = word.suffix.toLowerCase();
  const sParsed = parseAffixToken(word.suffix);

  if (sParsed.base && targetBase && sParsed.base === targetBase) return true;
  if (targetClean && sRaw.startsWith(targetClean)) return true;
  if (targetBase && targetBase.length >= 2 && word.word?.toLowerCase().endsWith(targetBase)) return true;
  return false;
}

/**
 * Extract and aggregate all morphemes (Roots, Prefixes, Suffixes) from words and roots.
 */
export function extractMorphemesFromWords(words = [], roots = []) {
  const result = [];

  // 1. Add Roots
  roots.forEach(r => {
    const rootWords = words.filter(w => Number(w.root || w.root_details?.id) === Number(r.id));
    result.push({
      id: `root_${r.id}`,
      key: `root_${r.id}`,
      numericId: Number(r.id),
      type: 'root',
      morpheme: r.morpheme,
      title: `[${r.morpheme.toUpperCase()}]`,
      cleanToken: r.morpheme,
      core_meaning: r.core_meaning || '',
      language: r.language || 'Latin',
      thematic_cluster: r.thematic_cluster || '',
      sat_tier: r.sat_tier || '',
      mnemonic: r.mnemonic || '',
      words: rootWords,
      wordCount: rootWords.length,
      wordIds: new Set(rootWords.map(w => w.id))
    });
  });

  // 2. Aggregate Prefixes from Words
  const prefixMap = new Map();
  words.forEach(w => {
    if (!w.prefix) return;
    const parsed = parseAffixToken(w.prefix);
    if (!parsed.cleanToken) return;

    let token = parsed.cleanToken.toLowerCase();
    if (!token.endsWith('-')) token += '-';

    if (!prefixMap.has(token)) {
      prefixMap.set(token, {
        meanings: new Set(),
        words: [],
        wordIds: new Set()
      });
    }
    const entry = prefixMap.get(token);
    if (parsed.meaning) entry.meanings.add(parsed.meaning);
    if (!entry.wordIds.has(w.id)) {
      entry.wordIds.add(w.id);
      entry.words.push(w);
    }
  });

  Array.from(prefixMap.entries())
    .sort((a, b) => b[1].words.length - a[1].words.length)
    .forEach(([token, data]) => {
      const meaningsList = Array.from(data.meanings);
      const meaningStr = meaningsList.slice(0, 3).join(', ') || 'derivational prefix';
      result.push({
        id: `prefix_${token}`,
        key: `prefix_${token}`,
        type: 'prefix',
        morpheme: token,
        title: token,
        cleanToken: token,
        core_meaning: meaningStr,
        language: 'Affix',
        thematic_cluster: '',
        sat_tier: '',
        words: data.words,
        wordCount: data.words.length,
        wordIds: data.wordIds
      });
    });

  // 3. Aggregate Suffixes from Words
  const suffixMap = new Map();
  words.forEach(w => {
    if (!w.suffix) return;
    const parsed = parseAffixToken(w.suffix);
    if (!parsed.cleanToken) return;

    let token = parsed.cleanToken.toLowerCase();
    if (!token.startsWith('-')) token = '-' + token;

    if (!suffixMap.has(token)) {
      suffixMap.set(token, {
        meanings: new Set(),
        words: [],
        wordIds: new Set()
      });
    }
    const entry = suffixMap.get(token);
    if (parsed.meaning) entry.meanings.add(parsed.meaning);
    if (!entry.wordIds.has(w.id)) {
      entry.wordIds.add(w.id);
      entry.words.push(w);
    }
  });

  Array.from(suffixMap.entries())
    .sort((a, b) => b[1].words.length - a[1].words.length)
    .forEach(([token, data]) => {
      const meaningsList = Array.from(data.meanings);
      const meaningStr = meaningsList.slice(0, 3).join(', ') || 'derivational ending';
      result.push({
        id: `suffix_${token}`,
        key: `suffix_${token}`,
        type: 'suffix',
        morpheme: token,
        title: token,
        cleanToken: token,
        core_meaning: meaningStr,
        language: 'Affix',
        thematic_cluster: '',
        sat_tier: '',
        words: data.words,
        wordCount: data.words.length,
        wordIds: data.wordIds
      });
    });

  return result;
}

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
 * Balance word sampling across candidate pools up to targetCount
 */
export function drawBalancedSampleFromPools(wordsMap, targetCount = SESSION_SIZE) {
  const keys = Object.keys(wordsMap).filter(k => wordsMap[k]?.length > 0);
  if (keys.length === 0) return [];

  // Deep clone candidate pools
  const pools = {};
  keys.forEach(k => {
    pools[k] = [...wordsMap[k]].sort(() => 0.5 - Math.random());
  });

  const selected = [];
  const chosenWordIds = new Set();
  let index = 0;

  // Round-robin selection across available pools
  while (selected.length < targetCount) {
    const availableKeys = keys.filter(k => pools[k].length > 0);
    if (availableKeys.length === 0) break; // Exhausted all pools

    const currentKey = availableKeys[index % availableKeys.length];
    const candidate = pools[currentKey].pop();
    if (candidate && !chosenWordIds.has(candidate.id)) {
      chosenWordIds.add(candidate.id);
      selected.push(candidate);
    }
    index++;
  }

  return selected;
}

/**
 * Generate Deck - Option A: "Morpheme Focus" (Roots, Prefixes, Suffixes)
 * - 1 to 5 selected morphemes (roots, prefixes, or suffixes)
 * - Balanced sample of up to 15 words
 * - Backfill related words if < 15 and requested
 */
export function generateMorphemeDeck({
  selectedMorphemes = [],
  selectedMorphemeIds = [],
  selectedRootIds = [],
  allWords = [],
  allRoots = [],
  allMorphemes = null,
  backfillRelated = true,
  targetCount = SESSION_SIZE
}) {
  const morphemeCatalog = allMorphemes || extractMorphemesFromWords(allWords, allRoots);
  const catalogMap = new Map();
  morphemeCatalog.forEach(m => {
    catalogMap.set(m.id, m);
    catalogMap.set(m.key, m);
    if (m.type === 'root') {
      catalogMap.set(String(m.numericId), m);
      catalogMap.set(`root:${m.numericId}`, m);
    } else if (m.type === 'prefix') {
      catalogMap.set(m.cleanToken.toLowerCase(), m);
      catalogMap.set(`prefix:${m.cleanToken.toLowerCase()}`, m);
    } else if (m.type === 'suffix') {
      catalogMap.set(m.cleanToken.toLowerCase(), m);
      catalogMap.set(`suffix:${m.cleanToken.toLowerCase()}`, m);
    }
  });

  // Resolve all requested morphemes
  const resolvedMorphemes = [];
  const resolvedIds = new Set();

  // 1. From selectedMorphemes objects
  selectedMorphemes.forEach(m => {
    if (m && m.id && !resolvedIds.has(m.id)) {
      resolvedIds.add(m.id);
      resolvedMorphemes.push(m);
    }
  });

  // 2. From selectedMorphemeIds
  selectedMorphemeIds.forEach(id => {
    const found = catalogMap.get(String(id));
    if (found && !resolvedIds.has(found.id)) {
      resolvedIds.add(found.id);
      resolvedMorphemes.push(found);
    }
  });

  // 3. From selectedRootIds (backward compatibility)
  selectedRootIds.forEach(rId => {
    const found = catalogMap.get(String(rId)) || catalogMap.get(`root_${rId}`);
    if (found && !resolvedIds.has(found.id)) {
      resolvedIds.add(found.id);
      resolvedMorphemes.push(found);
    }
  });

  // Group candidate words for each selected morpheme
  const wordsByMorpheme = {};
  const allEligibleWordIds = new Set();

  resolvedMorphemes.forEach(m => {
    let pool = [];
    if (m.words && m.words.length > 0) {
      pool = m.words;
    } else if (m.type === 'root') {
      pool = allWords.filter(w => Number(w.root || w.root_details?.id) === Number(m.numericId || m.id));
    } else if (m.type === 'prefix') {
      pool = allWords.filter(w => wordMatchesPrefix(w, m.cleanToken || m.morpheme));
    } else if (m.type === 'suffix') {
      pool = allWords.filter(w => wordMatchesSuffix(w, m.cleanToken || m.morpheme));
    }

    wordsByMorpheme[m.id] = pool;
    pool.forEach(w => allEligibleWordIds.add(w.id));
  });

  const totalEligible = allEligibleWordIds.size;
  let chosenWords = [];

  if (totalEligible >= targetCount) {
    chosenWords = drawBalancedSampleFromPools(wordsByMorpheme, targetCount);
  } else {
    // Collect all words across selected pools without duplicates
    const chosenIds = new Set();
    Object.values(wordsByMorpheme).forEach(arr => {
      arr.forEach(w => {
        if (!chosenIds.has(w.id)) {
          chosenIds.add(w.id);
          chosenWords.push(w);
        }
      });
    });

    // If backfill is requested and we have room
    if (backfillRelated && chosenWords.length < targetCount) {
      const needed = targetCount - chosenWords.length;
      const chosenWordIds = new Set(chosenWords.map(w => w.id));

      // Attempt to backfill with words sharing similar morphemes / roots
      const hasRoot = resolvedMorphemes.some(m => m.type === 'root');
      const dominantLanguage = resolvedMorphemes.find(m => m.type === 'root')?.language || 'Latin';

      let relatedCandidates = allWords.filter(w => {
        if (chosenWordIds.has(w.id)) return false;
        if (hasRoot) {
          const wLang = w.root_details?.language || allRoots.find(r => r.id === w.root)?.language;
          return wLang && wLang.toLowerCase() === dominantLanguage.toLowerCase();
        }
        return true;
      }).sort(() => 0.5 - Math.random());

      chosenWords.push(...relatedCandidates.slice(0, needed));

      // If still under targetCount, fill with general remaining words
      if (chosenWords.length < targetCount) {
        const stillNeeded = targetCount - chosenWords.length;
        const currentChosenIds = new Set(chosenWords.map(w => w.id));
        const generalFill = allWords
          .filter(w => !currentChosenIds.has(w.id))
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
    resolvedMorphemes
  };
}

/**
 * Backward compatibility alias for generateRootFamilyDeck
 */
export const generateRootFamilyDeck = generateMorphemeDeck;

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

/**
 * Return the subset of targetMorphemes that match a given word.
 */
export function getMatchingTargetMorphemes(word, targetMorphemes = []) {
  if (!word || !Array.isArray(targetMorphemes) || targetMorphemes.length === 0) {
    return [];
  }

  return targetMorphemes.filter((m) => {
    if (!m) return false;
    if (m.type === 'root') {
      const targetRootId = Number(m.numericId ?? m.rootId);
      const wordRootId = Number(word.root || word.root_details?.id);
      if (targetRootId && wordRootId === targetRootId) return true;
      const targetToken = (m.cleanToken || m.morpheme || '').toLowerCase();
      const wordToken = (word.root_details?.morpheme || '').toLowerCase();
      return Boolean(targetToken && wordToken && targetToken === wordToken);
    }
    if (m.type === 'prefix') {
      return wordMatchesPrefix(word, m.cleanToken || m.morpheme);
    }
    if (m.type === 'suffix') {
      return wordMatchesSuffix(word, m.cleanToken || m.morpheme);
    }
    return false;
  });
}

/**
 * Resolve initial morpheme IDs from root IDs, morpheme list, or a single morpheme descriptor.
 */
export function resolveInitialMorphemeIds({
  allMorphemes = [],
  initialSelectedMorphemes = [],
  initialMorpheme = null,
  initialSelectedRootIds = [],
  fallbackToFirst = false,
}) {
  if (initialSelectedMorphemes && initialSelectedMorphemes.length > 0) {
    const ids = initialSelectedMorphemes
      .map((m) => (typeof m === 'object' ? (m.id || m.key) : String(m)))
      .filter(Boolean);
    if (ids.length > 0) {
      return ids.slice(0, MAX_SELECTED_MORPHEMES);
    }
  }

  if (initialMorpheme) {
    const targetType = initialMorpheme.type?.toLowerCase();
    const targetToken = (
      initialMorpheme.cleanToken ||
      initialMorpheme.morpheme ||
      initialMorpheme.title ||
      ''
    )
      .toLowerCase()
      .trim();
    const targetRootId = initialMorpheme.rootId || initialMorpheme.root?.id;

    const found = allMorphemes.find((m) => {
      if (targetType && m.type !== targetType) return false;
      if (targetType === 'root' && targetRootId) {
        return Number(m.numericId) === Number(targetRootId);
      }
      const mToken = (m.cleanToken || m.morpheme || '').toLowerCase();
      return (
        mToken === targetToken ||
        mToken.replace(/[^a-z0-9]/g, '') === targetToken.replace(/[^a-z0-9]/g, '')
      );
    });
    if (found) return [found.id];
  }

  if (initialSelectedRootIds && initialSelectedRootIds.length > 0) {
    return initialSelectedRootIds
      .slice(0, MAX_SELECTED_MORPHEMES)
      .map((rId) => `root_${rId}`);
  }

  if (fallbackToFirst && allMorphemes.length > 0) {
    return [allMorphemes[0].id];
  }

  return [];
}

/**
 * Build a complete targeted morpheme practice session payload from selected targets.
 */
export function buildMorphemePracticeSession({
  selectedMorphemes = [],
  selectedMorphemeIds = [],
  allWords = [],
  allRoots = [],
  allMorphemes = null,
  backfillRelated = true,
  targetCount = SESSION_SIZE,
}) {
  const gen = generateMorphemeDeck({
    selectedMorphemes,
    selectedMorphemeIds,
    allWords,
    allRoots,
    allMorphemes,
    backfillRelated,
    targetCount,
  });

  const resolved = gen.resolvedMorphemes || selectedMorphemes || [];
  const types = new Set(resolved.map((m) => m.type));
  let modeLabel = 'Morpheme Focus';
  if (types.size === 1) {
    if (types.has('prefix')) modeLabel = 'Prefix Focus';
    else if (types.has('suffix')) modeLabel = 'Suffix Focus';
    else if (types.has('root')) modeLabel = 'Root Target Set';
  }

  const titleList = resolved
    .map((m) => (m.type === 'root' ? `[${(m.morpheme || '').toUpperCase()}]` : m.title))
    .join(' + ');

  const targetWordsCount = Math.min(gen.totalEligible || 0, gen.deck.length);
  const backfillCount = Math.max(0, gen.deck.length - targetWordsCount);

  return {
    deck: gen.deck,
    title: `${modeLabel}: ${titleList}`,
    mode: 'root_family',
    modeLabel,
    details:
      backfillCount > 0
        ? `${resolved.length} target${resolved.length === 1 ? '' : 's'} (${targetWordsCount} target words + ${backfillCount} related fill)`
        : `${resolved.length} target${resolved.length === 1 ? '' : 's'} (${gen.deck.length} words)`,
    targetMorphemeIds: resolved.map((m) => m.id),
    targetMorphemes: resolved.map((m) => ({
      id: m.id,
      type: m.type,
      numericId: m.numericId || null,
      morpheme: m.morpheme,
      cleanToken: m.cleanToken,
      title: m.title,
      core_meaning: m.core_meaning,
      language: m.language,
      wordCount: m.wordCount || m.words?.length || 0,
    })),
    backfillRelated,
  };
}
