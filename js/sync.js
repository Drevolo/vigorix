import { STORAGE_KEYS, storageGet, storageSet } from './utils.js';
import { isLoggedIn, getUser } from './auth.js';
import { listMyStore, upsertStoreRecord } from './api.js';

const SYNC_KEYS = [
  STORAGE_KEYS.CURRENT,
  STORAGE_KEYS.HISTORY,
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.EDITED_EXERCISES
];

let syncInProgress = false;

function setStatus(text) {
  const el = document.getElementById('syncStatus');
  if (el) el.textContent = text;
}

function getTime() {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export async function syncNow(silent = false) {
  if (syncInProgress) return;
  if (!isLoggedIn()) {
    setStatus('Não sincronizado (não logado)');
    return;
  }

  syncInProgress = true;
  if (!silent) setStatus('Sincronizando...');
  else setStatus('Sincronizando...');

  try {
    const remote = await listMyStore();
    const remoteMap = new Map();
    for (const item of remote) {
      if (item.key && item.data !== undefined) {
        remoteMap.set(item.key, item);
      }
    }

    for (const key of SYNC_KEYS) {
      const local = storageGet(key, null);
      const rem = remoteMap.get(key);

      if (rem && !local) {
        storageSet(key, rem.data);
        continue;
      }
    }

    for (const key of SYNC_KEYS) {
      const local = storageGet(key, null);
      if (local !== null && local !== undefined) {
        await upsertStoreRecord(key, local);
      }
    }

    setStatus(`Sincronizado às ${getTime()}`);
  } catch (e) {
    console.error('[SYNC]', e);
    setStatus('Erro ao sincronizar');
  } finally {
    syncInProgress = false;
  }
}

export async function syncOnExerciseFinish() {
  if (!isLoggedIn()) {
    setStatus('Salvo local (não logado)');
    return;
  }
  if (syncInProgress) return;

  syncInProgress = true;
  setStatus('Salvando...');

  try {
    const localCurrent = storageGet(STORAGE_KEYS.CURRENT, null);
    if (localCurrent !== null) {
      await upsertStoreRecord(STORAGE_KEYS.CURRENT, localCurrent);
    }
    for (const key of [STORAGE_KEYS.HISTORY, STORAGE_KEYS.SETTINGS, STORAGE_KEYS.EDITED_EXERCISES]) {
      const local = storageGet(key, null);
      if (local !== null) {
        await upsertStoreRecord(key, local);
      }
    }
    setStatus(`Sincronizado às ${getTime()}`);
  } catch (e) {
    console.error('[SYNC_FINISH]', e);
    setStatus('Salvo local (falha online)');
  } finally {
    syncInProgress = false;
  }
}
