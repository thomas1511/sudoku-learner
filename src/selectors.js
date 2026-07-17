// Derived, read-only views over `state`: the current board, whether the lesson's
// prelude is complete, visible candidates, and the current coach/fast move+state.
import { state, getManual } from './state.js';
import { legalCandidates } from './core/geometry.js';
import { traceState } from './core/solver.js';

export function manualBoard() {
  const s = getManual();
  const c = state.lessonVariant.case;
  return c.puzzle.map((v, i) => v || s.values[i] || 0);
}

export function lessonReady() {
  const b = manualBoard();
  const c = state.lessonVariant.case;
  return state.lessonVariant.trace
    .slice(0, c.techniqueStep)
    .every((m) => (m.placements || []).every(([i, d]) => b[i] === d));
}

export function remainingPrelude() {
  const b = manualBoard();
  const c = state.lessonVariant.case;
  return state.lessonVariant.trace
    .slice(0, c.techniqueStep)
    .filter((m) => (m.placements || []).some(([i, d]) => b[i] !== d)).length;
}

export function manualCandidates(i) {
  const b = manualBoard();
  if (b[i]) return [];
  if (state.hintLevel) {
    const st = traceState(state.lessonVariant, state.lessonVariant.case.techniqueStep);
    return [...st.cands[i]].sort((a, b) => a - b);
  }
  if (state.autoNotes) return legalCandidates(i, b);
  const mask = getManual().notes[i] || 0;
  const out = [];
  for (let d = 1; d <= 9; d++) if (mask & (1 << d)) out.push(d);
  return out;
}

export function currentLessonState() {
  return state.coachMode ? traceState(state.lessonVariant, state.coachPos) : null;
}
export function currentLessonMove() {
  return state.coachMode && state.coachPos < state.lessonVariant.trace.length
    ? state.lessonVariant.trace[state.coachPos]
    : null;
}
export function currentFastState() {
  return traceState(state.fastVariant, state.fastPos);
}
export function currentFastMove() {
  return state.fastPos < state.fastVariant.trace.length
    ? state.fastVariant.trace[state.fastPos]
    : null;
}
