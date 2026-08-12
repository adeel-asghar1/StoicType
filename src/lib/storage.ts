export type TestRecord = {
  id: string;
  name: string;
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number;
  mode: string;
  createdAt: string;
};

const RECORDS_KEY = "stoictype:test-records";
const NAME_KEY = "stoictype:player-name";
const STREAK_KEY = "stoictype:daily-streak";

export function getRecords(): TestRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecord(record: TestRecord) {
  const records = getRecords();
  records.push(record);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records.slice(-200)));
}

export function getPlayerName() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NAME_KEY) || "";
}

export function savePlayerName(name: string) {
  localStorage.setItem(NAME_KEY, name.trim().slice(0, 24));
}

export function clearRecords() {
  localStorage.removeItem(RECORDS_KEY);
}

export function getLeaderboard(records: TestRecord[] = getRecords()) {
  const byName = new Map<string, TestRecord>();
  for (const record of records) {
    const key = record.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing || record.wpm > existing.wpm || (record.wpm === existing.wpm && record.accuracy > existing.accuracy)) {
      byName.set(key, record);
    }
  }
  return [...byName.values()]
    .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy || a.name.localeCompare(b.name))
    .map((record, index) => ({ ...record, rank: index + 1 }));
}

export function getPlayerStats(name: string, records: TestRecord[] = getRecords()) {
  const mine = records.filter((record) => record.name.toLowerCase() === name.toLowerCase());
  if (!mine.length) return { bestWpm: 0, averageWpm: 0, bestAccuracy: 0, tests: 0 };
  return {
    bestWpm: Math.max(...mine.map((r) => r.wpm)),
    averageWpm: Math.round(mine.reduce((sum, r) => sum + r.wpm, 0) / mine.length),
    bestAccuracy: Math.max(...mine.map((r) => r.accuracy)),
    tests: mine.length,
  };
}


export function getDailyStreak() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { streak?: number; lastDate?: string };
    if (!parsed.lastDate || !parsed.streak) return 0;
    const last = new Date(`${parsed.lastDate}T00:00:00`);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.round((todayStart.getTime() - last.getTime()) / 86400000);
    return diff <= 1 ? parsed.streak : 0;
  } catch {
    return 0;
  }
}

export function markDailyStreak() {
  if (typeof window === "undefined") return 0;
  const date = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const parsed = raw ? JSON.parse(raw) as { streak?: number; lastDate?: string } : null;
    let streak = 1;
    if (parsed?.lastDate === date) {
      streak = parsed.streak ?? 1;
    } else if (parsed?.lastDate) {
      const previous = new Date(`${parsed.lastDate}T00:00:00`);
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const gap = Math.round((todayStart.getTime() - previous.getTime()) / 86400000);
      streak = gap === 1 ? Math.max(1, (parsed.streak ?? 0) + 1) : 1;
    }
    localStorage.setItem(STREAK_KEY, JSON.stringify({ streak, lastDate: date }));
    return streak;
  } catch {
    return 1;
  }
}
