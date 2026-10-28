document.addEventListener('DOMContentLoaded', async () => {

  const grid = document.getElementById('avisosGrid');
  if (!grid) return;

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

  function renderAvisos(avisos) {
    if (!avisos.length) {
      renderEmpty();
      return;
    }

    grid.innerHTML = '';

    avisos.forEach(a => {
      const card = document.createElement('article');
      card.className = 'aviso-card' + (a.imagen_url ? '' : ' no-image');

      const image = a.imagen_url
        ? `<div class="aviso-img-wrap"><img src="${escapeHtml(a.imagen_url)}" alt="${escapeHtml(a.titulo)}" loading="lazy"></div>`
        : '';

      card.innerHTML = `
        ${image}
        <div class="aviso-body">
          <span class="aviso-date"><i class="far fa-calendar"></i> ${formatFecha(a.fecha_publicacion)}</span>
          <h3 class="aviso-title">${escapeHtml(a.titulo)}</h3>
          <p class="aviso-text">${escapeHtml(a.contenido)}</p>
        </div>
      `;

      grid.appendChild(card);
    });

    if (typeof AOS !== 'undefined' && AOS.refreshHard) {
      AOS.refreshHard();
    }
  }

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
