// Modal de edição dos exercícios do dia.
import { TREINO_A, TREINO_B, DIAS_PARA_TREINO } from '../core/data.js';
import { storageGet, storageSet, STORAGE_KEYS } from '../core/utils.js';
import { buildWorkoutPlan, getSelectedWeek } from '../workout/state.js';
import { syncPush } from '../core/sync.js';
import { escapeHtml } from './dom.js';
import { render } from './workout-view.js';

export function setupEditModal() {
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

function openEditModal() {
  const activeWeekBtn = document.querySelector('.edit-week-btn.active');
  const week = activeWeekBtn ? activeWeekBtn.dataset.editWeek : 'Semana 1';
  renderEditExercises(week);
}

function renderEditExercises(week) {
  const tipoTreino = DIAS_PARA_TREINO[new Date().getDay()];
  const treinosBase = tipoTreino === 'A' ? TREINO_A : TREINO_B;
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
        <div class="edit-exercise-name">${escapeHtml(ex.nome)}</div>
      </div>
      <div class="edit-input-group">
        <label class="edit-label">Nome</label>
        <input type="text" class="edit-input" data-key="${escapeHtml(key)}" data-field="nome" value="${escapeHtml(editedEx.nome || ex.nome)}">
      </div>
      <div class="edit-input-group">
        <label class="edit-label">Meta/Reps</label>
        <input type="text" class="edit-input" data-key="${escapeHtml(key)}" data-field="meta" value="${escapeHtml(editedEx.meta || ex.meta[week])}">
      </div>
      <div class="edit-input-group">
        <label class="edit-label">Foco</label>
        <input type="text" class="edit-input" data-key="${escapeHtml(key)}" data-field="foco" value="${escapeHtml(editedEx.foco || ex.foco)}">
      </div>
      <div class="edit-input-group">
        <label class="edit-label">Instrução</label>
        <textarea class="edit-textarea" data-key="${escapeHtml(key)}" data-field="instrucao">${escapeHtml(editedEx.instrucao || ex.instrucao)}</textarea>
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
