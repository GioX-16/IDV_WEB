/* ============================================================
   dashboard.js — Panel de control principal
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- SIMULATED DATA ---------- */
  const actividades = [
    { id: 1, titulo: 'Culto de Oración',       fecha: '2026-07-30', hora: '18:00', estado: 'activo' },
    { id: 2, titulo: 'Culto de Dorcas',         fecha: '2026-08-01', hora: '18:00', estado: 'activo' },
    { id: 3, titulo: 'Ayuno Congregacional',    fecha: '2026-07-30', hora: '09:00', estado: 'activo' },
    { id: 4, titulo: 'Culto de Jóvenes',        fecha: '2026-08-02', hora: '18:00', estado: 'pendiente' },
    { id: 5, titulo: 'Estudios SEAN',           fecha: '2026-07-31', hora: '18:00', estado: 'activo' },
    { id: 6, titulo: 'Culto Evangelístico',     fecha: '2026-08-03', hora: '16:00', estado: 'activo' },
    { id: 7, titulo: 'Escuela Dominical',       fecha: '2026-08-03', hora: '09:00', estado: 'pendiente' },
    { id: 8, titulo: 'Reunión de Líderes',      fecha: '2026-08-05', hora: '17:00', estado: 'cancelado' },
  ];

  const programacion = [
    { id: 1, dia: 'Martes',   actividad: 'Culto de Oración',       hora: '6:00 PM - 8:00 PM' },
    { id: 2, dia: 'Miércoles',actividad: 'Ayuno Congregacional',    hora: '9:00 AM - 2:00 PM' },
    { id: 3, dia: 'Jueves',   actividad: 'Estudios SEAN',           hora: '6:00 PM - 8:00 PM' },
    { id: 4, dia: 'Viernes',  actividad: 'Culto de Dorcas',         hora: '6:00 PM - 8:00 PM' },
    { id: 5, dia: 'Sábado',   actividad: 'Culto de Jóvenes',        hora: '6:00 PM - 8:00 PM' },
    { id: 6, dia: 'Domingo',  actividad: 'Escuela Dominical',       hora: '9:00 AM - 11:00 AM' },
    { id: 7, dia: 'Domingo',  actividad: 'Culto Evangelístico',     hora: '4:00 PM - 7:00 PM' },
  ];

  const usuarios = [
    { id: 1, nombre: 'Administrador',       correo: 'admin@idv.org.ni',   rol: 'Administrador', estado: 'activo' },
    { id: 2, nombre: 'René Adolfo García',  correo: 'pastor@idv.org.ni',  rol: 'Pastor',        estado: 'activo' },
    { id: 3, nombre: 'Mallen Luna López',   correo: 'mallen@idv.org.ni',  rol: 'Pastora',       estado: 'activo' },
    { id: 4, nombre: 'Lester García',       correo: 'lester@idv.org.ni',  rol: 'Co-Pastor',     estado: 'activo' },
    { id: 5, nombre: 'Ena Alexa Pérez',     correo: 'ena@idv.org.ni',     rol: 'Co-Pastora',    estado: 'activo' },
    { id: 6, nombre: 'Editor IDV',          correo: 'editor@idv.org.ni',  rol: 'Editor',        estado: 'activo' },
    { id: 7, nombre: 'María López',         correo: 'maria@idv.org.ni',   rol: 'Editor',        estado: 'inactivo' },
  ];

  /* ---------- RENDER STAT CARDS ---------- */
  document.getElementById('statActividades').textContent = actividades.length;
  document.getElementById('statProgramacion').textContent = programacion.length;
  document.getElementById('statUsuarios').textContent = usuarios.filter(u => u.estado === 'activo').length;
  document.getElementById('statPendientes').textContent = actividades.filter(a => a.estado === 'pendiente').length;

  /* ---------- RENDER RECENT ACTIVITIES TABLE ---------- */
  const tbody = document.getElementById('recentActivitiesBody');
  const recent = [...actividades]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  const statusBadge = (estado) => {
    const map = {
      activo:    '<span class="status-badge active"><span class="status-dot"></span> Activo</span>',
      pendiente: '<span class="status-badge pending"><span class="status-dot"></span> Pendiente</span>',
      cancelado: '<span class="status-badge canceled"><span class="status-dot"></span> Cancelado</span>',
    };
    return map[estado] || map.pendiente;
  };

  recent.forEach(a => {
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

  /* ---------- HELPER ---------- */
  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text;
    return el.innerHTML;
  }

});
