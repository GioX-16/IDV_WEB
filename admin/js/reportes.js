document.addEventListener('DOMContentLoaded', async () => {

  const form        = document.getElementById('reportFilters');
  const fromInput   = document.getElementById('reportFrom');
  const toInput     = document.getElementById('reportTo');
  const estadoInput = document.getElementById('reportEstado');
  const quickRange  = document.getElementById('quickRange');
  const printRange  = document.getElementById('printRange');

  const kpiTotal          = document.getElementById('kpiTotal');
  const kpiActivas        = document.getElementById('kpiActivas');
  const kpiPendientes     = document.getElementById('kpiPendientes');
  const kpiCanceladas     = document.getElementById('kpiCanceladas');
  const kpiProximas       = document.getElementById('kpiProximas');
  const kpiProgramacion   = document.getElementById('kpiProgramacion');
  const kpiProgramacionNote = document.getElementById('kpiProgramacionNote');

  const estadoBars  = document.getElementById('estadoBars');
  const mesBars     = document.getElementById('mesBars');
  const diaBars     = document.getElementById('diaBars');
  const upcomingBody = document.getElementById('upcomingBody');
  const attentionBody = document.getElementById('attentionBody');

  let actividades = [];
  let programacion = null;

  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text == null ? '' : text;
    return el.innerHTML;
  }

  function toLocalISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatDate(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha.length > 10 ? fecha : fecha + 'T00:00:00');
    if (isNaN(d)) return fecha;
    return d.toLocaleDateString('es-NI', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  function formatMonth(key) {
    const d = new Date(key + '-01T00:00:00');
    if (isNaN(d)) return key;
    const label = d.toLocaleDateString('es-NI', { month: 'short', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
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
    const today = startOfDay(new Date());
    let from = '';
    let to = '';

    if (value === 'mes') {
      from = toLocalISO(new Date(today.getFullYear(), today.getMonth(), 1));
      to = toLocalISO(new Date(today.getFullYear(), today.getMonth() + 1, 0));
    } else if (value === 'ano') {
      from = toLocalISO(new Date(today.getFullYear(), 0, 1));
      to = toLocalISO(new Date(today.getFullYear(), 11, 31));
    } else if (value === 'proximos30') {
      from = toLocalISO(today);
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      to = toLocalISO(end);
    } else if (value === 'ultimos90') {
      const start = new Date(today);
      start.setDate(start.getDate() - 90);
      from = toLocalISO(start);
      to = toLocalISO(today);
    }

    fromInput.value = from;
    toInput.value = to;
    quickRange.value = value;
  }

  function rangeLabel() {
    const desde = fromInput.value;
    const hasta = toInput.value;
    let label;

    if (desde && hasta) label = `${formatDate(desde)} al ${formatDate(hasta)}`;
    else if (desde) label = `Desde ${formatDate(desde)}`;
    else if (hasta) label = `Hasta ${formatDate(hasta)}`;
    else label = 'Todas las fechas';

    if (estadoInput.value) {
      label += ` · Estado: ${estadoInput.options[estadoInput.selectedIndex].text}`;
    }

    return label;
  }

  function renderBars(container, items) {
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

  function renderSummary() {
    const counts = { activo: 0, pendiente: 0, cancelado: 0 };
    actividades.forEach(a => {
      if (counts[a.estado] !== undefined) counts[a.estado] += 1;
    });

    const today = startOfDay(new Date());
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    const todayISO = toLocalISO(today);
    const in30ISO = toLocalISO(in30);

    const proximas = actividades.filter(a => a.fecha >= todayISO && a.fecha <= in30ISO);

    kpiTotal.textContent = actividades.length;
    kpiActivas.textContent = counts.activo;
    kpiPendientes.textContent = counts.pendiente;
    kpiCanceladas.textContent = counts.cancelado;
    kpiProximas.textContent = proximas.length;
    document.getElementById('kpiTotalNote').textContent = rangeLabel();

    renderBars(estadoBars, [
      { label: 'Activas', value: counts.activo, className: 'success' },
      { label: 'Pendientes', value: counts.pendiente, className: 'warning' },
      { label: 'Canceladas', value: counts.cancelado, className: 'danger' },
    ]);

    const monthMap = new Map();
    actividades.forEach(a => {
      if (!a.fecha) return;
      const key = a.fecha.slice(0, 7);
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    });
    const monthItems = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([key, value]) => ({ label: formatMonth(key), value }));
    renderBars(mesBars, monthItems);

    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    actividades.forEach(a => {
      if (!a.fecha) return;
      const d = new Date(a.fecha + 'T00:00:00');
      if (isNaN(d)) return;
      dayCounts[(d.getDay() + 6) % 7] += 1;
    });
    renderBars(diaBars, dayLabels.map((label, i) => ({ label, value: dayCounts[i] })));
  }

  function renderProgramacion() {
    if (!programacion || !programacion.imagen_url) {
      kpiProgramacion.textContent = '—';
      kpiProgramacionNote.textContent = 'Sin programación publicada';
      return;
    }

    const updated = new Date(programacion.updated_at || programacion.created_at);
    if (isNaN(updated)) {
      kpiProgramacion.textContent = 'Publicada';
      kpiProgramacionNote.textContent = 'Programación disponible';
      return;
    }

    const today = startOfDay(new Date());
    const updatedDay = startOfDay(updated);
    const days = Math.max(0, Math.round((today - updatedDay) / 86400000));

    kpiProgramacion.textContent = days === 0 ? 'Hoy' : `${days} d`;
    kpiProgramacionNote.textContent = `Actualizada el ${formatDate(updated.toISOString())}`;
  }

  function renderTables() {
    const todayISO = toLocalISO(startOfDay(new Date()));

    const upcoming = actividades
      .filter(a => a.fecha >= todayISO)
      .slice(0, 8);

    if (!upcoming.length) {
      upcomingBody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><i class="fas fa-calendar-xmark"></i><p>No hay próximas actividades en el periodo seleccionado.</p></div></td></tr>';
    } else {
      upcomingBody.innerHTML = upcoming.map(a => `
        <tr>
          <td>${formatDate(a.fecha)}</td>
          <td>${APP.formatTime(a.hora)}</td>
          <td><strong>${escapeHtml(a.titulo)}</strong></td>
          <td>${statusBadge(a.estado)}</td>
        </tr>`).join('');
    }

    const attention = actividades
      .filter(a => a.estado === 'pendiente' || a.estado === 'cancelado')
      .slice(0, 12);

    if (!attention.length) {
      attentionBody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><i class="fas fa-circle-check"></i><p>No hay actividades pendientes ni canceladas.</p></div></td></tr>';
    } else {
      attentionBody.innerHTML = attention.map(a => `
        <tr>
          <td>${formatDate(a.fecha)}</td>
          <td>${APP.formatTime(a.hora)}</td>
          <td><strong>${escapeHtml(a.titulo)}</strong></td>
          <td class="report-description">${escapeHtml(a.descripcion || '')}</td>
          <td>${statusBadge(a.estado)}</td>
        </tr>`).join('');
    }
  }

  async function loadProgramacion() {
    try {
      const { data } = await supabase
        .from('programacion')
        .select('imagen_url, updated_at, created_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      programacion = data && data.length ? data[0] : null;
    } catch (e) {
      console.error('Error al cargar la programación:', e);
      programacion = null;
    }
  }

  async function loadReport() {
    const desde = fromInput.value;
    const hasta = toInput.value;

    if (desde && hasta && desde > hasta) {
      APP.showToast('La fecha "Desde" no puede ser mayor que la fecha "Hasta".', 'warning');
      return;
    }

    try {
      let query = supabase.from('actividades').select('*');

      if (desde) query = query.gte('fecha', desde);
      if (hasta) query = query.lte('fecha', hasta);
      if (estadoInput.value) query = query.eq('estado', estadoInput.value);

      const { data, error } = await query
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;
      actividades = data || [];
    } catch (e) {
      console.error('Error al generar el reporte:', e);
      APP.showToast('Error al generar el reporte. Intenta de nuevo.', 'error');
      actividades = [];
    }

    await loadProgramacion();
    renderSummary();
    renderProgramacion();
    renderTables();
  }

  function exportCsv() {
    if (!actividades.length) {
      APP.showToast('No hay actividades para exportar con los filtros actuales.', 'info');
      return;
    }

    const headers = ['Fecha', 'Hora', 'Actividad', 'Descripción', 'Estado'];
    const stateLabel = { activo: 'Activo', pendiente: 'Pendiente', cancelado: 'Cancelado' };

    const cell = (value) => `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;

    const rows = actividades.map(a => [
      a.fecha || '',
      a.hora || '',
      a.titulo || '',
      a.descripcion || '',
      stateLabel[a.estado] || a.estado || '',
    ].map(cell).join(';'));

    const csv = '\uFEFF' + [headers.map(cell).join(';'), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-actividades-${toLocalISO(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    APP.showToast('Reporte exportado en CSV.', 'success');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    loadReport();
  });

  quickRange.addEventListener('change', () => {
    if (quickRange.value !== 'custom') {
      setQuickRange(quickRange.value);
      loadReport();
    }
  });

  fromInput.addEventListener('change', () => { quickRange.value = 'custom'; });
  toInput.addEventListener('change', () => { quickRange.value = 'custom'; });

  document.getElementById('btnPrintReport').addEventListener('click', () => {
    printRange.textContent = `${rangeLabel()} · Generado el ${new Date().toLocaleString('es-NI')}`;
    window.print();
  });

  document.getElementById('btnExportCsv').addEventListener('click', exportCsv);

  setQuickRange('ano');
  await loadReport();
});
