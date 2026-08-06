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

    /* Cargar actividades desde Supabase (lectura pública).
       Si la BD está vacía o no responde, se usa el fallback local. */
    async function loadActividades() {
        if (typeof supabase === 'undefined') return;
        try {
            const { data } = await supabase.from('actividades').select('*');
            if (Array.isArray(data) && data.length) actividades = data;
        } catch (e) {
            console.error('Error al cargar actividades desde Supabase:', e);
        }
    }

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

    /* ----- RENDER: Tabla de actividades ----- */
    const tbody = document.getElementById('actividadesTableBody');

    const estadoInfo = {
        activo:    { label: 'Activo',    cls: 'act-estado-activo' },
        pendiente: { label: 'Pendiente', cls: 'act-estado-pendiente' },
        cancelado: { label: 'Cancelado', cls: 'act-estado-cancelado' },
    };

    function renderActividades() {
        if (!tbody) return;

        const sorted = [...actividades].sort((a, b) =>
            (a.fecha + ' ' + a.hora).localeCompare(b.fecha + ' ' + b.hora)
        );

        if (sorted.length === 0) {
            tbody.innerHTML = `
                <tr class="actividades-empty-row">
                    <td colspan="5">
                        <div class="actividades-empty">
                            <i class="fas fa-calendar-times"></i>
                            <p>No hay actividades programadas por el momento.</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = '';

        sorted.forEach(a => {
            const info = estadoInfo[a.estado] || estadoInfo.pendiente;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Fecha">${formatFecha(a.fecha)}</td>
                <td data-label="Hora">${formatHora(a.hora)}</td>
                <td data-label="Actividad"><strong>${escapeHtml(a.titulo)}</strong></td>
                <td data-label="Descripción"><span class="act-desc">${escapeHtml(a.descripcion || '')}</span></td>
                <td data-label="Estado"><span class="act-estado ${info.cls}"><span class="act-dot"></span>${info.label}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    (async () => {
        await loadActividades();
        renderActividades();
    })();

    /* ----- PROGRAMACION SEMANAL: Imagen guardada por el admin en la BD ----- */
    const progImg = document.getElementById('programacionImg');
    const btnDownload = document.getElementById('btnDownloadProg');
    let currentProgUrl = progImg ? progImg.src : '';

    if (progImg && typeof supabase !== 'undefined') {
        (async () => {
            try {
                const { data } = await supabase
                    .from('programacion')
                    .select('imagen_url, nombre_archivo')
                    .order('updated_at', { ascending: false })
                    .limit(1);
                if (data && data.length && data[0].imagen_url) {
                    progImg.src = data[0].imagen_url;
                    currentProgUrl = data[0].imagen_url;
                    progImg.dataset.filename = data[0].nombre_archivo || 'programacion-semanal';
                }
            } catch (e) {
                console.error('Error al cargar la programación desde Supabase:', e);
            }
        })();
    }

    if (btnDownload) {
        btnDownload.addEventListener('click', async () => {
            const url = currentProgUrl;
            if (!url || url === window.location.origin + '/img/mapacontac.svg' || url.endsWith('mapacontac.svg')) {
                APP && APP.showToast ? APP.showToast('No hay una programación disponible para descargar.', 'info') : alert('No hay una programación disponible para descargar.');
                return;
            }

            btnDownload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Descargando...';
            btnDownload.disabled = true;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('No se pudo descargar la imagen.');
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = progImg.dataset.filename || 'programacion-semanal.jpg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            } catch (err) {
                console.error('Error al descargar:', err);
                window.open(url, '_blank');
            } finally {
                btnDownload.innerHTML = '<i class="fas fa-download"></i> Descargar Programación';
                btnDownload.disabled = false;
            }
        });
    }

});
