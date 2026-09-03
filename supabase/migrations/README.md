# Cómo aplicar esta migración desde el panel de Supabase

Estos pasos no requieren instalar nada ni usar la terminal. Se hacen enteramente
desde el navegador, en el panel web de Supabase (supabase.com/dashboard).

1. Entra al panel de Supabase y abre el proyecto del arcade (el que se decidió
   en el prerrequisito #2 de `docs/specs/walking-skeleton.md`).
2. En el menú de la izquierda, busca **SQL Editor** (ícono de una hoja con
   `>_`) y haz clic ahí.
3. Haz clic en **New query** (arriba a la derecha).
4. Abre el archivo `20260903193452_create_scores.sql` que está en esta misma
   carpeta, selecciona todo su contenido y cópialo.
5. Pega ese contenido completo en el cuadro del SQL Editor de Supabase (borra
   cualquier texto que haya quedado ahí por defecto).
6. Haz clic en **Run** (o el botón ▶, abajo a la derecha del cuadro).
7. Debe aparecer un mensaje de éxito ("Success. No rows returned"). Si aparece
   algo en rojo, copia el mensaje de error completo y compártelo antes de
   volver a intentar — no lo ejecutes una segunda vez sin revisarlo.

## Cómo confirmar que quedó bien

Sin salir del SQL Editor:

1. En el menú de la izquierda, entra a **Table Editor**. Debe aparecer una
   tabla llamada `scores` con las columnas `id`, `game_id`, `name`, `score` y
   `created_at`.
2. Vuelve al **SQL Editor**, abre una consulta nueva, y pega esto para
   comprobar que las políticas quedaron activas:

   ```sql
   select tablename, rowsecurity from pg_tables where tablename = 'scores';
   ```

   La columna `rowsecurity` debe decir `true`.

3. Prueba insertar un récord de prueba y leerlo de vuelta:

   ```sql
   insert into public.scores (game_id, name, score) values ('test-pattern', 'LUCAS', 100);

   select * from public.get_top_scores('test-pattern');
   ```

   Debe devolver la fila que acabas de insertar, con un `id` y un `created_at`
   generados automáticamente (no los que tú escribiste, porque no escribiste
   ninguno — eso es justamente lo que se está verificando).

4. Cuando termines de probar, puedes borrar el registro de prueba desde el
   **Table Editor** (ahí sí puedes borrar filas, porque el panel de Supabase
   usa una llave con permisos completos; la app real nunca podrá hacerlo).

## Si algo sale mal

- Si el error dice algo sobre `pgcrypto` o `gen_random_uuid`, es casi seguro
  que la extensión no estaba habilitada; repite el paso 6, la migración
  vuelve a intentar habilitarla.
- Si el error dice que `scores` ya existe, es que esta migración (u otra
  parecida) ya se aplicó antes. No la vuelvas a correr sin revisar primero
  qué tiene la tabla actual, para no perder datos.
- Esta migración no borra nada si se vuelve a ejecutar por accidente en un
  proyecto donde la tabla ya existe con esta misma estructura: usa `if not
  exists` y `create or replace` en todas partes. Sí fallaría (sin borrar
  nada) si la tabla existe con una estructura distinta.

## Qué NO hace este README

No conecta la app con Supabase (eso son la URL y la clave anónima del
proyecto, que van en `.env.local` y nunca se versionan — prerrequisito #3 de
`docs/specs/walking-skeleton.md`). Este README solo cubre la base de datos.

## SUPUESTOS

Decisiones que tomé por ambigüedad de la spec, para que Lucas las revise
antes de aplicar la migración:

1. **Alfabeto de `name` no se valida en la base de datos.** La spec solo fija
   el largo (1–5 caracteres). El "alfabeto permitido" para el ingreso de
   nombre se menciona como definido en la spec del shell (product-spec.md
   §8), así que asumí que ese filtro de caracteres vive en la app, no en la
   base de datos. Si se quiere blindar también a nivel de base de datos (por
   ejemplo, restringir a mayúsculas A–Z), falta una spec de shell que lo
   defina.
2. **`game_id` es texto libre, sin lista fija de valores.** El catálogo de
   juegos vive en código (`packages/catalog`), no en la base de datos, así
   que no hay una tabla de juegos contra la cual poner una llave foránea. Solo
   validé que no esté vacío.
3. **Top 10 como función, no como vista.** La spec permite "una vista o
   función". Elegí función (`get_top_scores(game_id, limit)`) porque el top
   10 es *por juego*, y una función parametrizable evita tener que filtrar
   una vista grande desde el cliente. Devuelve todas las columnas de
   `scores`.
4. **`score` se valida como `>= 0` pero no tiene tope superior.** La spec no
   menciona un máximo; cada juego podría tener su propio techo de puntaje
   posible, y eso vive en la spec de cada juego, no en esta tabla compartida.
5. **No se agregó una tabla ni un catálogo de juegos en la base de datos.**
   Coherente con que el catálogo es "una lista declarativa" en código
   (product-spec.md §3.3), no en Supabase.
