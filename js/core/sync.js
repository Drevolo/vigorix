import { STORAGE_KEYS, storageGet, storageSet, getLocalUpdatedAt, setLocalUpdatedAt } from './utils.js';
import { isLoggedIn } from './auth.js';
import { listMyStore, upsertStoreRecord } from './api.js';
import { mergeHistory, sortHistory } from './history.js';

const SYNC_KEYS = [
  STORAGE_KEYS.CURRENT,
  STORAGE_KEYS.HISTORY,
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.EDITED_EXERCISES
];

let syncInProgress = false;
let pendingPush = false;

function drainPendingPush() {
  if (!pendingPush) return;
  pendingPush = false;
  syncPush();
}

function setStatus(text) {
  const el = document.getElementById('syncStatus');
  if (el) el.textContent = text;

  // Pill compacta do topo (mobile)
  const pill = document.getElementById('syncPillText');
  if (pill) pill.textContent = text;

  const dot = document.querySelector('.status-dot');
  if (dot) {
    let color = 'var(--success)';
    if (/erro/i.test(text)) color = 'var(--danger)';
    else if (/offline|não logado|falha/i.test(text)) color = 'var(--warning)';
    else if (/sincronizando|salvando/i.test(text)) color = 'var(--cyan)';
    dot.style.background = color;
    dot.style.boxShadow = `0 0 8px ${color}`;
  }
}

function getTime() {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// União por id: nunca perde treino feito em outro aparelho.
// (implementação em core/history.js)
function remoteIsNewer(remote, localUpdatedAt) {
  if (!localUpdatedAt) return true;
  const remoto = Date.parse(remote && remote.updated_at) || 0;
  const local = Date.parse(localUpdatedAt) || 0;
  return remoto > local;
}

function applyRemote(key, remote) {
  storageSet(key, remote.data);
  setLocalUpdatedAt(key, remote.updated_at);
}

/**
 * Sincroniza com o Supabase.
 * - histórico: união por id (merge)
 * - demais chaves: vence a alteração mais recente (local ou remota)
 */
export async function syncNow() {
  if (syncInProgress) return { skipped: true };
  if (!isLoggedIn()) {
    setStatus('Não sincronizado (não logado)');
    return { skipped: true };
  }
  if (!navigator.onLine) {
    setStatus('Offline — dados salvos no aparelho');
    return { offline: true };
  }

  syncInProgress = true;
  setStatus('Sincronizando...');

  let aplicouRemoto = false;
  let enviouAlgo = false;

  try {
    const remoto = await listMyStore();
    const remotoPorChave = new Map();
    for (const item of remoto) {
      if (item && item.key) remotoPorChave.set(item.key, item);
    }

    for (const key of SYNC_KEYS) {
      const local = storageGet(key, null);
      const remotoItem = remotoPorChave.get(key);
      const localVazio = local === null || local === undefined;

      if (!remotoItem) {
        if (!localVazio) {
          await upsertStoreRecord(key, local);
          enviouAlgo = true;
        }
        continue;
      }

      if (localVazio) {
        applyRemote(key, remotoItem);
        aplicouRemoto = true;
        continue;
      }

      if (key === STORAGE_KEYS.HISTORY) {
        const localLista = Array.isArray(local) ? local : [];
        const remotoLista = Array.isArray(remotoItem.data) ? remotoItem.data : [];
        const mesclado = mergeHistory(localLista, remotoLista);

        if (JSON.stringify(mesclado) !== JSON.stringify(sortHistory(localLista))) {
          storageSet(key, mesclado);
          aplicouRemoto = true;
        }
        if (JSON.stringify(mesclado) !== JSON.stringify(sortHistory(remotoLista))) {
          await upsertStoreRecord(key, mesclado);
          enviouAlgo = true;
        }
        continue;
      }

      if (remoteIsNewer(remotoItem, getLocalUpdatedAt(key))) {
        applyRemote(key, remotoItem);
        aplicouRemoto = true;
      } else {
        await upsertStoreRecord(key, local);
        enviouAlgo = true;
      }
    }

    if (aplicouRemoto) {
      window.dispatchEvent(new CustomEvent('vigorix:synced'));
    }

    if (aplicouRemoto || enviouAlgo) {
      setStatus(`Sincronizado às ${getTime()}`);
    } else {
      setStatus(`Tudo atualizado às ${getTime()}`);
    }
    return { aplicouRemoto, enviouAlgo };
  } catch (e) {
    console.error('[SYNC]', e);
    setStatus('Erro ao sincronizar');
    return { error: e };
  } finally {
    syncInProgress = false;
    drainPendingPush();
  }
}

/**
 * Envio rápido para o servidor (não puxa nada).
 */
export async function syncPush() {
  if (!isLoggedIn()) {
    setStatus('Salvo no aparelho (não logado)');
    return;
  }
  if (!navigator.onLine) {
    setStatus('Offline — salvo no aparelho');
    return;
  }
  if (syncInProgress) {
    pendingPush = true;
    return;
  }

  syncInProgress = true;
  setStatus('Salvando...');

  try {
    for (const key of SYNC_KEYS) {
      const local = storageGet(key, null);
      if (local !== null && local !== undefined) {
        await upsertStoreRecord(key, local);
      }
    }
    setStatus(`Salvo às ${getTime()}`);
  } catch (e) {
    console.error('[SYNC_FINISH]', e);
    setStatus('Salvo no aparelho (falha online)');
  } finally {
    syncInProgress = false;
    drainPendingPush();
  }
}

// Alias mantido para compatibilidade.
export const syncOnExerciseFinish = syncPush;
