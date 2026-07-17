// User actions and mode orchestration: cell entry, lesson navigation, the coach
// walkthrough and the fast-mode quiz. Every action mutates `state` and then calls
// renderAll() to repaint.
import {
  state,
  saved,
  persist,
  getManual,
  cloneManual,
  applyManualSnapshot,
} from './state.js';
import { PEERS } from './core/geometry.js';
import { makeVariant } from './core/variant.js';
import { randomSeed } from './core/rng.js';
import { BASE_CASES } from './data/cases.js';
import { BASE_TRACES } from './data/traces.js';
import { manualBoard, currentFastMove } from './selectors.js';
import { toast } from './ui/toast.js';
import { renderAll } from './ui/render.js';

// --- Lesson: manual solving -------------------------------------------------

export function selectCell(i) {
  if (state.solutionView) return;
  state.selected = i;
  renderAll();
}

export function enterDigit(d) {
  if (state.appMode !== 'lesson' || state.coachMode || state.solutionView || state.selected === null)
    return;
  const c = state.lessonVariant.case;
  const s = getManual();
  if (c.puzzle[state.selected]) {
    toast('Dit is een gegeven cijfer');
    return;
  }
  state.undo.push(cloneManual());
  state.wrong.delete(state.selected);
  if (state.pencil) {
    if (s.values[state.selected]) s.values[state.selected] = 0;
    s.notes[state.selected] ^= 1 << d;
  } else {
    s.values[state.selected] = d;
    s.notes[state.selected] = 0;
    for (const j of PEERS[state.selected]) s.notes[j] &= ~(1 << d);
  }
  persist();
  checkSolved();
  renderAll();
}

export function erase() {
  if (state.appMode !== 'lesson' || state.coachMode || state.solutionView || state.selected === null)
    return;
  const c = state.lessonVariant.case;
  const s = getManual();
  if (c.puzzle[state.selected]) return;
  state.undo.push(cloneManual());
  s.values[state.selected] = 0;
  s.notes[state.selected] = 0;
  state.wrong.delete(state.selected);
  persist();
  renderAll();
}

export function checkSolved() {
  const c = state.lessonVariant.case;
  const s = getManual();
  if (
    c.puzzle.every((g, i) => g || s.values[i]) &&
    s.values.every((v, i) => c.puzzle[i] || v === c.solution[i])
  ) {
    s.solved = true;
    persist();
    toast('Opgelost — sterk gedaan!');
  }
}

// --- Lesson: navigation -----------------------------------------------------

export function loadLessonVariant() {
  const base = BASE_CASES[state.lessonIndex];
  state.lessonVariant = makeVariant(base, BASE_TRACES[base.id], state.lessonSeed);
  state.lessonState = getManual();
}

export function newLessonExample() {
  if (state.coachMode) exitCoach();
  if (
    manualBoard().some((v, i) => !state.lessonVariant.case.puzzle[i] && v) &&
    !confirm('Een nieuw voorbeeld maken? Je huidige voortgang blijft bij dit veld bewaard.')
  )
    return;
  state.lessonSeed = randomSeed();
  saved.lessonSeeds = saved.lessonSeeds || {};
  saved.lessonSeeds[BASE_CASES[state.lessonIndex].id] = state.lessonSeed;
  loadLessonVariant();
  state.selected = null;
  state.hintLevel = 0;
  state.solutionView = false;
  state.wrong.clear();
  state.undo = [];
  persist();
  renderAll();
  toast('Nieuw gevalideerd voorbeeld gegenereerd');
}

