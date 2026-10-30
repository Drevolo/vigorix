import { TREINO_A, TREINO_B, DIAS_PARA_TREINO, RODADAS } from './data.js';
import { getTodayISO, getDayName, storageGet, storageSet, STORAGE_KEYS, generateId, formatSeconds } from './utils.js';
import { syncPush } from './sync.js';

let selectedWeek = "Semana 1";
let workoutPlan = [];
let currentState = {
  round: 0, // 0-indexed
  exerciseIndex: 0,
  phase: 'ready', // ready, exercising, resting
  restTime: 0,
  restDuration: 0,
  exerciseTimer: 0,
  exerciseStartTime: null,
  completedExercises: []
};

let timers = {
  exercise: null,
  rest: null
};

const RING_CIRCUMFERENCE = 439.82;
const MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// O CDN do Lucide pode falhar offline; o app deve continuar funcionando.
function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function totalExercises() {
  const porRodada = workoutPlan[0] ? workoutPlan[0].length : 5;
  return RODADAS * porRodada;
}

function readHistory() {
  const list = storageGet(STORAGE_KEYS.HISTORY, []);
  return Array.isArray(list) ? list.filter(item => item && item.data) : [];
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7; // segunda-feira
  d.setDate(d.getDate() - offset);
  return d;
}

function computeStreak(history) {
  const dates = new Set(history.map(item => item.data));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!dates.has(getTodayISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dates.has(getTodayISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function computeStreakRecord(history) {
  const dates = [...new Set(history.map(item => item.data))].sort();
  let best = 0;
  let run = 0;
  let previous = null;

  dates.forEach(iso => {
    const current = new Date(`${iso}T00:00:00`);
    if (previous && (current - previous) / 86400000 === 1) {
      run++;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    previous = current;
  });

  return best;
}

function workoutMinutes(item) {
  if (!item || !Array.isArray(item.exercises)) return 0;
  return item.exercises.reduce((sum, ex) => sum + (Number(ex && ex.time) || 0), 0) / 60;
}

function init() {
  // Configurações
  const settings = storageGet(STORAGE_KEYS.SETTINGS, { semana: "Semana 1" });
  selectedWeek = settings.semana;
  
  // Setup sidebar
  setupSidebar();
  
  // Setup week selectors
  setupWeekSelectors();
  
  // Setup action buttons
  setupActionButtons();
  
  // Setup edit modal
  setupEditModal();
  
  // Setup reset
  document.getElementById('btnResetWorkout').addEventListener('click', resetCurrentWorkout);
  
  // Build workout
  buildWorkoutPlan();
  
  // Load state or start fresh
  loadCurrentSession();
  
  // Render
  render();
  
  // Se o sync trouxe dados de outro aparelho, atualiza a tela
  window.addEventListener('vigorix:synced', handleRemoteUpdate);
  
  refreshIcons();
}

function handleRemoteUpdate() {
  // Não mexe no treino se houver cronômetro rodando
  if (timers.exercise || timers.rest) return;
  
  const settings = storageGet(STORAGE_KEYS.SETTINGS, null);
  if (settings && settings.semana && settings.semana !== selectedWeek) {
    selectedWeek = settings.semana;
    document.querySelectorAll('.week-btn-sidebar').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.week === selectedWeek);
    });
    const semanaEl = document.getElementById('sidebarSemana');
    if (semanaEl) semanaEl.textContent = selectedWeek;
  }
  
  buildWorkoutPlan();
  loadCurrentSession();
  render();
}

function setupSidebar() {
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  menuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
  });
  
  sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
  });
  
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
  });
  
  // Header info in sidebar
  setText('sidebarDate', new Date().toLocaleDateString('pt-BR'));
  const tipoTreino = DIAS_PARA_TREINO[new Date().getDay()];
  setText('sidebarTreino', `Treino ${tipoTreino}`);
  setText('sidebarSemana', selectedWeek);
}

