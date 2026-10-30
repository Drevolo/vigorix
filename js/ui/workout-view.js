// Renderização da tela de treino (exercício, anel, progresso, sidebar).
import { DIAS_PARA_TREINO, RODADAS } from '../core/data.js';
import { formatSeconds, getDayName } from '../core/utils.js';
import {
  getPlan,
  getSelectedWeek,
  getState,
  saveCurrentSession,
  RING_CIRCUMFERENCE,
  totalExercises
} from '../workout/state.js';
import { escapeHtml, refreshIcons, setText } from './dom.js';
import { renderDashboard } from './dashboard-view.js';

export function render() {
  const today = new Date();
  const tipoTreino = DIAS_PARA_TREINO[today.getDay()];
  const state = getState();
  const selectedWeek = getSelectedWeek();

  // Header / page head
  setText('headerDate', today.toLocaleDateString('pt-BR'));
  setText('headerDay', getDayName(today));
  setText('headerTreino', `Treino ${tipoTreino}`);
  setText('headerSemana', selectedWeek);

  setText('sidebarDate', today.toLocaleDateString('pt-BR'));
  setText('sidebarTreino', `Treino ${tipoTreino}`);
  setText('sidebarSemana', selectedWeek);

  const timerSection = document.querySelector('.timer-section');
  if (timerSection) timerSection.dataset.phase = state.phase;

  renderProgress();
  renderDashboard();

  // Check if completed
  if (state.phase === 'completed') {
    document.getElementById('exerciseDisplay').style.display = 'none';
    document.querySelector('.timer-section').style.display = 'none';
    document.querySelector('.action-section').style.display = 'none';
    document.getElementById('completionSection').style.display = 'flex';
    renderSidebarHistory();
    refreshIcons();
    return;
  }

  document.getElementById('exerciseDisplay').style.display = 'block';
  document.querySelector('.timer-section').style.display = 'flex';
  document.querySelector('.action-section').style.display = 'flex';
  document.getElementById('completionSection').style.display = 'none';

  const plan = getPlan();
  const currentEx = plan[state.round] ? plan[state.round][state.exerciseIndex] : null;

  // Sessão inconsistente (plano editado/carregado): volta ao início da rodada.
  if (!currentEx) {
    if (!plan[0] || !plan[0].length) return;
    state.round = Math.min(state.round, RODADAS - 1);
    state.exerciseIndex = 0;
    state.phase = 'ready';
    state.restTime = 0;
    state.restDuration = 0;
    saveCurrentSession();
    return render();
  }

  // Display exercise
  setText('exerciseName', currentEx.nome);
  setText('exerciseFocus', currentEx.foco);
  renderExerciseMeta(currentEx.meta);
  setText('exerciseInstruction', currentEx.instrucao);
  setText('exerciseRoundPill', `RODADA ${state.round + 1} DE ${RODADAS}`);
  setText('exerciseSubtitle', `Exercício ${state.exerciseIndex + 1} de ${plan[state.round].length}`);
  setText('ringRoundTag', `R${state.round + 1} · E${state.exerciseIndex + 1}`);

  // Timer display
  if (state.phase === 'resting') {
    setText('timerModeIndicator', 'DESCANSO');
    setText('timerLabel', state.restDuration === 60 ? 'Descanso entre Rodadas' : 'Descanso entre Exercícios');
    setText('mainTimer', formatSeconds(state.restTime));
    document.getElementById('btnStart').style.display = 'none';
    document.getElementById('btnFinish').style.display = 'none';
    document.getElementById('btnSkipRest').style.display = 'flex';
  } else if (state.phase === 'exercising') {
    setText('timerModeIndicator', 'EM ANDAMENTO');
    setText('timerLabel', 'Tempo decorrido');
    setText('mainTimer', formatSeconds(state.exerciseTimer));
    document.getElementById('btnStart').style.display = 'none';
    document.getElementById('btnFinish').style.display = 'flex';
    document.getElementById('btnSkipRest').style.display = 'none';
  } else {
    setText('timerModeIndicator', 'PRONTO PARA INICIAR');
    setText('timerLabel', 'Toque em iniciar');
    setText('mainTimer', '00:00');
    document.getElementById('btnStart').style.display = 'flex';
    document.getElementById('btnFinish').style.display = 'none';
    document.getElementById('btnSkipRest').style.display = 'none';
  }

  updateRing();
  renderSidebarHistory();
  refreshIcons();
}

