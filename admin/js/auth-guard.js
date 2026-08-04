/* ============================================================
   auth-guard.js — Protección de rutas del Panel Admin
   ============================================================
   Se carga en todas las páginas del panel (menos login.html).
   Si no hay sesión activa redirige a login.html.
   Si hay sesión, carga el perfil en APP.user y actualiza la UI.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  APP.user = {
    id: session.user.id,
    email: session.user.email,
    nombre: session.user.user_metadata?.nombre || 'Usuario',
    rol: 'Editor',
  };

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      APP.user = {
        id: profile.id,
        email: profile.email,
        nombre: profile.nombre,
        rol: profile.rol,
      };
    }
  } catch (e) {
    console.warn('No se pudo cargar el perfil:', e);
  }

  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  if (nameEl) nameEl.textContent = APP.user.nombre || APP.user.email || 'Usuario';
  if (roleEl) roleEl.textContent = APP.user.rol || '';

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.href = 'login.html';
  });
});
