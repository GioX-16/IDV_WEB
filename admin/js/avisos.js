document.addEventListener('DOMContentLoaded', async () => {

  const tbody        = document.getElementById('avisosBody');
  const modalTitle   = document.getElementById('modalTitle');
  const form         = document.getElementById('avisoForm');
  const fileInput    = document.getElementById('avImagen');
  const previewWrap  = document.getElementById('avisoPreviewWrap');
  const previewImg   = document.getElementById('avisoPreview');
  const btnRemoveImg = document.getElementById('btnQuitarImagen');
  const btnSave      = document.getElementById('btnSaveAviso');

  /* ---------- NOTIFICACIONES ---------- */
  const btnPrepararWA   = document.getElementById('btnPrepararWhatsapp');
  const notifCheckWrap  = document.getElementById('notifCheckWrap');
  const notifCheck      = document.getElementById('avNotificado');
  const notifHint       = document.getElementById('notifHint');
  const thNotificado    = document.getElementById('thNotificado');

  const bucket = window.AVISOS_BUCKET || 'avisos';

  // URL pública del sitio para los enlaces profundos que se comparten.
  const SITE_URL = (window.IDV_SITE_URL || window.location.origin).replace(/\/+$/, '');

  let avisos = [];
  let editingId = null;
  let pendingFile = null;
  let originalImageUrl = '';
  let originalStoragePath = '';
  let removeImage = false;

  // ¿La tabla 'avisos' tiene la columna notificado_at? Se comprueba en
  // caliente para que el panel funcione aunque la migración no se aplique.
  let hayColumnaNotificado = false;
  // Solo el rol Administrador puede marcar el estado de notificación.
  let esAdministrador = false;

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

  /* ============================================================
     NOTIFICACIONES A LOS HERMANOS
     ============================================================ */

  // Espera a que auth-guard cargue el perfil real (con su rol).
  function waitForUser() {
    return new Promise((resolve) => {
      const onReady = (event) => {
        document.removeEventListener('idv:user-ready', onReady);
        resolve(event.detail || APP.user);
      };

      document.addEventListener('idv:user-ready', onReady);

      // Red de seguridad: si el evento no llega, se usa lo que haya.
      setTimeout(() => {
        document.removeEventListener('idv:user-ready', onReady);
        resolve(APP.user);
      }, 4000);
    });
  }

  // Comprueba si la columna notificado_at existe en la base de datos.
  // Si la migración no se ha aplicado, el panel sigue funcionando igual.
  async function detectNotificadoColumn() {
    try {
      const { error } = await supabase
        .from('avisos')
        .select('notificado_at')
        .limit(1);

      return !error;
    } catch (e) {
      console.warn('No se pudo verificar la columna notificado_at:', e);
      return false;
    }
  }

  // El check "Notificado" solo se muestra si la columna existe Y el
  // usuario es Administrador. No se oculta nada que el usuario pueda usar.
  function updateNotifControls() {
    const visible = hayColumnaNotificado && esAdministrador;

    if (notifCheckWrap) {
      notifCheckWrap.hidden = !visible;
    }
    if (thNotificado) {
      thNotificado.hidden = !hayColumnaNotificado;
    }
  }

  // Enlace profundo hacia un aviso concreto.
  function avisoUrl(id) {
    if (!id) return `${SITE_URL}/#avisos`;
    return `${SITE_URL}/?aviso=${encodeURIComponent(id)}#avisos`;
  }

  // Texto listo para enviar por WhatsApp.
  function buildShareText({ titulo, contenido, fecha, id }) {
    const partes = [
      '🔥 *Iglesia del Dios Viviente*',
      '',
      `📢 ${titulo || 'Aviso'}`,
    ];

    if (fecha) {
      partes.push(`📅 ${APP.formatDate(fecha)}`);
    }

    partes.push('');

    if (contenido) {
      partes.push(contenido);
      partes.push('');
    }

    partes.push(`🌐 ${avisoUrl(id)}`);

    return partes.join('\n');
  }

  function shareToWhatsApp({ titulo, contenido, fecha, id }) {
    const texto = buildShareText({ titulo, contenido, fecha, id });
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  }

  // Datos del formulario (para preparar el mensaje antes de guardar).
  function currentFormData() {
    return {
      titulo: form.querySelector('[name="titulo"]').value.trim(),
      contenido: form.querySelector('[name="contenido"]').value.trim(),
      fecha: form.querySelector('[name="fecha_publicacion"]').value,
      id: editingId,
    };
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

  function notificadoBadge(a) {
    if (a.notificado_at) {
      return '<span class="status-badge active"><span class="status-dot"></span> Notificado</span>';
    }
    return '<span class="status-badge inactive"><span class="status-dot"></span> Sin notificar</span>';
  }

  function renderTable() {
    tbody.innerHTML = '';

    const colspan = hayColumnaNotificado ? 5 : 4;

    if (!avisos.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${colspan}">
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

      const notifCell = hayColumnaNotificado
        ? `<td data-label="Notificado">${notificadoBadge(a)}</td>`
        : '';

      tr.innerHTML = `
        <td data-label="">
          <div class="aviso-cell">
            ${thumb}
            <div class="aviso-cell-text">
              <strong>${escapeHtml(a.titulo)}</strong>
              <small>${escapeHtml(truncate(a.contenido, 110))}</small>
            </div>
          </div>
        </td>
        <td data-label="Publicación">${a.fecha_publicacion ? APP.formatDate(a.fecha_publicacion) : '-'}</td>
        <td data-label="Estado">${statusBadge(a.estado)}</td>
        ${notifCell}
        <td data-label="">
          <div class="action-btns">
            <button class="btn-icon share" title="Compartir por WhatsApp" data-share="${a.id}"><i class="fab fa-whatsapp"></i></button>
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

    tbody.querySelectorAll('[data-share]').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = avisos.find(item => item.id === parseInt(btn.dataset.share, 10));
        if (!a) return;
        shareToWhatsApp({
          titulo: a.titulo,
          contenido: a.contenido,
          fecha: a.fecha_publicacion,
          id: a.id,
        });
      });
    });
  }

  function openCreateModal() {
    editingId = null;
    modalTitle.textContent = 'Nuevo Aviso';
    form.reset();
    resetImageState();
    form.querySelector('[name="estado"]').value = 'activo';
    form.querySelector('[name="fecha_publicacion"]').value = todayISO();
    if (notifCheck) notifCheck.checked = false;
    if (notifHint) {
      notifHint.textContent = 'Guárdalo primero para que el enlace llegue directo al aviso.';
    }
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
    if (notifCheck) notifCheck.checked = !!a.notificado_at;
    if (notifHint) {
      notifHint.textContent = 'Abre WhatsApp con el mensaje listo para enviar al grupo.';
    }
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

    // El estado de notificación solo lo controla el Administrador y solo
    // si la columna existe en la base de datos.
    if (hayColumnaNotificado && esAdministrador && notifCheck) {
      record.notificado_at = notifCheck.checked ? new Date().toISOString() : null;
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

  /* ---------- PREPARAR MENSAJE PARA WHATSAPP ---------- */

  if (btnPrepararWA) {
    btnPrepararWA.addEventListener('click', () => {
      const data = currentFormData();

      if (!data.titulo) {
        APP.showToast('Escribe el título del aviso antes de preparar el mensaje.', 'warning');
        return;
      }

      shareToWhatsApp(data);
    });
  }

  APP.setupSearch('#searchAvisos', '#avisosBody tr');
  APP.setupModalClose('avisoModal');

  /* ---------- INICIO ---------- */

  // El rol real llega desde auth-guard; sin él no se decide nada.
  const user = await waitForUser();
  esAdministrador = !!(user && user.rol === 'Administrador');

  // Si la migración no está aplicada, el panel sigue funcionando igual.
  hayColumnaNotificado = await detectNotificadoColumn();
  updateNotifControls();

  await loadAvisos();
  renderTable();
});
