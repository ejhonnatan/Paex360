const { getDb } = require("./db");
const migrations = new WeakMap();
const LEGACY_YEAR = 2026;

function surveyYear(value) {
  const year = Number(value ?? LEGACY_YEAR);
  if (!Number.isInteger(year) || year < 2026 || year > 2100) {
    const error = new Error("El año debe estar entre 2026 y 2100.");
    error.statusCode = 400; throw error;
  }
  return year;
}
function storageCode(code, year) {
  // Keep historical keys and foreign keys intact, including the old unique constraint.
  const canonical = String(code || "").trim().replace(/@\d{4}$/, "");
  return canonical && year !== LEGACY_YEAR ? `${canonical}@${year}` : canonical;
}
async function addColumn(db, table, column, definition) {
  const columns = await db.execute(`PRAGMA table_info(${table})`);
  if (columns.rows.some(row => row.name === column)) return;
  try { await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`); }
  catch (error) {
    // Another cold function may have applied the same additive migration.
    const current = await db.execute(`PRAGMA table_info(${table})`);
    if (!current.rows.some(row => row.name === column)) throw error;
  }
}
async function ensureSurveyYears(db) {
  if (!migrations.has(db)) {
    const migration = (async () => {
      await addColumn(db, "survey_response_headers", "survey_year", "INTEGER NOT NULL DEFAULT 2026");
      await addColumn(db, "survey_response_answers", "improvement_plan", "TEXT NOT NULL DEFAULT ''");
      await db.execute("CREATE INDEX IF NOT EXISTS idx_survey_headers_year ON survey_response_headers(center_code, survey_year, survey_code)");
    })();
    migrations.set(db, migration);
    migration.catch(() => migrations.delete(db));
  }
  return migrations.get(db);
}
function publicRows(value) {
  if (Array.isArray(value)) return value.map(publicRows);
  if (!value || typeof value !== "object") return value;
  const out = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, publicRows(item)]));
  for (const key of ["survey_code", "surveyCode"]) {
    if (typeof out[key] !== "string" || !out[key]) continue;
    const match = out[key].match(/@(\d{4})$/);
    out.year = Number(out.survey_year ?? match?.[1] ?? out.year ?? LEGACY_YEAR);
    out[key] = out[key].replace(/@\d{4}$/, "");
  }
  return out;
}
function withSurveyYear(handler) {
  return async event => {
    try {
      const body = event.httpMethod === "POST" ? JSON.parse(event.body || "{}") : null;
      const params = {...event.queryStringParameters};
      const year = surveyYear(body?.year ?? params.year ?? event.surveyYear);
      if (body?.surveyCode) body.surveyCode = storageCode(body.surveyCode, year);
      if (params.surveyCode) params.surveyCode = storageCode(params.surveyCode, year);
      if (body) body.year = year;
      params.year = year;
      await ensureSurveyYears(getDb());
      const result = await handler({...event, surveyYear:year, queryStringParameters:params,
        ...(body ? {body:JSON.stringify(body)} : {})});
      return {...result, body:JSON.stringify(publicRows(JSON.parse(result.body)))};
    } catch(error) {
      return {statusCode:error.statusCode || 500, headers:{"Content-Type":"application/json","Cache-Control":"no-store"},
        body:JSON.stringify({error:"No se pudo acceder a la encuesta del año seleccionado",detail:error.message})};
    }
  };
}
module.exports = { surveyYear, storageCode, ensureSurveyYears, publicRows, withSurveyYear };
