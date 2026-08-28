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
  ('Simpatia', 1, 'miss'),
  ('Belleza / presencia', 2, 'miss'),
  ('Carisma', 3, 'miss'),
  ('Desenvolmiento en pasarela', 4, 'miss'),
  ('Vestuario', 5, 'miss'),
  ('Conocimiento General', 6, 'miss'),
  ('Puntualidad', 7, 'miss')
on conflict do nothing;

-- Criterios para MISTER
insert into criterios (nombre, orden, categoria) values
  ('Simpatia', 1, 'mister'),
  ('Belleza / presencia', 2, 'mister'),
  ('Carisma', 3, 'mister'),
  ('Desenvolmiento en pasarela', 4, 'mister'),
  ('Vestuario', 5, 'mister'),
  ('Conocimiento General', 6, 'mister'),
  ('Puntualidad', 7, 'mister')
on conflict do nothing;

-- Criterios para ÑUSTA
insert into criterios (nombre, orden, categoria) values
  ('Belleza / presencia', 1, 'nusta'),
  ('Vestuario', 2, 'nusta'),
  ('Coreografia / danza', 3, 'nusta'),
  ('Originalidad', 4, 'nusta'),
  ('Conocimientos Generales', 5, 'nusta'),
  ('Puntualidad', 6, 'nusta')
on conflict do nothing;

-- Criterios para CHOLITA
insert into criterios (nombre, orden, categoria) values
  ('Simpatia', 1, 'cholita'),
  ('Belleza / presencia', 2, 'cholita'),
  ('Carisma', 3, 'cholita'),
  ('Desenvolmiento en pasarela', 4, 'cholita'),
  ('Vestuario', 5, 'cholita'),
  ('Conocimiento General', 6, 'cholita'),
  ('Puntualidad', 7, 'cholita')
on conflict do nothing;

-- Criterios para CHASQUI
insert into criterios (nombre, orden, categoria) values
  ('Presencia y desenvolmiento', 1, 'chasqui'),
  ('Vestuario e identidad cultural', 2, 'chasqui'),
  ('Carisma', 3, 'chasqui'),
  ('Originalidad', 4, 'chasqui'),
  ('Conocimientos generales', 5, 'chasqui'),
  ('Puntualidad', 5, 'chasqui')
on conflict do nothing;

