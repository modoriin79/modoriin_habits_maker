export const KEY = 'little-ritual:v1';
export const PALETTE = [
  { name: '세이지', color: '#9eb5a1' }, { name: '앰버', color: '#cba674' },
  { name: '라벤더', color: '#b6a4cb' }, { name: '로즈', color: '#cca2aa' },
  { name: '하늘', color: '#9fbfce' },
];
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function freshState(name = '') { return { version: 1, name, entries: [], jars: [] }; }
export function completedToday(state, date = localDate()) { return state.entries.some(e => e.date === date); }
export function currentEntries(state) { return state.entries.slice(state.jars.length * 30); }
export function addEntry(state, entry, random = Math.random) {
  if (completedToday(state, entry.date)) return state;
  const next = structuredClone(state);
  next.entries.push(entry);
  if (next.entries.length % 30 === 0) {
    const previous = next.jars.at(-1)?.color;
    const choices = PALETTE.filter(p => p.color !== previous);
    const color = choices[Math.floor(random() * choices.length)].color;
    next.jars.push({ color, date: entry.date, positions: next.entries.slice(-30).map(e => e.position) });
  }
  return next;
}
export function undoToday(state, date = localDate()) {
  if (state.entries.at(-1)?.date !== date) return state;
  const next = structuredClone(state);
  if (next.entries.length % 30 === 0) next.jars.pop();
  next.entries.pop();
  return next;
}
export function validateState(value) {
  if (!value || value.version !== 1 || typeof value.name !== 'string' || value.name.length > 50 || !Array.isArray(value.entries) || !Array.isArray(value.jars)) throw new Error('지원하지 않는 기록 파일이에요.');
  if (value.entries.length > 100000 || value.jars.length !== Math.floor(value.entries.length / 30)) throw new Error('기록 개수가 올바르지 않아요.');
  const dates = new Set();
  const validPosition = p => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite) && Math.hypot(p[0], p[2]) <= 0.85 && p[1] >= 0.22 && p[1] < 3;
  for (const e of value.entries) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date) || dates.has(e.date) || !validPosition(e.position)) throw new Error('기록 데이터가 올바르지 않아요.');
    dates.add(e.date);
  }
  for (let i = 0; i < value.jars.length; i++) {
    const jar = value.jars[i];
    if (!PALETTE.some(p => p.color === jar.color) || jar.date !== value.entries[i * 30 + 29].date || !Array.isArray(jar.positions) || jar.positions.length !== 30 || !jar.positions.every(validPosition)) throw new Error('유리병 데이터가 올바르지 않아요.');
  }
  return value;
}
export function loadState(storage = localStorage) {
  const raw = storage.getItem(KEY);
  return raw ? validateState(JSON.parse(raw)) : freshState();
}
export function saveState(state, storage = localStorage) { storage.setItem(KEY, JSON.stringify(state)); }
