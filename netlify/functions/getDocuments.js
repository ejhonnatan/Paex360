const fs = require("fs");
const path = require("path");

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? "";
    });
    return row;
  });
}

function toBool(value) {
  return String(value).toLowerCase().trim() === "true";
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const email = String(body.email || "").toLowerCase().trim();
    const center = String(body.center || "").toLowerCase().trim();

    if (!email || !center) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email y center son requeridos" })
      };
    }

    const permisosPath = path.join(__dirname, "Permisos_pagina.csv");
    const documentosPath = path.join(__dirname, "Documentos.csv");

    const permisosRows = parseCSV(fs.readFileSync(permisosPath, "utf8"));
    const documentosRows = parseCSV(fs.readFileSync(documentosPath, "utf8"));

    const userRow = permisosRows.find(r => String(r.email || "").toLowerCase().trim() === email);

    if (!userRow) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Usuario sin permisos registrados" })
      };
    }

    const puedeDocumentos = toBool(userRow.Puede_Documentos);
    const puedeDiagonal = toBool(userRow.Clinica_Diagonal);
    const puedeSalus = toBool(userRow.Clinica_Salus);

    const tienePermisoCentro =
      (center === "diagonal" && puedeDiagonal) ||
      (center === "Clinica_Salus" && puedeSalus);

    if (!tienePermisoCentro) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "No tienes permisos para este centro" })
      };
    }

    if (!puedeDocumentos) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documents: []
        })
      };
    }

    const documents = documentosRows
      .filter(r => toBool(r.activo) && String(r.centro || "").toLowerCase().trim() === center)
      .map(r => ({
        id: r.id,
        nombre: r.nombre,
        ruta: r.ruta
      }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ documents })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error leyendo documentos",
        detail: error.message
      })
    };
  }
};
