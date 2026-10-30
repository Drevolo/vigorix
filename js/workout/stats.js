// Estatísticas derivadas do histórico (não alteram estado).
import { getTodayISO } from '../core/utils.js';

export const MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7; // segunda-feira
  d.setDate(d.getDate() - offset);
  return d;
}

export function computeStreak(history) {
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

export function computeStreakRecord(history) {
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

export function workoutMinutes(item) {
  if (!item || !Array.isArray(item.exercises)) return 0;
  return item.exercises.reduce((sum, ex) => sum + (Number(ex && ex.time) || 0), 0) / 60;
}
