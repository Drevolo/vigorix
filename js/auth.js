import { supabase } from './supabase-client.js';

const SESSION_KEY = 'vigorix_sb_session';
const USER_KEY = 'vigorix_sb_user';

function markLoggedIn(user) {
  localStorage.setItem(SESSION_KEY, '1');
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Sessão salva no aparelho. Fechar o navegador/app NÃO desloga:
 * o Supabase guarda a sessão no localStorage e renova o token sozinho.
 */
export function isLoggedIn() {
  return localStorage.getItem(SESSION_KEY) === '1';
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Lê a sessão que o supabase-js já mantém no localStorage.
 * Nunca apaga a sessão local: só o botão "Sair" faz isso.
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
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = 'login.html';
}

export async function requireAuth() {
  // A sessão salva no aparelho é a fonte de verdade — sem revalidar token a cada entrada.
  if (isLoggedIn()) return true;

  // Primeira entrada após uma atualização do app: tenta recuperar a sessão já salva pelo Supabase.
  const session = await getSession();
  if (session) return true;

  window.location.href = 'login.html';
  return false;
}
