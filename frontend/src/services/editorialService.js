/**
 * Editorial Review & Lexicon Management Service
 * 
 * Provides persistence (via localStorage), timestamped verification history,
 * schema merging, and JSON export for admin-facing editorial reviews and
 * verified certification badges.
 */

const STORAGE_KEY = 'kiwi_editorial_reviews';
const ADMIN_MODE_KEY = 'kiwi_admin_review_mode';

// Pre-seeded verified certification for "intermittent" to ensure immediate certification demo
const DEFAULT_INITIAL_REVIEWS = {
  intermittent: {
    verified: true,
    verifiedAt: '2026-11-02T14:00:00.000Z',
    verifiedBy: 'Editorial Board',
    notes: 'Checked against Merriam-Webster Unabridged. Latin etymology [inter-] + [mittere] confirmed for SAT accuracy.',
    history: [
      {
        id: 'seed-intermittent-2026-11-02',
        action: 'verified',
        verified: true,
        timestamp: '2026-11-02T14:00:00.000Z',
        by: 'Editorial Board',
        notes: 'Checked against Merriam-Webster Unabridged. Latin etymology [inter-] + [mittere] confirmed for SAT accuracy.',
        summary: 'Initial editorial certification',
      },
    ],
  },
};

function parseTimestampMs(isoString) {
  if (!isoString) return 0;
  const ms = Date.parse(isoString);
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Format an ISO timestamp into a readable date + time string (e.g. "Nov 14, 2026, 9:24:56 PM")
 */
export function formatVerificationTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);
  try {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return date.toISOString();
  }
}

/**
 * Format an ISO timestamp as a compact relative time label (e.g. "5m ago", "2d ago")
 */