function setupWeekSelectors() {
  // Main header area doesn't have week selector anymore, but sidebar does
  document.querySelectorAll('.week-btn-sidebar').forEach(btn => {
    if (btn.dataset.week === selectedWeek) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.week-btn-sidebar').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedWeek = btn.dataset.week;
      document.getElementById('sidebarSemana').textContent = selectedWeek;
      storageSet(STORAGE_KEYS.SETTINGS, { semana: selectedWeek });
      buildWorkoutPlan();
      loadCurrentSession();
      render();
      syncPush();
    });
  });
}

function setupActionButtons() {
  document.getElementById('btnStart').addEventListener('click', startExercise);
  document.getElementById('btnFinish').addEventListener('click', finishExercise);
  document.getElementById('btnSkipRest').addEventListener('click', skipRest);
  document.getElementById('btnNewWorkout').addEventListener('click', newWorkout);
}

function setupEditModal() {
  const editModal = document.getElementById('editModal');
  const editClose = document.getElementById('editClose');
  const btnCancel = document.getElementById('btnCancelEdits');
  const btnSave = document.getElementById('btnSaveEdits');
  
  document.querySelectorAll('#btnEditExercises, [data-action="edit-exercises"]').forEach(btn => {
    btn.addEventListener('click', () => {
      openEditModal();
      editModal.classList.add('active');
    });
  });
  
  editClose.addEventListener('click', () => {
    editModal.classList.remove('active');
  });
  
  btnCancel.addEventListener('click', () => {
    editModal.classList.remove('active');
  });
  
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.classList.remove('active');
    }
  });
  
  btnSave.addEventListener('click', saveEdits);
  
  document.querySelectorAll('.edit-week-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.edit-week-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderEditExercises(btn.dataset.editWeek);
    });
  });
}

function buildWorkoutPlan() {
  const tipoTreino = DIAS_PARA_TREINO[new Date().getDay()];
  const treinosBase = tipoTreino === "A" ? TREINO_A : TREINO_B;
  const edited = storageGet(STORAGE_KEYS.EDITED_EXERCISES, {});
  
  workoutPlan = [];
  for (let r = 0; r < RODADAS; r++) {
    const roundExercises = [];
    treinosBase.forEach((ex, idx) => {
      const key = `${tipoTreino}_${ex.id}_${selectedWeek}`;
      const editedEx = edited[key] || {};
      roundExercises.push({
        round: r + 1,
        index: idx,
        id: ex.id,
        nome: editedEx.nome || ex.nome,
        foco: editedEx.foco || ex.foco,
        instrucao: editedEx.instrucao || ex.instrucao,
        meta: editedEx.meta || ex.meta[selectedWeek],
        original: ex
      });
    });
    workoutPlan.push(roundExercises);
  }
}

function loadCurrentSession() {
  const today = getTodayISO();
  const saved = storageGet(STORAGE_KEYS.CURRENT, null);
  
  if (saved && saved.date === today) {
    currentState = saved;
    // Cronômetro não sobrevive a recarregar a página: volta para "pronto"
    if (currentState.phase === 'resting' || currentState.phase === 'exercising') {
      currentState.phase = 'ready';
      currentState.restTime = 0;
      currentState.restDuration = 0;
    }
    // Rebuild plan in case week changed
    buildWorkoutPlan();
    return;
  }
  
  // New session
  currentState = {
    date: today,
    round: 0,
    exerciseIndex: 0,
    phase: 'ready',
    restTime: 0,
    restDuration: 0,
    exerciseTimer: 0,
    exerciseStartTime: null,
    completedExercises: []
  };
  saveCurrentSession();
}

function saveCurrentSession() {
  storageSet(STORAGE_KEYS.CURRENT, currentState);
}

