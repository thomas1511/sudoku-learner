// Application bootstrap: builds dynamic controls, loads the initial variants and
// wires every DOM control to an action. This is the only module that reaches
// broadly across the others, keeping wiring in one place.
import { state, getManual, cloneManual, applyManualSnapshot, freshManual, persist } from './state.js';
import { BASE_CASES } from './data/cases.js';
import { TECH_LABELS } from './data/techniques.js';
import { lessonReady } from './selectors.js';
import { renderAll } from './ui/render.js';
import { toast } from './ui/toast.js';
import {
  enterDigit,
  erase,
  setMode,
  switchLesson,
  newLessonExample,
  loadLessonVariant,
  loadFastVariant,
  startCoach,
  coachPrev,
  coachNext,
  toggleCoachAuto,
  exitCoach,
  fastAction,
  checkGuess,
  newFast,
  fastBack,
  fastReset,
  openSolution,
  closeSolution,
} from './actions.js';

const $ = (id) => document.getElementById(id);

export function init() {
  const sel = $('caseSelect');
  BASE_CASES.forEach((c, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = `${i + 1}. ${c.title}`;
    sel.appendChild(o);
  });

  const guess = $('guessSelect');
  Object.entries(TECH_LABELS).forEach(([k, v]) => {
    const o = document.createElement('option');
    o.value = k;
    o.textContent = v;
    guess.appendChild(o);
  });

  const keypad = $('keypad');
  for (let d = 1; d <= 9; d++) {
    const b = document.createElement('button');
    b.className = 'key';
    b.textContent = d;
    b.onclick = () => enterDigit(d);
    keypad.appendChild(b);
  }
  const er = document.createElement('button');
  er.className = 'key';
  er.textContent = '⌫';
  er.onclick = erase;
  keypad.appendChild(er);

  loadLessonVariant();
  loadFastVariant();

  // Mode + lesson navigation.
  $('lessonTab').onclick = () => setMode('lesson');
  $('fastTab').onclick = () => setMode('fast');
  sel.onchange = (e) => switchLesson(Number(e.target.value));
  $('prevCase').onclick = () => switchLesson(state.lessonIndex - 1);
  $('nextCase').onclick = () => switchLesson(state.lessonIndex + 1);
  $('newLesson').onclick = newLessonExample;
  $('jumpLesson').onclick = () => startCoach(true);
  $('coachJump').onclick = () => startCoach(true);
  $('coachStart').onclick = () => startCoach(false);
  $('coachToTechnique').onclick = () => {
    state.coachPos = state.lessonVariant.case.techniqueStep;
    renderAll();
  };
  $('coachPrev').onclick = coachPrev;
  $('coachNext').onclick = coachNext;
  $('coachAuto').onclick = toggleCoachAuto;
  $('coachExit').onclick = exitCoach;

  // Manual solving toggles.
  $('pencilBtn').onclick = () => {
    state.pencil = !state.pencil;
    renderAll();
  };
  $('patternBtn').onclick = () => {
    if (lessonReady()) {
      state.hintLevel = state.hintLevel === 1 ? 0 : 1;
      renderAll();
    }
  };
  $('eliminationBtn').onclick = () => {
    if (lessonReady()) {
      state.hintLevel = state.hintLevel === 2 ? 0 : 2;
      renderAll();
    }
  };
  $('autoNotes').onclick = () => {
    state.autoNotes = !state.autoNotes;
    renderAll();
  };
  $('coordsBtn').onclick = () => {
    state.showCoords = !state.showCoords;
    renderAll();
  };
  $('checkBtn').onclick = () => {
    state.wrong.clear();
    const c = state.lessonVariant.case;
    const s = getManual();
    s.values.forEach((v, i) => {
      if (v && v !== c.solution[i]) state.wrong.add(i);
    });
    renderAll();
    toast(state.wrong.size ? `${state.wrong.size} fout${state.wrong.size === 1 ? '' : 'en'}` : 'Geen fouten gevonden');
  };
  $('undoBtn').onclick = () => {
    const x = state.undo.pop();
    if (!x) return toast('Niets om ongedaan te maken');
    applyManualSnapshot(x);
    state.wrong.clear();
    renderAll();
  };
  $('resetBtn').onclick = () => {
    if (confirm('Dit voorbeeld opnieuw beginnen?')) {
      applyManualSnapshot(freshManual());
      state.selected = null;
      state.wrong.clear();
      state.hintLevel = 0;
      renderAll();
    }
  };

  // Solution modal.
  $('solutionBtn').onclick = openSolution;
  $('solutionCoach').onclick = () => {
    closeSolution();
    startCoach(true);
  };
  $('showSolution').onclick = () => {
    state.solutionView = true;
    closeSolution();
    renderAll();
    $('solutionBtn').textContent = '↩ Terug';
    $('solutionBtn').onclick = () => {
      state.solutionView = false;
      $('solutionBtn').textContent = '✓ Oplossing';
      $('solutionBtn').onclick = openSolution;
      renderAll();
    };
  };
  $('fillSolution').onclick = () => {
    const c = state.lessonVariant.case;
    const s = getManual();
    state.undo.push(cloneManual());
    for (let i = 0; i < 81; i++) if (!c.puzzle[i]) s.values[i] = c.solution[i];
    s.solved = true;
    persist();
    closeSolution();
    renderAll();
  };
  $('closeSolution').onclick = closeSolution;
  $('solutionModal').onclick = (e) => {
    if (e.target.id === 'solutionModal') closeSolution();
  };

  // Fast mode.
  $('fastAction').onclick = fastAction;
  $('checkGuess').onclick = checkGuess;
  $('newFastTop').onclick = newFast;
  $('newFastDock').onclick = newFast;
  $('newFastFinish').onclick = newFast;
  $('fastBack').onclick = fastBack;
  $('fastReset').onclick = fastReset;

  // Keyboard entry (lesson manual mode only).
  document.addEventListener('keydown', (e) => {
    if (state.appMode === 'lesson' && !state.coachMode) {
      if (/^[1-9]$/.test(e.key)) enterDigit(Number(e.key));
      else if (['Backspace', 'Delete', '0'].includes(e.key)) erase();
    }
  });

  setMode(state.appMode);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  }
}
