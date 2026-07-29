/* ============================================================
   usuarios.js — Gestión de Usuarios (CRUD simulado)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- SIMULATED DATA ---------- */
  let usuarios = JSON.parse(localStorage.getItem('idv_usuarios')) || [
    { id: 1,  nombre: 'Administrador',       correo: 'admin@idv.org.ni',   rol: 'Administrador', estado: 'activo' },
    { id: 2,  nombre: 'René Adolfo García',  correo: 'pastor@idv.org.ni',  rol: 'Pastor',        estado: 'activo' },
    { id: 3,  nombre: 'Mallen Luna López',   correo: 'mallen@idv.org.ni',  rol: 'Pastora',       estado: 'activo' },
    { id: 4,  nombre: 'Lester García',       correo: 'lester@idv.org.ni',  rol: 'Co-Pastor',     estado: 'activo' },
    { id: 5,  nombre: 'Ena Alexa Pérez',     correo: 'ena@idv.org.ni',     rol: 'Co-Pastora',    estado: 'activo' },
    { id: 6,  nombre: 'Editor IDV',          correo: 'editor@idv.org.ni',  rol: 'Editor',        estado: 'activo' },
    { id: 7,  nombre: 'María López',         correo: 'maria@idv.org.ni',   rol: 'Editor',        estado: 'inactivo' },
  ];

  let nextId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
  let editingId = null;

  /* ---------- PERSIST ---------- */
  function persist() {
    localStorage.setItem('idv_usuarios', JSON.stringify(usuarios));
  }

  /* ---------- RENDER TABLE ---------- */
  const tbody = document.getElementById('usuariosBody');

  function statusBadge(estado) {
    return estado === 'activo'
      ? '<span class="status-badge active"><span class="status-dot"></span> Activo</span>'
      : '<span class="status-badge canceled"><span class="status-dot"></span> Inactivo</span>';
  }

  function renderTable(data) {
    const rows = data || usuarios;
    tbody.innerHTML = '';

    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i class="fas fa-users-slash"></i>
              <p>No se encontraron usuarios.</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    rows.forEach(u => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', u.id);
      tr.innerHTML = `
        <td>
          <div style="display:flex;align-items:center;gap:0.6rem;">
            <div class="topbar-avatar" style="width:32px;height:32px;font-size:0.75rem;">
              ${getInitials(u.nombre)}
            </div>
            <strong>${escapeHtml(u.nombre)}</strong>
          </div>
        </td>
        <td>${escapeHtml(u.correo)}</td>
        <td>
          <span style="background:var(--primary-bg);color:var(--primary);padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">
            ${escapeHtml(u.rol)}
          </span>
        </td>
        <td>${statusBadge(u.estado)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon edit" title="Editar" data-edit="${u.id}"><i class="fas fa-pen-to-square"></i></button>
            <button class="btn-icon delete" title="Eliminar" data-delete="${u.id}"><i class="fas fa-trash-can"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    bindActions();
  }

  /* ---------- BIND EDIT / DELETE ---------- */
  function bindActions() {
    tbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.edit)));
    });

    tbody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => deleteUsuario(parseInt(btn.dataset.delete)));
    });
  }

  /* ---------- MODAL ---------- */
  const modalTitle = document.getElementById('modalTitleUsuario');
  const form = document.getElementById('usuarioForm');
  const passGroup = document.getElementById('passGroup');
  const passInput = document.getElementById('uPassword');

  document.getElementById('btnNuevoUsuario').addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Nuevo Usuario';
    form.reset();
    passGroup.style.display = '';
    passInput.required = true;
    APP.openModal('usuarioModal');
  });

  function openEditModal(id) {
    const u = usuarios.find(u => u.id === id);
    if (!u) return;

    editingId = id;
    modalTitle.textContent = 'Editar Usuario';
    form.querySelector('[name="nombre"]').value = u.nombre;
    form.querySelector('[name="correo"]').value = u.correo;
    form.querySelector('[name="rol"]').value = u.rol;
    form.querySelector('[name="estado"]').value = u.estado;
    passGroup.style.display = 'none';
    passInput.required = false;
    passInput.value = '';
    APP.openModal('usuarioModal');
  }

  /* ---------- SAVE ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
      nombre: form.querySelector('[name="nombre"]').value.trim(),
      correo: form.querySelector('[name="correo"]').value.trim(),
      rol:    form.querySelector('[name="rol"]').value,
      estado: form.querySelector('[name="estado"]').value,
    };

    if (!data.nombre || !data.correo || !data.rol) {
      APP.showToast('Completa los campos obligatorios.', 'warning');
      return;
    }

    const emailDuplicate = usuarios.some(u => u.correo === data.correo && u.id !== editingId);
    if (emailDuplicate) {
      APP.showToast('Ya existe un usuario con ese correo electrónico.', 'error');
      return;
    }

    if (editingId) {
      const idx = usuarios.findIndex(u => u.id === editingId);
      if (idx !== -1) {
        usuarios[idx] = { ...usuarios[idx], ...data };
      }
      APP.showToast('Usuario actualizado correctamente.', 'success');
    } else {
      if (!passInput.value) {
        APP.showToast('La contraseña es obligatoria para nuevos usuarios.', 'warning');
        return;
      }
      const nuevo = { id: nextId++, ...data, password: passInput.value };
      usuarios.unshift(nuevo);
      APP.showToast('Usuario creado correctamente.', 'success');
    }

    persist();
    renderTable();
    APP.closeModal('usuarioModal');
    editingId = null;
  });

  /* ---------- DELETE ---------- */
  function deleteUsuario(id) {
    const u = usuarios.find(u => u.id === id);
    if (!u) return;

    if (u.rol === 'Administrador' && usuarios.filter(x => x.rol === 'Administrador').length <= 1) {
      APP.showToast('No se puede eliminar el último administrador.', 'error');
      return;
    }

    if (!confirm(`¿Eliminar al usuario "${u.nombre}"? Esta acción no se puede deshacer.`)) return;

    usuarios = usuarios.filter(u => u.id !== id);
    persist();
    renderTable();
    APP.showToast('Usuario eliminado.', 'info');
  }

  /* ---------- SEARCH ---------- */
  APP.setupSearch('#searchUsuarios', '#usuariosBody tr');

  /* ---------- INIT ---------- */
  APP.setupModalClose('usuarioModal');
  renderTable();
});

/* ---------- HELPERS ---------- */
function escapeHtml(text) {
  const el = document.createElement('div');
  el.textContent = text;
  return el.innerHTML;
}

function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