export function formatRelativeTimestamp(isoString) {
  const ms = parseTimestampMs(isoString);
  if (!ms) return '';
  const diffSec = Math.round((Date.now() - ms) / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.round(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.round(diffMonths / 12)}y ago`;
}

function normalizeHistoryItem(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const timestamp = entry.timestamp || entry.verifiedAt || '';
  if (!timestamp) return null;
  const verified = Boolean(entry.verified);
  return {
    id: String(entry.id || `vh-${timestamp}-${verified ? '1' : '0'}`).trim(),
    action: String(entry.action || (verified ? 'verified' : 'unverified')).trim(),
    verified,
    timestamp: String(timestamp),
    by: String(entry.by || entry.verifiedBy || 'Admin').trim() || 'Admin',
    notes: String(entry.notes || '').trim(),
    ...(entry.summary ? { summary: String(entry.summary).trim() } : {}),
  };
}

/**
 * Extract and normalize verification history entries from a review object,
 * backfilling a legacy entry from verifiedAt if no history array is present.
 * Always sorted newest-first.
 */
export function normalizeHistoryEntries(review) {
  if (!review || typeof review !== 'object') return [];

  const entries = [];
  if (Array.isArray(review.history)) {
    review.history.forEach((item) => {
      const normalized = normalizeHistoryItem(item);
      if (normalized) entries.push(normalized);
    });
  }

  if (entries.length === 0 && review.verifiedAt) {
    const legacyVerified = review.verified !== false;
    entries.push({
      id: `legacy-${review.verifiedAt}`,
      action: legacyVerified ? 'verified' : 'unverified',
      verified: legacyVerified,
      timestamp: String(review.verifiedAt),
      by: String(review.verifiedBy || 'Admin').trim() || 'Admin',
      notes: String(review.notes || '').trim(),
      summary: legacyVerified ? 'Verified entry' : 'Marked as unverified',
    });
  }

  entries.sort((a, b) => parseTimestampMs(b.timestamp) - parseTimestampMs(a.timestamp));
  return entries;
}

/**
 * Merge two history arrays, deduplicating by id or (timestamp, action, verified, by),
 * sorted newest-first.
 */
export function mergeHistories(historyA = [], historyB = []) {
  const seenIds = new Set();
  const seenTuples = new Set();
  const merged = [];

  [...(historyA || []), ...(historyB || [])].forEach((raw) => {
    const entry = normalizeHistoryItem(raw);
    if (!entry) return;
    const tupleKey = `${entry.timestamp}|${entry.action}|${entry.verified}|${entry.by.toLowerCase()}`;
    if (seenIds.has(entry.id) || seenTuples.has(tupleKey)) return;
    seenIds.add(entry.id);
    seenTuples.add(tupleKey);
    merged.push(entry);
  });

  merged.sort((a, b) => parseTimestampMs(b.timestamp) - parseTimestampMs(a.timestamp));
  return merged;
}

/**
 * Normalize a review object so its history array is always populated and sorted.
 */
export function normalizeReview(review) {
  if (!review || typeof review !== 'object') return null;
  const history = normalizeHistoryEntries(review);
  const isVerified = Boolean(review.verified);
  const latestVerifiedEntry = history.find((e) => e.verified);
  const hasMeaningfulData =
    isVerified || Boolean(review.notes) || Boolean(review.verifiedAt) || history.length > 0;
  if (!hasMeaningfulData) return null;

  return {
    verified: isVerified,
    verifiedAt: isVerified
      ? (review.verifiedAt || latestVerifiedEntry?.timestamp || null)
      : null,
    verifiedBy: String(review.verifiedBy || 'Admin').trim() || 'Admin',
    notes: String(review.notes || '').trim(),
    history,
  };
}

function getLatestReviewEventMs(review) {
  if (!review) return 0;
  const history = normalizeHistoryEntries(review);
  const latestHistoryMs = history.length > 0 ? parseTimestampMs(history[0].timestamp) : 0;
  const verifiedAtMs = parseTimestampMs(review.verifiedAt);
  return Math.max(latestHistoryMs, verifiedAtMs);
}

/**
 * Intelligently merge a DB-backed review object and a localStorage review object,
 * preserving all verification history entries from both and using the fresher status.
 */
export function mergeReviewObjects(dbReview, storedReview) {
  const normDb = normalizeReview(dbReview);
  const normStored = normalizeReview(storedReview);

  if (!normDb && !normStored) return null;
  if (!normDb) return normStored;
  if (!normStored) return normDb;

  const mergedHistory = mergeHistories(normDb.history, normStored.history);
  const primary =
    getLatestReviewEventMs(normStored) > getLatestReviewEventMs(normDb) ? normStored : normDb;

  return {
    verified: primary.verified,
    verifiedAt: primary.verifiedAt,
    verifiedBy: primary.verifiedBy,
    notes: primary.notes,
    history: mergedHistory,
  };
}

/**
 * Build an updated review object with a new timestamped verification history entry.
 */
export function buildUpdatedReview(previousReview, reviewData = {}, options = {}) {
  const nowIso = options.timestamp || new Date().toISOString();
  const prevNorm = normalizeReview(previousReview);
  const existingHistory = prevNorm ? prevNorm.history : [];

  const isVerified = Boolean(reviewData.verified);
  const wasVerified = Boolean(prevNorm?.verified);
  const by = String(reviewData.verifiedBy || 'Admin').trim() || 'Admin';
  const notes = String(reviewData.notes || '').trim();
  const changedFields = Array.isArray(options.changedFields)
    ? options.changedFields.filter(Boolean)
    : [];

  let action = options.action;
  if (!action) {
    if (isVerified && !wasVerified) {
      action = changedFields.length > 0 ? 'edited_and_verified' : 'verified';
    } else if (!isVerified && wasVerified) {
      action = 'unverified';
    } else if (isVerified && wasVerified) {
      action = changedFields.length > 0 ? 'edited_and_verified' : 'attestation_updated';
    } else {
      action = 'attestation_updated';
    }
  }

  let summary = options.summary;
  if (!summary) {
    if (action === 'edited_and_verified') {
      summary =
        changedFields.length > 0
          ? `Updated ${changedFields.join(', ')} & verified`
          : 'Edited lexicon entry & verified';
    } else if (action === 'verified') {
      summary = 'Marked as verified';
    } else if (action === 'unverified') {
      summary = 'Marked as unverified';
    } else if (action === 'unpublished') {
      summary = 'Unpublished word from student lexicon';
    } else if (action === 'published') {
      summary = 'Re-published word to student lexicon';
    } else if (isVerified) {
      summary = 'Updated editorial attestation';
    } else {
      summary = 'Updated editorial notes (unverified)';
    }
  }

  const newEntry = {
    id: `vh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    verified: isVerified,
    timestamp: nowIso,
    by,
    notes,
    summary,
  };

  const history = mergeHistories([newEntry], existingHistory);
  const preserveVerifiedAt =
    (action === 'published' || action === 'unpublished') && isVerified && prevNorm?.verifiedAt;

  return {
    verified: isVerified,
    verifiedAt: isVerified ? (preserveVerifiedAt ? prevNorm.verifiedAt : nowIso) : null,
    verifiedBy: by,
    notes,
    history,
  };
}

/**
 * Retrieve all stored editorial reviews from localStorage
 */
