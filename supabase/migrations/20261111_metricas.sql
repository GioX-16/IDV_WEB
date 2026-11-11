-- ============================================================
-- IDV_WEB — Migración de consistencia de métricas
-- Fecha: 2026-11-11
--
-- Aplicar en Supabase → SQL Editor (una sola vez).
-- Es idempotente: puede ejecutarse más de una vez sin duplicar datos.
--
-- Qué corrige:
--   1. updated_at de programacion y avisos se actualiza en la BD
--      (no depende del reloj del navegador).
--   2. La programación queda como una sola fila (singleton).
--   3. Backfill de profiles para usuarios de Auth sin perfil.
--   4. Índices para las consultas de métricas y reportes.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TRIGGER updated_at
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists programacion_set_updated_at on public.programacion;
create trigger programacion_set_updated_at
  before update on public.programacion
  for each row execute function public.set_updated_at();

drop trigger if exists avisos_set_updated_at on public.avisos;
create trigger avisos_set_updated_at
  before update on public.avisos
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2. PROGRAMACIÓN COMO FILA ÚNICA
-- ------------------------------------------------------------
-- Conserva la fila más reciente (updated_at, luego id).
with ranked as (
  select
    id,
    row_number() over (
      order by updated_at desc nulls last, id desc
    ) as rn
  from public.programacion
)
delete from public.programacion p
using ranked r
where p.id = r.id
  and r.rn > 1;

create unique index if not exists programacion_singleton_idx
  on public.programacion ((true));

-- ------------------------------------------------------------
-- 3. BACKFILL DE PROFILES
-- ------------------------------------------------------------
-- Crea el perfil de cada usuario de Auth que todavía no lo tenga.
-- No toca perfiles existentes.
insert into public.profiles (id, email, nombre)
select
  u.id,
  u.email,
  coalesce(
    nullif(u.raw_user_meta_data->>'nombre', ''),
    split_part(u.email, '@', 1)
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict do nothing;

-- ------------------------------------------------------------
-- 4. ÍNDICES PARA MÉTRICAS
-- ------------------------------------------------------------
create index if not exists actividades_fecha_estado_idx
  on public.actividades (fecha, estado);

create index if not exists avisos_estado_fecha_idx
  on public.avisos (estado, fecha_publicacion desc);

-- ------------------------------------------------------------
-- 5. VERIFICACIÓN (ejecutar por separado si se desea)
-- ------------------------------------------------------------
-- select count(*) as perfiles,
--        count(*) filter (where estado = 'activo') as activos
-- from public.profiles;
--
-- select id, imagen_url, updated_at
-- from public.programacion
-- order by updated_at desc, id desc
-- limit 1;
