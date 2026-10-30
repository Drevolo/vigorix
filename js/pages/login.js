// Entrada da tela de login.
import { isLoggedIn, getSession, login } from '../core/auth.js';
import { syncNow } from '../core/sync.js';
import { registerServiceWorker } from '../core/pwa.js';

// O Supabase responde em inglês; a tela é em português.
function translateAuthError(err) {
  const raw = String(err && err.message ? err.message : err || '');
  const msg = raw.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('email not confirmed')) {
    return 'E-mail ainda não confirmado. Confirme a conta no Supabase.';
  }
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde um minuto e tente de novo.';
  }
  return raw || 'Erro ao entrar. Tente novamente.';
}

function initForm() {
  const form = document.getElementById('loginForm');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginSubmit');
  const btnText = document.getElementById('loginBtnText');
  const toggle = document.getElementById('togglePassword');
  const eyeOn = toggle.querySelector('.eye-on');
  const eyeOff = toggle.querySelector('.eye-off');

  toggle.addEventListener('click', () => {
    const showing = password.type === 'text';
    password.type = showing ? 'password' : 'text';
    toggle.setAttribute('aria-pressed', String(!showing));
    toggle.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
    eyeOn.style.display = showing ? 'block' : 'none';
    eyeOff.style.display = showing ? 'none' : 'block';
    password.focus();
  });

  [email, password].forEach(input => {
    input.addEventListener('input', () => {
      if (errorEl.textContent) errorEl.textContent = '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    btnText.textContent = 'Entrando...';

    try {
      await login(email.value, password.value);
      await syncNow(true);
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
      errorEl.textContent = translateAuthError(err);
      btn.disabled = false;
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      btnText.textContent = 'Entrar';
    }
  });
}

async function boot() {
  registerServiceWorker();

  // Sessão salva no aparelho entra direto — não depende de rede.
  if (isLoggedIn() || await getSession()) {
    window.location.replace('index.html');
    return;
  }

  initForm();
}

boot();