function render() {
  const today = new Date();
  const tipoTreino = DIAS_PARA_TREINO[today.getDay()];

  // Header / page head
  setText('headerDate', today.toLocaleDateString('pt-BR'));
  setText('headerDay', getDayName(today));
  setText('headerTreino', `Treino ${tipoTreino}`);
  setText('headerSemana', selectedWeek);

  setText('sidebarDate', today.toLocaleDateString('pt-BR'));
  setText('sidebarTreino', `Treino ${tipoTreino}`);
  setText('sidebarSemana', selectedWeek);

  const timerSection = document.querySelector('.timer-section');
  if (timerSection) timerSection.dataset.phase = currentState.phase;

  renderProgress();
  renderDashboard();

  // Check if completed
  if (currentState.phase === 'completed') {
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
  
  // Get current exercise
  const currentEx = workoutPlan[currentState.round] ? workoutPlan[currentState.round][currentState.exerciseIndex] : null;
  
  if (!currentEx) {
    // Move to next round
    if (currentState.round < RODADAS - 1) {
      currentState.round++;
      currentState.exerciseIndex = 0;
      startRest(60);
      return;
    } else {
      completeWorkout();
      return;
    }
  }
  
  // Display exercise
  setText('exerciseName', currentEx.nome);
  setText('exerciseFocus', currentEx.foco);
  renderExerciseMeta(currentEx.meta);
  setText('exerciseInstruction', currentEx.instrucao);
  setText('exerciseRoundPill', `RODADA ${currentState.round + 1} DE ${RODADAS}`);
  setText('exerciseSubtitle', `Exercício ${currentState.exerciseIndex + 1} de ${workoutPlan[currentState.round].length}`);
  setText('ringRoundTag', `R${currentState.round + 1} · E${currentState.exerciseIndex + 1}`);
  
  // Timer display
  if (currentState.phase === 'resting') {
    setText('timerModeIndicator', 'DESCANSO');
    setText('timerLabel', currentState.restDuration === 60 ? 'Descanso entre Rodadas' : 'Descanso entre Exercícios');
    setText('mainTimer', formatSeconds(currentState.restTime));
    document.getElementById('btnStart').style.display = 'none';
    document.getElementById('btnFinish').style.display = 'none';
    document.getElementById('btnSkipRest').style.display = 'flex';
  } else if (currentState.phase === 'exercising') {
    setText('timerModeIndicator', 'EM ANDAMENTO');
    setText('timerLabel', 'Tempo decorrido');
    setText('mainTimer', formatSeconds(currentState.exerciseTimer));
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

function updateRing() {
  const ring = document.getElementById('ringProgress');
  if (!ring) return;

  let fraction = 0;
  if (currentState.phase === 'resting' && currentState.restDuration > 0) {
    // Anel esvazia conforme o descanso termina
    fraction = Math.max(0, Math.min(1, currentState.restTime / currentState.restDuration));
  } else if (currentState.phase === 'exercising') {
    // Tempo livre: o anel preenche até 60s
    fraction = Math.min(1, currentState.exerciseTimer / 60);
  } else if (currentState.phase === 'completed') {
    fraction = 1;
  }

  ring.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - fraction));
}

function renderProgress() {
  const total = totalExercises();
  const done = currentState.completedExercises.length;
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
      const isCurrent = currentState.phase !== 'completed' && index === done;
      seg.className = 'progress-seg' + (index < done ? ' done' : isCurrent ? ' current' : '');
    });
  }

  setText('progressCount', `${done} de ${total}`);
  renderRounds();
}

