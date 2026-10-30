// Ações do treino: cronômetros, transições entre exercícios e conclusão.
import { RODADAS } from '../core/data.js';
import {
  generateId,
  getDayName,
  storageGet,
  storageSet,
  formatSeconds,
  STORAGE_KEYS
} from '../core/utils.js';
import { syncPush } from '../core/sync.js';
import {
  getPlan,
  getSelectedWeek,
  getState,
  resetSessionState,
  saveCurrentSession,
  todayWorkoutType
} from './state.js';
import { render, updateRing } from '../ui/workout-view.js';

let exerciseTimer = null;
let restTimer = null;

export function hasRunningTimer() {
  return Boolean(exerciseTimer || restTimer);
}

function stopTimers() {
  if (exerciseTimer) {
    clearInterval(exerciseTimer);
    exerciseTimer = null;
  }
  if (restTimer) {
    clearInterval(restTimer);
    restTimer = null;
  }
}

export function startExercise() {
  const state = getState();
  state.phase = 'exercising';
  state.exerciseTimer = 0;
  state.exerciseStartTime = Date.now();

  if (exerciseTimer) clearInterval(exerciseTimer);
  exerciseTimer = setInterval(() => {
    state.exerciseTimer++;
    document.getElementById('mainTimer').textContent = formatSeconds(state.exerciseTimer);
    updateRing();
    saveCurrentSession();
  }, 1000);

  saveCurrentSession();
  render();
}

export function finishExercise() {
  const state = getState();
  const plan = getPlan();

  if (exerciseTimer) {
    clearInterval(exerciseTimer);
    exerciseTimer = null;
  }

  const currentEx = plan[state.round][state.exerciseIndex];
  state.completedExercises.push({
    round: state.round + 1,
    exerciseIndex: state.exerciseIndex,
    nome: currentEx.nome,
    meta: currentEx.meta,
    time: state.exerciseTimer,
    completedAt: Date.now()
  });

  saveCurrentSession();
  // Sincroniza assim que termina o exercício (antes do descanso)
  syncPush();

  // Check if last exercise of round
  const isLastExerciseOfRound = state.exerciseIndex === plan[state.round].length - 1;
  const isLastRound = state.round === RODADAS - 1;

  if (isLastExerciseOfRound && isLastRound) {
    // Last exercise of entire workout
    completeWorkout();
    return;
  } else if (isLastExerciseOfRound) {
    // End of round, rest 60s
    state.exerciseIndex = 0;
    state.round++;
    startRest(60);
  } else {
    // Next exercise, rest 30-40s
    state.exerciseIndex++;
    startRest(35); // average of 30-40
  }
}

export function startRest(duration) {
  const state = getState();
  state.phase = 'resting';
  state.restDuration = duration;
  state.restTime = duration;

  if (restTimer) clearInterval(restTimer);
  restTimer = setInterval(() => {
    state.restTime--;
    document.getElementById('mainTimer').textContent = formatSeconds(state.restTime);
    updateRing();

    if (state.restTime <= 0) {
      clearInterval(restTimer);
      restTimer = null;
      nextExercise();
    }
    saveCurrentSession();
  }, 1000);

  saveCurrentSession();
  render();
}

export function skipRest() {
  if (restTimer) {
    clearInterval(restTimer);
    restTimer = null;
  }
  nextExercise();
}

function nextExercise() {
  getState().phase = 'ready';
  saveCurrentSession();
  render();
}

export function completeWorkout() {
  stopTimers();

  const state = getState();
  const history = storageGet(STORAGE_KEYS.HISTORY, []);
  const tipoTreino = todayWorkoutType();
  const totalExercicios = RODADAS * (getPlan()[0] ? getPlan()[0].length : 5);

  // Agrupa por rodada para a tela de histórico
  const porRodada = new Map();
  state.completedExercises.forEach(ex => {
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
    data: state.date,
    diaSemana: getDayName(new Date()),
    treino: tipoTreino,
    semana: getSelectedWeek(),
    completedAt: Date.now(),
    finalizadoEm: Date.now(),
    concluidos: state.completedExercises.length,
    totalExercicios,
    detalhes: [...porRodada.values()].sort((a, b) => a.numero - b.numero),
    exercises: state.completedExercises
  };

  history.unshift(registro);
  storageSet(STORAGE_KEYS.HISTORY, history);

  state.phase = 'completed';
  saveCurrentSession();
  render();

  // Envia o treino concluído para a nuvem
  syncPush();
}

export function newWorkout() {
  resetSessionState();
  saveCurrentSession();
  render();
  syncPush();
}

export function resetCurrentWorkout() {
  if (!confirm('Tem certeza que deseja resetar o treino do dia? Isso irá apagar o progresso atual.')) {
    return;
  }

  stopTimers();
  resetSessionState();
  saveCurrentSession();
  render();
  syncPush();

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('sidebarOverlay').classList.remove('active');
}
