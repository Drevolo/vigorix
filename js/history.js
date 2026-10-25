import { storageGet, STORAGE_KEYS } from './utils.js';

let currentFilter = 'todos';
let currentView = 'calendario';
let calendarDate = new Date();

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
  
  render();
}

function render() {
  const history = storageGet(STORAGE_KEYS.HISTORY, []);
  
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
  
  lucide.createIcons();
}

function renderCalendar() {
  const history = storageGet(STORAGE_KEYS.HISTORY, []);
  const historyDates = new Set(history.map(h => h.data));
  const grid = document.getElementById('calendarGrid');
  const label = document.getElementById('calMonthLabel');
  
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  label.textContent = `${meses[month]} ${year}`;
  
  grid.innerHTML = '';
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 0 Domingo
  const daysInMonth = lastDay.getDate();
  
  // Dias vazios antes do primeiro dia
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement('div');
    empty.style.height = '2.75rem';
    grid.appendChild(empty);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasTreino = historyDates.has(dateStr);
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    
    const dayEl = document.createElement('button');
    dayEl.style.height = '2.75rem';
    dayEl.style.borderRadius = '0.5rem';
    dayEl.style.border = isToday ? '1px solid var(--primary-accent)' : '1px solid var(--border-subtle)';
    dayEl.style.background = hasTreino ? 'rgba(245, 245, 247, 0.06)' : 'transparent';
    dayEl.style.color = hasTreino ? 'var(--text-primary)' : 'var(--text-secondary)';
    dayEl.style.fontSize = '0.875rem';
    dayEl.style.cursor = hasTreino ? 'pointer' : 'default';
    dayEl.style.position = 'relative';
    dayEl.textContent = day;
    
    if (hasTreino) {
      const dot = document.createElement('span');
      dot.style.position = 'absolute';
      dot.style.bottom = '4px';
      dot.style.left = '50%';
      dot.style.transform = 'translateX(-50%)';
      dot.style.width = '4px';
      dot.style.height = '4px';
      dot.style.borderRadius = '50%';
      dot.style.background = 'var(--text-primary)';
      dayEl.appendChild(dot);
      
      dayEl.addEventListener('click', () => {
        const items = history.filter(h => h.data === dateStr);
        if (items.length === 1) {
          showDetails(items[0]);
        } else if (items.length > 1) {
          // mostrar primeiro ou criar lista rápida
          showDetails(items[0]);
        }
      });
    }
    
    grid.appendChild(dayEl);
  }
}

function renderList(history) {
  const today = new Date().toISOString().split('T')[0];
  
  let filtered = [...history];
  if (currentFilter === 'hoje') {
    filtered = filtered.filter(h => h.data === today);
  } else if (currentFilter === '7dias') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString().split('T')[0];
    filtered = filtered.filter(h => h.data >= weekAgoISO);
  }
  
  filtered.sort((a, b) => b.data.localeCompare(a.data) || (b.finalizadoEm || 0) - (a.finalizadoEm || 0));
  
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
    const horaFinalizacao = item.finalizadoEm ? new Date(item.finalizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    
    const itemEl = document.createElement('div');
    itemEl.className = 'history-item';
    itemEl.innerHTML = `
      <div class="history-item-header">
        <div class="history-item-date">${dataFormatada} • ${item.diaSemana}</div>
        <div class="history-item-badge">Treino ${item.treino}</div>
      </div>
      <div class="history-item-info">
        <span>${item.semana}</span>
        <span>•</span>
        <span>${item.concluidos}/${item.totalExercicios}</span>
        <span>•</span>
        <span>${horaFinalizacao}</span>
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
  const horaFinalizacao = item.finalizadoEm ? new Date(item.finalizadoEm).toLocaleString('pt-BR') : '--';
  
  let detalhesHtml = `
    <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
      <div style="font-weight: 500; margin-bottom: 0.5rem; letter-spacing: -0.01em;">${dataFormatada} • ${item.diaSemana}</div>
      <div style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.9;">
        <div>Treino <span style="color: var(--text-primary);">A/B</span>: <strong style="color: var(--text-primary);">${item.treino}</strong></div>
        <div>Semana: <strong style="color: var(--text-primary);">${item.semana}</strong></div>
        <div>Exercícios: <strong style="color: var(--text-primary);">${item.concluidos}/${item.totalExercicios}</strong></div>
        <div>Finalizado: <strong style="color: var(--text-primary);">${horaFinalizacao}</strong></div>
      </div>
    </div>
  `;
  
  if (item.detalhes) {
    item.detalhes.forEach(rodada => {
      detalhesHtml += `
        <div style="margin-bottom: 1rem;">
          <div style="font-weight: 500; margin-bottom: 0.5rem; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.08em;">Rodada ${rodada.numero}</div>
          <div style="display: flex; flex-direction: column; gap: 0.375rem;">
      `;
      rodada.exercicios.forEach(ex => {
        detalhesHtml += `
          <div style="padding: 0.625rem 0.75rem; background: transparent; border: 1px solid var(--border-subtle); border-radius: 0.5rem; font-size: 0.8125rem; display: flex; align-items: center; gap: 0.625rem;">
            <span style="color: ${ex.feito ? 'var(--success)' : 'var(--text-secondary)'};">${ex.feito ? '●' : '○'}</span>
            <div style="flex: 1; ${ex.feito ? 'opacity: 0.6;' : ''}">
              <div style="${ex.feito ? 'text-decoration: line-through;' : ''}">${ex.nome}</div>
              <div style="color: var(--text-secondary); font-size: 0.75rem;">${ex.meta}</div>
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

document.addEventListener('DOMContentLoaded', init);