insert into concursantes (nombre, categoria, numero) values
-- Miss
  ('ARACELY HERREA CANSAYA', 'miss', 1),
  ('CAMILA VIVIANA GUTIERREZ ALI', 'miss', 2),
  ('GISEL ARIANA YANIQUE SUXO', 'miss', 3),
  ('LEYDI QUISPE ALTARIMANO', 'miss', 4),
  ('FABIOLA KUNO LAURA', 'miss', 5),
  ('KEYNER BRIANA CONDO SUXO', 'miss', 6),
  ('MARY LUZ MAMANI MAMANI', 'miss', 7),
  ('EVELIN WARA CONDORI MACHACA', 'miss', 8),
  ('LINETH ALVELUZ HUANCA QUISPE', 'miss', 9),
  ('MISHEL KAROLAIN MAMANI CALLE', 'miss', 10),
  ('BRISSA CELESTE SORIA TAPIA', 'miss', 11),
  ('PAOLA ANDREA RIOS PACO', 'miss', 12),
  ('PAMELA APAZA CALLIZAYA', 'miss', 13),
  ('YURI POMA CORI', 'miss', 14),
  ('NIKAELA NAZARET QUISPE MAMANI', 'miss', 15),
  ('DIRLY JHOANA SUXO AGUILAR', 'miss', 16),
  ('MARICEL ESTER YUPANQUI CERDA', 'miss', 17),
  ('ELIZABETH DEYSI ALAVI OSCORI', 'miss', 18),
  ('VIVIAN JHOSELIN MENCIAS COPA', 'miss', 19),
  ('SHIOMARA AGOR CASAS VILLCA', 'miss', 20),
  -- Mister
  ('PABLO FERNANDO SUXO TOLA', 'mister', 1),
  ('ZAIRO MAMANI TICONA', 'mister', 2),
  ('JHON ERICK CHINO MARQUEZ', 'mister', 3),
  ('RIZ ALARCON IBAÑEZ', 'mister', 4),
  ('RODRIGO CARLOS BELTRAN CHAMBILLA', 'mister', 5),
  ('ENRIQUE GIOVANI SOTO HUAYCHO', 'mister', 6),
  ('AMERICO SOLARI CONDORI', 'mister', 7),
  ('GERALD LEBY DE LA CRUZ MAMANI', 'mister', 8),
  ('CRISTHIAN ZENON ESCOBAR QUISPE', 'mister', 9),
  ('BRAYAN MAMANI ROJAS', 'mister', 10),
  ('MARCOS QUISPE CONDORI', 'mister', 11),
  ('ARIEL JIMMY ARRATIA ALEJO', 'mister', 12),
  ('FERNANDO ESCOBAR QUENTA', 'mister', 13),
  ('MARCELO JHON MAMANI VARGAS', 'mister', 14),
  ('LIMBER MAMANI POMA', 'mister', 15),
  ('SANDER LUNA APAZA', 'mister', 16),
  ('JUAN MARCELO CHARCA LIMACHI', 'mister', 17),
  ('JHOEL ALBERT PAUCARA Z', 'mister', 18),
  ('KEVIN ALDO MAMANI TELLEZ', 'mister', 19),
  ('EYDAN NUÑEZ ACHO', 'mister', 20),
  ('JHON WILLIAM LOZA MAMANI', 'mister', 21),
  -- Nusta
  ('LUZ PILAR BERNABE QUISPE', 'nusta', 1),
  ('YODALIN KATIA MAMANI QUISPE', 'nusta', 2),
  ('YOSELYN QUISPE QUISPE', 'nusta', 3),
  ('ABIGAIL ZOE MENDOZA PATTY', 'nusta', 4),
  ('INGRID CHAVEZ ROJAS', 'nusta', 5),
  ('MILAGROS LIBERTAD VIRGINIA BUSTAMANTE', 'nusta', 6),
  ('ALEXANDRA MIKAELA HUARANCA SAN MILLAN', 'nusta', 7),
  ('LEINA IRIS TANCARA GARCIA', 'nusta', 8),
  ('HEIDY CHOQUETOPA CHEKA', 'nusta', 9),
  ('JESICA HUANCA CONDORI', 'nusta', 10),
  ('JAZMIN MAMANI HUMEREZ', 'nusta', 11),
  ('PAOLA ALEJANDRA CHOQUE PARDO', 'nusta', 12),
  ('MAYA NILDA MOLLO CRUZ', 'nusta', 13),
  ('ROSA QUISPE NINA', 'nusta', 14),
  ('LORENA TRILLO SANCHEZ', 'nusta', 15),
  ('MAGDALENA QUISPE ALLCA', 'nusta', 16),
  ('ESTEFANI RODRIGUEZ QUISPE', 'nusta', 17),
  ('AVRIL VARGAS CONDORI', 'nusta', 18),
  ('ARLYMES NORIE PARI TICONA', 'nusta', 19),
  ('MARIEL PAOLA ESCOBAR CAPCHA', 'nusta', 20),
  ('MARIA ELENA MAMANI CARITA', 'nusta', 21),
  -- Cholita
  ('HONELY YOMAIRA QUENTA', 'cholita', 1),
  ('YULY EVELIN VENTURA ALANOCA', 'cholita', 2),
  ('CARMEN JESICA SULLCA LOPEZ', 'cholita', 3),
  ('ALBANY MAGDIEL MENDOZA TERRAZAS', 'cholita', 4),
  ('JHINATA MAYUMI CUTILE ALVAREZ', 'cholita', 5),
  ('MARIA LIZ QUISPE CONDORI', 'cholita', 6),
  ('SOLEDAD CHUI TICONA', 'cholita', 7),
  ('MAGALY NILDY PAZ MAMANI', 'cholita', 8),
  ('ROSMELIA SARZURI VINO', 'cholita', 9),
  ('NOELIA PAMELA CHIRI TOZOLA', 'cholita', 10),
  ('JHUSCETT BIANCA LOPEZ HUARICOLLO', 'cholita', 11),
  ('MAYUMI MARTHA CHURA HILARI', 'cholita', 12),
  ('CAMILA VARGAS APAZA', 'cholita', 13),
  ('MADELEN AYLIN GUTIERREZ CALLISAYA', 'cholita', 14),
  ('ABIGAIL WENDY HUARAHUARA ALI', 'cholita', 15),
  ('ADRIANA BELEN QUISPE HILARI', 'cholita', 16),
  ('MELANY HILARI MAMANI', 'cholita', 17),
  ('MARITZA CONDORI URUCHI', 'cholita', 18),
  ('VANIA PAOLA YANA QUISBERT', 'cholita', 19),
  ('NILDA OLIVIA HUAYGUA APAZA', 'cholita', 20),
  ('SANDY MARILYN ALANOCA MAMANI', 'cholita', 21),
  ('DANIELA ARACELY POBLETE VELAZQUES', 'cholita', 22),
  -- Chasqui
  ('DANIEL APAZA TUMIRI', 'chasqui', 1),
  ('VIDAL JUAN HUARACHI VILLCA', 'chasqui', 2),
  ('AMILCAR JOEL CALLISAYA MAMANI', 'chasqui', 3),
  ('XAVIER CARLOS TUYUKI AVERANGA PARISACA', 'chasqui', 4),
  ('DENILSON KEVIN CONDORI ARIAS', 'chasqui', 5),
  ('ARMIN VLADIMIR VARGAS CONDORI', 'chasqui', 6),
  ('ALEJANDRO FELIPE MAMANI BUTRON', 'chasqui', 7),
  ('JUAN JOSE CONDORI SALAZAR', 'chasqui', 8),
  ('ADEMAR CALLISAYA RAMOS', 'chasqui', 9),
  ('MIGUEL ANGEL POMA HUANCA', 'chasqui', 10),
  ('ROBERTO CARLOS CONDORI VILLCA', 'chasqui', 11),
  ('MIGUEL ANGEL MAYTA MARTINEZ', 'chasqui', 12),
  ('JHON MARCOS BLANCO MAMANI', 'chasqui', 13),
  ('LEONEL GIOVANI NUÑEZ VILLCA', 'chasqui', 14),
  ('RUBEN DAYNOR PACHECO CASTRO', 'chasqui', 15),
  ('HENRRY RONALD LEYVA HUAYCHO', 'chasqui', 16),
  ('JUAN LIZANDRO YUJRA SOLORZANO', 'chasqui', 17),
  ('JHON MICHAEL ALANOCA SULLCATA', 'chasqui', 18),
  ('CARLOS MARCA BAUTISTA', 'chasqui', 19),
  ('EDWIN CHACON MOLLOSTOCA', 'chasqui', 20),
  ('ARVIN JOSUE CHIPANA LEON', 'chasqui', 21),
  ('CHISTIAN CHOQUE CHOQUE', 'chasqui', 22),
  ('AMERICO SALARIO CONDORI ', 23)
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

grant select
on table public.resultados
to authenticated;