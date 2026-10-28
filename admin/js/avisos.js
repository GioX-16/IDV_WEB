document.addEventListener('DOMContentLoaded', async () => {

  const tbody        = document.getElementById('avisosBody');
  const modalTitle   = document.getElementById('modalTitle');
  const form         = document.getElementById('avisoForm');
  const fileInput    = document.getElementById('avImagen');
  const previewWrap  = document.getElementById('avisoPreviewWrap');
  const previewImg   = document.getElementById('avisoPreview');
  const btnRemoveImg = document.getElementById('btnQuitarImagen');
  const btnSave      = document.getElementById('btnSaveAviso');

  const bucket = window.AVISOS_BUCKET || 'avisos';

  let avisos = [];
  let editingId = null;
  let pendingFile = null;
  let originalImageUrl = '';
  let originalStoragePath = '';
  let removeImage = false;

  const saveHtml = '<i class="fas fa-save"></i> Guardar';
  const spinHtml = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text == null ? '' : text;
    return el.innerHTML;
  }

  function statusBadge(estado) {
    if (estado === 'inactivo') {
      return '<span class="status-badge inactive"><span class="status-dot"></span> Inactivo</span>';
    }
    return '<span class="status-badge active"><span class="status-dot"></span> Activo</span>';
  }

  function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max).trim() + '...' : text;
  }

  function resetImageState() {
    pendingFile = null;
    originalImageUrl = '';
    originalStoragePath = '';
    removeImage = false;
    fileInput.value = '';
    previewImg.removeAttribute('src');
    previewWrap.hidden = true;
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function showPreview(url) {
    if (!url) {
      previewWrap.hidden = true;
      previewImg.removeAttribute('src');
      return;
    }
    previewImg.src = url;
    previewWrap.hidden = false;
  }

  async function loadAvisos() {
    try {
      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .order('fecha_publicacion', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      avisos = data || [];
    } catch (e) {
      console.error('Error al cargar avisos:', e);
      APP.showToast('Error al cargar los avisos desde el servidor.', 'error');
      avisos = [];
    }
  }

  function renderTable() {
    tbody.innerHTML = '';

    if (!avisos.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              <i class="fas fa-bullhorn"></i>
              <p>No hay avisos registrados. Crea el primero con el botón "Nuevo Aviso".</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    avisos.forEach(a => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', a.id);

      const thumb = a.imagen_url
        ? `<img class="aviso-thumb" src="${escapeHtml(a.imagen_url)}" alt="">`
        : '<span class="aviso-thumb-empty"><i class="fas fa-image"></i></span>';

      tr.innerHTML = `
        <td>
          <div class="aviso-cell">
            ${thumb}
            <div class="aviso-cell-text">
              <strong>${escapeHtml(a.titulo)}</strong>
              <small>${escapeHtml(truncate(a.contenido, 110))}</small>
            </div>
          </div>
        </td>
        <td>${a.fecha_publicacion ? APP.formatDate(a.fecha_publicacion) : '-'}</td>
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

  function bindActions() {
    tbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.edit, 10)));
    });
    tbody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => deleteAviso(parseInt(btn.dataset.delete, 10)));
    });
  }

  function openCreateModal() {
    editingId = null;
    modalTitle.textContent = 'Nuevo Aviso';
    form.reset();
    resetImageState();
    form.querySelector('[name="estado"]').value = 'activo';
    form.querySelector('[name="fecha_publicacion"]').value = todayISO();
    APP.openModal('avisoModal');
  }

  function openEditModal(id) {
    const a = avisos.find(item => item.id === id);
    if (!a) return;

    editingId = id;
    resetImageState();
    originalImageUrl = a.imagen_url || '';
    originalStoragePath = a.storage_path || '';

    modalTitle.textContent = 'Editar Aviso';
    form.querySelector('[name="titulo"]').value = a.titulo || '';
    form.querySelector('[name="contenido"]').value = a.contenido || '';
    form.querySelector('[name="fecha_publicacion"]').value = a.fecha_publicacion || '';
    form.querySelector('[name="estado"]').value = a.estado || 'activo';
    showPreview(originalImageUrl);
    APP.openModal('avisoModal');
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      APP.showToast('Selecciona un archivo de imagen válido (PNG, JPG, WEBP o SVG).', 'error');
      fileInput.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      APP.showToast('La imagen no debe superar los 5 MB.', 'warning');
      fileInput.value = '';
      return;
    }

    pendingFile = file;
    removeImage = false;
    const reader = new FileReader();
    reader.onload = (e) => showPreview(e.target.result);
    reader.readAsDataURL(file);
  }

  async function removeOldImage(path) {
    if (!path) return;
    try {
      await supabase.storage.from(bucket).remove([path]);
    } catch (e) {
      console.warn('No se pudo eliminar la imagen anterior:', e);
    }
  }

  async function saveAviso(event) {
    event.preventDefault();

    const record = {
      titulo: form.querySelector('[name="titulo"]').value.trim(),
      contenido: form.querySelector('[name="contenido"]').value.trim(),
      fecha_publicacion: form.querySelector('[name="fecha_publicacion"]').value,
      estado: form.querySelector('[name="estado"]').value,
      updated_at: new Date().toISOString(),
    };

    if (!record.titulo || !record.contenido || !record.fecha_publicacion) {
      APP.showToast('Completa los campos obligatorios: Título, Contenido y Fecha.', 'warning');
      return;
    }

    btnSave.innerHTML = spinHtml;
    btnSave.disabled = true;

    try {
      if (pendingFile) {
        const safeName = pendingFile.name.replace(/\s+/g, '_');
        const storagePath = `avisos/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, pendingFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(storagePath);

        record.imagen_url = publicUrl;
        record.nombre_archivo = pendingFile.name;
        record.storage_path = storagePath;
      } else if (removeImage) {
        record.imagen_url = '';
        record.nombre_archivo = '';
        record.storage_path = '';
      }

      if (editingId) {
        const { error } = await supabase
          .from('avisos')
          .update(record)
          .eq('id', editingId);

        if (error) throw error;

        if (originalStoragePath && (pendingFile || removeImage)) {
          await removeOldImage(originalStoragePath);
        }

        APP.showToast('Aviso actualizado correctamente.', 'success');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('avisos')
          .insert({ ...record, created_by: user?.id || null });

        if (error) throw error;
        APP.showToast('Aviso creado correctamente.', 'success');
      }

      APP.closeModal('avisoModal');
      await loadAvisos();
      renderTable();
    } catch (e) {
      console.error('Error al guardar el aviso:', e);
      APP.showToast('Error al guardar el aviso. Intenta de nuevo.', 'error');
    } finally {
      btnSave.innerHTML = saveHtml;
      btnSave.disabled = false;
    }
  }

  async function deleteAviso(id) {
    const a = avisos.find(item => item.id === id);
    if (!a) return;

    if (!confirm(`¿Eliminar el aviso "${a.titulo}"? Esta acción no se puede deshacer.`)) return;

    try {
      const { error } = await supabase
        .from('avisos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (a.storage_path) await removeOldImage(a.storage_path);

      avisos = avisos.filter(item => item.id !== id);
      renderTable();
      APP.showToast('Aviso eliminado.', 'info');
    } catch (e) {
      console.error('Error al eliminar el aviso:', e);
      APP.showToast('Error al eliminar el aviso.', 'error');
    }
  }

  document.getElementById('btnNuevoAviso').addEventListener('click', openCreateModal);
  form.addEventListener('submit', saveAviso);
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  btnRemoveImg.addEventListener('click', () => {
    pendingFile = null;
    removeImage = !!editingId;
    fileInput.value = '';
    showPreview('');
  });

  APP.setupSearch('#searchAvisos', '#avisosBody tr');
  APP.setupModalClose('avisoModal');

  await loadAvisos();
  renderTable();
});
