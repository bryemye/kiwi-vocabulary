/**
 * Editorial Review & Lexicon Management Service
 * 
 * Provides persistence (via localStorage), schema merging, and JSON export
 * for admin-facing editorial reviews and verified certification badges.
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
  },
};

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
  return reviews[key] || null;
}

/**
 * Save or update editorial review for a word
 */
export function saveWordReview(word, reviewData) {
  if (!word) return null;
  const key = String(word).toLowerCase().trim();
  const reviews = getStoredReviews();

  const isVerified = Boolean(reviewData.verified);
  const updatedReview = {
    verified: isVerified,
    verifiedAt: isVerified 
      ? (reviewData.verifiedAt || new Date().toISOString()) 
      : (reviewData.verifiedAt || null),
    verifiedBy: (reviewData.verifiedBy || 'Admin').trim(),
    notes: (reviewData.notes || '').trim(),
  };

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
    if (storedReview) {
      return { ...w, review: { ...storedReview } };
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
      if (storedReview) {
        return { ...w, review: { ...storedReview } };
      }
      return w;
    });
    return { ...root, words: updatedWords };
  });
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
 * Includes all verified flags, reviewer metadata, and editorial notes.
 */
export function exportUpdatedLexiconJson(rootsList = [], wordsList = []) {
  const reviews = getStoredReviews();

  // If rootsList has words, format using roots
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
          const review = reviews[key] || w.review;
          const wordObj = {
            word: w.word,
            prefix: w.prefix || '',
            suffix: w.suffix || '',
            definition: w.definition,
            sat_sentence: w.sat_sentence,
            connotation: w.connotation || 'neutral',
            ...(w.mnemonic ? { mnemonic: w.mnemonic } : {}),
          };
          if (review && (review.verified || review.notes)) {
            wordObj.review = {
              verified: Boolean(review.verified),
              ...(review.verifiedAt ? { verifiedAt: review.verifiedAt } : {}),
              ...(review.verifiedBy ? { verifiedBy: review.verifiedBy } : {}),
              ...(review.notes ? { notes: review.notes } : {}),
            };
          }
          return wordObj;
        }),
      };
      return rootEntry;
    });
  } else if (wordsList && wordsList.length > 0) {
    // Group by root details if rootsList not available
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
      const review = reviews[key] || w.review;
      const wordObj = {
        word: w.word,
        prefix: w.prefix || '',
        suffix: w.suffix || '',
        definition: w.definition,
        sat_sentence: w.sat_sentence,
        connotation: w.connotation || 'neutral',
        ...(w.mnemonic ? { mnemonic: w.mnemonic } : {}),
      };
      if (review && (review.verified || review.notes)) {
        wordObj.review = {
          verified: Boolean(review.verified),
          ...(review.verifiedAt ? { verifiedAt: review.verifiedAt } : {}),
          ...(review.verifiedBy ? { verifiedBy: review.verifiedBy } : {}),
          ...(review.notes ? { notes: review.notes } : {}),
        };
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

  return {
    success: true,
    totalRoots: formattedData.length,
    totalWords: formattedData.reduce((acc, r) => acc + (r.words?.length || 0), 0),
    totalVerified: Object.values(reviews).filter((r) => r.verified).length,
  };
}
