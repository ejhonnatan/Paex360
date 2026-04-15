const { getDb } = require("./db");
const path = require("path");

function buildUploadFileName(originalName, questionNumber) {
  const ext = String(path.extname(originalName) || "").trim();
  const base = String(path.basename(originalName, ext) || "").trim() || "archivo";
  const now = new Date();
  const iso = now.toISOString().split(".")[0];
  const timestamp = iso.replace(/[-:]/g, "").replace("T", "_");
  const questionTag = Number(questionNumber || 0);
  return `${base}_#${questionTag}_${timestamp}${ext}`;
}

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

    const question = body.question || {};
    const questionId = Number(question.id || 0);
    const questionNumber = Number(question.number || 0);
    const referenceFileName = String(body.referenceFileName || "").trim();

    const fileName = String(body.fileName || "").trim();
    const mimeTypeRaw = String(body.mimeType || "").trim().toLowerCase();
    const mimeType = mimeTypeRaw || "application/octet-stream";
    const hasBase64Content = Object.prototype.hasOwnProperty.call(body, "base64Content");
    let base64Content = hasBase64Content ? String(body.base64Content ?? "") : "";
    base64Content = base64Content.trim();

    const missingFields = [];
    if (!surveyCode) missingFields.push("surveyCode");
    if (!center) missingFields.push("center");
    if (!email) missingFields.push("email");
    if (!questionId) missingFields.push("question.id");
    if (!questionNumber) missingFields.push("question.number");
    if (!fileName) missingFields.push("fileName");
    if (!hasBase64Content) missingFields.push("base64Content");

    const uniqueFileName = buildUploadFileName(fileName, questionNumber);

    if (missingFields.length) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Faltan datos obligatorios para subir el documento",
          detail: `Campos faltantes: ${missingFields.join(", ")}`,
          missingFields
        })
      };
    }

    base64Content = base64Content.replace(/^data:[^;]+;base64,/, "");

    let byteSize = 0;
    try {
      byteSize = Buffer.from(base64Content, "base64").length;
    } catch (_) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "El contenido Base64 del archivo no es válido" })
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
        `,
        args: [
          surveyCode,
          center,
          email,
          respondentName || null,
          questionNumber,
          totalQuestions || 7
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
        UPDATE survey_response_headers
        SET
          respondent_email = ?,
          respondent_name = ?,
          status = 'draft',
          current_question_number = ?,
          total_questions = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [email, respondentName || null, questionNumber, totalQuestions || 7, headerId]
    });

    await db.execute({
      sql: `
        INSERT INTO survey_uploaded_documents (
          response_header_id,
          question_id,
          question_number,
          reference_file_name,
          original_file_name,
          mime_type,
          base64_content,
          byte_size,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      args: [
        headerId,
        questionId,
        questionNumber,
        referenceFileName || null,
        uniqueFileName,
        mimeType,
        base64Content,
        byteSize
      ]
    });

    const savedResult = await db.execute({
      sql: `
        SELECT
          id,
          response_header_id,
          question_id,
          question_number,
          reference_file_name,
          original_file_name,
          mime_type,
          byte_size,
          created_at,
          updated_at
        FROM survey_uploaded_documents
        WHERE response_header_id = ? AND question_id = ?
        ORDER BY id DESC
        LIMIT 1
      `,
      args: [headerId, questionId]
    });

    const row = savedResult.rows[0];

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        ok: true,
        document: {
          id: Number(row.id),
          responseHeaderId: Number(row.response_header_id),
          questionId: Number(row.question_id),
          questionNumber: Number(row.question_number),
          referenceFileName: row.reference_file_name || null,
          originalFileName: row.original_file_name,
          mimeType: row.mime_type,
          byteSize: Number(row.byte_size || 0),
          createdAt: row.created_at || null,
          updatedAt: row.updated_at || null,
          ruta: `/.netlify/functions/getStoredDocument?documentId=${row.id}`
        }
      })
    };
  } catch (error) {
    console.error("uploadSurveyDocument error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Error subiendo documento de encuesta",
        detail: error.message || String(error)
      })
    };
  }
};
