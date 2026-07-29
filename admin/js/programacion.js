/* ============================================================
   programacion.js — Gestión de Programación Semanal
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- SIMULATED DATA ---------- */
  const defaultImage = '../img/mapacontac.svg';

  let savedImage = localStorage.getItem('idv_programacion_img');
  if (!savedImage) {
    savedImage = defaultImage;
    localStorage.setItem('idv_programacion_img', defaultImage);
  }

  const previewEl = document.getElementById('previewImage');
  const fileNameEl = document.getElementById('fileName');
  const fileInput = document.getElementById('uploadInput');
  const uploadArea = document.getElementById('uploadArea');
  const btnSave = document.getElementById('btnSaveImage');

  /* ---------- INIT PREVIEW ---------- */
  previewEl.src = savedImage;

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

    const reader = new FileReader();
    reader.onload = (e) => {
      previewEl.src = e.target.result;
      fileNameEl.textContent = file.name;
      btnSave.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- SAVE ---------- */
  btnSave.addEventListener('click', () => {
    btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btnSave.disabled = true;

    setTimeout(() => {
      const imgSrc = previewEl.src;
      localStorage.setItem('idv_programacion_img', imgSrc);
      savedImage = imgSrc;

      btnSave.innerHTML = '<i class="fas fa-check"></i> Guardado';
      btnSave.classList.add('btn-accent');
      APP.showToast('Programación semanal guardada exitosamente.', 'success');

      setTimeout(() => {
        btnSave.innerHTML = '<i class="fas fa-save"></i> Guardar';
        btnSave.disabled = true;
      }, 2000);
    }, 600);
  });

  /* ---------- RESET ---------- */
  document.getElementById('btnResetImage').addEventListener('click', () => {
    if (!confirm('¿Restaurar la imagen por defecto? Se perderá la imagen actual.')) return;

    previewEl.src = defaultImage;
    fileNameEl.textContent = 'Ningún archivo seleccionado';
    btnSave.disabled = true;
    fileInput.value = '';
  });

});
