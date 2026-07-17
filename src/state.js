// Central mutable application state + localStorage persistence.
// A single `state` object is shared (and mutated) across modules; `saved` is the
// serialisable slice written to localStorage.
import { BASE_CASES } from './data/cases.js';
import { randomSeed } from './core/rng.js';

const STORE = 'sudoku-lab-v5-fastest';

export function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || {};
  } catch {
    return {};
  }
}

export const saved = loadSaved();

const startIndex = saved.lessonIndex || 0;

export const state = {
  appMode: saved.mode || 'lesson',
  lessonIndex: startIndex,
  lessonSeed: (saved.lessonSeeds || {})[BASE_CASES[startIndex].id] || randomSeed(),
  lessonVariant: null,
  lessonState: null,
  selected: null,
  pencil: false,
  autoNotes: false,
  showCoords: false,
  hintLevel: 0,
  solutionView: false,
  wrong: new Set(),
  undo: [],
  coachMode: false,
  coachPos: 0,
  coachTimer: null,
  fastSession: saved.fastSession || null,
  fastVariant: null,
  fastPos: 0,
  fastStage: 0,
  fastGuessDone: false,
  stats: saved.stats || { correct: 0, attempts: 0, streak: 0, best: 0 },
};

export function persist() {
  saved.mode = state.appMode;
  saved.lessonIndex = state.lessonIndex;
  saved.lessonSeeds = saved.lessonSeeds || {};
  saved.lessonSeeds[BASE_CASES[state.lessonIndex].id] = state.lessonSeed;
  saved.fastSession = state.fastSession;
  saved.stats = state.stats;
  try {
    localStorage.setItem(STORE, JSON.stringify(saved));
  } catch {
    /* storage unavailable (e.g. private mode) */
  }
}

// Per-variant manual solving progress, keyed by case id + seed.
function manualKey() {
  return `lesson:${state.lessonVariant.case.id}:${state.lessonSeed}`;
}

export function freshManual() {
  return { values: Array(81).fill(0), notes: Array(81).fill(0), solved: false };
}

export function getManual() {
  saved.manual = saved.manual || {};
  if (!saved.manual[manualKey()]) saved.manual[manualKey()] = freshManual();
  return saved.manual[manualKey()];
}

export function cloneManual() {
  const s = getManual();
  return { values: [...s.values], notes: [...s.notes], solved: s.solved };
}

export function applyManualSnapshot(x) {
  saved.manual[manualKey()] = { values: [...x.values], notes: [...x.notes], solved: x.solved };
  persist();
}
