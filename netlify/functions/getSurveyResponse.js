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

    const headerResult = await db.execute({
      sql: `
        SELECT
          id,
          survey_code,
          center_code,
          respondent_email,
          respondent_name,
          status,
          current_question_number,
          answered_questions_count,
          total_questions,
          created_at,
          updated_at,
          submitted_at
        FROM survey_response_headers
        WHERE survey_code = ? AND center_code = ? AND respondent_email = ?
        LIMIT 1
      `,
      args: [surveyCode, center, email]
    });

    if (!headerResult.rows.length) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exists: false,
          header: null,
          answers: []
        })
      };
    }

    const header = headerResult.rows[0];

    const answersResult = await db.execute({
      sql: `
        SELECT
          question_id,
          question_number,
          self_score,
          evidence_text,
          improvement_actions,
          tutor_comments,
          certifier_score,
          certifier_observations,
          created_at,
          updated_at
        FROM survey_response_answers
        WHERE response_header_id = ?
        ORDER BY question_number
      `,
      args: [header.id]
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        exists: true,
        header,
        answers: answersResult.rows
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Error obteniendo respuestas de la encuesta",
        detail: error.message
      })
    };
  }
};