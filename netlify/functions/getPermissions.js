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

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email requerido" })
      };
    }

    const csvPath = path.join(__dirname, "Permisos_pagina.csv");
    const csvText = fs.readFileSync(csvPath, "utf8");
    const rows = parseCSV(csvText);

    const userRow = rows.find(r => String(r.email || "").toLowerCase().trim() === email);

    if (!userRow) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Usuario sin permisos registrados" })
      };
    }

    const permissions = {
      Clinica_Diagonal: toBool(userRow.Clinica_Diagonal),
      Clinica_Salus: toBool(userRow.Clinica_Salus),
      Puede_Documentos: toBool(userRow.Puede_Documentos)
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        permissions
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error leyendo permisos",
        detail: error.message
      })
    };
  }
};
