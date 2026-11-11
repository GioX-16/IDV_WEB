document.addEventListener('DOMContentLoaded', async () => {

  const grid = document.getElementById('avisosGrid');
  if (!grid) return;

  /* ---------- MODAL DE DETALLE ---------- */
  const modal     = document.getElementById('avisoModal');
  const dialog    = modal ? modal.querySelector('.aviso-modal-dialog') : null;
  const mediaEl   = document.getElementById('avisoModalMedia');
  const imageEl   = document.getElementById('avisoModalImage');
  const dateEl    = document.getElementById('avisoModalDate');
  const titleEl   = document.getElementById('avisoModalTitle');
  const textEl    = document.getElementById('avisoModalText');
  const closeBtn  = modal ? modal.querySelector('.aviso-modal-close') : null;

  let avisos = [];
  let lastFocused = null;

  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text == null ? '' : text;
    return el.innerHTML;
  }

  function formatFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha + 'T00:00:00');
    if (isNaN(d)) return fecha;
    return d.toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  function renderEmpty() {
    grid.innerHTML = `
      <div class="avisos-empty">
        <i class="fas fa-bullhorn"></i>
        <p>No hay avisos publicados por el momento.</p>
      </div>`;
  }

  /* ---------- ABRIR / CERRAR DETALLE ---------- */

  function focusableInDialog() {
    if (!dialog) return [];
    return Array.from(
      dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.disabled && el.offsetParent !== null);
  }

  function openAviso(index, trigger) {
    const aviso = avisos[index];
    if (!aviso || !modal || !dialog) return;

    lastFocused = trigger || document.activeElement;
    dialog.classList.remove('no-media');

    if (titleEl) titleEl.textContent = aviso.titulo || 'Aviso';
    if (textEl) textEl.textContent = aviso.contenido || '';
    if (dateEl) dateEl.textContent = formatFecha(aviso.fecha_publicacion);

    if (aviso.imagen_url && imageEl) {
      imageEl.src = aviso.imagen_url;
      imageEl.alt = aviso.titulo ? `Imagen del aviso: ${aviso.titulo}` : 'Imagen del aviso';
      if (mediaEl) mediaEl.hidden = false;
    } else {
      dialog.classList.add('no-media');
      if (mediaEl) mediaEl.hidden = true;
      if (imageEl) {
        imageEl.removeAttribute('src');
        imageEl.alt = '';
      }
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('aviso-modal-open');

    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeAviso() {
    if (!modal || !modal.classList.contains('is-open')) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('aviso-modal-open');

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: true });
    }
    lastFocused = null;
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-aviso]')) closeAviso();
    });

    modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAviso();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = focusableInDialog();
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------- TARJETAS ---------- */

  function renderAvisos(lista) {
    avisos = lista;

    if (!lista.length) {
      renderEmpty();
      return;
    }

    grid.innerHTML = '';

    lista.forEach((a, index) => {
      const card = document.createElement('article');
      card.className = 'aviso-card' + (a.imagen_url ? '' : ' no-image');
      card.dataset.index = String(index);
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Ver el aviso completo: ${a.titulo || 'Aviso'}`);

      const image = a.imagen_url
        ? `<div class="aviso-img-wrap">
             <img src="${escapeHtml(a.imagen_url)}" alt="${escapeHtml(a.titulo)}" loading="lazy">
             <span class="aviso-expand" aria-hidden="true"><i class="fas fa-expand"></i></span>
           </div>`
        : `<span class="aviso-expand aviso-expand--plain" aria-hidden="true"><i class="fas fa-expand"></i></span>`;

      card.innerHTML = `
        ${image}
        <div class="aviso-body">
          <span class="aviso-date"><i class="far fa-calendar"></i> ${formatFecha(a.fecha_publicacion)}</span>
          <h3 class="aviso-title">${escapeHtml(a.titulo)}</h3>
          <p class="aviso-text">${escapeHtml(a.contenido)}</p>
          <span class="aviso-more">
            Ver aviso completo
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </span>
        </div>
      `;

      grid.appendChild(card);
    });

    if (typeof AOS !== 'undefined' && AOS.refreshHard) {
      AOS.refreshHard();
    }
  }

  /* Delegación: funciona incluso si la grilla se vuelve a pintar. */
  grid.addEventListener('click', (event) => {
    const card = event.target.closest('.aviso-card');
    if (!card || !grid.contains(card)) return;
    openAviso(Number(card.dataset.index), card);
  });

  grid.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;

    const card = event.target.closest('.aviso-card');
    if (!card || !grid.contains(card)) return;

    event.preventDefault();
    openAviso(Number(card.dataset.index), card);
  });

  /* ---------- CARGA ---------- */

  try {
    const { data, error } = await supabase
      .from('avisos')
      .select('id, titulo, contenido, imagen_url, fecha_publicacion')
      .eq('estado', 'activo')
      .order('fecha_publicacion', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    renderAvisos(data || []);
  } catch (e) {
    console.error('Error al cargar los avisos:', e);
    renderEmpty();
  }
});
