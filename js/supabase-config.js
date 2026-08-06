/* ============================================================
   supabase-config.js — Configuración Global de Supabase
   ============================================================ */

   const SUPABASE_URL = 'https://uyxnosasdxoqfaacknwy.supabase.co'; /* <-- PROJECT URL */
   const SUPABASE_ANON_KEY = 'sb_publishable_J5whpvosEhxsTgYcqXjOZA_WtFiFmES'; /* <-- PUBLISHABLE KEY */
   const PROG_BUCKET = 'programacion';
   
   // Inicialización correcta usando el objeto global provisto por el CDN
   window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
   window.PROG_BUCKET = PROG_BUCKET;    