function renderRounds() {
  const container = document.getElementById('roundsList');
  if (!container) return;

  const doneKeys = new Set(
    currentState.completedExercises.map(ex => `${ex.round}-${ex.exerciseIndex}`)
  );

  container.innerHTML = '';

  workoutPlan.forEach((round, roundIndex) => {
    const isCurrentRound = currentState.phase !== 'completed' && roundIndex === currentState.round;
    const allDone = round.every((ex, index) => doneKeys.has(`${roundIndex + 1}-${index}`));
    const card = document.createElement('div');
    card.className = 'round-card' + (isCurrentRound ? ' is-current' : '') + (allDone ? ' is-done' : '');

    const rows = round.map((ex, index) => {
      const isDone = doneKeys.has(`${roundIndex + 1}-${index}`);
      const isCurrent = isCurrentRound && index === currentState.exerciseIndex;
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

function renderDashboard() {
  const history = readHistory().sort((a, b) => {
    const dataA = String(a.data || '');
    const dataB = String(b.data || '');
    if (dataA !== dataB) return dataB.localeCompare(dataA);
    return (b.finalizadoEm || 0) - (a.finalizadoEm || 0);
  });

  const streak = computeStreak(history);
  setText('headerStreak', `${streak} ${streak === 1 ? 'dia seguido' : 'dias seguidos'}`);
  setText('streakDays', `${streak} ${streak === 1 ? 'dia' : 'dias'}`);
  setText('streakRecord', `Recorde: ${computeStreakRecord(history)} dias`);
  setText('summaryWeek', selectedWeek);

  // Semana atual (segunda a domingo)
  const weekStart = startOfWeek();
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDates.push(getTodayISO(d));
  }
  const todayISO = getTodayISO();

  const weekHistory = history.filter(item => weekDates.includes(item.data));
  const weekMinutes = Math.round(weekHistory.reduce((sum, item) => sum + workoutMinutes(item), 0));

  setText('weekWorkouts', String(weekHistory.length));
  setText('weekMinutes', String(weekMinutes));
  setText('streakWeekCount', `${weekHistory.length} esta semana`);

  // Dias da sequência (domingo → sábado)
  const streakWeek = document.getElementById('streakWeek');
  if (streakWeek) {
    const sunday = new Date(weekStart);
    sunday.setDate(weekStart.getDate() - 1);
    const letters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    streakWeek.innerHTML = letters.map((letter, index) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + index);
      const iso = getTodayISO(d);
      const hasWorkout = history.some(item => item.data === iso);
      const circleClass = hasWorkout ? 'done' : iso === todayISO ? 'today' : '';
      const content = hasWorkout
        ? '<i data-lucide="check" style="width: 12px; height: 12px;"></i>'
        : iso === todayISO
          ? '<i></i>'
          : '';
      return `
        <div class="streak-day">
          <span>${letter}</span>
          <div class="streak-circle ${circleClass}">${content}</div>
        </div>
      `;
    }).join('');
  }

  // Gráfico da semana
  const chart = document.getElementById('weekChart');
  if (chart) {
    chart.innerHTML = weekDates.map(iso => {
      const count = history.filter(item => item.data === iso).length;
      const height = 14 + Math.min(count, 3) * 18;
      const classes = 'week-bar'
        + (count > 0 ? ' has-workout' : '')
        + (iso === todayISO ? ' is-today' : '');
      return `<div class="${classes}" style="height: ${height}px"></div>`;
    }).join('');
  }

  // Últimos treinos
  const recent = document.getElementById('recentList');
  if (recent) {
    if (history.length === 0) {
      recent.innerHTML = '<div class="sidebar-empty">Nenhum treino ainda</div>';
    } else {
      recent.innerHTML = history.slice(0, 3).map(item => {
        const date = new Date(`${item.data}T00:00:00`);
        const total = item.totalExercicios || totalExercises();
        return `
          <div class="recent-item">
            <div class="recent-date">
              <strong>${String(date.getDate()).padStart(2, '0')}</strong>
              <span>${MESES_CURTOS[date.getMonth()]}</span>
            </div>
            <div class="recent-info">
              <div class="recent-name">Treino ${escapeHtml(item.treino || '--')}</div>
              <div class="recent-meta">${escapeHtml(item.diaSemana || getDayName(date))} · ${item.concluidos || 0}/${total}</div>
            </div>
            <div class="recent-badge">
              <i data-lucide="check" style="width: 11px; height: 11px;"></i>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

function startExercise() {
  currentState.phase = 'exercising';
  currentState.exerciseTimer = 0;
  currentState.exerciseStartTime = Date.now();
  
  if (timers.exercise) clearInterval(timers.exercise);
  timers.exercise = setInterval(() => {
    currentState.exerciseTimer++;
    document.getElementById('mainTimer').textContent = formatSeconds(currentState.exerciseTimer);
    updateRing();
    saveCurrentSession();
  }, 1000);
  
  saveCurrentSession();
  render();
}

function finishExercise() {
  if (timers.exercise) {
    clearInterval(timers.exercise);
    timers.exercise = null;
  }
  
  const currentEx = workoutPlan[currentState.round][currentState.exerciseIndex];
  currentState.completedExercises.push({
    round: currentState.round + 1,
    exerciseIndex: currentState.exerciseIndex,
    nome: currentEx.nome,
    meta: currentEx.meta,
    time: currentState.exerciseTimer,
    completedAt: Date.now()
  });
  
  saveCurrentSession();
  // Sincroniza assim que termina o exercício (antes do descanso)
  syncPush();
  
  // Check if last exercise of round
  const isLastExerciseOfRound = currentState.exerciseIndex === workoutPlan[currentState.round].length - 1;
  const isLastRound = currentState.round === RODADAS - 1;
  
  if (isLastExerciseOfRound && isLastRound) {
    // Last exercise of entire workout
    completeWorkout();
    return;
  } else if (isLastExerciseOfRound) {
    // End of round, rest 60s
    currentState.exerciseIndex = 0;
    currentState.round++;
    startRest(60);
  } else {
    // Next exercise, rest 30-40s
    currentState.exerciseIndex++;
    startRest(35); // average of 30-40
  }
}

function startRest(duration) {
  currentState.phase = 'resting';
  currentState.restDuration = duration;
  currentState.restTime = duration;
  
  if (timers.rest) clearInterval(timers.rest);
  timers.rest = setInterval(() => {
    currentState.restTime--;
    document.getElementById('mainTimer').textContent = formatSeconds(currentState.restTime);
    updateRing();
    
    if (currentState.restTime <= 0) {
      clearInterval(timers.rest);
      timers.rest = null;
      nextExercise();
    }
    saveCurrentSession();
  }, 1000);
  
  saveCurrentSession();
  render();
}

function skipRest() {
  if (timers.rest) {
    clearInterval(timers.rest);
    timers.rest = null;
  }
  nextExercise();
}

function nextExercise() {
  currentState.phase = 'ready';
  saveCurrentSession();
  render();
}

function completeWorkout() {
  if (timers.exercise) {
    clearInterval(timers.exercise);
    timers.exercise = null;
  }
  if (timers.rest) {
    clearInterval(timers.rest);
    timers.rest = null;
  }
  
  const history = storageGet(STORAGE_KEYS.HISTORY, []);
  const tipoTreino = DIAS_PARA_TREINO[new Date().getDay()];
  const totalExercicios = RODADAS * (workoutPlan[0] ? workoutPlan[0].length : 5);
  
  // Agrupa por rodada para a tela de histórico
  const porRodada = new Map();
  currentState.completedExercises.forEach(ex => {
    const numero = ex.round || 1;
    if (!porRodada.has(numero)) {
      porRodada.set(numero, { numero, exercicios: [] });
    }
    porRodada.get(numero).exercicios.push({
      nome: ex.nome,
      meta: ex.meta,
      feito: true,
      time: ex.time
    });
  });
  
  const registro = {
    id: generateId(),
    data: currentState.date,
    diaSemana: getDayName(new Date()),
    treino: tipoTreino,
    semana: selectedWeek,
    completedAt: Date.now(),
    finalizadoEm: Date.now(),
    concluidos: currentState.completedExercises.length,
    totalExercicios,
    detalhes: [...porRodada.values()].sort((a, b) => a.numero - b.numero),
    exercises: currentState.completedExercises
  };
  
  history.unshift(registro);
  storageSet(STORAGE_KEYS.HISTORY, history);
  
  currentState.phase = 'completed';
  saveCurrentSession();
  render();
  
  // Envia o treino concluído para a nuvem
  syncPush();
}

function newWorkout() {
  currentState = {
    date: getTodayISO(),
    round: 0,
    exerciseIndex: 0,
    phase: 'ready',
    restTime: 0,
    restDuration: 0,
    exerciseTimer: 0,
    exerciseStartTime: null,
    completedExercises: []
  };
  saveCurrentSession();
  render();
  syncPush();
}

function resetCurrentWorkout() {
  if (confirm('Tem certeza que deseja resetar o treino do dia? Isso irá apagar o progresso atual.')) {
    if (timers.exercise) {
      clearInterval(timers.exercise);
      timers.exercise = null;
    }
    if (timers.rest) {
      clearInterval(timers.rest);
      timers.rest = null;
    }
    currentState = {
      date: getTodayISO(),
      round: 0,
      exerciseIndex: 0,
      phase: 'ready',
      restTime: 0,
      restDuration: 0,
      exerciseTimer: 0,
      exerciseStartTime: null,
      completedExercises: []
    };
    saveCurrentSession();
    render();
    syncPush();
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
  }
}

function renderSidebarHistory() {
  const sidebarHistory = document.getElementById('sidebarHistory');
  if (!sidebarHistory) return;

  setText('sidebarCount', `${currentState.completedExercises.length}/${totalExercises()}`);
  sidebarHistory.innerHTML = '';
  
  if (currentState.completedExercises.length === 0) {
    sidebarHistory.innerHTML = '<div class="sidebar-empty">Nenhum ainda</div>';
    return;
  }
  
  currentState.completedExercises.slice().reverse().forEach(ex => {
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

function openEditModal() {
  const activeWeekBtn = document.querySelector('.edit-week-btn.active');
  const week = activeWeekBtn ? activeWeekBtn.dataset.editWeek : 'Semana 1';
  renderEditExercises(week);
}

function renderEditExercises(week) {
  const tipoTreino = DIAS_PARA_TREINO[new Date().getDay()];
  const treinosBase = tipoTreino === "A" ? TREINO_A : TREINO_B;
  const edited = storageGet(STORAGE_KEYS.EDITED_EXERCISES, {});
  const container = document.getElementById('editExercisesList');
  
  container.innerHTML = '';
  
  treinosBase.forEach(ex => {
    const key = `${tipoTreino}_${ex.id}_${week}`;
    const editedEx = edited[key] || {};
    
    const item = document.createElement('div');
    item.className = 'edit-exercise-item';
    item.innerHTML = `
      <div class="edit-exercise-header">
        <div class="edit-exercise-name">${ex.nome}</div>
      </div>
      <div class="edit-input-group">
        <label class="edit-label">Nome</label>
        <input type="text" class="edit-input" data-key="${key}" data-field="nome" value="${editedEx.nome || ex.nome}">
      </div>
      <div class="edit-input-group">
        <label class="edit-label">Meta/Reps</label>
        <input type="text" class="edit-input" data-key="${key}" data-field="meta" value="${editedEx.meta || ex.meta[week]}">
      </div>
      <div class="edit-input-group">
        <label class="edit-label">Foco</label>
        <input type="text" class="edit-input" data-key="${key}" data-field="foco" value="${editedEx.foco || ex.foco}">
      </div>
      <div class="edit-input-group">
        <label class="edit-label">Instrução</label>
        <textarea class="edit-textarea" data-key="${key}" data-field="instrucao">${editedEx.instrucao || ex.instrucao}</textarea>
      </div>
    `;
    container.appendChild(item);
  });
}

function saveEdits() {
  const edited = storageGet(STORAGE_KEYS.EDITED_EXERCISES, {});
  const inputs = document.querySelectorAll('#editExercisesList .edit-input, #editExercisesList .edit-textarea');
  
  inputs.forEach(input => {
    const key = input.dataset.key;
    const field = input.dataset.field;
    if (!edited[key]) edited[key] = {};
    edited[key][field] = input.value;
  });
  
  storageSet(STORAGE_KEYS.EDITED_EXERCISES, edited);
  document.getElementById('editModal').classList.remove('active');
  
  buildWorkoutPlan();
  render();
  syncPush();
  alert('Exercícios atualizados!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
