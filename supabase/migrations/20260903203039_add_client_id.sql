-- Migración: agrega client_id a scores
--
-- Fuente de verdad: docs/specs/walking-skeleton.md §5 v1.1 (modelo de datos) y
-- docs/specs/core.md §8.2 (idempotencia de la cola de récords). No modificar
-- la migración 20260903193452_create_scores.sql: una migración es un hecho
-- histórico, no un documento editable. Esta migración es aparte y aditiva.

-- client_id: identificador generado por el CLIENTE, no por el servidor. Es la
-- clave de idempotencia: un reintento tras una respuesta de red perdida
-- reenvía el mismo client_id, y la restricción de unicidad de abajo hace que
-- el reintento no cree un récord duplicado.
--
-- Nullable por ahora: la tabla puede tener filas existentes (por ejemplo, un
-- registro de prueba insertado al verificar la migración anterior) que nunca
-- tuvieron client_id. No hay forma de reconstruir ese valor retroactivamente,
-- así que no se puede exigir NOT NULL sin antes purgar o inventar datos.
-- SUPUESTO: se deja nullable en el esquema; el cliente real (walking-skeleton
-- §5) siempre debe enviarlo, pero la base de datos no puede hacer cumplir esa
-- garantía sin perder filas preexistentes.
alter table public.scores
  add column if not exists client_id uuid;

comment on column public.scores.client_id is
  'Idempotencia: generado por el CLIENTE antes de insertar. Un reintento tras una respuesta de red perdida reenvía el mismo client_id; la restricción de unicidad evita el duplicado. Ver docs/specs/core.md §8.2.';

-- Restricción de unicidad. Se permite más de un NULL (comportamiento estándar
-- de un índice único en Postgres: NULL nunca es igual a NULL), lo cual es
-- correcto aquí: las filas preexistentes sin client_id no deben chocar entre
-- sí ni bloquear la primera fila real que sí lo traiga.
create unique index if not exists idx_scores_client_id
  on public.scores (client_id);

-- El trigger scores_force_server_defaults sobrescribe id y created_at en cada
-- INSERT, pero nunca tocó client_id (no estaba entre los campos que
-- reasigna), así que client_id ya viaja intacto desde el cliente sin
-- necesidad de tocar la función. Se deja constancia explícita de esto porque
-- es la razón de ser de esta migración: si en el futuro alguien "completa" el
-- trigger para forzar más columnas, NO debe incluir client_id.
