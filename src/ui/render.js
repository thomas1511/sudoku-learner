// Top-level render: decides which mode is active and repaints the board plus the
// relevant panels and control states. `renderAll` is the single repaint entry
// point called after every state change.
//
// Note: this module and ../actions.js form a runtime import cycle (renderAll ↔
// selectCell). That is safe under ESM because neither is invoked during module
// evaluation — only later, in response to user interaction.
import { state } from '../state.js';
import { coord } from '../core/geometry.js';
import { traceState } from '../core/solver.js';
import { moveDescription } from '../core/describe.js';
import { TECH_LABELS } from '../data/techniques.js';
import { lessonReady, currentLessonMove } from '../selectors.js';
import { renderGrid } from './grid.js';
import { renderLessonInfo, renderCoach, renderFast, renderDock } from './panels.js';
import { selectCell } from '../actions.js';

const $ = (id) => document.getElementById(id);

export function renderAll() {
  renderDock();
  if (state.appMode === 'lesson') {
    renderLessonInfo();
    renderGrid($('board'), 'lesson', selectCell);
    renderCoach();
    const ready = lessonReady();
    $('patternBtn').disabled = !ready;
    $('eliminationBtn').disabled = !ready;
    $('patternBtn').classList.toggle('active', state.hintLevel >= 1);
    $('eliminationBtn').classList.toggle('active', state.hintLevel >= 2);
    $('pencilBtn').classList.toggle('active', state.pencil);
    $('autoNotes').classList.toggle('active', state.autoNotes);
    $('coordsBtn').classList.toggle('active', state.showCoords);
    $('modePill').textContent = state.coachMode
      ? 'Leermodus'
      : state.solutionView
        ? 'Oplossing'
        : state.pencil
          ? 'Notities'
          : 'Cijfermodus';
    $('boardStatus').textContent = state.coachMode
      ? currentLessonMove()
        ? `${TECH_LABELS[currentLessonMove().tech]} · huidige zet`
        : 'Sudoku opgelost'
      : state.selected === null
        ? 'Tik op een lege cel'
        : coord(state.selected);
    const msg = $('boardMessage');
    if (!state.coachMode && state.hintLevel && ready) {
      const pos = state.lessonVariant.case.techniqueStep;
      const st = traceState(state.lessonVariant, pos);
      const d = moveDescription(state.lessonVariant.trace[pos], st, state.lessonVariant.trace[pos + 1]);
      msg.classList.remove('hidden');
      msg.innerHTML =
        state.hintLevel === 1
          ? `<strong>Patroon:</strong> ${d.observe}`
          : `<strong>Eliminatie:</strong> ${d.action} ${d.why}`;
    } else {
      msg.classList.add('hidden');
    }
  } else {
    renderGrid($('fastBoard'), 'fast');
    renderFast();
  }
}
