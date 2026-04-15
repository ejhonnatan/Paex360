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
    const respondentName = String(body.respondentName || "").trim();
    const totalQuestions = Number(body.totalQuestions || 0);
    const currentQuestionNumber = Number(body.currentQuestionNumber || 1);

    const question = body.question || {};
    const answer = body.answer || {};

    const questionId = Number(question.id || 0);
    const questionNumber = Number(question.number || 0);

    if (!surveyCode || !center || !email || !questionId || !questionNumber || !totalQuestions) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Faltan datos obligatorios para guardar la respuesta"
        })
      };
    }

    const db = getDb();

    const headerResult = await db.execute({
      sql: `
        SELECT id
        FROM survey_response_headers
        WHERE survey_code = ? AND center_code = ?
        ORDER BY COALESCE(updated_at, created_at) DESC, id DESC
        LIMIT 1
      `,
      args: [surveyCode, center]
    });

    let headerId = headerResult.rows[0]?.id;

    if (!headerId) {
      await db.execute({
        sql: `
          INSERT INTO survey_response_headers (
            survey_code,
            center_code,
            respondent_email,
            respondent_name,
            status,
            current_question_number,
            answered_questions_count,
            total_questions,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, 'draft', ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(survey_code, center_code, respondent_email)
          DO UPDATE SET
            respondent_name = excluded.respondent_name,
            current_question_number = excluded.current_question_number,
            total_questions = excluded.total_questions,
            status = 'draft',
            updated_at = CURRENT_TIMESTAMP
        `,
        args: [
          surveyCode,
          center,
          email,
          respondentName || null,
          currentQuestionNumber,
          totalQuestions
        ]
      });

      const insertedHeaderResult = await db.execute({
        sql: `
          SELECT id
          FROM survey_response_headers
          WHERE survey_code = ? AND center_code = ? AND respondent_email = ?
          ORDER BY id DESC
          LIMIT 1
        `,
        args: [surveyCode, center, email]
      });

      headerId = insertedHeaderResult.rows[0]?.id;
    }

    if (!headerId) {
      throw new Error("No fue posible obtener el encabezado de la encuesta");
    }

    await db.execute({
      sql: `
        INSERT INTO survey_response_answers (
          response_header_id,
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
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(response_header_id, question_id)
        DO UPDATE SET
          question_number = excluded.question_number,
          self_score = excluded.self_score,
          evidence_text = excluded.evidence_text,
          improvement_actions = excluded.improvement_actions,
          tutor_comments = excluded.tutor_comments,
          certifier_score = excluded.certifier_score,
          certifier_observations = excluded.certifier_observations,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        headerId,
        questionId,
        questionNumber,
        answer.selfScore ?? null,
        answer.evidenceText ?? "",
        answer.improvementActions ?? "",
        answer.tutorComments ?? "",
        answer.certifierScore ?? null,
        answer.certifierObservations ?? ""
      ]
    });

    await db.execute({
      sql: `
        UPDATE survey_response_headers
        SET
          respondent_email = ?,
          respondent_name = ?,
          status = 'draft',
          current_question_number = ?,
          answered_questions_count = (
            SELECT COUNT(*)
            FROM survey_response_answers
            WHERE response_header_id = ?
              AND self_score IS NOT NULL
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [email, respondentName || null, currentQuestionNumber, headerId, headerId]
    });

    const finalHeaderResult = await db.execute({
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
        WHERE id = ?
        LIMIT 1
      `,
      args: [headerId]
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({
        ok: true,
        header: finalHeaderResult.rows[0]
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Error guardando respuesta",
        detail: error.message
      })
    };
  }
};
