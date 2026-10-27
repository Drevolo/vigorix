import { PB_URL } from './pb-config.js';
import { getToken, getUser } from './auth.js';

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = token;
  return headers;
}

export async function listMyStore() {
  const user = getUser();
  if (!user) return [];

  const filter = encodeURIComponent(`user = "${user.id}"`);
  const res = await fetch(`${PB_URL}/api/collections/vigorix_store/records?filter=${filter}&sort=-updated`, {
    headers: authHeaders()
  });

  if (!res.ok) throw new Error('Erro ao buscar dados');
  const data = await res.json();
  return data.items || [];
}

export async function getStoreRecord(key) {
  const user = getUser();
  if (!user) return null;

  const filter = encodeURIComponent(`user = "${user.id}" && key = "${key}"`);
  const res = await fetch(`${PB_URL}/api/collections/vigorix_store/records?filter=${filter}&perPage=1`, {
    headers: authHeaders()
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0] || null;
}

export async function upsertStoreRecord(key, dataObj) {
  const user = getUser();
  if (!user) throw new Error('Não logado');

  const existing = await getStoreRecord(key);

  if (existing) {
    const res = await fetch(`${PB_URL}/api/collections/vigorix_store/records/${existing.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ data: dataObj })
    });
    if (!res.ok) throw new Error('Erro ao atualizar registro');
    return await res.json();
  }

  const res = await fetch(`${PB_URL}/api/collections/vigorix_store/records`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      user: user.id,
      key: key,
      data: dataObj
    })
  });

  if (!res.ok) throw new Error('Erro ao criar registro');
  return await res.json();
}
