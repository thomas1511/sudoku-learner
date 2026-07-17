// Renders the 9×9 board for either the lesson or the fast mode. This is a pure
// view: cell selection is delegated to the `onSelect` callback so the grid has
// no dependency on the action layer.
import { state, getManual } from '../state.js';
import { PEERS, coord } from '../core/geometry.js';
import { moveDigits } from '../core/solver.js';
import {
  manualBoard,
  manualCandidates,
  lessonReady,
  currentFastState,
  currentFastMove,
  currentLessonState,
  currentLessonMove,
} from '../selectors.js';

export function renderGrid(el, mode, onSelect) {
  const v = mode === 'fast' ? state.fastVariant : state.lessonVariant;
  const c = v.case;
  let board;
  let cands;
  let move = null;
  let showMarks = false;
  let showCut = false;

  if (mode === 'fast') {
    const st = currentFastState();
    board = st.board;
    cands = st.cands;
    move = currentFastMove();
    // Light up the pattern cells once the move has been reached via the reveal
    // steps, or immediately when the player names the technique correctly.
    showMarks = state.fastStage >= 3 || state.fastPatternLit;
    showCut = state.fastStage >= 3;
  } else if (state.coachMode) {
    const st = currentLessonState();
    board = st.board;
    cands = st.cands;
    move = currentLessonMove();
    showMarks = !!move;
    showCut = !!move;
  } else {
    board = state.solutionView ? c.solution : manualBoard();
    cands = null;
    if (state.hintLevel && lessonReady()) {
      move = v.trace[c.techniqueStep];
      showMarks = true;
      showCut = state.hintLevel > 1;
    }
  }

  el.innerHTML = '';
  el.classList.toggle('show-coords', state.showCoords && mode === 'lesson');
  const targetMap = new Map();
  const placeMap = new Map();
  if (move) {
    for (const [i, d] of move.eliminations || []) {
      if (!targetMap.has(i)) targetMap.set(i, []);
      targetMap.get(i).push(d);
    }
    for (const [i, d] of move.placements || []) placeMap.set(i, d);
  }

  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    const r = Math.floor(i / 9);
    const col = i % 9;
    if (col === 2 || col === 5) cell.classList.add('box-r');
    if (r === 2 || r === 5) cell.classList.add('box-b');
    const given = c.puzzle[i] > 0;
    if (given) cell.classList.add('given');
    if (mode === 'lesson' && !state.coachMode && !given && getManual().values[i])
      cell.classList.add('user-value');
    if (mode === 'lesson' && !state.coachMode && state.wrong.has(i)) cell.classList.add('wrong');
    if (mode === 'lesson' && !state.coachMode && state.solutionView && !given)
      cell.classList.add('solution-value');
    if (mode === 'lesson' && !state.coachMode && state.selected !== null) {
      if (i === state.selected) cell.classList.add('selected');
      else if (PEERS[state.selected].includes(i)) cell.classList.add('peer');
      const sv = board[state.selected];
      if (sv && board[i] === sv) cell.classList.add('same');
    }

    if (showMarks && move) {
      const role = move.roles?.[String(i)];
      if (role === 'pattern') cell.classList.add('move-pattern');
      if (role === 'pivot') cell.classList.add('move-pivot');
      if (role === 'wing') cell.classList.add('move-wing');
      if (role === 'colorA') cell.classList.add('move-a');
      if (role === 'colorB') cell.classList.add('move-b');
      if (role === 'result') cell.classList.add('move-place');
      if (!role && move.pattern?.includes(i)) cell.classList.add('move-pattern');
      if (targetMap.has(i)) cell.classList.add('move-target');
      if (placeMap.has(i)) cell.classList.add('move-place');
    }

    const value = board[i];
    if (value) {
      cell.innerHTML = `<span class="coord">${coord(i)}</span><span class="value">${value}</span>`;
    } else {
      let notes;
      if (mode === 'lesson' && !state.coachMode) notes = manualCandidates(i);
      else notes = [...(cands[i] || [])].sort((a, b) => a - b);
      const focus = move ? moveDigits(move) : [];
      const html = [1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map((d) => {
          const visible = notes.includes(d);
          const cls = ['note'];
          if (showMarks && visible && focus.includes(d) && move.pattern?.includes(i))
            cls.push('focus');
          if (showCut && visible && (targetMap.get(i) || []).includes(d)) cls.push('cut');
          return `<span class="${cls.join(' ')}">${visible ? d : ''}</span>`;
        })
        .join('');
      cell.innerHTML = `<span class="coord">${coord(i)}</span><span class="notes">${html}</span>`;
    }

    if (mode === 'lesson' && !state.coachMode) cell.onclick = () => onSelect(i);
    else cell.disabled = true;
    el.appendChild(cell);
  }
}
