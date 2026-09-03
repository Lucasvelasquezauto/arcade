-- Migración: tabla de récords (scores)
--
-- Fuente de verdad: docs/specs/walking-skeleton.md §5 (modelo de datos) y
-- docs/product-spec.md §8 (sistema de récords). No modificar esta migración
-- sin actualizar esas specs primero.

-- Extensión necesaria para generar UUIDs en el servidor (gen_random_uuid).
-- Supabase la trae habilitada por defecto; "if not exists" la deja segura
-- de re-ejecutar si no lo estuviera.
create extension if not exists pgcrypto;

-- Tabla única de récords, compartida entre todos los juegos del catálogo
-- y entre los tres dispositivos del propietario.
create table if not exists public.scores (
  id         uuid primary key default gen_random_uuid(),
  game_id    text not null check (char_length(game_id) > 0),
  name       text not null check (char_length(name) between 1 and 5),
  score      integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

comment on table public.scores is
  'Récords compartidos entre juegos y dispositivos. Ver docs/specs/walking-skeleton.md §5 y docs/product-spec.md §8.';
comment on column public.scores.game_id is
  'Identificador del juego en el catálogo (p. ej. "space-invaders").';
comment on column public.scores.name is
  'Iniciales del jugador, 1 a 5 caracteres. El alfabeto permitido (qué caracteres) se valida en la spec del shell, no aquí.';
comment on column public.scores.created_at is
  'Fecha del SERVIDOR, nunca del cliente. Forzada por el trigger scores_force_server_defaults incluso si el cliente envía un valor propio.';

-- El servidor es la única fuente de id y created_at: un trigger los
-- sobreescribe siempre en cada INSERT, sin importar qué envíe el cliente.
-- Esto es más fuerte que un simple "default": un default solo aplica si el
-- cliente omite la columna, y aquí no podemos confiar en que la omita.
create or replace function public.scores_force_server_defaults()
returns trigger
language plpgsql
as $$
begin
  new.id := gen_random_uuid();
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists trg_scores_force_server_defaults on public.scores;
create trigger trg_scores_force_server_defaults
  before insert on public.scores
  for each row
  execute function public.scores_force_server_defaults();

-- Índice de acceso: ranking por juego, mejor puntaje primero, desempatado
-- por el registro más reciente (product-spec.md §8: "a igual puntaje, gana
-- el más reciente").
create index if not exists idx_scores_game_score_created
  on public.scores (game_id, score desc, created_at desc);

-- ---------------------------------------------------------------------
-- Políticas de acceso
-- ---------------------------------------------------------------------

alter table public.scores enable row level security;

-- Lectura pública: cualquiera con la URL y la clave anónima puede leer la
-- tabla completa. Riesgo aceptado y documentado en walking-skeleton.md §5
-- (uso privado, sin cuentas de usuario).
drop policy if exists "scores_select_public" on public.scores;
create policy "scores_select_public"
  on public.scores
  for select
  to anon, authenticated
  using (true);

-- Inserción pública: cualquiera puede insertar un récord. No hay cuentas
-- de usuario (product-spec.md §3.4), así que no existe un "autor" contra el
-- que restringir.
drop policy if exists "scores_insert_public" on public.scores;
create policy "scores_insert_public"
  on public.scores
  for insert
  to anon, authenticated
  with check (true);

-- No se crean políticas de UPDATE ni DELETE a propósito. Con row level
-- security activado y sin ninguna política que cubra esas operaciones,
-- ambas quedan denegadas para los roles de cliente (anon, authenticated).
-- Solo el rol de servicio (service_role), que Supabase usa para saltarse
-- RLS, podría corregir un dato a mano desde el panel.

-- ---------------------------------------------------------------------
-- Top 10 por juego, calculado en el servidor
-- ---------------------------------------------------------------------

create or replace function public.get_top_scores(p_game_id text, p_limit integer default 10)
returns setof public.scores
language sql
stable
as $$
  select *
  from public.scores
  where game_id = p_game_id
  order by score desc, created_at desc
  limit greatest(p_limit, 0);
$$;

comment on function public.get_top_scores(text, integer) is
  'Top N (10 por defecto) de récords de un juego, ordenado por puntaje y desempatado por fecha; calculado enteramente en el servidor.';

grant execute on function public.get_top_scores(text, integer) to anon, authenticated;
