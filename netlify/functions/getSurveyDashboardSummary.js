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

    const whereClause = whereParts.length
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    const db = getDb();

    const summaryResult = await db.execute({
      sql: `
        SELECT
          COUNT(*) AS total_surveys,
          SUM(CASE WHEN LOWER(h.status) = 'draft' THEN 1 ELSE 0 END) AS total_draft,
          SUM(CASE WHEN LOWER(h.status) = 'submitted' THEN 1 ELSE 0 END) AS total_submitted,
          COALESCE(AVG(h.answered_questions_count * 100.0 / NULLIF(h.total_questions, 0)), 0) AS avg_progress_pct,
          COALESCE(SUM(h.answered_questions_count), 0) AS total_answered_questions,
          MAX(h.updated_at) AS last_updated_at
        FROM survey_response_headers h
        ${whereClause}
      `,
      args
    });

    const scoreResult = await db.execute({
      sql: `
        SELECT
          COALESCE(AVG(a.self_score), 0) AS avg_self_score,
          COALESCE(AVG(a.certifier_score), 0) AS avg_certifier_score,
          COUNT(a.id) AS total_answer_rows
        FROM survey_response_headers h
        LEFT JOIN survey_response_answers a
          ON a.response_header_id = h.id
        ${whereClause}
      `,
      args
    });

    const byCenterResult = await db.execute({
      sql: `
        SELECT
          h.center_code,
          COUNT(*) AS total_surveys,
          SUM(CASE WHEN LOWER(h.status) = 'draft' THEN 1 ELSE 0 END) AS total_draft,
          SUM(CASE WHEN LOWER(h.status) = 'submitted' THEN 1 ELSE 0 END) AS total_submitted,
          COALESCE(AVG(h.answered_questions_count * 100.0 / NULLIF(h.total_questions, 0)), 0) AS avg_progress_pct,
          COALESCE(MAX(h.updated_at), NULL) AS last_updated_at
        FROM survey_response_headers h
        ${whereClause}
        GROUP BY h.center_code
        ORDER BY h.center_code
      `,
      args
    });

    const byStatusResult = await db.execute({
      sql: `
        SELECT
          LOWER(h.status) AS status,
          COUNT(*) AS total_surveys
        FROM survey_response_headers h
        ${whereClause}
        GROUP BY LOWER(h.status)
        ORDER BY LOWER(h.status)
      `,
      args
    });

    const byQuestionResult = await db.execute({
      sql: `
        SELECT
          a.question_number,
          COUNT(*) AS total_rows,
          COUNT(a.self_score) AS total_self_score,
          COUNT(a.certifier_score) AS total_certifier_score,
          COALESCE(AVG(a.self_score), 0) AS avg_self_score,
          COALESCE(AVG(a.certifier_score), 0) AS avg_certifier_score
        FROM survey_response_headers h
        INNER JOIN survey_response_answers a
          ON a.response_header_id = h.id
        ${whereClause}
        GROUP BY a.question_number
        ORDER BY a.question_number
      `,
      args
    });

    const summaryRow = summaryResult.rows[0] || {};
    const scoreRow = scoreResult.rows[0] || {};

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
          status: status || null
        },
        summary: {
          totalSurveys: Number(summaryRow.total_surveys || 0),
          totalDraft: Number(summaryRow.total_draft || 0),
          totalSubmitted: Number(summaryRow.total_submitted || 0),
          avgProgressPct: Number(summaryRow.avg_progress_pct || 0),
          totalAnsweredQuestions: Number(summaryRow.total_answered_questions || 0),
          lastUpdatedAt: summaryRow.last_updated_at || null,
          avgSelfScore: Number(scoreRow.avg_self_score || 0),
          avgCertifierScore: Number(scoreRow.avg_certifier_score || 0),
          totalAnswerRows: Number(scoreRow.total_answer_rows || 0)
        },
        byCenter: (byCenterResult.rows || []).map(row => ({
          centerCode: row.center_code,
          totalSurveys: Number(row.total_surveys || 0),
          totalDraft: Number(row.total_draft || 0),
          totalSubmitted: Number(row.total_submitted || 0),
          avgProgressPct: Number(row.avg_progress_pct || 0),
          lastUpdatedAt: row.last_updated_at || null
        })),
        byStatus: (byStatusResult.rows || []).map(row => ({
          status: row.status,
          totalSurveys: Number(row.total_surveys || 0)
        })),
        byQuestion: (byQuestionResult.rows || []).map(row => ({
          questionNumber: Number(row.question_number || 0),
          totalRows: Number(row.total_rows || 0),
          totalSelfScore: Number(row.total_self_score || 0),
          totalCertifierScore: Number(row.total_certifier_score || 0),
          avgSelfScore: Number(row.avg_self_score || 0),
          avgCertifierScore: Number(row.avg_certifier_score || 0)
        }))
      })
    };
  } catch (error) {
    console.error("getSurveyDashboardSummary error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Error obteniendo resumen del dashboard de encuestas",
        detail: error.message || String(error)
      })
    };
  }
};