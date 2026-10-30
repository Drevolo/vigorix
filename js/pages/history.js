// Entrada da página de histórico.
import { getTodayISO } from '../core/utils.js';
import { requireAuth } from '../core/auth.js';
import { syncNow } from '../core/sync.js';
import { registerServiceWorker } from '../core/pwa.js';
import {
  readNormalizedHistory,
  sortHistory
} from '../core/history.js';
import { escapeHtml, refreshIcons } from '../ui/dom.js';

let currentFilter = 'todos';
let currentView = 'calendario';
let calendarDate = new Date();

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function init() {
  // View toggle
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      document.getElementById('calendarView').style.display = currentView === 'calendario' ? 'block' : 'none';
      document.getElementById('historyList').style.display = currentView === 'lista' ? 'flex' : 'none';
      document.getElementById('filterRow').style.display = currentView === 'lista' ? 'flex' : 'none';
      document.getElementById('emptyState').style.display = 'none';
      render();
    });
  });

  // Filtros
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  // Calendar nav
  document.getElementById('calPrev').addEventListener('click', () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    renderCalendar();
  });

  // Modal
  document.getElementById('detailClose').addEventListener('click', () => {
    document.getElementById('detailModal').classList.remove('active');
  });

  document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
      document.getElementById('detailModal').classList.remove('active');
    }
  });

  // Quando o sync trouxer dados de outro aparelho, atualiza a tela
  window.addEventListener('vigorix:synced', render);

  render();
  refreshIcons();
}

function render() {
  const history = readNormalizedHistory();

  // Estatísticas
  document.getElementById('statTotal').textContent = history.length;
  const diasUnicos = new Set(history.map(h => h.data)).size;
  document.getElementById('statDias').textContent = diasUnicos;

  if (currentView === 'calendario') {
    renderCalendar();
    document.getElementById('emptyState').style.display = 'none';
  } else {
    renderList(history);
  }

  refreshIcons();
}

function renderCalendar() {
  const history = readNormalizedHistory();
  const historyDates = new Set(history.map(h => h.data));
  const grid = document.getElementById('calendarGrid');
  const label = document.getElementById('calMonthLabel');
  const today = getTodayISO();

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  label.textContent = `${MESES[month]} ${year}`;
  grid.innerHTML = '';

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 0 Domingo
  const daysInMonth = lastDay.getDate();

  // Dias vazios antes do primeiro dia
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day is-empty';
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasTreino = historyDates.has(dateStr);
    const isToday = dateStr === today;

    const dayEl = document.createElement('button');
    dayEl.type = 'button';
    dayEl.className = 'calendar-day'
      + (hasTreino ? ' has-workout' : '')
      + (isToday ? ' is-today' : '');
    dayEl.textContent = day;
    if (!hasTreino) dayEl.disabled = true;

    if (hasTreino) {
      const dot = document.createElement('span');
      dot.className = 'calendar-dot';
      dayEl.appendChild(dot);

      dayEl.addEventListener('click', () => {
        const items = history.filter(h => h.data === dateStr);
        if (items.length >= 1) showDetails(items[0]);
      });
    }

    grid.appendChild(dayEl);
  }
}

function renderList(history) {
  const today = getTodayISO();

  let filtered = [...history];
  if (currentFilter === 'hoje') {
    filtered = filtered.filter(h => h.data === today);
  } else if (currentFilter === '7dias') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = getTodayISO(weekAgo);
    filtered = filtered.filter(h => h.data >= weekAgoISO);
  }

  filtered = sortHistory(filtered);

  const list = document.getElementById('historyList');
  const empty = document.getElementById('emptyState');

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = '';

  filtered.forEach(item => {
    const dataFormatada = new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR');
    const horaFinalizacao = item.finalizadoEm
      ? new Date(item.finalizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '--:--';

    const itemEl = document.createElement('div');
    itemEl.className = 'history-item';
    itemEl.innerHTML = `
      <div class="history-item-header">
        <div class="history-item-date">${escapeHtml(dataFormatada)} • ${escapeHtml(item.diaSemana || '')}</div>
        <div class="history-item-badge">Treino ${escapeHtml(item.treino || '--')}</div>
      </div>
      <div class="history-item-info">
        <span>${escapeHtml(item.semana || '—')}</span>
        <span>•</span>
        <span>${item.concluidos || 0}/${item.totalExercicios || 0}</span>
        <span>•</span>
        <span>${escapeHtml(horaFinalizacao)}</span>
      </div>
    `;
    itemEl.addEventListener('click', () => showDetails(item));
    list.appendChild(itemEl);
  });
}

function showDetails(item) {
  const modal = document.getElementById('detailModal');
  const content = document.getElementById('detailContent');
  const dataFormatada = new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR');
  const horaFinalizacao = item.finalizadoEm
    ? new Date(item.finalizadoEm).toLocaleString('pt-BR')
    : '--';

  let detalhesHtml = `
    <div class="detail-head">
      <div class="detail-title">${escapeHtml(dataFormatada)} • ${escapeHtml(item.diaSemana || '')}</div>
      <div class="detail-meta">
        <div>Treino A/B: <strong>${escapeHtml(item.treino || '--')}</strong></div>
        <div>Semana: <strong>${escapeHtml(item.semana || '—')}</strong></div>
        <div>Exercícios: <strong>${item.concluidos || 0}/${item.totalExercicios || 0}</strong></div>
        <div>Finalizado: <strong>${escapeHtml(horaFinalizacao)}</strong></div>
      </div>
    </div>
  `;

  if (item.detalhes) {
    item.detalhes.forEach(rodada => {
      detalhesHtml += `
        <div class="detail-round">
          <div class="detail-round-title">Rodada ${rodada.numero}</div>
          <div class="detail-list">
      `;
      rodada.exercicios.forEach(ex => {
        detalhesHtml += `
          <div class="detail-exercise${ex.feito ? ' is-done' : ''}">
            <span class="detail-mark">${ex.feito ? '●' : '○'}</span>
            <div class="detail-body">
              <div class="detail-name">${escapeHtml(ex.nome)}</div>
              <div class="detail-exercise-meta">${escapeHtml(ex.meta)}</div>
            </div>
          </div>
        `;
      });
      detalhesHtml += `</div></div>`;
    });
  }

  content.innerHTML = detalhesHtml;
  modal.classList.add('active');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

async function boot() {
  registerServiceWorker();

  if (!(await requireAuth())) return;

  // Se a rede estiver ruim, não segura a tela por mais de 4s
  await Promise.race([
    syncNow(),
    new Promise(resolve => setTimeout(resolve, 4000))
  ]);

  init();
  refreshIcons();
}
