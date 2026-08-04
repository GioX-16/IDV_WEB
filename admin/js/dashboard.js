/* ============================================================
   dashboard.js — Panel de control principal (datos desde Supabase)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  /* ---------- RENDER STAT CARDS ---------- */
  const statActividades  = document.getElementById('statActividades');
  const statProgramacion = document.getElementById('statProgramacion');
  const statUsuarios     = document.getElementById('statUsuarios');
  const statPendientes   = document.getElementById('statPendientes');

  try {
    const [totalRes, pendRes, progRes, userRes] = await Promise.all([
      supabase.from('actividades').select('*', { count: 'exact', head: true }),
      supabase.from('actividades').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('programacion').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
    ]);

    statActividades.textContent  = totalRes.count || 0;
    statPendientes.textContent   = pendRes.count || 0;
    statProgramacion.textContent = progRes.count || 0;
    statUsuarios.textContent     = userRes.count || 0;
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
            <a href="actividades.html" class="btn-icon" title="Ver"><i class="fas fa-eye"></i></a>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error('Error al cargar las actividades recientes:', e);
  }

});
