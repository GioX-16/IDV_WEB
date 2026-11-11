/* ============================================================
   reportes.js — Reporte de actividades y programación
   ============================================================
   Consume METRICAS para que los números coincidan con el Dashboard.
   La distribución por estado siempre se calcula sobre el período
   completo; el filtro de estado solo afecta a las tablas y al CSV.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  const form         = document.getElementById('reportFilters');
  const fromInput    = document.getElementById('reportFrom');
  const toInput      = document.getElementById('reportTo');
  const estadoInput  = document.getElementById('reportEstado');
  const quickRange   = document.getElementById('quickRange');
  const printRange   = document.getElementById('printRange');

  const kpiTotal           = document.getElementById('kpiTotal');
  const kpiActivas         = document.getElementById('kpiActivas');
  const kpiPendientes      = document.getElementById('kpiPendientes');
  const kpiCanceladas      = document.getElementById('kpiCanceladas');
  const kpiProximas        = document.getElementById('kpiProximas');
  const kpiProgramacion    = document.getElementById('kpiProgramacion');
  const kpiProgramacionNote = document.getElementById('kpiProgramacionNote');
  const kpiUsuarios        = document.getElementById('kpiUsuarios');
  const kpiUsuariosNote    = document.getElementById('kpiUsuariosNote');
  const kpiAvisos          = document.getElementById('kpiAvisos');
  const kpiAvisosNote      = document.getElementById('kpiAvisosNote');

  const estadoBars  = document.getElementById('estadoBars');
  const mesBars     = document.getElementById('mesBars');
  const diaBars     = document.getElementById('diaBars');
  const upcomingBody = document.getElementById('upcomingBody');
  const attentionBody = document.getElementById('attentionBody');

  let currentData = null;

  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text == null ? '' : text;
    return el.innerHTML;
  }

  function statusBadge(estado) {
    const map = {
      activo:    '<span class="status-badge active"><span class="status-dot"></span> Activo</span>',
      pendiente: '<span class="status-badge pending"><span class="status-dot"></span> Pendiente</span>',
      cancelado: '<span class="status-badge canceled"><span class="status-dot"></span> Cancelado</span>',
    };
    return map[estado] || map.pendiente;
  }

  function setQuickRange(value) {
    const today = METRICAS.todayLocal();
    let from = '';
    let to = '';

    if (value === 'mes') {
      from = METRICAS.toLocalISO(new Date(today.getFullYear(), today.getMonth(), 1));
      to = METRICAS.toLocalISO(new Date(today.getFullYear(), today.getMonth() + 1, 0));
    } else if (value === 'ano') {
      from = METRICAS.toLocalISO(new Date(today.getFullYear(), 0, 1));
      to = METRICAS.toLocalISO(new Date(today.getFullYear(), 11, 31));
    } else if (value === 'proximos30') {
      from = METRICAS.toLocalISO(today);
      to = METRICAS.toLocalISO(METRICAS.addDays(today, 30));
    } else if (value === 'ultimos90') {
      from = METRICAS.toLocalISO(METRICAS.addDays(today, -90));
      to = METRICAS.toLocalISO(today);
    } else if (value === 'todo') {
      from = '';
      to = '';
    } else {
      return;
    }

    fromInput.value = from;
    toInput.value = to;
    quickRange.value = value;
  }

  function rangeLabel(includeEstado) {
    const desde = fromInput.value;
    const hasta = toInput.value;
    let label;

    if (desde && hasta) label = `${METRICAS.formatDate(desde)} al ${METRICAS.formatDate(hasta)}`;
    else if (desde) label = `Desde ${METRICAS.formatDate(desde)}`;
    else if (hasta) label = `Hasta ${METRICAS.formatDate(hasta)}`;
    else label = 'Todas las fechas';

    if (includeEstado !== false && estadoInput.value) {
      label += ` · Estado: ${estadoInput.options[estadoInput.selectedIndex].text}`;
    }

    return label;
  }

  function renderBars(container, items) {
    if (!container) return;
    const max = Math.max(...items.map(item => item.value), 0);

    if (!max) {
      container.innerHTML = '<div class="report-empty">Sin datos en el periodo seleccionado.</div>';
      return;
    }

    container.innerHTML = items.map(item => {
      const pct = Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0);
      return `
        <div class="report-bar-row">
          <span class="report-bar-label">${escapeHtml(item.label)}</span>
          <div class="report-bar-track">
            <div class="report-bar-fill ${item.className || ''}" style="width:${pct}%"></div>
          </div>
          <span class="report-bar-value">${item.value}</span>
        </div>`;
    }).join('');
  }

  function renderSummary(data) {
    const metrics = data.activities;

    kpiTotal.textContent = metrics.total;
    kpiActivas.textContent = metrics.byState.activo;
    kpiPendientes.textContent = metrics.byState.pendiente;
    kpiCanceladas.textContent = metrics.byState.cancelado;
    kpiProximas.textContent = metrics.proximas30.length;
    const filtroEstado = estadoInput.value
      ? ` · Tablas filtradas por: ${estadoInput.options[estadoInput.selectedIndex].text}`
      : '';
    document.getElementById('kpiTotalNote').textContent = `${rangeLabel(false)}${filtroEstado}`;

    renderBars(estadoBars, [
      { label: 'Activas', value: metrics.byState.activo, className: 'success' },
      { label: 'Pendientes', value: metrics.byState.pendiente, className: 'warning' },
      { label: 'Canceladas', value: metrics.byState.cancelado, className: 'danger' },
    ]);

    const monthMap = new Map();
    data.periodRows.forEach((item) => {
      if (!item.fecha) return;
      const key = item.fecha.slice(0, 7);
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    });
    const monthItems = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([key, value]) => ({ label: METRICAS.formatMonth(key), value }));
    renderBars(mesBars, monthItems);

    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    data.periodRows.forEach((item) => {
      if (!item.fecha) return;
      const date = METRICAS.parseDateOnly(item.fecha);
      if (!date) return;
      dayCounts[(date.getDay() + 6) % 7] += 1;
    });
    renderBars(diaBars, dayLabels.map((label, index) => ({ label, value: dayCounts[index] })));
  }

  function renderProgramacion(state, error) {
    if (error) {
      kpiProgramacion.textContent = '—';
      kpiProgramacionNote.textContent = 'No se pudo consultar';
      return;
    }

    if (!state.publicada) {
      kpiProgramacion.textContent = 'Sin publicar';
      kpiProgramacionNote.textContent = 'Sin programación publicada';
      return;
    }

    kpiProgramacion.textContent = state.label;
    kpiProgramacionNote.textContent = state.stale
      ? `${state.note} · desactualizada`
      : state.note;
  }

  function renderUsuarios(users) {
    if (users.total === null) {
      kpiUsuarios.textContent = '—';
      kpiUsuariosNote.textContent = 'No se pudo consultar';
      return;
    }

    kpiUsuarios.textContent = users.activos;
    kpiUsuariosNote.textContent = `${users.pct === null ? '—' : users.pct + '%'} · ${users.total} registrado${users.total === 1 ? '' : 's'}`;
  }

  function renderAvisos(avisos) {
    if (avisos.visibles === null) {
      kpiAvisos.textContent = '—';
      kpiAvisosNote.textContent = 'No se pudo consultar';
      return;
    }

    kpiAvisos.textContent = avisos.visibles;
    kpiAvisosNote.textContent = avisos.thisMonth > 0
      ? `${avisos.thisMonth} publicado${avisos.thisMonth === 1 ? '' : 's'} este mes`
      : 'Publicados';
  }

  function renderTables(data) {
    const todayISO = METRICAS.toLocalISO(METRICAS.todayLocal());

    const upcoming = data.filteredRows
      .filter((item) => item.fecha >= todayISO && item.estado !== METRICAS.ESTADOS.CANCELADO)
      .sort((a, b) => `${a.fecha} ${a.hora || ''}`.localeCompare(`${b.fecha} ${b.hora || ''}`))
      .slice(0, 8);

    if (!upcoming.length) {
      upcomingBody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><i class="fas fa-calendar-xmark"></i><p>No hay próximas actividades en el periodo seleccionado.</p></div></td></tr>';
    } else {
      upcomingBody.innerHTML = upcoming.map(item => `
        <tr>
          <td>${METRICAS.formatDate(item.fecha)}</td>
          <td>${METRICAS.formatTime(item.hora)}</td>
          <td><strong>${escapeHtml(item.titulo)}</strong></td>
          <td>${statusBadge(item.estado)}</td>
        </tr>`).join('');
    }

    const attention = data.filteredRows
      .filter((item) => item.estado === METRICAS.ESTADOS.PENDIENTE)
      .sort((a, b) => `${a.fecha} ${a.hora || ''}`.localeCompare(`${b.fecha} ${b.hora || ''}`))
      .slice(0, 12);

    if (!attention.length) {
      attentionBody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><i class="fas fa-circle-check"></i><p>No hay actividades pendientes.</p></div></td></tr>';
    } else {
      attentionBody.innerHTML = attention.map(item => `
        <tr>
          <td>${METRICAS.formatDate(item.fecha)}</td>
          <td>${METRICAS.formatTime(item.hora)}</td>
          <td><strong>${escapeHtml(item.titulo)}</strong></td>
          <td class="report-description">${escapeHtml(item.descripcion || '')}</td>
          <td>${statusBadge(item.estado)}</td>
        </tr>`).join('');
    }
  }

  function renderAll(data) {
    renderSummary(data);
    renderProgramacion(data.programacion, data.programacionError);
    renderUsuarios(data.users);
    renderAvisos(data.avisos);
    renderTables(data);
  }

  async function loadReport() {
    const desde = fromInput.value;
    const hasta = toInput.value;

    if (desde && hasta && desde > hasta) {
      APP.showToast('La fecha "Desde" no puede ser mayor que la fecha "Hasta".', 'warning');
      return;
    }

    try {
      currentData = await METRICAS.getReportData({
        desde,
        hasta,
        estado: estadoInput.value || null,
      });
      renderAll(currentData);
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      APP.showToast('Error al generar el reporte. Intenta de nuevo.', 'error');
      currentData = null;
      kpiTotal.textContent = '—';
      kpiActivas.textContent = '—';
      kpiPendientes.textContent = '—';
      kpiCanceladas.textContent = '—';
      kpiProximas.textContent = '—';
      kpiProgramacion.textContent = '—';
      kpiProgramacionNote.textContent = 'Error de consulta';
      kpiUsuarios.textContent = '—';
      kpiUsuariosNote.textContent = 'Error de consulta';
      kpiAvisos.textContent = '—';
      kpiAvisosNote.textContent = 'Error de consulta';
    }
  }

  function exportCsv() {
    const rowsData = currentData ? currentData.filteredRows : [];

    if (!rowsData.length) {
      APP.showToast('No hay actividades para exportar con los filtros actuales.', 'info');
      return;
    }

    const headers = ['Fecha', 'Hora', 'Actividad', 'Descripción', 'Estado'];
    const stateLabel = { activo: 'Activo', pendiente: 'Pendiente', cancelado: 'Cancelado' };

    const cell = (value) => `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;

    const rows = rowsData.map(item => [
      item.fecha || '',
      item.hora || '',
      item.titulo || '',
      item.descripcion || '',
      stateLabel[item.estado] || item.estado || '',
    ].map(cell).join(';'));

    const csv = '\uFEFF' + [headers.map(cell).join(';'), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-actividades-${METRICAS.toLocalISO(METRICAS.todayLocal())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    APP.showToast('Reporte exportado en CSV.', 'success');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    loadReport();
  });

  quickRange.addEventListener('change', () => {
    if (quickRange.value === 'custom') return;
    setQuickRange(quickRange.value);
    loadReport();
  });

  fromInput.addEventListener('change', () => { quickRange.value = 'custom'; });
  toInput.addEventListener('change', () => { quickRange.value = 'custom'; });

  document.getElementById('btnPrintReport').addEventListener('click', () => {
    printRange.textContent = `${rangeLabel(true)} · Generado el ${new Date().toLocaleString('es-NI')}`;
    window.print();
  });

  document.getElementById('btnExportCsv').addEventListener('click', exportCsv);

  setQuickRange('ano');
  await loadReport();
});
