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

function normalizeFileName(value) {
  return String(value || "")
    .trim()
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    .toLowerCase();
}

function buildStoredDocumentUrl(documentId) {
  return `/.netlify/functions/getStoredDocument?documentId=${encodeURIComponent(documentId)}`;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Método no permitido" });
    }

    const body = JSON.parse(event.body || "{}");
    const center = String(body.center || "").trim().toLowerCase();

    if (!center) {
      return json(400, { error: "center es obligatorio" });
    }

    const db = getDb();

    // =========================================================
    // 1) DOCUMENTOS BASE DEL CENTRO DESDE center_documents
    // =========================================================
    const centerDocsResult = await db.execute({
      sql: `
        SELECT
          id,
          center_code,
          file_name,
          file_url,
          file_path,
          is_active,
          sort_order,
          created_at,
          updated_at
        FROM center_documents
        WHERE LOWER(TRIM(center_code)) = ?
          AND COALESCE(is_active, 1) = 1
        ORDER BY
          COALESCE(sort_order, 999999) ASC,
          file_name ASC
      `,
      args: [center]
    });

    const centerDocs = (centerDocsResult.rows || []).map((row) => ({
      id: Number(row.id),
      nombre: row.file_name || "",
      centro: row.center_code || center,
      ruta: row.file_url || row.file_path || "",
      activo: Number(row.is_active || 1) === 1,
      sortOrder: Number(row.sort_order || 999999),
      source: "center_documents",
      uploaded: false,
      referenceFileName: row.file_name || null,
      questionNumber: null,
      updatedAt: row.updated_at || row.created_at || null
    }));

    // =========================================================
    // 2) DOCUMENTOS SUBIDOS DESDE ENCUESTA
    //    SOLO POR CENTRO
    // =========================================================
    const uploadedResult = await db.execute({
      sql: `
        SELECT
          d.id,
          d.question_id,
          d.question_number,
          d.reference_file_name,
          d.original_file_name,
          d.mime_type,
          d.byte_size,
          d.created_at,
          d.updated_at,
          h.center_code
        FROM survey_uploaded_documents d
        INNER JOIN survey_response_headers h
          ON h.id = d.response_header_id
        WHERE LOWER(TRIM(h.center_code)) = ?
        ORDER BY
          COALESCE(d.question_number, 999999) ASC,
          COALESCE(d.updated_at, d.created_at) DESC,
          d.id DESC
      `,
      args: [center]
    });

    const uploadedDocs = (uploadedResult.rows || []).map((row) => ({
      id: Number(row.id),
      questionId: Number(row.question_id || 0),
      questionNumber: Number(row.question_number || 0),
      referenceFileName: row.reference_file_name || null,
      nombre: row.original_file_name || "documento.pdf",
      mimeType: row.mime_type || "application/pdf",
      byteSize: Number(row.byte_size || 0),
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
      ruta: buildStoredDocumentUrl(row.id),
      source: "survey_uploaded_documents",
      uploaded: true
    }));

    // =========================================================
    // 3) INDEXAR BASE POR NOMBRE
    // =========================================================
    const centerDocsMap = new Map();

    centerDocs.forEach((doc) => {
      const key = normalizeFileName(doc.nombre);
      if (key) {
        centerDocsMap.set(key, doc);
      }
    });

    // =========================================================
    // 4) REEMPLAZOS Y EXTRAS
    // =========================================================
    const replacementsByReference = new Map();
    const extraUploadedDocs = [];

    uploadedDocs.forEach((doc) => {
      const refKey = normalizeFileName(doc.referenceFileName);

      if (refKey && centerDocsMap.has(refKey)) {
        if (!replacementsByReference.has(refKey)) {
          replacementsByReference.set(refKey, doc);
        }
        return;
      }

      extraUploadedDocs.push(doc);
    });

    // =========================================================
    // 5) MERGE DE BASE + REEMPLAZOS
    // =========================================================
    const mergedDocs = centerDocs.map((doc) => {
      const key = normalizeFileName(doc.nombre);
      const uploadedReplacement = replacementsByReference.get(key);

      if (uploadedReplacement) {
        return {
          id: uploadedReplacement.id,
          nombre: uploadedReplacement.nombre,
          centro: center,
          ruta: uploadedReplacement.ruta,
          activo: true,
          sortOrder: doc.sortOrder,
          source: "survey_uploaded_documents",
          uploaded: true,
          referenceFileName: uploadedReplacement.referenceFileName,
          questionNumber: uploadedReplacement.questionNumber,
          mimeType: uploadedReplacement.mimeType,
          byteSize: uploadedReplacement.byteSize,
          createdAt: uploadedReplacement.createdAt || null,
          updatedAt: uploadedReplacement.updatedAt
        };
      }

      return doc;
    });

    // =========================================================
    // 6) AGREGAR EXTRAS SIN REFERENCIA
    //    EJ: PRUEBA.pdf con reference_file_name = NULL
    // =========================================================
    const extraUploadedDocsOut = extraUploadedDocs.map((doc) => ({
      id: doc.id,
      nombre: doc.nombre,
      centro: center,
      ruta: doc.ruta,
      activo: true,
      sortOrder: 999999,
      source: "survey_uploaded_documents",
      uploaded: true,
      referenceFileName: doc.referenceFileName,
      questionNumber: doc.questionNumber,
      mimeType: doc.mimeType,
      byteSize: doc.byteSize,
      createdAt: doc.createdAt || null,
      updatedAt: doc.updatedAt
    }));

    const finalDocuments = [
      ...mergedDocs,
      ...extraUploadedDocsOut
    ].sort((a, b) => {
      const sortA = Number(a.sortOrder || 999999);
      const sortB = Number(b.sortOrder || 999999);

      if (sortA !== sortB) {
        return sortA - sortB;
      }

      const qA = Number(a.questionNumber || 999999);
      const qB = Number(b.questionNumber || 999999);

      if (qA !== qB) {
        return qA - qB;
      }

      return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", {
        sensitivity: "base"
      });
    });

    return json(200, {
      center,
      total: finalDocuments.length,
      documents: finalDocuments
    });
  } catch (error) {
    console.error("getDocuments error:", error);

    return json(500, {
      error: "Error obteniendo documentos",
      detail: error.message || String(error)
    });
  }
};
