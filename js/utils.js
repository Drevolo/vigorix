// Vigorix - Utilitários

export const STORAGE_KEYS = {
  SETTINGS: "vigorix_settings",
  CURRENT: "vigorix_current",
  HISTORY: "vigorix_history",
  EDITED_EXERCISES: "vigorix_edited_exercises",
  SYNC_META: "vigorix_sync_meta"
};

const SYNCED_KEYS = [
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.CURRENT,
  STORAGE_KEYS.HISTORY,
  STORAGE_KEYS.EDITED_EXERCISES
];

// Momento da última alteração local de cada chave sincronizada.
export function getLocalUpdatedAt(key) {
  try {
    const meta = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_META) || "{}");
    return meta[key] || null;
  } catch (e) {
    return null;
  }
}

export function setLocalUpdatedAt(key, isoDate) {
  try {
    const meta = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_META) || "{}");
    meta[key] = isoDate || new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.SYNC_META, JSON.stringify(meta));
  } catch (e) {
    console.error("Erro ao salvar metadados de sync:", e);
  }
}

export function getTodayISO(date = new Date()) {
  const now = date;
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDayName(date = new Date()) {
  const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return dias[date.getDay()];
}

export function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao ler localStorage:", e);
    return fallback;
  }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (SYNCED_KEYS.includes(key)) {
      setLocalUpdatedAt(key, new Date().toISOString());
    }
    return true;
  } catch (e) {
    console.error("Erro ao salvar no localStorage:", e);
    return false;
  }
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTime(date = new Date()) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function formatSeconds(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
