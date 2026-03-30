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
    const documentId = Number(params.documentId || 0);

    if (!documentId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "documentId es obligatorio" })
      };
    }

    const db = getDb();

    const result = await db.execute({
      sql: `
        SELECT
          id,
          original_file_name,
          mime_type,
          base64_content
        FROM survey_uploaded_documents
        WHERE id = ?
        LIMIT 1
      `,
      args: [documentId]
    });

    const row = result.rows[0];

    if (!row) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Documento no encontrado" })
      };
    }

    const mimeType = row.mime_type || "application/octet-stream";
    const isPreviewable = mimeType.startsWith("application/pdf") || mimeType.startsWith("image/");
    const disposition = isPreviewable ? "inline" : "attachment";

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `${disposition}; filename="${row.original_file_name || "archivo"}"`,
        "Cache-Control": "no-store"
      },
      body: row.base64_content
    };
  } catch (error) {
    console.error("getStoredDocument error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Error obteniendo documento almacenado",
        detail: error.message || String(error)
      })
    };
  }
};