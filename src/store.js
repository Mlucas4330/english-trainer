const KEY = "reviewDeck";
const DAY = 86400000;
const INTERVALS = [1, 3, 7, 16, 35, 90];

async function readDeck() {
  try {
    const { [KEY]: deck } = await chrome.storage.local.get(KEY);
    return Array.isArray(deck) ? deck : [];
  } catch (e) { return []; }
}

async function writeDeck(deck) {
  try { await chrome.storage.local.set({ [KEY]: deck }); } catch (e) { /* best-effort */ }
}

function dueAt(box, now) {
  return now + INTERVALS[Math.min(box, INTERVALS.length - 1)] * DAY;
}

export async function recordMiss(item) {
  if (!item || !item.id) return;
  const now = Date.now();
  const deck = await readDeck();
  const existing = deck.find((d) => d.id === item.id);
  if (existing) {
    existing.timesSeen += 1;
    existing.timesWrong += 1;
    existing.box = 0;
    existing.nextDue = dueAt(0, now);
    Object.assign(existing, item, { timesSeen: existing.timesSeen, timesWrong: existing.timesWrong, box: 0, nextDue: existing.nextDue });
  } else {
    deck.push({ ...item, timesSeen: 1, timesWrong: 1, box: 0, nextDue: dueAt(0, now) });
  }
  await writeDeck(deck);
}

export async function getDue(now = Date.now()) {
  const deck = await readDeck();
  return deck.filter((d) => d.nextDue <= now).sort((a, b) => a.nextDue - b.nextDue);
}

export async function updateReview(id, gotIt) {
  const now = Date.now();
  const deck = await readDeck();
  const it = deck.find((d) => d.id === id);
  if (!it) return;
  it.timesSeen += 1;
  if (gotIt) {
    it.box = Math.min(it.box + 1, INTERVALS.length - 1);
    it.nextDue = dueAt(it.box, now);
  } else {
    it.timesWrong += 1;
    it.box = 0;
    it.nextDue = dueAt(0, now);
  }
  await writeDeck(deck);
}

export async function getStats(now = Date.now()) {
  const deck = await readDeck();
  const due = deck.filter((d) => d.nextDue <= now).length;
  const byLabel = {};
  for (const d of deck) {
    const label = d.focus || d.theme || d.type;
    byLabel[label] = (byLabel[label] || 0) + d.timesWrong;
  }
  let weakest = null, worst = 0;
  for (const [label, n] of Object.entries(byLabel)) if (n > worst) { worst = n; weakest = label; }
  return { due, total: deck.length, weakest };
}
