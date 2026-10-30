// Entrada da home: autenticação, sync inicial e bindings da tela de treino.
import { requireAuth, getUser, logout } from '../core/auth.js';
import { syncNow, syncPush } from '../core/sync.js';
import { registerServiceWorker } from '../core/pwa.js';
import { storageGet, storageSet, STORAGE_KEYS } from '../core/utils.js';
import { refreshIcons } from '../ui/dom.js';
import {
  buildWorkoutPlan,
  getSelectedWeek,
  loadCurrentSession,
  setSelectedWeek
} from '../workout/state.js';
import { render } from '../ui/workout-view.js';
import { setupSidebar } from '../ui/sidebar.js';
import { setupEditModal } from '../ui/edit-modal.js';
import {
  finishExercise,
  hasRunningTimer,
  newWorkout,
  resetCurrentWorkout,
  skipRest,
  startExercise
} from '../workout/actions.js';

function setupWeekSelectors() {
  document.querySelectorAll('.week-btn-sidebar').forEach(btn => {
    if (btn.dataset.week === getSelectedWeek()) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.week-btn-sidebar').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setSelectedWeek(btn.dataset.week);
      document.getElementById('sidebarSemana').textContent = getSelectedWeek();
      storageSet(STORAGE_KEYS.SETTINGS, { semana: getSelectedWeek() });
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

function handleRemoteUpdate() {
  // Não mexe no treino se houver cronômetro rodando
  if (hasRunningTimer()) return;

  const settings = storageGet(STORAGE_KEYS.SETTINGS, null);
  if (settings && settings.semana && settings.semana !== getSelectedWeek()) {
    setSelectedWeek(settings.semana);
    document.querySelectorAll('.week-btn-sidebar').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.week === getSelectedWeek());
    });
    const semanaEl = document.getElementById('sidebarSemana');
    if (semanaEl) semanaEl.textContent = getSelectedWeek();
  }

  buildWorkoutPlan();
  loadCurrentSession();
  render();
}

function initHome() {
  // Configurações
  const settings = storageGet(STORAGE_KEYS.SETTINGS, { semana: 'Semana 1' });
  setSelectedWeek(settings.semana);

  setupSidebar();
  setupWeekSelectors();
  setupActionButtons();
  setupEditModal();

  document.getElementById('btnResetWorkout').addEventListener('click', resetCurrentWorkout);

  buildWorkoutPlan();
  loadCurrentSession();
  render();

  // Se o sync trouxe dados de outro aparelho, atualiza a tela
  window.addEventListener('vigorix:synced', handleRemoteUpdate);

  refreshIcons();
}

function setAvatarInitial() {
  const user = getUser();
  const email = user && user.email ? user.email : '';
  const inicial = (email.charAt(0) || 'V').toUpperCase();
  document.querySelectorAll('#avatarInitial, #avatarInitialTop').forEach(el => {
    el.textContent = inicial;
  });
}

function bindSyncActions() {
  const btnSync = document.getElementById('btnSyncNow');
  const btnLogout = document.getElementById('btnLogout');

  if (btnSync) btnSync.addEventListener('click', () => syncNow());
  if (btnLogout) btnLogout.addEventListener('click', logout);
}

async function boot() {
  registerServiceWorker();

  const autenticado = await requireAuth();
  if (!autenticado) return;

  setAvatarInitial();

  // Se a rede estiver ruim, não segura a tela por mais de 4s
  await Promise.race([
    syncNow(),
    new Promise(resolve => setTimeout(resolve, 4000))
  ]);

  initHome();
  bindSyncActions();
  refreshIcons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
