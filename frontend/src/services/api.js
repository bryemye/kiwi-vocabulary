const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

// --------------------------------------------------------------------------------
// Kiwi Vocabulary Product APIs
// --------------------------------------------------------------------------------

export async function fetchRoots() {
  const res = await fetch(`${API_BASE}/vocab/roots/`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch roots (HTTP ${res.status})`);
  return res.json();
}

export async function fetchWords(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/vocab/words/${query ? `?${query}` : ''}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch vocabulary words (HTTP ${res.status})`);
  return res.json();
}

export async function fetchWordSession(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/vocab/session/${query ? `?${query}` : ''}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch vocabulary session (HTTP ${res.status})`);
  return res.json();
}

/**
 * Returns YYYY-MM-DD based on the user's local device midnight clock.
 */
export function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetch the deterministic daily 15-word challenge deck for guest users.
 */
export async function fetchDailyDeck(dateStr = getLocalDateString()) {
  return fetchWordSession({ count: 15, daily: 1, date: dateStr });
}

// --------------------------------------------------------------------------------
// Instant Cache & Guest Persistence Helpers (localStorage)
// --------------------------------------------------------------------------------

export function getCachedDailyDeck(dateStr = getLocalDateString()) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`kiwi_daily_deck_${dateStr}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setCachedDailyDeck(dateStr, deck) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`kiwi_daily_deck_${dateStr}`, JSON.stringify(deck));
  } catch (e) {}
}

export function getGuestSession(dateStr = getLocalDateString()) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`kiwi_guest_session_${dateStr}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveGuestSession(dateStr, sessionData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`kiwi_guest_session_${dateStr}`, JSON.stringify(sessionData));
  } catch (e) {}
}

export function clearGuestSession(dateStr = getLocalDateString()) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`kiwi_guest_session_${dateStr}`);
  } catch (e) {}
}

export function getCachedUserDeck(userId) {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = localStorage.getItem(`kiwi_user_deck_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setCachedUserDeck(userId, deck) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`kiwi_user_deck_${userId}`, JSON.stringify(deck));
  } catch (e) {}
}

export async function fetchVocabStats() {
  const res = await fetch(`${API_BASE}/vocab/stats/`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch vocabulary stats (HTTP ${res.status})`);
  return res.json();
}

// --------------------------------------------------------------------------------
// Kiwi Math & Reading Standalone Module APIs
// --------------------------------------------------------------------------------

export async function fetchQuestions(section = 'MATH') {
  const url = section.toUpperCase() === 'MATH' 
    ? `${API_BASE}/math/questions/` 
    : `${API_BASE}/reading/questions/`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    // Fallback if needed
    const fallback = await fetch(`${API_BASE}/questions/?section=${section}`, { credentials: 'include' });
    if (!fallback.ok) throw new Error(`Failed to fetch questions (HTTP ${fallback.status})`);
    return fallback.json();
  }
  return res.json();
}

export async function fetchReadingPassages() {
  const res = await fetch(`${API_BASE}/reading/passages/`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch reading passages (HTTP ${res.status})`);
  return res.json();
}

// --------------------------------------------------------------------------------
// Kiwi Platform Core APIs (Dashboard & Unified Activity Logging)
// --------------------------------------------------------------------------------

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/platform/dashboard/stats/`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch platform dashboard statistics (HTTP ${res.status})`);
  return res.json();
}

export async function logStudyAttempt({ 
  item_type, 
  word_id = null, 
  word = null, 
  question_id = null, 
  question = null, 
  section = '',
  is_correct, 
  seconds_spent = 0,
  metadata = {}
}) {
  const actualWordId = word_id ?? word;
  const actualQuestionId = question_id ?? question;

  const payload = {
    item_type,
    is_correct,
    seconds_spent,
    metadata,
  };

  if (actualWordId != null) {
    payload.word_id = actualWordId;
  }
  if (actualQuestionId != null) {
    payload.question_id = actualQuestionId;
  }
  if (section) {
    payload.section = section;
  }

  const res = await fetch(`${API_BASE}/platform/study-logs/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to log study attempt to platform:', errorText);
    throw new Error('Failed to log study attempt');
  }
  return res.json();
}

// --------------------------------------------------------------------------------
// Platform Core Magic Link Authentication APIs
// --------------------------------------------------------------------------------

export async function requestMagicLink(email) {
  const res = await fetch(`${API_BASE}/platform/auth/magic-link/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Failed to dispatch magic link');
  }
  return data;
}

export async function verifyMagicLink(token, sessionId = null, action = 'verify') {
  const payload = { token, action };
  if (sessionId) {
    payload.session_id = sessionId;
  }

  const res = await fetch(`${API_BASE}/platform/auth/verify-magic-link/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || data.detail || 'Failed to verify magic link');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function pollMagicLinkStatus(sessionId, deviceSecret) {
  const res = await fetch(`${API_BASE}/platform/auth/poll-status/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ session_id: sessionId, device_secret: deviceSecret }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'Failed to poll login status');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function fetchCurrentUser() {
  try {
    const res = await fetch(`${API_BASE}/platform/auth/me/`, {
      method: 'GET',
      credentials: 'include',
    });
    if (res.status === 401) {
      return null;
    }
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch authenticated user session:', err);
    return null;
  }
}

export async function logoutUser() {
  const res = await fetch(`${API_BASE}/platform/auth/logout/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Failed to logout');
  }
  return data;
}

// --------------------------------------------------------------------------------
// Vocabulary Word Management APIs (Staff / Admin Only)
// --------------------------------------------------------------------------------

export async function updateVocabularyWord(id, wordData) {
  const res = await fetch(`${API_BASE}/vocab/words/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(wordData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Failed to update vocabulary word');
  }
  return data;
}
