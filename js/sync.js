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
    // 1) PULL: trazer do banco e mesclar com local (prioriza mais recente por updated)
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

      if (rem && local) {
        // Se tiver updated no remote, comparar por updated
        const rUpdated = rem.updated ? new Date(rem.updated).getTime() : 0;
        // Não temos updated local, mas pra esse caso simples vamos priorizar remoto em pull inicial se mais "novo"? 
        // Mantém local-first: só puxa se não tiver local. Já cobre caso troque de aparelho.
        continue;
      }
    }

    // 2) PUSH: enviar tudo que tem local
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
    // Também garante que history/settings/edited fiquem atualizados caso tenham mudado
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
