// ============================================
// IDV_WEB - Seccion Actividades (Tabs)
// Iglesia del Dios Viviente
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    /* ----- TABS: Alternar contenido ----- */
    const tabButtons = document.querySelectorAll('.actividad-tab');
    const tabPanels = document.querySelectorAll('.actividad-panel');

    function activateTab(tab) {
        tabButtons.forEach(btn => {
            const active = btn === tab;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', String(active));
        });

        tabPanels.forEach(panel => {
            const active = panel.id === 'tab-' + tab.dataset.tab;
            panel.classList.toggle('active', active);
            panel.setAttribute('aria-hidden', String(!active));
        });
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => activateTab(btn));
    });

    /* ----- DATOS: Actividades (fallback si el admin no guardo nada) ----- */
    const DEFAULT_ACTIVIDADES = [
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

    let actividades = DEFAULT_ACTIVIDADES;
    try {
        const stored = JSON.parse(localStorage.getItem('idv_actividades'));
        if (Array.isArray(stored) && stored.length) actividades = stored;
    } catch (e) { /* usar fallback */ }

    /* ----- HELPERS ----- */
    function escapeHtml(text) {
        const el = document.createElement('div');
        el.textContent = text;
        return el.innerHTML;
    }

    function formatFecha(fecha) {
        if (!fecha) return '';
        const d = new Date(fecha + 'T00:00:00');
        if (isNaN(d)) return fecha;
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function formatHora(hora) {
        if (!hora) return '';
        const parts = hora.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1] || '0', 10);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    /* ----- RENDER: Grid de actividades ----- */
    const grid = document.getElementById('actividadesGrid');

    const estadoInfo = {
        activo:    { label: 'Activo',    cls: 'act-estado-activo' },
        pendiente: { label: 'Pendiente', cls: 'act-estado-pendiente' },
        cancelado: { label: 'Cancelado', cls: 'act-estado-cancelado' },
    };

    function renderActividades() {
        if (!grid) return;

        const sorted = [...actividades].sort((a, b) =>
            (a.fecha + ' ' + a.hora).localeCompare(b.fecha + ' ' + b.hora)
        );

        if (sorted.length === 0) {
            grid.innerHTML = `
                <div class="actividades-empty">
                    <i class="fas fa-calendar-times"></i>
                    <p>No hay actividades programadas por el momento.</p>
                </div>`;
            return;
        }

        grid.innerHTML = '';

        sorted.forEach(a => {
            const info = estadoInfo[a.estado] || estadoInfo.pendiente;
            const card = document.createElement('article');
            card.className = 'actividad-card';
            card.innerHTML = `
                <div class="actividad-card-top">
                    <div class="actividad-icon"><i class="fas fa-calendar-day"></i></div>
                    <span class="act-estado ${info.cls}"><span class="act-dot"></span>${info.label}</span>
                </div>
                <h3>${escapeHtml(a.titulo)}</h3>
                ${a.descripcion ? `<p>${escapeHtml(a.descripcion)}</p>` : ''}
                <div class="actividad-meta">
                    <span><i class="far fa-calendar-alt"></i> ${formatFecha(a.fecha)}</span>
                    <span><i class="far fa-clock"></i> ${formatHora(a.hora)}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    renderActividades();

    /* ----- PROGRAMACION SEMANAL: Imagen guardada por el admin ----- */
    const progImg = document.getElementById('programacionImg');
    if (progImg) {
        const savedImage = localStorage.getItem('idv_programacion_img');
        if (savedImage) {
            progImg.src = savedImage;
        }
    }

});
