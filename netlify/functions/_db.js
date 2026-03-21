const { createClient } = require("@libsql/client");

const requiredEnv = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length) {
  console.error("Faltan variables de entorno de Turso:", missing.join(", "));
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

let schemaPromise = null;

async function ensureSchema() {
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS survey_response_headers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        survey_code TEXT NOT NULL,
        center_code TEXT NOT NULL,
        respondent_email TEXT NOT NULL,
        respondent_name TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        current_question_number INTEGER DEFAULT 1,
        answered_questions_count INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 7,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        submitted_at TEXT,
        UNIQUE(survey_code, center_code, respondent_email)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS survey_response_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        response_header_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        question_number INTEGER NOT NULL,
        self_score INTEGER,
        evidence_text TEXT,
        improvement_actions TEXT,
        tutor_comments TEXT,
        certifier_score INTEGER,
        certifier_observations TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(response_header_id, question_id)
      );
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_survey_headers_lookup
      ON survey_response_headers (survey_code, center_code, respondent_email);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_survey_answers_header
      ON survey_response_answers (response_header_id);
    `);
  })();

  return schemaPromise;
}

module.exports = {
  db,
  ensureSchema
};
