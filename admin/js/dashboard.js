/* ============================================================
   dashboard.js — Panel de control principal
   ============================================================
   Todas las métricas se calculan con METRICAS (fuente única).
   La programación muestra la antigüedad de la última imagen subida.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  const els = {
    actividades: document.getElementById('statActividades'),
    actividadesLabel: document.getElementById('statActividadesLabel'),
    actividadesChange: document.getElementById('statActividadesChange'),
    programacion: document.getElementById('statProgramacion'),
    programacionChange: document.getElementById('statProgramacionChange'),
    usuarios: document.getElementById('statUsuarios'),
    usuariosChange: document.getElementById('statUsuariosChange'),
    pendientes: document.getElementById('statPendientes'),
    pendientesChange: document.getElementById('statPendientesChange'),
    avisos: document.getElementById('statAvisos'),
    avisosChange: document.getElementById('statAvisosChange'),
    insightProximas: document.getElementById('insightProximas'),
    insightPendientes: document.getElementById('insightPendientes'),
    insightProgramacion: document.getElementById('insightProgramacion'),
    insightAvisos: document.getElementById('insightAvisos'),
    recentBody: document.getElementById('recentActivitiesBody'),
  };

  const setChange = (element, text, tone) => {
    if (!element) return;
    const icon = tone === 'up' ? 'fa-arrow-up' : tone === 'down' ? 'fa-arrow-down' : 'fa-minus';
    element.className = `stat-change${tone ? ` ${tone}` : ''}`;
    element.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
  };

  const setValue = (element, value, fallback) => {
    if (!element) return;
    element.textContent = value === null || value === undefined ? (fallback || '—') : value;
  };

  const showError = (message) => {
    if (window.APP && APP.showToast) APP.showToast(message, 'error');
  };

  try {
    const data = await METRICAS.getDashboardData();
    const activities = data.activities;

    /* ---------- TARJETAS ---------- */
    setValue(els.actividades, activities.total, '—');
    if (els.actividadesLabel) {
      els.actividadesLabel.textContent = `Actividades ${data.year}`;
    }

    if (data.variation.pct === null) {
      setChange(
        els.actividadesChange,
        `${data.variation.thisMonth} este mes`,
        data.variation.thisMonth > 0 ? 'up' : null
      );
    } else {
      const tone = data.variation.pct >= 0 ? 'up' : 'down';
      const sign = data.variation.pct > 0 ? '+' : '';
      setChange(els.actividadesChange, `${sign}${data.variation.pct}% vs mes anterior`, tone);
    }

    setValue(els.programacion, data.programacion.label, '—');
    if (data.programacionError) {
      setChange(els.programacionChange, 'No se pudo consultar', 'down');
    } else if (!data.programacion.publicada) {
      setChange(els.programacionChange, 'Sin programación publicada', 'down');
    } else {
      setChange(
        els.programacionChange,
        data.programacion.stale ? `${data.programacion.note} · desactualizada` : data.programacion.note,
        data.programacion.stale ? 'down' : 'up'
      );
    }

    if (data.usersError) {
      setValue(els.usuarios, '—', '—');
      setChange(els.usuariosChange, 'No se pudo consultar', 'down');
    } else {
      setValue(els.usuarios, data.users.activos, '—');
      const pct = data.users.pct === null ? '—' : `${data.users.pct}%`;
      setChange(
        els.usuariosChange,
        `${pct} activo · ${data.users.total} registrado${data.users.total === 1 ? '' : 's'}`,
        data.users.activos > 0 ? 'up' : 'down'
      );
    }

    setValue(els.pendientes, activities.byState.pendiente, '—');
    if (activities.overduePending > 0) {
      setChange(
        els.pendientesChange,
        `${activities.overduePending} vencida${activities.overduePending === 1 ? '' : 's'}`,
        'down'
      );
    } else if (activities.byState.pendiente > 0) {
      setChange(els.pendientesChange, 'Requieren atención', 'down');
    } else {
      setChange(els.pendientesChange, 'Sin pendientes', 'up');
    }

    if (data.avisosError) {
      setValue(els.avisos, '—', '—');
      setChange(els.avisosChange, 'No se pudo consultar', 'down');
    } else {
      setValue(els.avisos, data.avisos.visibles, '—');
      setChange(
        els.avisosChange,
        data.avisos.thisMonth > 0
          ? `${data.avisos.thisMonth} publicado${data.avisos.thisMonth === 1 ? '' : 's'} este mes`
          : 'Publicados',
        data.avisos.visibles > 0 ? 'up' : null
      );
    }

    /* ---------- INSIGHTS ---------- */
    if (els.insightProximas) {
      els.insightProximas.textContent = activities.proximas7.length;
    }
    if (els.insightPendientes) {
      els.insightPendientes.textContent = activities.byState.pendiente;
    }
    if (els.insightProgramacion) {
      els.insightProgramacion.textContent = data.programacionError
        ? '—'
        : data.programacion.label;
    }
    if (els.insightAvisos) {
      els.insightAvisos.textContent = data.avisosError ? '—' : data.avisos.visibles;
    }

    /* ---------- ACTIVIDADES RECIENTES ---------- */
    if (els.recentBody) {
      els.recentBody.innerHTML = '';

      if (!data.recent.length) {
        els.recentBody.innerHTML = `
          <tr>
            <td colspan="5">
              <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>No hay actividades registradas.</p>
              </div>
            </td>
          </tr>`;
      } else {
        const escapeHtml = (text) => {
          const el = document.createElement('div');
          el.textContent = text == null ? '' : text;
          return el.innerHTML;
        };

        const statusBadge = (estado) => {
          const map = {
            activo: '<span class="status-badge active"><span class="status-dot"></span> Activo</span>',
            pendiente: '<span class="status-badge pending"><span class="status-dot"></span> Pendiente</span>',
            cancelado: '<span class="status-badge canceled"><span class="status-dot"></span> Cancelado</span>',
          };
          return map[estado] || map.pendiente;
        };

        data.recent.forEach((item) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><strong>${escapeHtml(item.titulo)}</strong></td>
            <td>${METRICAS.formatDate(item.fecha)}</td>
            <td>${METRICAS.formatTime(item.hora)}</td>
            <td>${statusBadge(item.estado)}</td>
            <td>
              <div class="action-btns">
                <a href="actividades.html" class="btn-icon" title="Ver"><i class="fas fa-eye"></i></a>
              </div>
            </td>
          `;
          els.recentBody.appendChild(row);
        });
      }
    }
  } catch (error) {
    console.error('Error al cargar las estadísticas:', error);
    showError('No se pudieron cargar las métricas del Dashboard. Revisa la conexión e intenta de nuevo.');

    setValue(els.actividades, '—', '—');
    setValue(els.programacion, '—', '—');
    setValue(els.usuarios, '—', '—');
    setValue(els.pendientes, '—', '—');
    setValue(els.avisos, '—', '—');
    setChange(els.actividadesChange, 'Error de consulta', 'down');
    setChange(els.programacionChange, 'Error de consulta', 'down');
    setChange(els.usuariosChange, 'Error de consulta', 'down');
    setChange(els.pendientesChange, 'Error de consulta', 'down');
    setChange(els.avisosChange, 'Error de consulta', 'down');
    [els.insightProximas, els.insightPendientes, els.insightProgramacion, els.insightAvisos]
      .forEach((el) => { if (el) el.textContent = '—'; });
  }

  /* ---------- REFRESCAR AL VOLVER A LA PESTAÑA ---------- */
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) window.location.reload();
  });
});
