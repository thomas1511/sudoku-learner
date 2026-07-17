// Candidate/trace state maths: replay a solve trace move-by-move and query the
// board + candidate sets at any point. Pure functions over (variant, position).
import { PEERS, legalCandidates } from './geometry.js';

export function initialTraceState(v) {
  const board = [...v.case.puzzle];
  const cands = Array.from({ length: 81 }, (_, i) =>
    new Set(board[i] ? [] : legalCandidates(i, board)),
  );
  return { board, cands };
}

export function applyMoveToState(st, m) {
  for (const [i, d] of m.eliminations || []) if (!st.board[i]) st.cands[i].delete(d);
  for (const [i, d] of m.placements || []) {
    st.board[i] = d;
    st.cands[i] = new Set();
    for (const j of PEERS[i]) if (!st.board[j]) st.cands[j].delete(d);
  }
}

export function traceState(v, pos) {
  const st = initialTraceState(v);
  for (let i = 0; i < pos; i++) applyMoveToState(st, v.trace[i]);
  return st;
}

export function moveDigits(m) {
  return [
    ...new Set([
      ...(m.placements || []).map((x) => x[1]),
      ...(m.eliminations || []).map((x) => x[1]),
    ]),
  ].sort((a, b) => a - b);
}

export function postCandidates(st, m, i) {
  const s = new Set(st.cands[i] || []);
  for (const [j, d] of m.eliminations || []) if (j === i) s.delete(d);
  return [...s].sort((a, b) => a - b);
}
