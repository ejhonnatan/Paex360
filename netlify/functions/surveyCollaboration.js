const { ANSWER_FIELDS } = require("./surveyNotifications");
const KEYS = Object.keys(ANSWER_FIELDS);
function normalizedAnswer(row = {}) {
  return Object.fromEntries(KEYS.map(key => [key, row[ANSWER_FIELDS[key][0]] ?? (key.endsWith("Score") ? null : "")]));
}
function normalizeValue(key, value) {
  return key.endsWith("Score") ? (value == null ? null : Number(value)) : String(value ?? "");
}
function mergeCollaborativeAnswer(previous, answer, base, fields) {
  if (!base || Array.isArray(base) || typeof base !== "object" ||
      !KEYS.every(key => key === "improvementPlan" || Object.hasOwn(base, key)) || !Array.isArray(fields) ||
      fields.some(key => !KEYS.includes(key)) || new Set(fields).size !== fields.length) {
    const error = new Error("Recarga la encuesta antes de guardar los cambios compartidos.");
    error.statusCode = 400; throw error;
  }
  const current = previous ? normalizedAnswer(previous) : Object.fromEntries(KEYS.map(key => [key, normalizeValue(key, base[key])]));
  const conflicts = fields.filter(key => normalizeValue(key, current[key]) !== normalizeValue(key, base[key]) &&
    normalizeValue(key, current[key]) !== normalizeValue(key, answer[key]));
  if (conflicts.length) {
    const error = new Error("Otro usuario modificó los mismos campos. Tus cambios siguen en pantalla; elige qué versión conservar.");
    error.statusCode = 409; error.conflicts = conflicts; error.currentAnswer = current; throw error;
  }
  return { ...current, ...Object.fromEntries(fields.map(key => [key, normalizeValue(key, answer[key])])) };
}
async function ensurePresence(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS survey_presence (
    center_code TEXT NOT NULL, survey_code TEXT NOT NULL, session_id TEXT NOT NULL,
    user_email TEXT NOT NULL, user_name TEXT NOT NULL DEFAULT '',
    question_id INTEGER NOT NULL, question_number INTEGER NOT NULL,
    active_field TEXT NOT NULL DEFAULT '', is_editing INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(center_code, survey_code, session_id)
  )`);
}
module.exports = { KEYS, normalizedAnswer, mergeCollaborativeAnswer, ensurePresence };
