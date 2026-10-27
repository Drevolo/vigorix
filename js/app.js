import { TREINO_A, TREINO_B, DIAS_PARA_TREINO, RODADAS } from './data.js';
import { getTodayISO, getDayName, storageGet, storageSet, STORAGE_KEYS, generateId, formatSeconds } from './utils.js';
import { syncOnExerciseFinish } from './sync.js';

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
  
  lucide.createIcons();
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
  document.getElementById('sidebarDate').textContent = new Date().toLocaleDateString('pt-BR');
  document.getElementById('sidebarDay').textContent = getDayName(new Date());
  const tipoTreino = DIAS_PARA_TREINO[new Date().getDay()];
  document.getElementById('sidebarTreino').textContent = `Treino ${tipoTreino}`;
  document.getElementById('sidebarSemana').textContent = selectedWeek;
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
  const btnEdit = document.getElementById('btnEditExercises');
  const editModal = document.getElementById('editModal');
  const editClose = document.getElementById('editClose');
  const btnCancel = document.getElementById('btnCancelEdits');
  const btnSave = document.getElementById('btnSaveEdits');
  
  btnEdit.addEventListener('click', () => {
    openEditModal();
    editModal.classList.add('active');
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
  // Header
  document.getElementById('headerDate').textContent = new Date().toLocaleDateString('pt-BR');
  document.getElementById('headerDay').textContent = getDayName(new Date());
  const tipoTreino = DIAS_PARA_TREINO[new Date().getDay()];
  document.getElementById('headerTreino').textContent = `Treino ${tipoTreino}`;
  
  // Progress indicator
  document.getElementById('currentRound').textContent = currentState.round + 1;
  document.getElementById('totalRounds').textContent = RODADAS;
  document.getElementById('currentExIndex').textContent = currentState.exerciseIndex + 1;
  document.getElementById('totalEx').textContent = workoutPlan[0] ? workoutPlan[0].length : 5;
  
  // Check if completed
  if (currentState.phase === 'completed') {
    document.getElementById('exerciseDisplay').style.display = 'none';
    document.querySelector('.timer-section').style.display = 'none';
    document.querySelector('.action-section').style.display = 'none';
    document.getElementById('completionSection').style.display = 'flex';
    renderSidebarHistory();
    lucide.createIcons();
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
  document.getElementById('exerciseName').textContent = currentEx.nome;
  document.getElementById('exerciseFocus').textContent = currentEx.foco;
  document.getElementById('exerciseMeta').textContent = currentEx.meta;
  document.getElementById('exerciseInstruction').textContent = currentEx.instrucao;
  
  // Timer display
  if (currentState.phase === 'resting') {
    document.getElementById('timerModeIndicator').textContent = 'DESCANSO';
    document.getElementById('timerLabel').textContent = currentState.restDuration === 60 ? 'Descanso entre Rodadas' : 'Descanso entre Exercícios';
    document.getElementById('mainTimer').textContent = formatSeconds(currentState.restTime);
    document.getElementById('btnStart').style.display = 'none';
    document.getElementById('btnFinish').style.display = 'none';
    document.getElementById('btnSkipRest').style.display = 'flex';
  } else if (currentState.phase === 'exercising') {
    document.getElementById('timerModeIndicator').textContent = 'FAZENDO EXERCÍCIO';
    document.getElementById('timerLabel').textContent = 'Tempo decorrido';
    document.getElementById('mainTimer').textContent = formatSeconds(currentState.exerciseTimer);
    document.getElementById('btnStart').style.display = 'none';
    document.getElementById('btnFinish').style.display = 'flex';
    document.getElementById('btnSkipRest').style.display = 'none';
  } else {
    document.getElementById('timerModeIndicator').textContent = 'PRONTO PARA INICIAR';
    document.getElementById('timerLabel').textContent = 'Clique em Iniciar';
    document.getElementById('mainTimer').textContent = '00:00';
    document.getElementById('btnStart').style.display = 'flex';
    document.getElementById('btnFinish').style.display = 'none';
    document.getElementById('btnSkipRest').style.display = 'none';
  }
  
  renderSidebarHistory();
  lucide.createIcons();
}

function startExercise() {
  currentState.phase = 'exercising';
  currentState.exerciseTimer = 0;
  currentState.exerciseStartTime = Date.now();
  
  if (timers.exercise) clearInterval(timers.exercise);
  timers.exercise = setInterval(() => {
    currentState.exerciseTimer++;
    document.getElementById('mainTimer').textContent = formatSeconds(currentState.exerciseTimer);
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
  syncOnExerciseFinish();
  
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
  
  const registro = {
    id: generateId(),
    data: currentState.date,
    diaSemana: getDayName(new Date()),
    treino: tipoTreino,
    semana: selectedWeek,
    completedAt: Date.now(),
    exercises: currentState.completedExercises
  };
  
  history.unshift(registro);
  storageSet(STORAGE_KEYS.HISTORY, history);
  
  currentState.phase = 'completed';
  saveCurrentSession();
  render();
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
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
  }
}

function renderSidebarHistory() {
  const sidebarHistory = document.getElementById('sidebarHistory');
  sidebarHistory.innerHTML = '';
  
  if (currentState.completedExercises.length === 0) {
    sidebarHistory.innerHTML = '<div class="sidebar-empty">Nenhum ainda</div>';
    return;
  }
  
  currentState.completedExercises.slice().reverse().forEach(ex => {
    const item = document.createElement('div');
    item.className = 'sidebar-history-item';
    item.innerHTML = `
      <div class="sidebar-history-name">${ex.nome}</div>
      <div class="sidebar-history-meta">R${ex.round} • ${formatSeconds(ex.time)} • ${ex.meta}</div>
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
  alert('Exercícios atualizados!');
}

document.addEventListener('DOMContentLoaded', init);
