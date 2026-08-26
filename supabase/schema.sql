-- ============================================================
-- ESQUEMA: Votación Miss & Mister
-- Ejecutar en Supabase -> SQL Editor
-- ============================================================
-- Nota: pgcrypto ya viene habilitada por defecto en Supabase,
-- no es necesario crearla manualmente.

-- ------------------------------------------------------------
-- 1. CONCURSANTES
-- ------------------------------------------------------------
create table if not exists concursantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null check (categoria in ('miss','mister','cholita','nusta','chasqui')),
  numero int,
  foto_url text,
  activo boolean default true,
  created_at timestamp default now()
);

-- ------------------------------------------------------------
-- 2. CRITERIOS DE EVALUACIÓN
-- ------------------------------------------------------------
create table if not exists criterios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  peso numeric default 1,
  orden int default 0,
  -- NULL significa que el criterio aplica a TODAS las categorías
  categoria text default null check (
    categoria is null or categoria in ('miss','mister','cholita','nusta','chasqui')
  )
);

-- ------------------------------------------------------------
-- 3. VOTOS
-- ------------------------------------------------------------
create table if not exists votos (
  id uuid primary key default gen_random_uuid(),
  juez_id uuid references auth.users(id) not null,
  concursante_id uuid references concursantes(id) on delete cascade not null,
  criterio_id uuid references criterios(id) on delete cascade not null,
  puntaje numeric not null check (puntaje between 0 and 10),
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique (juez_id, concursante_id, criterio_id)
);

-- Trigger para actualizar updated_at en cada cambio de voto
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_votos_updated_at on votos;
create trigger trg_votos_updated_at
  before update on votos
  for each row execute procedure set_updated_at();

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table concursantes enable row level security;
alter table criterios enable row level security;
alter table votos enable row level security;

-- Concursantes: cualquier usuario autenticado puede leer
drop policy if exists "lectura_concursantes" on concursantes;
create policy "lectura_concursantes" on concursantes
  for select using (auth.role() = 'authenticated');

-- Criterios: cualquier usuario autenticado puede leer
drop policy if exists "lectura_criterios" on criterios;
create policy "lectura_criterios" on criterios
  for select using (auth.role() = 'authenticated');

-- Votos: cada jurado solo ve/inserta/actualiza SUS votos
drop policy if exists "jurado_ve_sus_votos" on votos;
create policy "jurado_ve_sus_votos" on votos
  for select using (auth.uid() = juez_id);

drop policy if exists "jurado_inserta_sus_votos" on votos;
create policy "jurado_inserta_sus_votos" on votos
  for insert with check (auth.uid() = juez_id);

drop policy if exists "jurado_actualiza_sus_votos" on votos;
create policy "jurado_actualiza_sus_votos" on votos
  for update using (auth.uid() = juez_id);

-- ------------------------------------------------------------
-- 5. VISTA PÚBLICA DE RESULTADOS (promedios agregados)
--    No expone votos individuales por jurado.
-- ------------------------------------------------------------
create or replace view resultados as
select
  c.id,
  c.nombre,
  c.categoria,
  c.numero,
  c.foto_url,
  round(avg(v.puntaje)::numeric, 2) as promedio,
  count(distinct v.juez_id) as jurados_votaron
from concursantes c
left join votos v on v.concursante_id = c.id
where c.activo = true
group by c.id, c.nombre, c.categoria, c.numero, c.foto_url
order by c.categoria, promedio desc nulls last;

-- La vista hereda RLS del usuario que consulta (security_invoker por defecto
-- en Postgres 15+ vía Supabase). Si tu proyecto no lo aplica automáticamente,
-- descomentá la siguiente línea para forzarlo:
-- alter view resultados set (security_invoker = true);

-- ------------------------------------------------------------
-- 6. DATOS DE EJEMPLO (borrá o editá a gusto)
-- ------------------------------------------------------------

-- Criterios para MISS
insert into criterios (nombre, orden, categoria) values
  ('Pasarela', 1, 'miss'),
  ('Presentación / Porte', 2, 'miss'),
  ('Entrevista', 3, 'miss'),
  ('Simpatía', 4, 'miss')
on conflict do nothing;

-- Criterios para MISTER
insert into criterios (nombre, orden, categoria) values
  ('Pasarela', 1, 'mister'),
  ('Presentación / Porte', 2, 'mister'),
  ('Entrevista', 3, 'mister'),
  ('Simpatía', 4, 'mister')
on conflict do nothing;

-- Criterios para ÑUSTA
insert into criterios (nombre, orden, categoria) values
  ('Baile Tradicional', 1, 'nusta'),
  ('Vestimenta Típica', 2, 'nusta'),
  ('Entrevista', 3, 'nusta'),
  ('Simpatía', 4, 'nusta')
on conflict do nothing;

-- Criterios para CHOLITA
insert into criterios (nombre, orden, categoria) values
  ('Vestimenta Típica', 1, 'cholita'),
  ('Baile', 2, 'cholita'),
  ('Entrevista', 3, 'cholita'),
  ('Simpatía', 4, 'cholita')
on conflict do nothing;

-- Criterios para CHASQUI
insert into criterios (nombre, orden, categoria) values
  ('Presentación / Porte', 1, 'chasqui'),
  ('Baile', 2, 'chasqui'),
  ('Entrevista', 3, 'chasqui'),
  ('Simpatía', 4, 'chasqui')
on conflict do nothing;

insert into concursantes (nombre, categoria, numero) values
  ('Concursante Miss 1', 'miss', 1),
  ('Concursante Miss 2', 'miss', 2),
  ('Concursante Miss 3', 'miss', 3),
  ('Concursante Mister 1', 'mister', 1),
  ('Concursante Mister 2', 'mister', 2),
  ('Concursante Mister 3', 'mister', 3)
on conflict do nothing;

-- ------------------------------------------------------------
-- 7. CREAR LOS 4 JURADOS
-- ------------------------------------------------------------
-- No se hace por SQL. Andá a:
--   Supabase Dashboard -> Authentication -> Users -> Add User
-- y creá un usuario por cada jurado (email + contraseña).
-- "Auto Confirm User" debe quedar activado para que puedan
-- iniciar sesión de inmediato sin verificar email.
-- ============================================================

-- ============================================================
-- 5. PERMISOS PARA LA DATA API
-- ============================================================

grant select
on table public.concursantes
to authenticated;

grant select
on table public.criterios
to authenticated;

grant select, insert, update
on table public.votos
to authenticated;