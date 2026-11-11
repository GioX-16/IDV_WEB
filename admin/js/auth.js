/* ============================================================
   auth.js — Acceso de servicio del panel (Supabase Auth)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- DOM ---------- */
  const form      = document.getElementById('loginForm');
  const emailEl   = document.getElementById('email');
  const passEl    = document.getElementById('password');
  const errorEl   = document.getElementById('loginError');
  const btn       = document.getElementById('loginBtn');
  const toggleEl  = document.getElementById('togglePassword');
  const capsHint  = document.getElementById('capsHint');

  if (!form) return;

  /* ---------- ESTADO ---------- */
  function setBusy(busy) {
    btn.disabled = busy;
    btn.classList.toggle('is-busy', busy);
    btn.setAttribute('aria-busy', String(busy));
    emailEl.disabled = busy;
    passEl.disabled = busy;
  }

  function clearError() {
    errorEl.classList.remove('show');
    errorEl.textContent = '';
    emailEl.removeAttribute('aria-invalid');
    passEl.removeAttribute('aria-invalid');
    document.querySelectorAll('.field-control.is-invalid').forEach((control) => {
      control.classList.remove('is-invalid');
    });
  }

  function showError(message, fields) {
    errorEl.textContent = message;
    errorEl.classList.add('show');

    (fields || []).forEach((field) => {
      field.setAttribute('aria-invalid', 'true');
      const control = field.closest('.field')?.querySelector('.field-control');
      if (control) control.classList.add('is-invalid');
    });

    const firstInvalid = (fields || [])[0];
    if (firstInvalid) firstInvalid.focus();
  }

  /* ---------- MOSTRAR / OCULTAR CONTRASEÑA ---------- */
  if (toggleEl) {
    toggleEl.addEventListener('click', () => {
      const showing = passEl.type === 'text';
      passEl.type = showing ? 'password' : 'text';

      const icon = toggleEl.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye', showing);
        icon.classList.toggle('fa-eye-slash', !showing);
      }

      toggleEl.setAttribute('aria-pressed', String(!showing));
      toggleEl.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña');

      // Mantiene el cursor al final al alternar la visibilidad
      const end = passEl.value.length;
      passEl.focus();
      try { passEl.setSelectionRange(end, end); } catch (_) { /* sin selección */ }
    });
  }

  /* ---------- BLOQ MAYÚS ---------- */
  function updateCapsLock(event) {
    if (!capsHint) return;
    let active = false;

    if (typeof event.getModifierState === 'function') {
      active = event.getModifierState('CapsLock');
    }

    capsHint.hidden = !active;
  }

  passEl.addEventListener('keydown', updateCapsLock);
  passEl.addEventListener('keyup', updateCapsLock);
  passEl.addEventListener('blur', () => {
    if (capsHint) capsHint.hidden = true;
  });

  /* ---------- LIMPIAR ERROR AL ESCRIBIR ---------- */
  [emailEl, passEl].forEach((input) => {
    input.addEventListener('input', clearError);
  });

  /* ---------- ENVÍO ---------- */
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const email    = emailEl.value.trim();
    const password = passEl.value;

    if (!email || !password) {
      const missing = [];
      if (!email) missing.push(emailEl);
      if (!password) missing.push(passEl);
      showError('Completa el correo y la contraseña para continuar.', missing);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Escribe un correo válido, por ejemplo nombre@idv.org.ni.', [emailEl]);
      return;
    }

    setBusy(true);

    try {
      if (!window.supabaseClient) {
        throw new Error('missing-client');
      }

      const { error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setBusy(false);

        const message = String(error.message || '').toLowerCase();
        if (message.includes('invalid login credentials')) {
          showError('El correo o la contraseña no son correctos. Vuelve a intentarlo.', [emailEl, passEl]);
        } else if (message.includes('email not confirmed')) {
          showError('La cuenta aún no está confirmada. Pide a un administrador que la active.');
        } else if (message.includes('rate limit') || error.status === 429) {
          showError('Demasiados intentos. Espera un momento y vuelve a intentarlo.');
        } else {
          showError('No pudimos iniciar sesión. Revisa tu conexión e inténtalo de nuevo.');
        }
        return;
      }

      /* Sesión creada: Supabase la conserva entre visitas. */
      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setBusy(false);
      showError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
    }
  });

  /* ---------- FOCO INICIAL (solo escritorio) ---------- */
  if (window.matchMedia('(min-width: 900px)').matches) {
    emailEl.focus({ preventScroll: true });
  }
});
