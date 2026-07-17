// Renders the textual side panels: lesson metadata + progress, the coach
// walkthrough, the fast-mode quiz reveals, and the bottom action dock.
import { state } from '../state.js';
import { TECH_LABELS, TECH_INFO } from '../data/techniques.js';
import { moveDescription, fastestWhy } from '../core/describe.js';
import {
  manualBoard,
  remainingPrelude,
  currentLessonState,
  currentLessonMove,
  currentFastState,
  currentFastMove,
} from '../selectors.js';

const $ = (id) => document.getElementById(id);

export function renderLessonInfo() {
  const c = state.lessonVariant.case;
  const info = TECH_INFO[c.id] || {};
  $('caseSelect').value = state.lessonIndex;
  $('lessonKicker').textContent = `Voorbeeld ${String(state.lessonSeed).slice(-5)} · ${c.clues} gegeven cijfers`;
  $('lessonTitle').textContent = c.title;
  $('lessonSubtitle').textContent = c.subtitle;
  $('lessonDifficulty').textContent = c.difficulty;
  $('generalRule').textContent = info.rule || c.subtitle;
  $('generalSteps').innerHTML = (info.steps || []).map((x) => `<li>${x}</li>`).join('');
  $('generalPitfall').textContent = `Let op: ${info.pitfall || 'Controleer altijd eerst eenvoudigere technieken.'}`;
  const b = manualBoard();
  const editable = c.puzzle.filter((x) => !x).length;
  const correct = c.puzzle.reduce((n, g, i) => n + (!g && b[i] === c.solution[i] ? 1 : 0), 0);
  const pct = Math.round((correct / editable) * 100);
  $('lessonBar').style.width = pct + '%';
  $('lessonProgress').textContent = `${pct}% · ${remainingPrelude()} voorbereidende zetten tot leermoment`;
  $('jumpLesson').textContent = `Naar ${c.title}`;
}

export function renderCoach() {
  const active = $('coachActive');
  const inactive = $('coachInactive');
  inactive.classList.toggle('hidden', state.coachMode);
  active.classList.toggle('hidden', !state.coachMode);
  if (!state.coachMode) return;
  const total = state.lessonVariant.trace.length;
  const m = currentLessonMove();
  $('coachCounter').textContent =
    state.coachPos < total ? `Zet ${state.coachPos + 1} van ${total}` : `Opgelost · ${total} zetten`;
  $('coachPercent').textContent = Math.round((state.coachPos / total) * 100) + '%';
  $('coachBar').style.width = Math.round((state.coachPos / total) * 100) + '%';
  if (m) {
    const st = currentLessonState();
    const d = moveDescription(m, st, state.lessonVariant.trace[state.coachPos + 1]);
    $('coachTitle').textContent = d.title;
    $('coachObserve').textContent = d.observe;
    $('coachWhy').textContent = d.why;
    $('coachActionText').textContent = d.action;
    $('coachAfter').textContent = d.after;
  } else {
    $('coachTitle').textContent = 'Sudoku opgelost';
    $('coachObserve').textContent = 'Alle 81 cellen zijn logisch bepaald.';
    $('coachWhy').textContent = 'Iedere stap volgde uit kandidaatbeperkingen; er is niet gegokt.';
    $('coachActionText').textContent = 'Je kunt terugspoelen om een stap opnieuw te bekijken.';
    $('coachAfter').textContent =
      'Genereer daarna een nieuw voorbeeld om dezelfde techniek opnieuw te toetsen.';
  }
  $('coachAuto').textContent = state.coachTimer ? '❚❚ Pauze' : '▶ Auto';
}

export function renderFast() {
  const total = state.fastVariant.trace.length;
  const m = currentFastMove();
  const st = currentFastState();
  const empty = st.board.filter((x) => !x).length;
  $('fastStepStat').textContent = Math.min(state.fastPos + 1, total);
  $('fastScore').textContent = `${state.stats.correct}/${state.stats.attempts}`;
  $('fastStreak').textContent = state.stats.streak;
  $('fastBar').style.width = Math.round((state.fastPos / total) * 100) + '%';
  $('fastProgress').textContent = `${state.fastPos}/${total} zetten · ${empty} lege cellen`;
  $('fastTopTitle').textContent = m ? `Zet ${state.fastPos + 1} · techniek verborgen` : 'Sudoku afgerond';
  $('fastQuestion').classList.toggle('hidden', !m);
  $('fastFinish').classList.toggle('hidden', !!m);
  $('fastBack').disabled = state.fastPos === 0;
  $('fastReset').disabled = state.fastPos === 0;
  if (!m) return;
  const d = moveDescription(m, st, state.fastVariant.trace[state.fastPos + 1]);
  $('answerReveal').classList.toggle('visible', state.fastStage >= 1);
  $('tipReveal').classList.toggle('visible', state.fastStage >= 2);
  $('markReveal').classList.toggle('visible', state.fastStage >= 3);
  $('applyReveal').classList.toggle('visible', state.fastStage >= 3);
  $('answerReveal').innerHTML = `<strong>Snelste techniek: ${d.title}</strong><br>${fastestWhy(m)}`;
  $('tipReveal').innerHTML = `<strong>Tip zonder markering:</strong><br>${d.tip}`;
  $('markReveal').innerHTML = `<strong>Nu gemarkeerd:</strong><br>${d.mark}`;
  $('applyReveal').innerHTML = `<strong>Zet:</strong> ${d.action}<br><span>${d.why}</span>`;
  const labels = ['Toon snelste techniek', 'Geef een tip', 'Markeer het patroon', 'Pas deze zet toe'];
  $('fastAction').textContent = labels[state.fastStage];
  $('fastModePill').textContent = ['Denk zelf', 'Techniek bekend', 'Tip bekend', 'Patroon gemarkeerd'][
    state.fastStage
  ];
  if (!state.fastGuessDone) $('guessSelect').value = '';
}

export function renderDock() {
  const manual = state.appMode === 'lesson' && !state.coachMode;
  const coach = state.appMode === 'lesson' && state.coachMode;
  const fast = state.appMode === 'fast';
  $('manualDock').classList.toggle('hidden', !manual);
  $('coachDock').classList.toggle('hidden', !coach);
  $('fastDock').classList.toggle('hidden', !fast);
}

export { TECH_LABELS };
