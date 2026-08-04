/* ============================================================
   programacion.js — Gestión de Programación Semanal
   (imagen subida a Supabase Storage + URL guardada en la BD)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  /* ---------- ELEMENTOS ---------- */
  const previewEl   = document.getElementById('previewImage');
  const fileNameEl  = document.getElementById('fileName');
  const fileInput   = document.getElementById('uploadInput');
  const uploadArea  = document.getElementById('uploadArea');
  const btnSave     = document.getElementById('btnSaveImage');
  const btnReset    = document.getElementById('btnResetImage');

  const defaultImage = '../img/mapacontac.svg';
  let pendingFile  = null;   /* archivo seleccionado, aún no guardado */
  let rowId        = null;   /* id de la fila actual en la tabla programacion */
  let storedFile   = null;   /* nombre del archivo en el bucket (para restaurar) */

  /* ---------- CARGAR IMAGEN ACTUAL DESDE LA BD ---------- */
  previewEl.src = defaultImage;

  try {
    const { data } = await supabase
      .from('programacion')
      .select('id, imagen_url, nombre_archivo')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (data && data.length && data[0].imagen_url) {
      rowId = data[0].id;
      storedFile = data[0].nombre_archivo || null;
      previewEl.src = data[0].imagen_url;
      if (data[0].nombre_archivo) fileNameEl.textContent = data[0].nombre_archivo;
    }
  } catch (e) {
    console.error('Error al cargar la programación:', e);
  }

  /* ---------- UPLOAD TRIGGER ---------- */
  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary)';
    uploadArea.style.background = 'var(--primary-bg)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = 'var(--bg)';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = 'var(--bg)';
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  /* ---------- HANDLE FILE ---------- */
  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      APP.showToast('Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      APP.showToast('La imagen no debe superar los 5 MB.', 'warning');
      return;
    }

    pendingFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewEl.src = e.target.result;
      fileNameEl.textContent = file.name;
      btnSave.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- SAVE ---------- */
  const saveHtml  = '<i class="fas fa-save"></i> Guardar';
  const spinHtml  = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  const doneHtml  = '<i class="fas fa-check"></i> Guardado';

  btnSave.addEventListener('click', async () => {
    if (!pendingFile) return;

    btnSave.innerHTML = spinHtml;
    btnSave.disabled = true;

    try {
      /* 1. Subir archivo al bucket */
      const safeName = pendingFile.name.replace(/\s+/g, '_');
      const storagePath = `weekly/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(PROG_BUCKET)
        .upload(storagePath, pendingFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(PROG_BUCKET)
        .getPublicUrl(storagePath);

      /* 2. Guardar la URL en la tabla programacion */
      const { data: { user } } = await supabase.auth.getUser();

      const record = {
        imagen_url: publicUrl,
        nombre_archivo: pendingFile.name,
        updated_by: user?.id || null,
      };

      let dbError = null;
      if (rowId) {
        const res = await supabase.from('programacion').update(record).eq('id', rowId);
        dbError = res.error;
      } else {
        const res = await supabase.from('programacion').insert(record).select('id').single();
        dbError = res.error;
        if (!dbError && res.data) rowId = res.data.id;
      }

      if (dbError) throw dbError;

      storedFile = pendingFile.name;
      pendingFile = null;

      btnSave.innerHTML = doneHtml;
      btnSave.classList.add('btn-accent');
      APP.showToast('Programación semanal guardada exitosamente.', 'success');

      setTimeout(() => {
        btnSave.innerHTML = saveHtml;
        btnSave.disabled = true;
      }, 2000);
    } catch (e) {
      console.error('Error al guardar la imagen:', e);
      APP.showToast('Error al guardar la imagen. Intenta de nuevo.', 'error');
      btnSave.innerHTML = saveHtml;
      btnSave.disabled = false;
    }
  });

  /* ---------- RESET ---------- */
  btnReset.addEventListener('click', async () => {
    if (!confirm('¿Restaurar la imagen por defecto? Se eliminará la imagen actual.')) return;

    previewEl.src = defaultImage;
    fileNameEl.textContent = 'Ningún archivo seleccionado';
    btnSave.disabled = true;
    fileInput.value = '';
    pendingFile = null;

    try {
      /* Eliminar fila de la BD (el sitio público usará su imagen por defecto) */
      if (rowId) {
        await supabase.from('programacion').delete().eq('id', rowId);
        rowId = null;
      }

      /* Eliminar archivo del bucket si existe */
      if (storedFile) {
        const prefix = storedFile.replace(/\s+/g, '_');
        const { data: list } = await supabase.storage
          .from(PROG_BUCKET)
          .list('weekly');

        const match = (list || []).find(f => f.name.endsWith(prefix));
        if (match) {
          await supabase.storage.from(PROG_BUCKET).remove([`weekly/${match.name}`]);
        }
        storedFile = null;
      }

      APP.showToast('Imagen restaurada a la predeterminada.', 'info');
    } catch (e) {
      console.error('Error al restaurar la imagen:', e);
    }
  });

});
