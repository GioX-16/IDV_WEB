/* ============================================================
   dashboard.js — Panel de control principal (datos desde Supabase)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  /* ---------- RENDER STAT CARDS ---------- */
  const statActividades  = document.getElementById('statActividades');
  const statProgramacion = document.getElementById('statProgramacion');
  const statUsuarios     = document.getElementById('statUsuarios');
  const statPendientes   = document.getElementById('statPendientes');
  const statAvisos       = document.getElementById('statAvisos');

  const toLocalISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const today = new Date();
  const todayISO = toLocalISO(today);
  const next7 = new Date(today);
  next7.setDate(next7.getDate() + 7);
  const next7ISO = toLocalISO(next7);

  try {
    const [totalRes, pendRes, progRes, userRes, avisosRes, proxRes, progLatestRes] = await Promise.all([
      supabase.from('actividades').select('*', { count: 'exact', head: true }),
      supabase.from('actividades').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('programacion').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
      supabase.from('avisos').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
      supabase.from('actividades').select('*', { count: 'exact', head: true }).gte('fecha', todayISO).lte('fecha', next7ISO),
      supabase.from('programacion').select('updated_at').order('updated_at', { ascending: false }).limit(1),
    ]);

    statActividades.textContent  = totalRes.count || 0;
    statPendientes.textContent   = pendRes.count || 0;
    statProgramacion.textContent = progRes.count || 0;
    statUsuarios.textContent     = userRes.count || 0;
    statAvisos.textContent       = avisosRes.count || 0;

    const insightPendientes = document.getElementById('insightPendientes');
    const insightProximas = document.getElementById('insightProximas');
    const insightAvisos = document.getElementById('insightAvisos');
    const insightProgramacion = document.getElementById('insightProgramacion');

    if (insightPendientes) insightPendientes.textContent = pendRes.count || 0;
    if (insightProximas) insightProximas.textContent = proxRes.count || 0;
    if (insightAvisos) insightAvisos.textContent = avisosRes.count || 0;

    if (insightProgramacion) {
      const latest = progLatestRes.data && progLatestRes.data.length ? progLatestRes.data[0] : null;
      if (!latest || !latest.updated_at) {
        insightProgramacion.textContent = '—';
      } else {
        const updated = new Date(latest.updated_at);
        const diff = Math.max(0, Math.round((new Date(todayISO + 'T00:00:00') - new Date(updated.getFullYear(), updated.getMonth(), updated.getDate())) / 86400000));
        insightProgramacion.textContent = diff === 0 ? 'Hoy' : `Hace ${diff} d`;
      }
    }
  } catch (e) {
    console.error('Error al cargar las estadísticas:', e);
  }

  /* ---------- RENDER RECENT ACTIVITIES TABLE ---------- */
  const tbody = document.getElementById('recentActivitiesBody');

  const statusBadge = (estado) => {
    const map = {
      activo:    '<span class="status-badge active"><span class="status-dot"></span> Activo</span>',
      pendiente: '<span class="status-badge pending"><span class="status-dot"></span> Pendiente</span>',
      cancelado: '<span class="status-badge canceled"><span class="status-dot"></span> Cancelado</span>',
    };
    return map[estado] || map.pendiente;
  };

  const escapeHtml = (text) => {
    const el = document.createElement('div');
    el.textContent = text;
    return el.innerHTML;
  };

  try {
    const { data: recent } = await supabase
      .from('actividades')
      .select('*')
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .limit(5);

    (recent || []).forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(a.titulo)}</strong></td>
        <td>${APP.formatDate(a.fecha)}</td>
        <td>${APP.formatTime(a.hora)}</td>
        <td>${statusBadge(a.estado)}</td>
        <td>
          <div class="action-btns">
            <a href="actividades" class="btn-icon" title="Ver"><i class="fas fa-eye"></i></a>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error('Error al cargar las actividades recientes:', e);
  }

});
