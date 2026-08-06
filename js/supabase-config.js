/* ============================================================
   supabase-config.js — Configuración Global de Supabase
   ============================================================ */

   const SUPABASE_URL = 'https://uyxnosasdxoqfaacknwy.supabase.co'; /* <-- PROJECT URL */
   const SUPABASE_ANON_KEY = 'sb_publishable_J5whpvosEhxsTgYcqXjOZA_WtFiFmES'; /* <-- PUBLISHABLE KEY */
   const PROG_BUCKET = 'programacion';
   
   // Inicialización: ambas variables apuntan al mismo cliente de Supabase.
   // 'supabase' para compatibilidad con todo el código existente.
   // 'supabaseClient' como alias explícito.
   window.supabase = window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
   window.PROG_BUCKET = PROG_BUCKET;    