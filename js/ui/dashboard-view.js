// Coluna lateral / resumo da home (sequência, últimos treinos, semana).
import { getTodayISO, getDayName } from '../core/utils.js';
import { readValidHistory, sortHistory } from '../core/history.js';
import { getSelectedWeek, totalExercises } from '../workout/state.js';
import {
  MESES_CURTOS,
  startOfWeek,
  computeStreak,
  computeStreakRecord,
  workoutMinutes
} from '../workout/stats.js';
import { escapeHtml, refreshIcons, setText } from './dom.js';

export function renderDashboard() {
  const history = sortHistory(readValidHistory());
  const selectedWeek = getSelectedWeek();

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

  refreshIcons();
}
