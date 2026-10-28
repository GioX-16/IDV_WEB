-- ============================================================
-- IDV_WEB — Migración: módulo de Avisos
-- Iglesia del Dios Viviente
--
-- CÓMO USARLO:
--   1. Abre tu proyecto en https://supabase.com/dashboard
--   2. Ve a SQL Editor
--   3. Pega TODO este archivo y pulsa "Run"
-- ============================================================

-- ============================================================
-- 1. TABLA: avisos
-- ============================================================
create table if not exists public.avisos (
  id                bigint generated always as identity primary key,
  titulo            text not null,
  contenido         text not null,
  imagen_url        text not null default '',
  nombre_archivo    text not null default '',
  storage_path      text not null default '',
  estado            text not null default 'activo'
                    check (estado in ('activo', 'inactivo')),
  fecha_publicacion date not null default current_date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null
);

create index if not exists avisos_publicados_idx
  on public.avisos (estado, fecha_publicacion desc);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================
alter table public.avisos enable row level security;

-- Lectura pública de avisos activos. Los usuarios autenticados
-- pueden leer todos (incluidos los inactivos para el panel admin).
drop policy if exists "avisos_select_public_auth" on public.avisos;
create policy "avisos_select_public_auth"
  on public.avisos for select
  using (estado = 'activo' or auth.role() = 'authenticated');

-- Escritura: solo usuarios autenticados.
drop policy if exists "avisos_write_auth" on public.avisos;
create policy "avisos_write_auth"
  on public.avisos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 3. STORAGE BUCKET: avisos (público)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avisos', 'avisos', true)
on conflict (id) do nothing;

-- Lectura pública del bucket
drop policy if exists "avisos_bucket_read" on storage.objects;
create policy "avisos_bucket_read"
  on storage.objects for select
  using (bucket_id = 'avisos');

-- Escritura: solo usuarios autenticados
drop policy if exists "avisos_bucket_write" on storage.objects;
create policy "avisos_bucket_write"
  on storage.objects for all
  using (bucket_id = 'avisos' and auth.role() = 'authenticated')
  with check (bucket_id = 'avisos' and auth.role() = 'authenticated');