export function switchLesson(index) {
  stopCoach();
  state.coachMode = false;
  document.body.classList.remove('coach-active');
  state.lessonIndex = (index + BASE_CASES.length) % BASE_CASES.length;
  state.lessonSeed = (saved.lessonSeeds || {})[BASE_CASES[state.lessonIndex].id] || randomSeed();
  loadLessonVariant();
  state.selected = null;
  state.hintLevel = 0;
  state.solutionView = false;
  state.wrong.clear();
  state.undo = [];
  persist();
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Coach walkthrough ------------------------------------------------------

export function startCoach(jump) {
  state.coachMode = true;
  state.coachPos = jump ? state.lessonVariant.case.techniqueStep : 0;
  state.hintLevel = 0;
  state.solutionView = false;
  state.selected = null;
  document.body.classList.add('coach-active');
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function exitCoach() {
  stopCoach();
  state.coachMode = false;
  document.body.classList.remove('coach-active');
  renderAll();
}

export function coachNext() {
  if (state.coachPos < state.lessonVariant.trace.length) {
    state.coachPos++;
    renderAll();
  } else {
    stopCoach();
    toast('De volledige oplossing is bereikt');
  }
}

export function coachPrev() {
  if (state.coachPos > 0) {
    state.coachPos--;
    renderAll();
  }
}

export function toggleCoachAuto() {
  if (state.coachTimer) {
    stopCoach();
    renderAll();
    return;
  }
  const tick = () => {
    if (!state.coachMode || state.coachPos >= state.lessonVariant.trace.length) {
      stopCoach();
      renderAll();
      return;
    }
    state.coachPos++;
    renderAll();
    state.coachTimer = setTimeout(tick, Number(document.getElementById('coachSpeed').value));
  };
  state.coachTimer = setTimeout(tick, 300);
  renderAll();
}

export function stopCoach() {
  if (state.coachTimer) {
    clearTimeout(state.coachTimer);
    state.coachTimer = null;
  }
}

// --- Fast mode (fastest-move quiz) ------------------------------------------

export function loadFastVariant() {
  if (!state.fastSession)
    state.fastSession = {
      baseIndex: Math.floor(Math.random() * BASE_CASES.length),
      seed: randomSeed(),
      pos: 0,
    };
  const base = BASE_CASES[state.fastSession.baseIndex];
  state.fastVariant = makeVariant(base, BASE_TRACES[base.id], state.fastSession.seed);
  state.fastPos = Math.max(0, Math.min(state.fastSession.pos || 0, state.fastVariant.trace.length));
  state.fastStage = 0;
  state.fastGuessDone = false;
  state.fastPatternLit = false;
}

export function newFast() {
  let idx = Math.floor(Math.random() * BASE_CASES.length);
  if (state.fastSession && BASE_CASES.length > 1)
    while (idx === state.fastSession.baseIndex) idx = Math.floor(Math.random() * BASE_CASES.length);
  state.fastSession = { baseIndex: idx, seed: randomSeed(), pos: 0 };
  state.fastPos = 0;
  state.fastStage = 0;
  state.fastGuessDone = false;
  state.fastPatternLit = false;
  loadFastVariant();
  persist();
  renderAll();
  toast('Nieuw gemengd oefenveld gegenereerd');
}

export function fastAction() {
  const m = currentFastMove();
  if (!m) {
    newFast();
    return;
  }
  if (state.fastStage < 3) {
    state.fastStage++;
    renderAll();
    return;
  }
  state.fastPos++;
  state.fastSession.pos = state.fastPos;
  state.fastStage = 0;
  state.fastGuessDone = false;
  state.fastPatternLit = false;
  persist();
  renderAll();
  if (state.fastPos >= state.fastVariant.trace.length) toast('Sudoku logisch afgerond');
}

export function checkGuess() {
  const m = currentFastMove();
  const val = document.getElementById('guessSelect').value;
  if (!m || !val) {
    toast('Kies eerst een techniek');
    return;
  }
  if (state.fastGuessDone) {
    toast('Je antwoord voor deze zet is al geteld');
    return;
  }
  state.fastGuessDone = true;
  state.stats.attempts++;
  const correct = val === m.tech;
  if (correct) {
    state.stats.correct++;
    state.stats.streak++;
    state.stats.best = Math.max(state.stats.best, state.stats.streak);
    toast('Juist — dat is de snelste zet');
    state.fastStage = Math.max(state.fastStage, 1);
    state.fastPatternLit = true;
  } else {
    state.stats.streak = 0;
    toast('Nog niet. Vraag een tip of onthul de techniek.');
  }
  persist();
  renderAll();
  if (correct) glowFastPattern();
}

// Briefly pulse the freshly marked pattern cells so a correct answer visibly
// "lights up" the board. The .glow class animates once; later repaints recreate
// the cells without it, so the highlight persists but the pulse does not repeat.
function glowFastPattern() {
  document
    .querySelectorAll(
      '#fastBoard .cell.move-pattern, #fastBoard .cell.move-target, #fastBoard .cell.move-pivot, #fastBoard .cell.move-wing, #fastBoard .cell.move-a, #fastBoard .cell.move-b, #fastBoard .cell.move-place',
    )
    .forEach((c) => c.classList.add('glow'));
}

export function fastBack() {
  if (state.fastPos > 0) {
    state.fastPos--;
    state.fastSession.pos = state.fastPos;
    state.fastStage = 0;
    state.fastGuessDone = false;
    state.fastPatternLit = false;
    persist();
    renderAll();
  }
}

export function fastReset() {
  state.fastPos = 0;
  state.fastSession.pos = 0;
  state.fastStage = 0;
  state.fastGuessDone = false;
  state.fastPatternLit = false;
  persist();
  renderAll();
}

// --- Mode switch + solution modal ------------------------------------------

export function setMode(mode) {
  stopCoach();
  state.appMode = mode;
  state.coachMode = false;
  document.body.classList.remove('coach-active');
  document.getElementById('lessonMode').classList.toggle('hidden', mode !== 'lesson');
  document.getElementById('fastMode').classList.toggle('hidden', mode !== 'fast');
  document.getElementById('lessonNav').classList.toggle('hidden', mode !== 'lesson');
  document.getElementById('fastNav').classList.toggle('hidden', mode !== 'fast');
  document.getElementById('lessonTab').classList.toggle('active', mode === 'lesson');
  document.getElementById('fastTab').classList.toggle('active', mode === 'fast');
  persist();
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function openSolution() {
  document.getElementById('solutionModal').classList.add('open');
}

export function closeSolution() {
  document.getElementById('solutionModal').classList.remove('open');
}
