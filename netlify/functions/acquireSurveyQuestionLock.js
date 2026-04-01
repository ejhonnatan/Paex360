const { getDb } = require("./db");

const LOCK_WINDOW_MINUTES = 2;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });

    const body = JSON.parse(event.body || "{}");
    const surveyCode = String(body.surveyCode || "").trim();
    const center = String(body.center || "").trim().toLowerCase();
    const email = String(body.email || "").trim().toLowerCase();
    const questionId = Number(body.questionId || 0);
    const questionNumber = Number(body.questionNumber || 0);

    if (!surveyCode || !center || !email || !questionId) {
      return json(400, { error: "surveyCode, center, email y questionId son obligatorios" });
    }

    const db = getDb();

    await db.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS survey_question_locks (
          survey_code TEXT NOT NULL,
          center_code TEXT NOT NULL,
          question_id INTEGER NOT NULL,
          question_number INTEGER,
          locked_by_email TEXT NOT NULL,
          locked_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (survey_code, center_code, question_id)
        )
      `,
      args: []
    });

    await db.execute({
      sql: `
        DELETE FROM survey_question_locks
        WHERE updated_at < datetime('now', '-' || ? || ' minutes')
      `,
      args: [LOCK_WINDOW_MINUTES]
    });

    await db.execute({
      sql: `
        INSERT INTO survey_question_locks (
          survey_code, center_code, question_id, question_number, locked_by_email, locked_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(survey_code, center_code, question_id)
        DO UPDATE SET
          locked_by_email = excluded.locked_by_email,
          question_number = excluded.question_number,
          updated_at = CURRENT_TIMESTAMP
        WHERE survey_question_locks.locked_by_email = excluded.locked_by_email
           OR survey_question_locks.updated_at < datetime('now', '-' || ? || ' minutes')
      `,
      args: [surveyCode, center, questionId, questionNumber || null, email, LOCK_WINDOW_MINUTES]
    });

    const result = await db.execute({
      sql: `
        SELECT locked_by_email, updated_at
        FROM survey_question_locks
        WHERE survey_code = ? AND center_code = ? AND question_id = ?
        LIMIT 1
      `,
      args: [surveyCode, center, questionId]
    });

    const row = result.rows[0];
    const ownerEmail = String(row?.locked_by_email || "").toLowerCase();
    const isOwner = ownerEmail === email;

    return json(200, {
      ok: true,
      locked: !isOwner,
      ownerEmail: row?.locked_by_email || null,
      updatedAt: row?.updated_at || null,
      questionId
    });
  } catch (error) {
    console.error("acquireSurveyQuestionLock error:", error);
    return json(500, { error: "Error adquiriendo bloqueo", detail: error.message || String(error) });
  }
};
