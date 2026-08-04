/* ============================================================
   auth.js — Login del Panel Admin (autenticación real con Supabase)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- DOM ---------- */
  const form    = document.getElementById('loginForm');
  const emailEl = document.getElementById('email');
  const passEl  = document.getElementById('password');
  const errorEl = document.getElementById('loginError');
  const btn     = document.getElementById('loginBtn');

  /* ---------- SUBMIT ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = emailEl.value.trim();
    const password = passEl.value.trim();
    errorEl.classList.remove('show');
    errorEl.textContent = '';

    /* Validar campos */
    if (!email || !password) {
      showError('Por favor completa todos los campos.');
      return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
    btn.disabled  = true;

    /* Autenticación contra Supabase Auth */
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
      btn.disabled  = false;
      showError('Correo o contraseña incorrectos. Intenta de nuevo.');
      return;
    }

    /* Login exitoso: Supabase guarda la sesión automáticamente */
    window.location.href = 'dashboard.html';
  });

  /* ---------- HELPERS ---------- */
  function showError(msg) {
    errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    errorEl.classList.add('show');
  }
});
