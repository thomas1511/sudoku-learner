// Puzzle-variant generation. A base case is transformed (band/stack/row/col
// permutation, optional transpose, digit relabelling) into a fresh but
// isomorphic puzzle, so the same technique can be practised on endless layouts.
import { rng32, shuffled } from './rng.js';

export function makeTransform(seed) {
  const rng = rng32(seed);
  const bandOrder = shuffled([0, 1, 2], rng);
  const stackOrder = shuffled([0, 1, 2], rng);
  const newRows = [];
  const newCols = [];
  for (const b of bandOrder) for (const x of shuffled([0, 1, 2], rng)) newRows.push(b * 3 + x);
  for (const s of stackOrder) for (const x of shuffled([0, 1, 2], rng)) newCols.push(s * 3 + x);
  const rowMap = Array(9);
  const colMap = Array(9);
  newRows.forEach((old, nw) => (rowMap[old] = nw));
  newCols.forEach((old, nw) => (colMap[old] = nw));
  const transpose = rng() < 0.5;
  const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  const digitMap = [0, ...digits];
  function mapIndex(i) {
    let r = rowMap[Math.floor(i / 9)];
    let c = colMap[i % 9];
    if (transpose) [r, c] = [c, r];
    return r * 9 + c;
  }
  return { mapIndex, mapDigit: (d) => digitMap[d] || 0 };
}

// Build a randomised, validated variant of a base case together with its trace.
export function makeVariant(base, trace, seed) {
  const t = makeTransform(seed);
  const puzzle = Array(81).fill(0);
  const solution = Array(81).fill(0);
  for (let i = 0; i < 81; i++) {
    puzzle[t.mapIndex(i)] = t.mapDigit(base.puzzle[i]);
    solution[t.mapIndex(i)] = t.mapDigit(base.solution[i]);
  }
  const candidates = {};
  for (const [k, ds] of Object.entries(base.candidates || {}))
    candidates[String(t.mapIndex(Number(k)))] = ds.map(t.mapDigit).sort((a, b) => a - b);
  const targets = {};
  for (const [k, ds] of Object.entries(base.targets || {}))
    targets[String(t.mapIndex(Number(k)))] = ds.map(t.mapDigit).sort((a, b) => a - b);
  const roles = {};
  for (const [k, v] of Object.entries(base.roles || {}))
    roles[String(t.mapIndex(Number(k)))] = v;
  const c = {
    ...base,
    puzzle,
    solution,
    candidates,
    targets,
    roles,
    pattern: (base.pattern || []).map(t.mapIndex),
    focusDigits: (base.focusDigits || []).map(t.mapDigit).sort((a, b) => a - b),
    variantSeed: seed,
  };
  const tr = trace.map((m) => ({
    title: m.title,
    kind: m.kind,
    tech: m.tech,
    placements: (m.placements || []).map(([i, d]) => [t.mapIndex(i), t.mapDigit(d)]),
    eliminations: (m.eliminations || []).map(([i, d]) => [t.mapIndex(i), t.mapDigit(d)]),
    pattern: (m.pattern || []).map(t.mapIndex),
    roles: Object.fromEntries(
      Object.entries(m.roles || {}).map(([k, v]) => [String(t.mapIndex(Number(k))), v]),
    ),
  }));
  return { case: c, trace: tr };
}
