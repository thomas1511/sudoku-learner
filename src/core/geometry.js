// Board geometry (rows, columns, boxes, peers) and coordinate/label helpers.
// A board is a flat array of 81 cells; index i maps to row Math.floor(i/9), col i%9.

export const ROWS = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => r * 9 + c),
);
export const COLS = Array.from({ length: 9 }, (_, c) =>
  Array.from({ length: 9 }, (_, r) => r * 9 + c),
);
export const BOXES = Array.from({ length: 9 }, (_, b) => {
  const br = Math.floor(b / 3) * 3;
  const bc = (b % 3) * 3;
  return Array.from({ length: 9 }, (_, k) => (br + Math.floor(k / 3)) * 9 + bc + (k % 3));
});
export const UNITS = [...ROWS, ...COLS, ...BOXES];

// For each cell, the set of cells sharing its row, column or box (excluding itself).
export const PEERS = Array.from({ length: 81 }, (_, i) => {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
  return [...new Set([...ROWS[r], ...COLS[c], ...BOXES[b]])].filter((x) => x !== i);
});

export const coord = (i) => `r${Math.floor(i / 9) + 1}c${(i % 9) + 1}`;

export function coords(xs) {
  const a = [...new Set(xs)].map(coord);
  return a.length < 2
    ? a[0] || ''
    : a.length === 2
      ? `${a[0]} en ${a[1]}`
      : `${a.slice(0, -1).join(', ')} en ${a.at(-1)}`;
}

export function digitList(ds) {
  const a = [...new Set(ds)].sort((x, y) => x - y);
  return a.length === 1
    ? String(a[0])
    : a.length === 2
      ? `${a[0]} en ${a[1]}`
      : `${a.slice(0, -1).join(', ')} en ${a.at(-1)}`;
}

export function unitLabel(unit) {
  const i = UNITS.indexOf(unit);
  return i < 9 ? `rij ${i + 1}` : i < 18 ? `kolom ${i - 8}` : `blok ${i - 17}`;
}

export function containingUnit(indices, extra = []) {
  const all = [...new Set([...indices, ...extra])];
  return (
    UNITS.find((u) => all.every((i) => u.includes(i))) ||
    UNITS.find((u) => indices.every((i) => u.includes(i))) ||
    null
  );
}

// Digits still legal for an empty cell given the current board.
export function legalCandidates(index, board) {
  if (board[index]) return [];
  const used = new Set(PEERS[index].map((i) => board[i]).filter(Boolean));
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !used.has(n));
}
