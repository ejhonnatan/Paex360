const { getDb } = require("./db");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    const params = event.queryStringParameters || {};

    const surveyCode = String(params.surveyCode || "").trim();
    const center = String(params.center || "").trim().toLowerCase();
    const email = String(params.email || "").trim().toLowerCase();
    const status = String(params.status || "").trim().toLowerCase();
    const questionNumber = params.questionNumber !== undefined && params.questionNumber !== null && params.questionNumber !== ""
      ? Number(params.questionNumber)
      : null;

    const whereParts = [];
    const args = [];

    if (surveyCode) {
      whereParts.push("h.survey_code = ?");
      args.push(surveyCode);
    }

    if (center) {
      whereParts.push("h.center_code = ?");
      args.push(center);
    }

    if (email) {
      whereParts.push("h.respondent_email = ?");
      args.push(email);
    }

    if (status) {
      whereParts.push("LOWER(h.status) = ?");
      args.push(status);
    }

    if (questionNumber !== null && !Number.isNaN(questionNumber)) {
      whereParts.push("a.question_number = ?");
      args.push(questionNumber);
    }

    const whereClause = whereParts.length
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    const db = getDb();

    const result = await db.execute({
      sql: `
        SELECT
          h.id AS response_header_id,
          h.survey_code,
          h.center_code,
          h.respondent_email,
          h.respondent_name,
          h.status,
          h.current_question_number,
          h.answered_questions_count,
          h.total_questions,
          h.created_at AS header_created_at,
          h.updated_at AS header_updated_at,
          h.submitted_at,

          a.id AS answer_id,
          a.question_id,
          a.question_number,
          a.self_score,
          a.evidence_text,
          a.improvement_actions,
          a.tutor_comments,
          a.certifier_score,
          a.certifier_observations,
          a.created_at AS answer_created_at,
          a.updated_at AS answer_updated_at
        FROM survey_response_headers h
        LEFT JOIN survey_response_answers a
          ON a.response_header_id = h.id
        ${whereClause}
        ORDER BY
          h.updated_at DESC,
          h.id DESC,
          a.question_number ASC
      `,
      args
    });

    const rows = (result.rows || []).map(row => ({
      responseHeaderId: Number(row.response_header_id || 0),
      surveyCode: row.survey_code,
      centerCode: row.center_code,
      respondentEmail: row.respondent_email,
      respondentName: row.respondent_name || null,
      status: row.status,
      currentQuestionNumber: Number(row.current_question_number || 0),
      answeredQuestionsCount: Number(row.answered_questions_count || 0),
      totalQuestions: Number(row.total_questions || 0),
      progressPct:
        Number(row.total_questions || 0) > 0
          ? (Number(row.answered_questions_count || 0) * 100) / Number(row.total_questions || 0)
          : 0,
      headerCreatedAt: row.header_created_at || null,
      headerUpdatedAt: row.header_updated_at || null,
      submittedAt: row.submitted_at || null,

      answerId: row.answer_id !== null && row.answer_id !== undefined ? Number(row.answer_id) : null,
      questionId: row.question_id !== null && row.question_id !== undefined ? Number(row.question_id) : null,
      questionNumber: row.question_number !== null && row.question_number !== undefined ? Number(row.question_number) : null,
      selfScore: row.self_score !== null && row.self_score !== undefined ? Number(row.self_score) : null,
      evidenceText: row.evidence_text || "",
      improvementActions: row.improvement_actions || "",
      tutorComments: row.tutor_comments || "",
      certifierScore: row.certifier_score !== null && row.certifier_score !== undefined ? Number(row.certifier_score) : null,
      certifierObservations: row.certifier_observations || "",
      answerCreatedAt: row.answer_created_at || null,
      answerUpdatedAt: row.answer_updated_at || null
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        filters: {
          surveyCode: surveyCode || null,
          center: center || null,
          email: email || null,
          status: status || null,
          questionNumber: questionNumber !== null && !Number.isNaN(questionNumber) ? questionNumber : null
        },
        totalRows: rows.length,
        rows
      })
    };
  } catch (error) {
    console.error("getSurveyDashboardDetail error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Error obteniendo detalle del dashboard de encuestas",
        detail: error.message || String(error)
      })
    };
  }
};