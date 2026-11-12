/* ============================================================
   usuarios.js — Usuarios reales del sistema
   ============================================================
   La fuente única es la tabla profiles (1 fila por usuario de
   Supabase Auth). Ya no se usa localStorage ni se guardan
   contraseñas en el navegador.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  const tbody = document.getElementById('usuariosBody');
  const infoBtn = document.getElementById('btnNuevoUsuario');

  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text == null ? '' : text;
    return el.innerHTML;
  }

  function getInitials(name) {
    if (!name) return '?';
    return String(name)
      .trim()
      .split(/\s+/)
      .map(word => word[0])
      .filter((_, index, arr) => index === 0 || index === arr.length - 1)
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function statusBadge(estado) {
    return estado === 'activo'
      ? '<span class="status-badge active"><span class="status-dot"></span> Activo</span>'
      : '<span class="status-badge canceled"><span class="status-dot"></span> Inactivo</span>';
  }

  function renderTable(usuarios) {
    tbody.innerHTML = '';

    if (!usuarios.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              <i class="fas fa-users-slash"></i>
              <p>No se encontraron usuarios.</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    usuarios.forEach((usuario) => {
      const row = document.createElement('tr');
      row.setAttribute('data-id', usuario.id);
      row.innerHTML = `
        <td data-label="">
          <div style="display:flex;align-items:center;gap:0.6rem;">
            <div class="topbar-avatar" style="width:32px;height:32px;font-size:0.75rem;">
              ${escapeHtml(getInitials(usuario.nombre || usuario.email))}
            </div>
            <strong>${escapeHtml(usuario.nombre || 'Sin nombre')}</strong>
          </div>
        </td>
        <td data-label="Correo">${escapeHtml(usuario.email || '')}</td>
        <td data-label="Rol">
          <span style="background:var(--primary-bg);color:var(--primary);padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">
            ${escapeHtml(usuario.rol || 'Editor')}
          </span>
        </td>
        <td data-label="Estado">${statusBadge(usuario.estado)}</td>
      `;
      tbody.appendChild(row);
    });
  }

  async function loadUsuarios() {
    try {
      await supabase.auth.getSession();

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, nombre, rol, estado')
        .order('email', { ascending: true });

      if (error) throw error;

      const usuarios = data || [];
      renderTable(usuarios);

      const activos = usuarios.filter(u => u.estado === 'activo').length;
      APP.setupSearch('#searchUsuarios', '#usuariosBody tr');

      if (activos !== usuarios.length) {
        APP.showToast(`Hay ${usuarios.length - activos} usuario(s) inactivo(s).`, 'info');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      tbody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              <i class="fas fa-triangle-exclamation"></i>
              <p>No se pudieron cargar los usuarios. Revisa la conexión.</p>
            </div>
          </td>
        </tr>`;
      APP.showToast('Error al cargar los usuarios desde Supabase.', 'error');
    }
  }

  if (infoBtn) {
    infoBtn.addEventListener('click', () => {
      APP.showToast('Las cuentas se crean y eliminan desde Supabase → Authentication → Users. Esta vista refleja los perfiles reales.', 'info');
    });
  }

  await loadUsuarios();
});
