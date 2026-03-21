const { getDb } = require("./db");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const surveyCode = String(body.surveyCode || "").trim();
    const center = String(body.center || "").trim().toLowerCase();
    const email = String(body.email || "").trim().toLowerCase();

    if (!surveyCode || !center || !email) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "surveyCode, center y email son obligatorios" })
      };
    }

    const db = getDb();

    await db.execute({
      sql: `
        UPDATE survey_response_headers
        SET
          status = 'submitted',
          submitted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE survey_code = ? AND center_code = ? AND respondent_email = ?
      `,
      args: [surveyCode, center, email]
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        message: "Encuesta finalizada correctamente"
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Error finalizando encuesta",
        detail: error.message
      })
    };
  }
};