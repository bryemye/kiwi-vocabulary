const API_BASE = '/api';

export async function fetchRoots() {
  const res = await fetch(`${API_BASE}/roots/`);
  if (!res.ok) throw new Error('Failed to fetch roots');
  return res.json();
}

export async function fetchWords(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/words/${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch vocabulary words');
  return res.json();
}

export async function fetchWordSession(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/words/session/${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch vocabulary session');
  return res.json();
}

export async function fetchQuestions(section = '') {
  const query = section ? `?section=${section}` : '';
  const res = await fetch(`${API_BASE}/questions/${query}`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function fetchReadingPassages() {
  const res = await fetch(`${API_BASE}/reading-passages/`);
  if (!res.ok) throw new Error('Failed to fetch reading passages');
  return res.json();
}

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats/`);
  if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
  return res.json();
}

export async function logStudyAttempt({ 
  item_type, 
  word_id = null, 
  word = null, 
  question_id = null, 
  question = null, 
  is_correct, 
  seconds_spent = 0 
}) {
  const actualWordId = word_id ?? word;
  const actualQuestionId = question_id ?? question;

  const payload = {
    item_type,
    is_correct,
    seconds_spent,
  };

  if (actualWordId != null) {
    payload.word_id = actualWordId;
  }
  if (actualQuestionId != null) {
    payload.question_id = actualQuestionId;
  }

  const res = await fetch(`${API_BASE}/study-logs/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to log study attempt:', errorText);
    throw new Error('Failed to log study attempt');
  }
  return res.json();
}
