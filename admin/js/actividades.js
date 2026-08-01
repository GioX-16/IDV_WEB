/* ============================================================
   actividades.js — Gestión de Actividades (CRUD simulado)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- SIMULATED DATA ---------- */
  let actividades = JSON.parse(localStorage.getItem('idv_actividades')) || [
    { id: 1,  titulo: 'Culto de Oración',         fecha: '2026-07-30', hora: '18:00', descripcion: 'Culto dedicado a la adoración y oración.', estado: 'activo' },
    { id: 2,  titulo: 'Culto de Dorcas',           fecha: '2026-08-01', hora: '18:00', descripcion: 'Culto dirigido por mujeres.', estado: 'activo' },
    { id: 3,  titulo: 'Ayuno Congregacional',      fecha: '2026-07-30', hora: '09:00', descripcion: 'Ayuno para crecimiento espiritual.', estado: 'activo' },
    { id: 4,  titulo: 'Culto de Jóvenes',          fecha: '2026-08-02', hora: '18:00', descripcion: 'Servicio para jóvenes y adolescentes.', estado: 'pendiente' },
    { id: 5,  titulo: 'Estudios SEAN',             fecha: '2026-07-31', hora: '18:00', descripcion: 'Estudios sobre la Vida en Cristo.', estado: 'activo' },
    { id: 6,  titulo: 'Culto Evangelístico',       fecha: '2026-08-03', hora: '16:00', descripcion: 'Culto de adoración y alabanza.', estado: 'activo' },
    { id: 7,  titulo: 'Escuela Dominical',         fecha: '2026-08-03', hora: '09:00', descripcion: 'Clases para todas las edades.', estado: 'pendiente' },
    { id: 8,  titulo: 'Reunión de Líderes',        fecha: '2026-08-05', hora: '17:00', descripcion: 'Coordinación de ministerios.', estado: 'cancelado' },
    { id: 9,  titulo: 'Vigilia de Oración',        fecha: '2026-08-08', hora: '22:00', descripcion: 'Noche de oración y alabanza.', estado: 'pendiente' },
    { id: 10, titulo: 'Bautismos',                 fecha: '2026-08-10', hora: '10:00', descripcion: 'Celebración de bautismos.', estado: 'pendiente' },
  ];

  let nextId = actividades.length > 0 ? Math.max(...actividades.map(a => a.id)) + 1 : 1;
  let editingId = null;

  /* ---------- PERSIST ---------- */
  function persist() {
    localStorage.setItem('idv_actividades', JSON.stringify(actividades));
  }

  /* ---------- RENDER TABLE ---------- */
  const tbody = document.getElementById('actividadesBody');

  function statusBadge(estado) {
    const map = {
      activo:    '<span class="status-badge active"><span class="status-dot"></span> Activo</span>',
      pendiente: '<span class="status-badge pending"><span class="status-dot"></span> Pendiente</span>',
      cancelado: '<span class="status-badge canceled"><span class="status-dot"></span> Cancelado</span>',
    };
    return map[estado] || map.pendiente;
  }

  function renderTable(data) {
    const rows = data || actividades;
    tbody.innerHTML = '';

    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i class="fas fa-calendar-times"></i>
              <p>No se encontraron actividades.</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    rows.forEach(a => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', a.id);
      tr.innerHTML = `
        <td><strong>${escapeHtml(a.titulo)}</strong></td>
        <td>${APP.formatDate(a.fecha)}</td>
        <td>${APP.formatTime(a.hora)}</td>
        <td>${statusBadge(a.estado)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon edit" title="Editar" data-edit="${a.id}"><i class="fas fa-pen-to-square"></i></button>
            <button class="btn-icon delete" title="Eliminar" data-delete="${a.id}"><i class="fas fa-trash-can"></i></button>
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
      btn.addEventListener('click', () => deleteActividad(parseInt(btn.dataset.delete)));
    });
  }

  /* ---------- OPEN MODAL FOR CREATE / EDIT ---------- */
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('actividadForm');

  document.getElementById('btnNuevaActividad').addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Nueva Actividad';
    form.reset();
    form.querySelector('[name="estado"]').value = 'activo';
    APP.openModal('actividadModal');
  });

  function openEditModal(id) {
    const a = actividades.find(a => a.id === id);
    if (!a) return;

    editingId = id;
    modalTitle.textContent = 'Editar Actividad';
    form.querySelector('[name="titulo"]').value = a.titulo;
    form.querySelector('[name="fecha"]').value = a.fecha;
    form.querySelector('[name="hora"]').value = a.hora;
    form.querySelector('[name="descripcion"]').value = a.descripcion || '';
    form.querySelector('[name="estado"]').value = a.estado;
    APP.openModal('actividadModal');
  }

  /* ---------- SAVE ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
      titulo:      form.querySelector('[name="titulo"]').value.trim(),
      fecha:       form.querySelector('[name="fecha"]').value,
      hora:        form.querySelector('[name="hora"]').value,
      descripcion: form.querySelector('[name="descripcion"]').value.trim(),
      estado:      form.querySelector('[name="estado"]').value,
    };

    if (!data.titulo || !data.fecha || !data.hora) {
      APP.showToast('Completa los campos obligatorios: Título, Fecha y Hora.', 'warning');
      return;
    }

    if (editingId) {
      const idx = actividades.findIndex(a => a.id === editingId);
      if (idx !== -1) {
        actividades[idx] = { ...actividades[idx], ...data };
      }
      APP.showToast('Actividad actualizada correctamente.', 'success');
    } else {
      const nueva = { id: nextId++, ...data };
      actividades.unshift(nueva);
      APP.showToast('Actividad creada correctamente.', 'success');
    }

    persist();
    renderTable();
    APP.closeModal('actividadModal');
    editingId = null;
  });

  /* ---------- DELETE ---------- */
  function deleteActividad(id) {
    const a = actividades.find(a => a.id === id);
    if (!a) return;

    if (!confirm(`¿Eliminar la actividad "${a.titulo}"? Esta acción no se puede deshacer.`)) return;

    actividades = actividades.filter(a => a.id !== id);
    persist();
    renderTable();
    APP.showToast('Actividad eliminada.', 'info');
  }

  /* ---------- SEARCH ---------- */
  APP.setupSearch('#searchActividades', '#actividadesBody tr');

  /* ---------- INIT ---------- */
  APP.setupModalClose('actividadModal');
  renderTable();
});

function escapeHtml(text) {
  const el = document.createElement('div');
  el.textContent = text;
  return el.innerHTML;
}