export function getStoredReviews() {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_REVIEWS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_REVIEWS));
      return { ...DEFAULT_INITIAL_REVIEWS };
    }
    const parsed = JSON.parse(raw);
    // Ensure default initial review for intermittent is present if not set
    if (!parsed.intermittent) {
      parsed.intermittent = DEFAULT_INITIAL_REVIEWS.intermittent;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to parse editorial reviews from localStorage:', err);
    return { ...DEFAULT_INITIAL_REVIEWS };
  }
}

/**
 * Get review metadata for a specific word
 */
export function getWordReview(word) {
  if (!word) return null;
  const key = String(word).toLowerCase().trim();
  const reviews = getStoredReviews();
  return normalizeReview(reviews[key]) || null;
}

/**
 * Save or update editorial review for a word.
 * If reviewData already includes a history array (e.g. from buildUpdatedReview),
 * merges it with stored history without duplicating; otherwise builds a new entry.
 */
export function saveWordReview(word, reviewData, options = {}) {
  if (!word) return null;
  const key = String(word).toLowerCase().trim();
  const reviews = getStoredReviews();
  const existing = reviews[key] || null;

  let updatedReview;
  if (Array.isArray(reviewData?.history) && reviewData.history.length > 0 && !options.forceNewEntry) {
    const mergedHistory = mergeHistories(reviewData.history, normalizeHistoryEntries(existing));
    const isVerified = Boolean(reviewData.verified);
    updatedReview = {
      verified: isVerified,
      verifiedAt: isVerified
        ? (reviewData.verifiedAt || mergedHistory.find((e) => e.verified)?.timestamp || new Date().toISOString())
        : null,
      verifiedBy: String(reviewData.verifiedBy || 'Admin').trim() || 'Admin',
      notes: String(reviewData.notes || '').trim(),
      history: mergedHistory,
    };
  } else {
    updatedReview = buildUpdatedReview(existing, reviewData, options);
  }

  reviews[key] = updatedReview;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
      // Notify active components of review updates
      window.dispatchEvent(
        new CustomEvent('kiwi_editorial_review_updated', {
          detail: { word: key, review: updatedReview },
        })
      );
    } catch (err) {
      console.error('Failed to save editorial review to localStorage:', err);
    }
  }

  return updatedReview;
}

/**
 * Remove an editorial review
 */
export function removeWordReview(word) {
  if (!word) return;
  const key = String(word).toLowerCase().trim();
  const reviews = getStoredReviews();
  delete reviews[key];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
      window.dispatchEvent(
        new CustomEvent('kiwi_editorial_review_updated', {
          detail: { word: key, review: null },
        })
      );
    } catch (err) {
      console.error('Failed to delete review from localStorage:', err);
    }
  }
}

/**
 * Merge stored reviews into a list of words
 */
export function mergeReviewsIntoWords(wordsList = []) {
  const reviews = getStoredReviews();
  return wordsList.map((w) => {
    const key = w.word?.toLowerCase().trim();
    const storedReview = reviews[key];
    const merged = mergeReviewObjects(w.review, storedReview);
    if (merged) {
      return { ...w, review: merged };
    }
    return w;
  });
}

/**
 * Merge stored reviews into a list of roots (and their child words)
 */
export function mergeReviewsIntoRoots(rootsList = []) {
  const reviews = getStoredReviews();
  return rootsList.map((root) => {
    if (!root.words || !Array.isArray(root.words)) return root;
    const updatedWords = root.words.map((w) => {
      const key = w.word?.toLowerCase().trim();
      const storedReview = reviews[key];
      const merged = mergeReviewObjects(w.review, storedReview);
      if (merged) {
        return { ...w, review: merged };
      }
      return w;
    });
    return { ...root, words: updatedWords };
  });
}

/**
 * Aggregate a flat, reverse-chronological verification history across all words.
 */
export function getAllVerificationHistory(wordsList = []) {
  const storedReviews = getStoredReviews();
  const wordByKey = new Map();

  wordsList.forEach((w) => {
    const key = w.word?.toLowerCase().trim();
    if (key) wordByKey.set(key, w);
  });

  const allKeys = new Set([...wordByKey.keys(), ...Object.keys(storedReviews || {})]);
  const events = [];

  allKeys.forEach((key) => {
    const wordObj = wordByKey.get(key);
    const merged = mergeReviewObjects(wordObj?.review, storedReviews[key]);
    if (!merged || !Array.isArray(merged.history) || merged.history.length === 0) return;

    merged.history.forEach((entry) => {
      events.push({
        ...entry,
        word: wordObj?.word || key,
        wordId: wordObj?.id ?? null,
        partOfSpeech: wordObj?.part_of_speech || '',
        rootMorpheme: wordObj?.root_details?.morpheme || '',
        currentVerified: Boolean(merged.verified),
      });
    });
  });

  events.sort((a, b) => parseTimestampMs(b.timestamp) - parseTimestampMs(a.timestamp));
  return events;
}

