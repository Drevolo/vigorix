import { supabase } from './supabase-client.js';

const USER_KEY = 'vigorix_sb_user';

export function isLoggedIn() {
  return !!localStorage.getItem('vigorix_sb_session');
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    localStorage.setItem('vigorix_sb_session', '1');
    if (data.session.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.session.user));
    }
    return data.session;
  }
  localStorage.removeItem('vigorix_sb_session');
  localStorage.removeItem(USER_KEY);
  return null;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password
  });

  if (error) throw new Error(error.message || 'Falha no login');
  if (data.session) {
    localStorage.setItem('vigorix_sb_session', '1');
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
  }
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem('vigorix_sb_session');
  localStorage.removeItem(USER_KEY);
  window.location.href = 'login.html';
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}
