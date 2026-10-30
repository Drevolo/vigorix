// Estado da sessão de treino + construção do plano da semana.
// Nenhum módulo deve reatribuir essas variáveis de fora: use os getters/setters.
import { TREINO_A, TREINO_B, DIAS_PARA_TREINO, RODADAS } from '../core/data.js';
import { getTodayISO, storageGet, storageSet, STORAGE_KEYS } from '../core/utils.js';

export const RING_CIRCUMFERENCE = 439.82;

let selectedWeek = 'Semana 1';
let workoutPlan = [];
let currentState = createEmptySession();

function createEmptySession() {
  return {
    date: getTodayISO(),
    round: 0,
    exerciseIndex: 0,
    phase: 'ready', // ready, exercising, resting, completed
    restTime: 0,
    restDuration: 0,
    exerciseTimer: 0,
    exerciseStartTime: null,
    completedExercises: []
  };
}

export function getSelectedWeek() {
  return selectedWeek;
}

export function setSelectedWeek(week) {
  selectedWeek = week;
}

export function getPlan() {
  return workoutPlan;
}

export function getState() {
  return currentState;
}

export function setState(next) {
  currentState = next;
}

export function todayWorkoutType() {
  return DIAS_PARA_TREINO[new Date().getDay()];
}

export function totalExercises() {
  const porRodada = workoutPlan[0] ? workoutPlan[0].length : 5;
  return RODADAS * porRodada;
}

export function buildWorkoutPlan() {
  const tipoTreino = todayWorkoutType();
  const treinosBase = tipoTreino === 'A' ? TREINO_A : TREINO_B;
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

export function saveCurrentSession() {
  storageSet(STORAGE_KEYS.CURRENT, currentState);
}

export function loadCurrentSession() {
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
    buildWorkoutPlan();
    return;
  }

  currentState = createEmptySession();
  saveCurrentSession();
}

export function resetSessionState() {
  currentState = createEmptySession();
}
