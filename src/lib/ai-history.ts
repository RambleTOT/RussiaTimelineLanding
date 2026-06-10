/** Recent AI questions, persisted in sessionStorage (never the API key). */
const KEY = 'rt-ai-history';
const MAX = 8;

export function getRecentQuestions(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function addRecentQuestion(question: string): void {
  const trimmed = question.trim();
  if (!trimmed) return;
  try {
    const list = [trimmed, ...getRecentQuestions().filter((q) => q !== trimmed)].slice(0, MAX);
    sessionStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — non-fatal */
  }
}
