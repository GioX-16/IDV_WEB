-- ============================================================
-- IDV_WEB — Esquema Supabase
-- Iglesia del Dios Viviente — Panel Admin + Sitio Público
--
-- CÓMO USARLO:
--   1. Abre tu proyecto en https://supabase.com/dashboard
--   2. Ve a SQL Editor
--   3. Pega TODO este archivo y pulsa "Run"
-- ============================================================

-- ============================================================
-- 1. TABLA: profiles (extiende auth.users)
-- ============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null unique,
  nombre     text not null default '',
  rol        text not null default 'Editor'
             check (rol in ('Administrador', 'Pastor', 'Editor')),
  estado     text not null default 'activo'
             check (estado in ('activo', 'inactivo')),
  created_at timestamptz not null default now()
);

-- Trigger: crea el perfil automáticamente al registrar un usuario en Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. TABLA: actividades
-- ============================================================
create table if not exists public.actividades (
  id          bigint generated always as identity primary key,
  titulo      text not null,
  fecha       date not null,
  hora        time not null,
  descripcion text not null default '',
  estado      text not null default 'activo'
              check (estado in ('activo', 'pendiente', 'cancelado')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 3. TABLA: programacion (una sola fila por programación publicada)
-- ============================================================
create table if not exists public.programacion (
  id            bigint generated always as identity primary key,
  imagen_url    text not null default '',
  nombre_archivo text not null default '',
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null
);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.actividades  enable row level security;
alter table public.programacion enable row level security;

-- --- profiles ---
-- Lectura: solo usuarios autenticados (el dashboard necesita conteos)
drop policy if exists "profiles_select_auth" on public.profiles;
create policy "profiles_select_auth"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Escritura: cada usuario actualiza su propio nombre
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- El INSERT lo maneja el trigger handle_new_user (security definer)

-- --- actividades ---
-- Lectura pública (sitio público sin login)
drop policy if exists "actividades_select_public" on public.actividades;
create policy "actividades_select_public"
  on public.actividades for select
  using (true);

-- Escritura: solo usuarios autenticados
drop policy if exists "actividades_write_auth" on public.actividades;
create policy "actividades_write_auth"
  on public.actividades for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- --- programacion ---
-- Lectura pública (sitio público muestra la imagen sin login)
drop policy if exists "programacion_select_public" on public.programacion;
create policy "programacion_select_public"
  on public.programacion for select
  using (true);

-- Escritura: solo usuarios autenticados
drop policy if exists "programacion_write_auth" on public.programacion;
create policy "programacion_write_auth"
  on public.programacion for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 5. STORAGE BUCKET: programacion (público)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('programacion', 'programacion', true)
on conflict (id) do nothing;

-- Lectura pública del bucket
drop policy if exists "programacion_bucket_read" on storage.objects;
create policy "programacion_bucket_read"
  on storage.objects for select
  using (bucket_id = 'programacion');

-- Escritura: solo usuarios autenticados
drop policy if exists "programacion_bucket_write" on storage.objects;
create policy "programacion_bucket_write"
  on storage.objects for all
  using (bucket_id = 'programacion' and auth.role() = 'authenticated')
  with check (bucket_id = 'programacion' and auth.role() = 'authenticated');

-- ============================================================
-- 6. SEED: actividades iniciales
-- ============================================================
insert into public.actividades (titulo, fecha, hora, descripcion, estado)
values
  ('Culto de Oración',        '2026-07-30', '18:00', 'Culto dedicado a la adoración y oración.', 'activo'),
  ('Culto de Dorcas',         '2026-08-01', '18:00', 'Culto dirigido por mujeres.', 'activo'),
  ('Ayuno Congregacional',    '2026-07-30', '09:00', 'Ayuno para crecimiento espiritual.', 'activo'),
  ('Culto de Jóvenes',        '2026-08-02', '18:00', 'Servicio para jóvenes y adolescentes.', 'pendiente'),
  ('Estudios SEAN',           '2026-07-31', '18:00', 'Estudios sobre la Vida en Cristo.', 'activo'),
  ('Culto Evangelístico',     '2026-08-03', '16:00', 'Culto de adoración y alabanza.', 'activo'),
  ('Escuela Dominical',       '2026-08-03', '09:00', 'Clases para todas las edades.', 'pendiente'),
  ('Reunión de Líderes',      '2026-08-05', '17:00', 'Coordinación de ministerios.', 'cancelado'),
  ('Vigilia de Oración',      '2026-08-08', '22:00', 'Noche de oración y alabanza.', 'pendiente'),
  ('Bautismos',               '2026-08-10', '10:00', 'Celebración de bautismos.', 'pendiente')
on conflict do nothing;

-- ============================================================
-- 7. SEED: usuarios demo (Auth)
-- ============================================================
-- Crea los usuarios directamente en auth.users con contraseñas cifradas.
-- El trigger handle_new_user crea sus perfiles automáticamente.
--
-- Si el INSERT fallara en tu versión de Supabase, no es bloqueante:
-- crea los usuarios desde  Authentication -> Users -> Add user
-- (admin@idv.org.ni/admin123, pastor@idv.org.ni/pastor123, editor@idv.org.ni/editor123)
-- y el trigger creará los perfiles igualmente.

do $$
begin
  begin
    insert into auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, instance_id
    )
    values
      (gen_random_uuid(), 'admin@idv.org.ni', crypt('admin123', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', '{"nombre":"Administrador"}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
      (gen_random_uuid(), 'pastor@idv.org.ni', crypt('pastor123', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', '{"nombre":"Pastor René García"}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
      (gen_random_uuid(), 'editor@idv.org.ni', crypt('editor123', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', '{"nombre":"Editor IDV"}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000')
    on conflict (email) do nothing;
    raise notice 'Usuarios demo creados correctamente.';
  exception when others then
    raise notice 'No se pudieron crear los usuarios por SQL (%). Créalos en Authentication -> Users -> Add user.', sqlerrm;
  end;
end $$;

-- Asignar roles a los usuarios demo
update public.profiles set rol = 'Administrador' where email = 'admin@idv.org.ni';
update public.profiles set rol = 'Pastor'        where email = 'pastor@idv.org.ni';
-- editor@idv.org.ni conserva el rol por defecto: Editor
