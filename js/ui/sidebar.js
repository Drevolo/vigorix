// Barra lateral: abrir/fechar e dados do treino do dia.
import { DIAS_PARA_TREINO } from '../core/data.js';
import { getSelectedWeek } from '../workout/state.js';
import { setText } from './dom.js';

export function setupSidebar() {
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
  setText('sidebarTreino', `Treino ${DIAS_PARA_TREINO[new Date().getDay()]}`);
  setText('sidebarSemana', getSelectedWeek());
}
