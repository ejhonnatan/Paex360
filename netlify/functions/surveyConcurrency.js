const LOCK_MINUTES = 2;
const { ensurePresence } = require("./surveyCollaboration");
const { ensureNotifications } = require("./surveyNotifications");

async function ensureQuestionLocks(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS survey_question_locks (
    survey_code TEXT NOT NULL, center_code TEXT NOT NULL,
    question_id INTEGER NOT NULL, question_number INTEGER,
    locked_by_email TEXT NOT NULL, locked_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (survey_code, center_code, question_id)
  )`);
}

async function withSurveyTransaction(db, callback) {
  await ensureQuestionLocks(db);
  await ensureNotifications(db);
  await ensurePresence(db);
  const tx = await db.transaction("write");
  try {
    const result = await callback(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}

async function requireQuestionOwner(db, surveyCode, center, questionId, email) {
  const collaborators = await db.execute({
    sql:`SELECT user_email FROM survey_presence WHERE survey_code = ? AND center_code = ?
      AND question_id = ? AND user_email <> ? AND updated_at >= datetime('now', '-45 seconds') LIMIT 1`,
    args:[surveyCode, center, questionId, email]
  });
  if (collaborators.rows.length) {
    const error = new Error("Esta encuesta usa edición compartida. Recarga la página para guardar sin sobrescribir cambios ajenos.");
    error.statusCode = 423; throw error;
  }
  const result = await db.execute({
    sql: `UPDATE survey_question_locks SET updated_at = CURRENT_TIMESTAMP
      WHERE survey_code = ? AND center_code = ? AND question_id = ?
      AND locked_by_email = ?
      AND updated_at >= datetime('now', '-' || ? || ' minutes')`,
    args: [surveyCode, center, questionId, email, LOCK_MINUTES]
  });
  if (result.rowsAffected !== 1) {
    const error = new Error("La pregunta está siendo editada por otro usuario o el bloqueo ha caducado. Vuelve a entrar en la pregunta antes de guardar.");
    error.statusCode = 423;
    throw error;
  }
}

module.exports = { LOCK_MINUTES, withSurveyTransaction, requireQuestionOwner };
