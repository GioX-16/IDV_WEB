/* ============================================================
   IDV_WEB — Avisos públicos
   Iglesia del Dios Viviente

   Responsabilidades:
     - Cargar y renderizar las tarjetas de avisos.
     - Modal de detalle.
     - Compartir por WhatsApp (enlace profundo ?aviso=<id>).
     - Campana con contador de avisos nuevos (estado en localStorage).
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  const grid = document.getElementById('avisosGrid');
  if (!grid) return;

  /* ---------- CONFIG ---------- */

  // Clave de localStorage donde se guarda el id del último aviso visto.
  const STORAGE_KEY = 'idv_avisos_vistos';

  // URL pública del sitio. Se puede sobreescribir con window.IDV_SITE_URL
  // para que los enlaces compartidos apunten al dominio real
  // incluso si el sitio se está sirviendo desde otro host.
  const SITE_URL = (window.IDV_SITE_URL || window.location.origin).replace(/\/+$/, '');

  /* ---------- ELEMENTOS ---------- */

  const modal     = document.getElementById('avisoModal');
  const dialog    = modal ? modal.querySelector('.aviso-modal-dialog') : null;
  const mediaEl   = document.getElementById('avisoModalMedia');
  const imageEl   = document.getElementById('avisoModalImage');
  const dateEl    = document.getElementById('avisoModalDate');
  const titleEl   = document.getElementById('avisoModalTitle');
  const textEl    = document.getElementById('avisoModalText');
  const closeBtn  = modal ? modal.querySelector('.aviso-modal-close') : null;
  const shareBtn  = document.getElementById('avisoModalShare');
  const copyBtn   = document.getElementById('avisoModalCopy');

  const bellBtn   = document.getElementById('navBell');
  const badgeEl   = document.getElementById('navBadge');

  let avisos = [];
  let lastFocused = null;
  let currentAviso = null;

  /* ---------- UTILIDADES ---------- */

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

  function notify(message, type = 'success') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }
    console.info('[avisos]', message);
  }

  /* ---------- WHATSAPP ---------- */

  // Enlace profundo: abre el sitio en el aviso exacto.
  function avisoUrl(aviso) {
    if (!aviso || aviso.id == null) return `${SITE_URL}/#avisos`;
    return `${SITE_URL}/?aviso=${encodeURIComponent(aviso.id)}#avisos`;
  }

  // Texto listo para enviar por WhatsApp.
  function buildShareText(aviso) {
    if (!aviso) return '';
    const partes = [
      '🔥 *Iglesia del Dios Viviente*',
      '',
      `📢 ${aviso.titulo || 'Aviso'}`,
    ];

    if (aviso.fecha_publicacion) {
      partes.push(`📅 ${formatFecha(aviso.fecha_publicacion)}`);
    }

    partes.push('');

    if (aviso.contenido) {
      partes.push(aviso.contenido);
      partes.push('');
    }

    partes.push(`🌐 ${avisoUrl(aviso)}`);

    return partes.join('\n');
  }

  // wa.me sin número: abre WhatsApp con el selector de contactos,
  // para que cada hermano elija a quién se lo reenvía.
  function buildShareUrl(aviso) {
    return `https://wa.me/?text=${encodeURIComponent(buildShareText(aviso))}`;
  }

  function shareAviso(aviso) {
    if (!aviso) return;
    window.open(buildShareUrl(aviso), '_blank', 'noopener');
  }

  async function copyAvisoLink(aviso) {
    if (!aviso) return;
    const url = avisoUrl(aviso);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const helper = document.createElement('textarea');
        helper.value = url;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
      }
      notify('Enlace del aviso copiado.', 'success');
    } catch (e) {
      console.error('No se pudo copiar el enlace:', e);
      notify('No se pudo copiar el enlace.', 'error');
    }
  }

  /* ---------- ESTADO DE LECTURA ---------- */

  function readVistos() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const value = parseInt(raw, 10);
      return Number.isFinite(value) ? value : null;
    } catch (_) {
      return null;
    }
  }

  function writeVistos(id) {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch (_) {
      /* Modo privado o storage bloqueado: la campana simplemente no marca. */
    }
  }

  function maxAvisoId() {
    return avisos.reduce((max, a) => Math.max(max, Number(a.id) || 0), 0);
  }

  function countUnread() {
    const vistos = readVistos();
    if (vistos === null) return 0;
    return avisos.filter(a => Number(a.id) > vistos).length;
  }

  function showBadge(count) {
    if (!badgeEl || !bellBtn) return;
    badgeEl.textContent = String(count);
    badgeEl.hidden = false;
    bellBtn.setAttribute('aria-label', `${count} aviso${count === 1 ? '' : 's'} nuevo${count === 1 ? '' : 's'}`);
  }

  function hideBadge() {
    if (!badgeEl || !bellBtn) return;
    badgeEl.hidden = true;
    badgeEl.textContent = '0';
    bellBtn.setAttribute('aria-label', 'Ver avisos');
  }

  function markAllSeen() {
    writeVistos(maxAvisoId());
    hideBadge();
  }

  function updateBadge() {
    if (!bellBtn) return;

    // La campana solo aparece si el módulo de avisos se cargó bien.
    bellBtn.hidden = false;

    const vistos = readVistos();
    const maxId = maxAvisoId();

    // Primera visita: todo lo que ya existe se marca como visto para no
    // inundar al hermano con un badge de "12 avisos nuevos".
    if (vistos === null) {
      writeVistos(maxId);
      hideBadge();
      return;
    }

    const unread = countUnread();
    if (unread > 0) {
      showBadge(unread);
    } else {
      hideBadge();
    }
  }

  /* ---------- RENDER ---------- */

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
    currentAviso = aviso;
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
    currentAviso = null;
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
      card.dataset.id = String(a.id);
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
          <div class="aviso-head">
            <span class="aviso-date"><i class="far fa-calendar"></i> ${formatFecha(a.fecha_publicacion)}</span>
            <button type="button" class="aviso-share" data-share="${escapeHtml(a.id)}"
                    aria-label="Compartir este aviso por WhatsApp" title="Compartir por WhatsApp">
              <i class="fab fa-whatsapp" aria-hidden="true"></i>
            </button>
          </div>
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
    // El botón de compartir tiene prioridad: no debe abrir el modal.
    const shareTrigger = event.target.closest('[data-share]');
    if (shareTrigger) {
      event.preventDefault();
      event.stopPropagation();
      const id = parseInt(shareTrigger.dataset.share, 10);
      const aviso = avisos.find(a => Number(a.id) === id);
      shareAviso(aviso);
      return;
    }

    const card = event.target.closest('.aviso-card');
    if (!card || !grid.contains(card)) return;
    openAviso(Number(card.dataset.index), card);
  });

  grid.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;

    const shareTrigger = event.target.closest('[data-share]');
    if (shareTrigger) return;

    const card = event.target.closest('.aviso-card');
    if (!card || !grid.contains(card)) return;

    event.preventDefault();
    openAviso(Number(card.dataset.index), card);
  });

  /* ---------- ACCIONES DEL MODAL ---------- */

  if (shareBtn) {
    shareBtn.addEventListener('click', () => shareAviso(currentAviso));
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => copyAvisoLink(currentAviso));
  }

  /* ---------- CAMPANA DE AVISOS NUEVOS ---------- */

  if (bellBtn) {
    bellBtn.addEventListener('click', () => {
      markAllSeen();

      const section = document.getElementById('avisos');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Al ver la sección de avisos, lo leído deja de contar como pendiente.
  const avisosSection = document.getElementById('avisos');
  if (avisosSection && typeof IntersectionObserver !== 'undefined') {
    const seenObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          markAllSeen();
        }
      });
    }, { threshold: 0.4 });

    seenObserver.observe(avisosSection);
  }

  /* ---------- ENLACE PROFUNDO (?aviso=<id>) ---------- */

  function handleDeepLink() {
    let id;
    try {
      const params = new URLSearchParams(window.location.search);
      id = parseInt(params.get('aviso'), 10);
    } catch (_) {
      return;
    }

    if (!Number.isFinite(id)) return;

    const index = avisos.findIndex(a => Number(a.id) === id);
    if (index === -1) return;

    const card = grid.querySelector(`.aviso-card[data-id="${id}"]`);
    if (card) {
      card.classList.add('aviso-destacado');
      try {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (_) {
        card.scrollIntoView();
      }
    }

    openAviso(index, card);
  }

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

    updateBadge();

    const unread = countUnread();
    if (unread > 0) {
      notify(`Hay ${unread} aviso${unread === 1 ? '' : 's'} nuevo${unread === 1 ? '' : 's'}.`);
    }

    handleDeepLink();
  } catch (e) {
    console.error('Error al cargar los avisos:', e);
    renderEmpty();
    if (bellBtn) bellBtn.hidden = true;
  }
});
