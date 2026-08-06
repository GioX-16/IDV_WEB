/* ============================================================
   actividades.js — Gestión de Actividades (vía Supabase)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  /* ---------- ESTADO ---------- */
  let actividades = [];
  let editingId   = null;

  /* ---------- ELEMENTOS ---------- */
  const tbody      = document.getElementById('actividadesBody');
  const modalTitle = document.getElementById('modalTitle');
  const form       = document.getElementById('actividadForm');

  /* ---------- HELPERS ---------- */
  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text;
    return el.innerHTML;
  }

  function statusBadge(estado) {
    const map = {
      activo:    '<span class="status-badge active"><span class="status-dot"></span> Activo</span>',
      pendiente: '<span class="status-badge pending"><span class="status-dot"></span> Pendiente</span>',
      cancelado: '<span class="status-badge canceled"><span class="status-dot"></span> Cancelado</span>',
    };
    return map[estado] || map.pendiente;
  }

  /* ---------- CARGAR ACTIVIDADES DESDE SUPABASE ---------- */
  async function loadActividades() {
    try {
      const { data, error } = await supabase
        .from('actividades')
        .select('*')
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;
      actividades = data || [];
    } catch (e) {
      console.error('Error al cargar actividades:', e);
      APP.showToast('Error al cargar las actividades desde el servidor.', 'error');
      actividades = [];
    }
  }

  /* ---------- RENDER TABLE ---------- */
  function renderTable(data) {
    const rows = data || actividades;
    tbody.innerHTML = '';

    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <i class="fas fa-calendar-times"></i>
              <p>No se encontraron actividades. Crea la primera con el botón "Nueva Actividad".</p>
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
      btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.edit, 10)));
    });
    tbody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => deleteActividad(parseInt(btn.dataset.delete, 10)));
    });
  }

  /* ---------- OPEN MODAL FOR CREATE ---------- */
  document.getElementById('btnNuevaActividad').addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Nueva Actividad';
    form.reset();
    form.querySelector('[name="estado"]').value = 'activo';
    APP.openModal('actividadModal');
  });

  /* ---------- OPEN MODAL FOR EDIT ---------- */
  function openEditModal(id) {
    const a = actividades.find(act => act.id === id);
    if (!a) return;

    editingId = id;
    modalTitle.textContent = 'Editar Actividad';
    form.querySelector('[name="titulo"]').value      = a.titulo;
    form.querySelector('[name="fecha"]').value        = a.fecha;
    form.querySelector('[name="hora"]').value         = a.hora;
    form.querySelector('[name="descripcion"]').value  = a.descripcion || '';
    form.querySelector('[name="estado"]').value       = a.estado;
    APP.openModal('actividadModal');
  }

  /* ---------- SAVE (CREATE / UPDATE) ---------- */
  const btnSave = document.getElementById('btnSaveActividad');
  const saveHtml  = '<i class="fas fa-save"></i> Guardar';
  const spinHtml  = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const record = {
      titulo:      form.querySelector('[name="titulo"]').value.trim(),
      fecha:       form.querySelector('[name="fecha"]').value,
      hora:        form.querySelector('[name="hora"]').value,
      descripcion: form.querySelector('[name="descripcion"]').value.trim(),
      estado:      form.querySelector('[name="estado"]').value,
    };

    if (!record.titulo || !record.fecha || !record.hora) {
      APP.showToast('Completa los campos obligatorios: Título, Fecha y Hora.', 'warning');
      return;
    }

    btnSave.innerHTML = spinHtml;
    btnSave.disabled = true;

    try {
      if (editingId) {
        const { error } = await supabase
          .from('actividades')
          .update(record)
          .eq('id', editingId);

        if (error) throw error;

        const idx = actividades.findIndex(a => a.id === editingId);
        if (idx !== -1) actividades[idx] = { ...actividades[idx], ...record };
        APP.showToast('Actividad actualizada correctamente.', 'success');
      } else {
        const { data, error } = await supabase
          .from('actividades')
          .insert(record)
          .select('*')
          .single();

        if (error) throw error;

        actividades.unshift(data);
        APP.showToast('Actividad creada correctamente.', 'success');
      }

      renderTable();
      APP.closeModal('actividadModal');
      editingId = null;
    } catch (err) {
      console.error('Error al guardar actividad:', err);
      APP.showToast('Error al guardar la actividad. Intenta de nuevo.', 'error');
    } finally {
      btnSave.innerHTML = saveHtml;
      btnSave.disabled = false;
    }
  });

  /* ---------- DELETE ---------- */
  async function deleteActividad(id) {
    const a = actividades.find(act => act.id === id);
    if (!a) return;

    if (!confirm(`¿Eliminar la actividad "${a.titulo}"? Esta acción no se puede deshacer.`)) return;

    try {
      const { error } = await supabase
        .from('actividades')
        .delete()
        .eq('id', id);

      if (error) throw error;

      actividades = actividades.filter(act => act.id !== id);
      renderTable();
      APP.showToast('Actividad eliminada.', 'info');
    } catch (err) {
      console.error('Error al eliminar actividad:', err);
      APP.showToast('Error al eliminar la actividad.', 'error');
    }
  }

  /* ---------- SEARCH ---------- */
  APP.setupSearch('#searchActividades', '#actividadesBody tr');

  /* ---------- INIT ---------- */
  APP.setupModalClose('actividadModal');
  await loadActividades();
  renderTable();
});
