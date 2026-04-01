const { getDb } = require("./db");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Método no permitido" });
    }

    const body = JSON.parse(event.body || "{}");

    const center = String(body.center || "").trim().toLowerCase();
    const documentId = Number(body.documentId || 0);
    const source = String(body.source || "").trim();

    if (!center || !documentId || !source) {
      return json(400, { error: "center, documentId y source son obligatorios" });
    }

    const db = getDb();

    if (source === "center_documents") {
      const existsResult = await db.execute({
        sql: `
          SELECT id
          FROM center_documents
          WHERE id = ?
            AND LOWER(TRIM(center_code)) = ?
            AND COALESCE(is_active, 1) = 1
          LIMIT 1
        `,
        args: [documentId, center]
      });

      if (!existsResult.rows.length) {
        return json(404, { error: "Documento no encontrado para este centro" });
      }

      await db.execute({
        sql: `
          UPDATE center_documents
          SET is_active = 0,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND LOWER(TRIM(center_code)) = ?
        `,
        args: [documentId, center]
      });

      return json(200, { ok: true, deleted: true, source });
    }

    if (source === "survey_uploaded_documents") {
      const existsResult = await db.execute({
        sql: `
          SELECT d.id
          FROM survey_uploaded_documents d
          INNER JOIN survey_response_headers h
            ON h.id = d.response_header_id
          WHERE d.id = ?
            AND LOWER(TRIM(h.center_code)) = ?
          LIMIT 1
        `,
        args: [documentId, center]
      });

      if (!existsResult.rows.length) {
        return json(404, { error: "Documento subido no encontrado para este centro" });
      }

      await db.execute({
        sql: `DELETE FROM survey_uploaded_documents WHERE id = ?`,
        args: [documentId]
      });

      return json(200, { ok: true, deleted: true, source });
    }

    return json(400, { error: "source inválido" });
  } catch (error) {
    console.error("deleteDocument error:", error);
    return json(500, {
      error: "Error eliminando documento",
      detail: error.message || String(error)
    });
  }
};
