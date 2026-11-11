/* ============================================================
   metricas.js — Fuente única de verdad para el panel admin
   ============================================================
   Todas las páginas deben calcular sus métricas con este módulo.
   Reglas:
   - "hoy" siempre se calcula en hora local (America/Managua).
   - Las fechas DATE (YYYY-MM-DD) se parsean como locales, nunca UTC.
   - Las actividades canceladas no cuentan como próximas.
   - La programación es una sola imagen; su antigüedad se mide con
     updated_at (fecha de la última sustitución).
   ============================================================ */

window.METRICAS = (function () {
  'use strict';

  const ESTADOS = Object.freeze({
    ACTIVO: 'activo',
    PENDIENTE: 'pendiente',
    CANCELADO: 'cancelado',
  });

  const ESTADOS_VALIDOS = [ESTADOS.ACTIVO, ESTADOS.PENDIENTE, ESTADOS.CANCELADO];
  const MS_DAY = 86400000;
  const TIME_ZONE = 'America/Managua';

  /* ---------- FECHAS ---------- */

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function datePartsInTimeZone(date, timeZone) {
    const parts = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date).forEach((part) => {
      if (part.type !== 'literal') parts[part.type] = part.value;
    });
    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
    };
  }

  function calendarDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return null;
    const parts = datePartsInTimeZone(date, TIME_ZONE);
    return new Date(parts.year, parts.month - 1, parts.day);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function todayLocal() {
    return calendarDate(new Date());
  }

  function toLocalISO(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function parseDateOnly(value) {
    if (!value) return null;
    if (value instanceof Date) return startOfDay(value);

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    if (!match) return null;

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    if (!value) return '';
    const isDateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
    const date = isDateOnly ? parseDateOnly(value) : new Date(value);
    if (!date || isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString('es-NI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: TIME_ZONE,
    });
  }

  function formatMonth(key) {
    const date = parseDateOnly(`${key}-01`);
    if (!date) return key;
    const label = date.toLocaleDateString('es-NI', { month: 'short', year: 'numeric', timeZone: TIME_ZONE });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function formatTime(value) {
    if (!value) return '';
    const [hours, minutes] = String(value).split(':');
    const hour = parseInt(hours, 10);
    if (isNaN(hour)) return String(value);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${minutes || '00'} ${suffix}`;
  }

  function calendarDayDiff(target, reference) {
    const from = reference ? startOfDay(reference) : todayLocal();
    const to = target instanceof Date ? calendarDate(target) : calendarDate(new Date(target));
    if (!to) return 0;
    return Math.max(0, Math.round((from - to) / MS_DAY));
  }

  function formatRelativeDays(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '—';
    const days = calendarDayDiff(date);
    return days === 0 ? 'Hoy' : `Hace ${days} d`;
  }

  /* ---------- ACTIVIDADES ---------- */

  function compareActivities(a, b) {
    const left = `${a.fecha || ''} ${a.hora || ''}`;
    const right = `${b.fecha || ''} ${b.hora || ''}`;
    return left.localeCompare(right);
  }

  function isWithin(date, fromISO, toISO) {
    if (fromISO && date < fromISO) return false;
    if (toISO && date > toISO) return false;
    return true;
  }

  function computeActivityMetrics(rows, options) {
    const opts = options || {};
    const today = opts.today ? startOfDay(opts.today) : todayLocal();
    const todayISO = toLocalISO(today);
    const in7 = toLocalISO(addDays(today, 7));
    const in30 = toLocalISO(addDays(today, 30));

    const actividades = (rows || []).filter((item) => item && item.fecha);
    const byState = {
      [ESTADOS.ACTIVO]: 0,
      [ESTADOS.PENDIENTE]: 0,
      [ESTADOS.CANCELADO]: 0,
    };

    actividades.forEach((item) => {
      if (byState[item.estado] !== undefined) byState[item.estado] += 1;
    });

    const isCancelled = (item) => item.estado === ESTADOS.CANCELADO;
    const isUpcoming = (item) => item.fecha >= todayISO && !isCancelled(item);

    const proximas7 = actividades.filter(
      (item) => isUpcoming(item) && item.fecha < in7
    );
    const proximas30 = actividades.filter(
      (item) => isUpcoming(item) && item.fecha < in30
    );
    const upcoming = actividades.filter(isUpcoming).sort(compareActivities);
    const attention = actividades
      .filter((item) => item.estado === ESTADOS.PENDIENTE)
      .sort(compareActivities);

    const overduePending = attention.filter((item) => item.fecha < todayISO).length;

    return {
      total: actividades.length,
      byState,
      proximas7,
      proximas30,
      upcoming,
      attention,
      overduePending,
      todayISO,
    };
  }

  function computeMonthVariation(rows, today) {
    const reference = today || todayLocal();
    const year = reference.getFullYear();
    const month = reference.getMonth();
    const previous = new Date(year, month - 1, 1);

    const inMonth = (date, y, m) =>
      date && date.getFullYear() === y && date.getMonth() === m;

    let thisMonth = 0;
    let lastMonth = 0;

    (rows || []).forEach((item) => {
      const date = parseDateOnly(item.fecha);
      if (inMonth(date, year, month)) thisMonth += 1;
      if (inMonth(date, previous.getFullYear(), previous.getMonth())) lastMonth += 1;
    });

    const pct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
    return { thisMonth, lastMonth, pct };
  }

  /* ---------- USUARIOS ---------- */

  function computeUserMetrics(rows) {
    const usuarios = (rows || []).filter(Boolean);
    const activos = usuarios.filter((item) => item.estado === 'activo').length;
    const total = usuarios.length;
    return {
      total,
      activos,
      inactivos: total - activos,
      pct: total > 0 ? Math.round((activos / total) * 100) : null,
    };
  }

  /* ---------- AVISOS ---------- */

  function computeAvisoMetrics(rows, today) {
    const reference = today || todayLocal();
    const todayISO = toLocalISO(reference);
    const avisos = (rows || []).filter(Boolean);

    const visibles = avisos.filter(
      (item) => item.estado === 'activo' && (!item.fecha_publicacion || item.fecha_publicacion <= todayISO)
    );

    const thisMonth = visibles.filter((item) => {
      const date = parseDateOnly(item.fecha_publicacion);
      return date &&
        date.getFullYear() === reference.getFullYear() &&
        date.getMonth() === reference.getMonth();
    }).length;

    return {
      total: avisos.length,
      activos: avisos.filter((item) => item.estado === 'activo').length,
      visibles: visibles.length,
      thisMonth,
    };
  }

  /* ---------- PROGRAMACIÓN ---------- */

  function computeProgramacionState(row) {
    if (!row || !row.imagen_url) {
      return {
        publicada: false,
        label: 'Sin publicar',
        note: 'Sin programación publicada',
        days: null,
        updatedAt: null,
        stale: false,
      };
    }

    const updatedAt = row.updated_at ? new Date(row.updated_at) : null;
    if (!updatedAt || isNaN(updatedAt.getTime())) {
      return {
        publicada: true,
        label: 'Publicada',
        note: 'Programación disponible',
        days: null,
        updatedAt: null,
        stale: false,
      };
    }

    const days = calendarDayDiff(updatedAt);
    return {
      publicada: true,
      label: days === 0 ? 'Hoy' : `Hace ${days} d`,
      note: `Actualizada el ${formatDate(updatedAt.toISOString())}`,
      days,
      updatedAt,
      stale: days > 7,
    };
  }

  /* ---------- CONSULTAS SUPABASE ---------- */

  async function fetchActividades(range) {
    const opts = range || {};
    const pageSize = 1000;
    const rows = [];
    let offset = 0;

    // Paginación explícita: PostgREST suele limitar a 1000 filas por
    // respuesta. Así los totales no se truncan en tablas grandes.
    while (true) {
      let query = supabase.from('actividades').select('*');

      if (opts.desde) query = query.gte('fecha', opts.desde);
      if (opts.hasta) query = query.lte('fecha', opts.hasta);

      const { data, error } = await query
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      const page = data || [];
      rows.push(...page);

      if (page.length < pageSize) break;
      offset += pageSize;
    }

    return rows;
  }

  async function fetchProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, nombre, rol, estado')
      .order('email', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function fetchAvisos() {
    const { data, error } = await supabase
      .from('avisos')
      .select('id, titulo, estado, fecha_publicacion, created_at, updated_at')
      .order('fecha_publicacion', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async function fetchProgramacion() {
    const { data, error } = await supabase
      .from('programacion')
      .select('id, imagen_url, nombre_archivo, updated_at, updated_by')
      .neq('imagen_url', '')
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length ? data[0] : null;
  }

  async function settled(promise) {
    try {
      return { ok: true, value: await promise };
    } catch (error) {
      console.error('Error al cargar una métrica:', error);
      return { ok: false, error };
    }
  }

  /* ---------- DATOS PARA DASHBOARD ---------- */

  async function ensureSession() {
    try {
      await supabase.auth.getSession();
    } catch (error) {
      console.warn('No se pudo verificar la sesión:', error);
    }
  }

  async function getDashboardData() {
    await ensureSession();
    const today = todayLocal();
    const year = today.getFullYear();
    const yearFrom = `${year}-01-01`;
    const yearTo = `${year}-12-31`;

    // Las actividades son esenciales: si fallan, la página muestra error.
    const allActivities = await fetchActividades();

    const [profilesRes, avisosRes, programacionRes] = await Promise.all([
      settled(fetchProfiles()),
      settled(fetchAvisos()),
      settled(fetchProgramacion()),
    ]);

    const yearActivities = allActivities.filter(
      (item) => item.fecha >= yearFrom && item.fecha <= yearTo
    );

    const activities = computeActivityMetrics(yearActivities, { today });
    const variation = computeMonthVariation(allActivities, today);

    const recent = [...allActivities]
      .sort((a, b) => compareActivities(b, a))
      .slice(0, 5);

    const users = profilesRes.ok
      ? computeUserMetrics(profilesRes.value)
      : { total: null, activos: null, inactivos: null, pct: null };

    const avisos = avisosRes.ok
      ? computeAvisoMetrics(avisosRes.value, today)
      : { total: null, activos: null, visibles: null, thisMonth: null };

    const programacion = computeProgramacionState(
      programacionRes.ok ? programacionRes.value : null
    );

    return {
      year,
      activities,
      variation,
      recent,
      users,
      usersError: !profilesRes.ok,
      avisos,
      avisosError: !avisosRes.ok,
      programacion,
      programacionError: !programacionRes.ok,
    };
  }

  /* ---------- DATOS PARA REPORTES ---------- */

  async function getReportData(filters) {
    await ensureSession();
    const opts = filters || {};
    const today = todayLocal();

    // El período se consulta sin filtro de estado para que la
    // distribución siempre sea representativa.
    const periodRows = await fetchActividades({
      desde: opts.desde,
      hasta: opts.hasta,
    });

    const filteredRows = opts.estado
      ? periodRows.filter((item) => item.estado === opts.estado)
      : periodRows;

    const [profilesRes, avisosRes, programacionRes] = await Promise.all([
      settled(fetchProfiles()),
      settled(fetchAvisos()),
      settled(fetchProgramacion()),
    ]);

    return {
      periodRows,
      filteredRows,
      activities: computeActivityMetrics(periodRows, { today }),
      users: profilesRes.ok
        ? computeUserMetrics(profilesRes.value)
        : { total: null, activos: null, inactivos: null, pct: null },
      avisos: avisosRes.ok
        ? computeAvisoMetrics(avisosRes.value, today)
        : { total: null, activos: null, visibles: null, thisMonth: null },
      programacion: computeProgramacionState(
        programacionRes.ok ? programacionRes.value : null
      ),
      programacionError: !programacionRes.ok,
    };
  }

  return {
    ESTADOS,
    ESTADOS_VALIDOS,
    // fechas
    startOfDay,
    todayLocal,
    toLocalISO,
    addDays,
    parseDateOnly,
    formatDate,
    formatMonth,
    formatTime,
    formatRelativeDays,
    calendarDayDiff,
    // cálculos
    computeActivityMetrics,
    computeMonthVariation,
    computeUserMetrics,
    computeAvisoMetrics,
    computeProgramacionState,
    // consultas
    fetchActividades,
    fetchProfiles,
    fetchAvisos,
    fetchProgramacion,
    getDashboardData,
    getReportData,
  };
})();
