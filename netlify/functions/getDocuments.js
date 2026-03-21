const fs = require("fs");
const path = require("path");
const { getDb } = require("./db");

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function readCsvDocuments() {
  const filePath = path.join(__dirname, "Documentos.csv");

  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map(h => h.trim());

  return lines.slice(1).map(line => {
    const cols = parseCsvLine(line);
    const row = {};

    headers.forEach((header, idx) => {
      row[header] = (cols[idx] || "").trim();
    });

    return row;
  });
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
    const email = String(body.email || "").trim().toLowerCase();
    const center = String(body.center || "").trim().toLowerCase();
    const surveyCode = String(body.surveyCode || "paex360-certificacion-v1").trim();

    if (!email || !center) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "email y center son obligatorios" })
      };
    }

    const csvDocs = readCsvDocuments()
      .filter(row => String(row.centro || "").trim().toLowerCase() === center)
      .filter(row => {
        const activo = String(row.activo || "").trim().toLowerCase();
        return activo === "true" || activo === "1" || activo === "yes";
      })
      .map(row => ({
        id: row.id || null,
        nombre: row.nombre || "",
        centro: row.centro || "",
        ruta: row.ruta || "",
        activo: true,
        source: "csv",
        uploaded: false
      }));

    const db = getDb();

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
          d.updated_at
        FROM survey_uploaded_documents d
        INNER JOIN survey_response_headers h
          ON h.id = d.response_header_id
        WHERE h.survey_code = ?
          AND h.center_code = ?
          AND h.respondent_email = ?
        ORDER BY d.question_number ASC, d.updated_at DESC
      `,
      args: [surveyCode, center, email]
    });

    const uploadedDocs = (uploadedResult.rows || []).map(row => ({
      id: Number(row.id),
      questionId: Number(row.question_id || 0),
      questionNumber: Number(row.question_number || 0),
      referenceFileName: row.reference_file_name || null,
      nombre: row.original_file_name || "documento.pdf",
      mimeType: row.mime_type || "application/pdf",
      byteSize: Number(row.byte_size || 0),
      updatedAt: row.updated_at || null,
      ruta: `/.netlify/functions/getStoredDocument?documentId=${row.id}`,
      source: "db",
      uploaded: true
    }));

    const uploadedByReference = new Map();
    const uploadedWithoutReference = [];

    uploadedDocs.forEach(doc => {
      const ref = String(doc.referenceFileName || "").trim().toLowerCase();
      if (ref) {
        uploadedByReference.set(ref, doc);
      } else {
        uploadedWithoutReference.push(doc);
      }
    });

    const mergedDocs = csvDocs.map(doc => {
      const refKey = String(doc.nombre || "").trim().toLowerCase();
      const uploaded = uploadedByReference.get(refKey);

      if (uploaded) {
        return {
          id: uploaded.id,
          nombre: uploaded.nombre,
          centro: center,
          ruta: uploaded.ruta,
          activo: true,
          source: "db",
          uploaded: true,
          referenceFileName: uploaded.referenceFileName,
          questionNumber: uploaded.questionNumber,
          updatedAt: uploaded.updatedAt
        };
      }

      return doc;
    });

    uploadedWithoutReference.forEach(doc => {
      mergedDocs.push({
        id: doc.id,
        nombre: doc.nombre,
        centro: center,
        ruta: doc.ruta,
        activo: true,
        source: "db",
        uploaded: true,
        referenceFileName: null,
        questionNumber: doc.questionNumber,
        updatedAt: doc.updatedAt
      });
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        center,
        email,
        surveyCode,
        total: mergedDocs.length,
        documents: mergedDocs
      })
    };
  } catch (error) {
    console.error("getDocuments error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Error obteniendo documentos",
        detail: error.message || String(error)
      })
    };
  }
};