function renderExerciseMeta(meta) {
  const raw = String(meta || '');
  const match = raw.match(/^(.*?)\s*\((.+)\)\s*$/);
  setText('exerciseMeta', match ? match[1].trim() : (raw || '—'));

  const detail = document.getElementById('exerciseMetaDetail');
  if (detail) detail.textContent = match ? match[2].trim() : '';
}

export function updateRing() {
  const ring = document.getElementById('ringProgress');
  if (!ring) return;
  const state = getState();

  let fraction = 0;
  if (state.phase === 'resting' && state.restDuration > 0) {
    // Anel esvazia conforme o descanso termina
    fraction = Math.max(0, Math.min(1, state.restTime / state.restDuration));
  } else if (state.phase === 'exercising') {
    // Tempo livre: o anel preenche até 60s
    fraction = Math.min(1, state.exerciseTimer / 60);
  } else if (state.phase === 'completed') {
    fraction = 1;
  }

  ring.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - fraction));
}

function renderProgress() {
  const state = getState();
  const total = totalExercises();
  const done = state.completedExercises.length;
  const bars = document.getElementById('progressBars');

  if (bars) {
    if (bars.children.length !== total) {
      bars.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const seg = document.createElement('span');
        seg.className = 'progress-seg';
        bars.appendChild(seg);
      }
    }

    Array.from(bars.children).forEach((seg, index) => {
      const isCurrent = state.phase !== 'completed' && index === done;
      seg.className = 'progress-seg' + (index < done ? ' done' : isCurrent ? ' current' : '');
    });
  }

  setText('progressCount', `${done} de ${total}`);
  renderRounds();
}

function renderRounds() {
  const container = document.getElementById('roundsList');
  if (!container) return;

  const state = getState();
  const plan = getPlan();
  const doneKeys = new Set(
    state.completedExercises.map(ex => `${ex.round}-${ex.exerciseIndex}`)
  );

  container.innerHTML = '';

  plan.forEach((round, roundIndex) => {
    const isCurrentRound = state.phase !== 'completed' && roundIndex === state.round;
    const allDone = round.every((ex, index) => doneKeys.has(`${roundIndex + 1}-${index}`));
    const card = document.createElement('div');
    card.className = 'round-card' + (isCurrentRound ? ' is-current' : '') + (allDone ? ' is-done' : '');

    const rows = round.map((ex, index) => {
      const isDone = doneKeys.has(`${roundIndex + 1}-${index}`);
      const isCurrent = isCurrentRound && index === state.exerciseIndex;
      const dotClass = isDone ? 'done' : isCurrent ? 'current' : '';
      const dotContent = isDone
        ? '<i data-lucide="check" style="width: 8px; height: 8px;"></i>'
        : isCurrent
          ? '<i></i>'
          : '';
      return `
        <div class="round-row${isCurrent ? ' is-current-row' : ''}">
          <div class="round-dot ${dotClass}">${dotContent}</div>
          <span>${escapeHtml(ex.nome)}</span>
        </div>
      `;
    }).join('');

    const headRight = isCurrentRound
      ? '<span class="round-now">AGORA</span>'
      : allDone
        ? '<i data-lucide="check" class="round-check" style="width: 12px; height: 12px;"></i>'
        : '';

    card.innerHTML = `
      <div class="round-head">
        <span class="round-title">Rodada ${roundIndex + 1}</span>
        ${headRight}
      </div>
      ${rows}
    `;
    container.appendChild(card);
  });
}

function renderSidebarHistory() {
  const sidebarHistory = document.getElementById('sidebarHistory');
  if (!sidebarHistory) return;

  const state = getState();
  setText('sidebarCount', `${state.completedExercises.length}/${totalExercises()}`);
  sidebarHistory.innerHTML = '';

  if (state.completedExercises.length === 0) {
    sidebarHistory.innerHTML = '<div class="sidebar-empty">Nenhum ainda</div>';
    return;
  }

  state.completedExercises.slice().reverse().forEach(ex => {
    const item = document.createElement('div');
    item.className = 'sidebar-history-item';
    item.innerHTML = `
      <div class="history-check">
        <i data-lucide="check" style="width: 10px; height: 10px;"></i>
      </div>
      <div class="history-body">
        <div class="sidebar-history-name">${escapeHtml(ex.nome)}</div>
        <div class="sidebar-history-meta">R${ex.round} · ${escapeHtml(ex.meta || '')}</div>
      </div>
      <div class="sidebar-history-time">${formatSeconds(ex.time)}</div>
    `;
    sidebarHistory.appendChild(item);
  });
}