/**
 * Check and persist Admin/Reviewer Mode
 */
export function getStoredAdminMode() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ADMIN_MODE_KEY) === 'true';
  } catch (err) {
    return false;
  }
}

export function setStoredAdminMode(enabled) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_MODE_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.warn('Failed to persist admin mode state:', err);
  }
}

/**
 * Count total verified words in a word collection
 */
export function countVerifiedWords(wordsList = []) {
  return wordsList.filter((w) => w.review?.verified === true).length;
}

/**
 * Export the complete updated lexicon dataset as a JSON file matching sat_vocab_seed.json format.
 * Includes all verified flags, reviewer metadata, editorial notes, and verification history.
 */
export function exportUpdatedLexiconJson(rootsList = [], wordsList = []) {
  const reviews = getStoredReviews();

  const buildWordReviewPayload = (review) => {
    const norm = normalizeReview(review);
    if (!norm) return null;
    if (!norm.verified && !norm.notes && norm.history.length === 0) return null;
    return {
      verified: Boolean(norm.verified),
      ...(norm.verifiedAt ? { verifiedAt: norm.verifiedAt } : {}),
      ...(norm.verifiedBy ? { verifiedBy: norm.verifiedBy } : {}),
      ...(norm.notes ? { notes: norm.notes } : {}),
      ...(norm.history.length > 0 ? { history: norm.history } : {}),
    };
  };

  let formattedData = [];

  if (rootsList && rootsList.length > 0) {
    formattedData = rootsList.map((root) => {
      const rootEntry = {
        root: {
          morpheme: root.morpheme,
          language: root.language || 'Latin',
          core_meaning: root.core_meaning,
          mnemonic: root.mnemonic || '',
        },
        words: (root.words || []).map((w) => {
          const key = w.word?.toLowerCase().trim();
          const review = mergeReviewObjects(w.review, reviews[key]);
          const wordObj = {
            word: w.word,
            prefix: w.prefix || '',
            suffix: w.suffix || '',
            definition: w.definition,
            sat_sentence: w.sat_sentence,
            connotation: w.connotation || 'neutral',
            ...(w.mnemonic ? { mnemonic: w.mnemonic } : {}),
            ...(w.is_published === false ? { is_published: false } : {}),
          };
          const reviewPayload = buildWordReviewPayload(review);
          if (reviewPayload) {
            wordObj.review = reviewPayload;
          }
          return wordObj;
        }),
      };
      return rootEntry;
    });
  } else if (wordsList && wordsList.length > 0) {
    const rootMap = new Map();
    wordsList.forEach((w) => {
      const rootKey = w.root_details?.morpheme || `root-${w.root}`;
      if (!rootMap.has(rootKey)) {
        rootMap.set(rootKey, {
          root: {
            morpheme: w.root_details?.morpheme || 'unknown',
            language: w.root_details?.language || 'Latin',
            core_meaning: w.root_details?.core_meaning || '',
            mnemonic: w.root_details?.mnemonic || '',
          },
          words: [],
        });
      }
      const key = w.word?.toLowerCase().trim();
      const review = mergeReviewObjects(w.review, reviews[key]);
      const wordObj = {
        word: w.word,
        prefix: w.prefix || '',
        suffix: w.suffix || '',
        definition: w.definition,
        sat_sentence: w.sat_sentence,
        connotation: w.connotation || 'neutral',
        ...(w.mnemonic ? { mnemonic: w.mnemonic } : {}),
        ...(w.is_published === false ? { is_published: false } : {}),
      };
      const reviewPayload = buildWordReviewPayload(review);
      if (reviewPayload) {
        wordObj.review = reviewPayload;
      }
      rootMap.get(rootKey).words.push(wordObj);
    });
    formattedData = Array.from(rootMap.values());
  }

  const jsonString = JSON.stringify(formattedData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'sat_vocab_seed.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  const verifiedTotal = formattedData.reduce(
    (acc, r) => acc + (r.words || []).filter((w) => w.review?.verified).length,
    0
  );

  return {
    success: true,
    totalRoots: formattedData.length,
    totalWords: formattedData.reduce((acc, r) => acc + (r.words?.length || 0), 0),
    totalVerified: verifiedTotal || Object.values(reviews).filter((r) => r.verified).length,
  };
}
