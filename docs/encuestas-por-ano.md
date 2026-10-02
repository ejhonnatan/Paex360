# Plan de mejora y encuestas por año

Esta versión utiliza **Turso/libSQL (SQLite)**, mediante `netlify/functions/db.js`,
con `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`. No tiene conexión a Supabase.

## Cambios en la base de datos

La primera petición de encuestas o notificaciones después del despliegue aplica
automáticamente una migración aditiva e idempotente:

- `survey_response_headers.survey_year`: entero obligatorio, valor inicial `2026`.
- `survey_response_answers.improvement_plan`: texto obligatorio, inicialmente vacío.
- Índice `idx_survey_headers_year` por centro, año y encuesta.

Las respuestas existentes se asignan a **2026**. No se borran ni se copian entre
años; se conservan sus identificadores, relaciones y documentos adjuntos.
Si los datos históricos corresponden a otro período, hay que revisar su asignación
antes de usar la nueva versión. No se deduce el período de la fecha de modificación.

Para preparar manualmente una base que todavía no tenga estas columnas, el SQL
equivalente es:

```sql
ALTER TABLE survey_response_headers
  ADD COLUMN survey_year INTEGER NOT NULL DEFAULT 2026;
ALTER TABLE survey_response_answers
  ADD COLUMN improvement_plan TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_survey_headers_year
  ON survey_response_headers(center_code, survey_year, survey_code);
```

No repetir los `ALTER TABLE` si las columnas ya existen. La aplicación comprueba
`PRAGMA table_info` antes de aplicarlos y tolera migraciones simultáneas de varias
funciones. El token configurado debe permitir cambios de esquema, como ocurre
con las tablas de notificaciones y presencia que la aplicación ya crea.

## Separación anual

Todos los ámbitos utilizan el mismo formulario y reciben `year` en las llamadas
de lectura, guardado, carga de adjuntos, finalización y colaboración. El dashboard
online y el listado de documentos de encuesta filtran por ese año. Los documentos
de referencia del centro siguen siendo comunes; los archivos subidos a una encuesta
pertenecen al año de su respuesta.

Para conservar la restricción única histórica
`(survey_code, center_code, respondent_email)` sin reconstruir tablas ni tocar
claves externas, las claves almacenadas de 2026 mantienen su código original.
Los otros años usan una clave como `paex360-ambito1@2027`. El campo `survey_year`
contiene el año real. Las API devuelven el código público `paex360-ambito1` y `year`.
Las integraciones SQL externas deben filtrar por `survey_year` y, si comparan el
código del ámbito, tener en cuenta ese sufijo. El informe Power BI externo no se
modifica automáticamente; este cambio afecta al dashboard online de esta aplicación.

Las peticiones antiguas sin año siguen usando 2026. Las notificaciones muestran
eventos de todos los años y enlazan al ámbito, pregunta y año del evento.
La presencia y los conflictos de edición se separan por año.

El selector ofrece desde 2026 hasta dos años posteriores al actual. Un año válido
en el enlace también se incluye. La API acepta años enteros de 2026 a 2100.
Al cambiar de año o ámbito se guarda la pregunta anterior primero; si falla o hay
un conflicto pendiente, se conserva el período anterior. Durante la carga de
archivos no se permite cambiar de período.

## Verificación

```text
node --experimental-vm-modules --test tests/survey-concurrency.test.js
```

Las pruebas usan SQLite local y las funciones reales con autenticación simulada.
Cubren migración sin pérdida de datos, seis ámbitos, separación anual de respuestas,
planes, adjuntos, dashboard, presencia, notificaciones, conflictos y cambios de año
con un guardado pendiente. No confirman el despliegue ni la migración en producción.
