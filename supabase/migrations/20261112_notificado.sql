-- ============================================================
-- IDV_WEB — Migración: estado de notificación de los avisos
-- Fecha: 2026-11-12
--
-- Aplicar en Supabase → SQL Editor (una sola vez).
-- Es idempotente: puede ejecutarse más de una vez sin errores.
--
-- Qué añade:
--   1. La columna avisos.notificado_at: fecha en la que el aviso se
--      marcó como notificado a los hermanos por WhatsApp.
--   2. Un índice parcial para localizar rápido los avisos pendientes
--      de notificar.
--   3. Un trigger que impide que alguien que NO sea Administrador
--      escriba en notificado_at. La regla queda garantizada por la
--      base de datos, no solo por la interfaz.
--
-- Nota: el panel de administración detecta si esta columna existe.
-- Si la migración no se aplica, el panel sigue funcionando igual
-- (simplemente no muestra la columna "Notificado").
-- ============================================================

-- ------------------------------------------------------------
-- 1. COLUMNA notificado_at
-- ------------------------------------------------------------
alter table public.avisos
  add column if not exists notificado_at timestamptz;

comment on column public.avisos.notificado_at is
  'Fecha en que el aviso fue marcado como notificado a los hermanos por WhatsApp.';

-- ------------------------------------------------------------
-- 2. ÍNDICE DE AVISOS PENDIENTES DE NOTIFICAR
-- ------------------------------------------------------------
create index if not exists avisos_sin_notificar_idx
  on public.avisos (fecha_publicacion desc)
  where notificado_at is null;

-- ------------------------------------------------------------
-- 3. GUARDIA DE ROL (solo Administrador escribe notificado_at)
-- ------------------------------------------------------------
create or replace function public.guard_notificado_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text;
begin
  -- Si el valor no cambió, no hay nada que validar.
  if new.notificado_at is not distinct from old.notificado_at then
    return new;
  end if;

  select p.rol into v_rol
  from public.profiles p
  where p.id = auth.uid();

  -- coalesce hace que un usuario sin perfil quede bloqueado
  -- (fail closed): solo un Administrador puede cambiar el estado.
  if coalesce(v_rol, '') <> 'Administrador' then
    raise exception
      'Solo el rol Administrador puede cambiar el estado de notificacion de un aviso.';
  end if;

  return new;
end;
$$;

drop trigger if exists avisos_guard_notificado on public.avisos;
create trigger avisos_guard_notificado
  before update on public.avisos
  for each row execute function public.guard_notificado_at();

-- ------------------------------------------------------------
-- VERIFICACIÓN (ejecutar por separado si se desea)
-- ------------------------------------------------------------
-- select id, titulo, estado, notificado_at
-- from public.avisos
-- order by fecha_publicacion desc;
--
-- select count(*) as pendientes_de_notificar
-- from public.avisos
-- where notificado_at is null;
