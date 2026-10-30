// Histórico de treinos: leitura, normalização, ordenação e merge.
// Fica no core porque é compartilhado por treino, dashboard, sync e página de histórico.
import { storageGet, STORAGE_KEYS } from './utils.js';

export function readHistory() {
  const bruto = storageGet(STORAGE_KEYS.HISTORY, []);
  return Array.isArray(bruto) ? bruto : [];
}

export function readValidHistory() {
  return readHistory().filter(item => item && item.data);
}

// Registros antigos não tinham `detalhes`/`concluidos`; normaliza na leitura.
export function normalizeRecord(item) {
  const registro = { ...item };
  const exercises = Array.isArray(registro.exercises) ? registro.exercises : [];

  if (registro.concluidos === undefined) registro.concluidos = exercises.length;
  if (registro.totalExercicios === undefined) registro.totalExercicios = exercises.length;
  if (registro.finalizadoEm === undefined) registro.finalizadoEm = registro.completedAt;
  if (registro.semana === undefined) registro.semana = '—';

  if (!registro.detalhes && exercises.length > 0) {
    const rodadas = new Map();
    exercises.forEach(ex => {
      const numero = ex.round || 1;
      if (!rodadas.has(numero)) rodadas.set(numero, { numero, exercicios: [] });
      rodadas.get(numero).exercicios.push({
        nome: ex.nome,
        meta: ex.meta,
        feito: true,
        time: ex.time
      });
    });
    registro.detalhes = [...rodadas.values()].sort((a, b) => a.numero - b.numero);
  }

  return registro;
}

export function readNormalizedHistory() {
  return readHistory().map(normalizeRecord);
}

// Mais recente primeiro: data, depois horário de conclusão, depois id.
export function sortHistory(list) {
  return [...list].sort((a, b) => {
    const dataA = String(a && a.data ? a.data : '');
    const dataB = String(b && b.data ? b.data : '');
    if (dataA !== dataB) return dataB.localeCompare(dataA);
    const tempoA = (a && (a.completedAt || a.finalizadoEm)) || 0;
    const tempoB = (b && (b.completedAt || b.finalizadoEm)) || 0;
    if (tempoA !== tempoB) return tempoB - tempoA;
    return String(a && a.id).localeCompare(String(b && b.id));
  });
}

// União por id: nunca perde treino feito em outro aparelho.
export function mergeHistory(localList, remoteList) {
  const porId = new Map();
  [...remoteList, ...localList].forEach(item => {
    if (!item || !item.id) return;
    const anterior = porId.get(item.id);
    if (!anterior) {
      porId.set(item.id, item);
      return;
    }
    const tempoAnterior = anterior.completedAt || anterior.finalizadoEm || 0;
    const tempoAtual = item.completedAt || item.finalizadoEm || 0;
    if (tempoAtual >= tempoAnterior) porId.set(item.id, item);
  });
  return sortHistory([...porId.values()]);
}
