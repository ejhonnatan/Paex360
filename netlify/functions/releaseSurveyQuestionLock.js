const { getDb } = require("./db");

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

    if (!surveyCode || !center || !email || !questionId) {
      return json(400, { error: "surveyCode, center, email y questionId son obligatorios" });
    }

    const db = getDb();

    await db.execute({
      sql: `
        DELETE FROM survey_question_locks
        WHERE survey_code = ?
          AND center_code = ?
          AND question_id = ?
          AND locked_by_email = ?
      `,
      args: [surveyCode, center, questionId, email]
    });

    return json(200, { ok: true, released: true });
  } catch (error) {
    console.error("releaseSurveyQuestionLock error:", error);
    return json(500, { error: "Error liberando bloqueo", detail: error.message || String(error) });
  }
};
