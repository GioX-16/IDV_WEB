/* ============================================================
   auth.js — Lógica de Login del Panel Admin
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- SIMULATED USERS ---------- */
  const USERS = [
    { email: 'admin@idv.org.ni', password: 'admin123', name: 'Administrador', role: 'Administrador' },
    { email: 'pastor@idv.org.ni', password: 'pastor123', name: 'Pastor René García', role: 'Pastor' },
    { email: 'editor@idv.org.ni',  password: 'editor123', name: 'Editor IDV',        role: 'Editor' },
  ];

  /* ---------- DOM ---------- */
  const form     = document.getElementById('loginForm');
  const emailEl  = document.getElementById('email');
  const passEl   = document.getElementById('password');
  const errorEl  = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');

  /* ---------- SUBMIT ---------- */
  form.addEventListener('submit', (e) => {
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

    /* Buscar usuario */
    const user = USERS.find(u => u.email === email && u.password === password);

    if (!user) {
      showError('Correo o contraseña incorrectos. Intenta de nuevo.');
      return;
    }

    /* Login exitoso */
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
    btn.disabled = true;

    setTimeout(() => {
      localStorage.setItem('idv_admin_user', JSON.stringify({
        name: user.name,
        role: user.role,
        email: user.email,
        loggedAt: new Date().toISOString(),
      }));

      window.location.href = 'dashboard.html';
    }, 800);
  });

  /* ---------- HELPERS ---------- */
  function showError(msg) {
    errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    errorEl.classList.add('show');
  }
});
