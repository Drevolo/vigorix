import { supabase } from './supabase-client.js';

const SESSION_KEY = 'vigorix_sb_session';
const USER_KEY = 'vigorix_sb_user';

/**
 * A sessão fica no sessionStorage: vale enquanto o navegador/app estiver aberto.
 * Fechar o navegador (ou o app no celular) limpa a sessão e o login é pedido de novo.
 * Recarregar a página ou navegar entre treino/histórico mantém o login.
 */
function store() {
  return window.sessionStorage;
}

// Remove a sessão antiga que ficava gravada no localStorage (versão anterior).
try {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
  Object.keys(localStorage)
    .filter(key => key.startsWith('sb-') && key.endsWith('-auth-token'))
    .forEach(key => localStorage.removeItem(key));
} catch (e) {
  console.warn('[AUTH] Não foi possível limpar a sessão antiga:', e);
}

function markLoggedIn(user) {
  store().setItem(SESSION_KEY, '1');
  if (user) {
    store().setItem(USER_KEY, JSON.stringify(user));
  }
}

export function isLoggedIn() {
  return store().getItem(SESSION_KEY) === '1';
}

export function getUser() {
  try {
    const raw = store().getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Lê a sessão que o supabase-js mantém no sessionStorage.
 * Nunca apaga a sessão local: só o botão "Sair" (ou fechar o navegador) faz isso.
 */
export async function getSession() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data && data.session) {
      markLoggedIn(data.session.user);
      return data.session;
    }
  } catch (e) {
    console.warn('[AUTH] Não foi possível ler a sessão:', e);
  }
  return null;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password
  });

  if (error) throw new Error(error.message || 'Falha no login');
  markLoggedIn(data.user);
  return data;
}

export async function logout() {
  try {
    // scope local: encerra só este aparelho, sem derrubar as outras sessões
    await supabase.auth.signOut({ scope: 'local' });
  } catch (e) {
    console.warn('[AUTH] Falha ao encerrar no servidor, saindo localmente:', e);
  }
  store().removeItem(SESSION_KEY);
  store().removeItem(USER_KEY);
  window.location.href = 'login.html';
}

export async function requireAuth() {
  // Sessão válida apenas enquanto esta janela do navegador estiver aberta.
  if (isLoggedIn()) return true;

  const session = await getSession();
  if (session) return true;

  window.location.href = 'login.html';
  return false;
}
