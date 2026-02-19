const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  try {
    // =============================
    // 1️⃣ Validar método
    // =============================
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    // =============================
    // 2️⃣ Obtener email del body
    // =============================
    const body = JSON.parse(event.body || "{}");
    const email = (body.email || "").toLowerCase().trim();

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email requerido" })
      };
    }

    // =============================
    // 3️⃣ Leer CSV correctamente
    // =============================
    const filePath = path.join(__dirname, "Permisos_pagina.csv");

    if (!fs.existsSync(filePath)) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Archivo CSV no encontrado",
          filePath,
          filesDisponibles: fs.readdirSync(__dirname)
        })
      };
    }

    const csvData = fs.readFileSync(filePath, "utf8");

    // =============================
    // 4️⃣ Parsear CSV
    // Formato esperado:
    // email,Clinica_Diagonal,Clinica_Salus
    // usuario@email.com,true,false
    // =============================

    const lines = csvData
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const headers = lines[0].split(",").map(h => h.trim());

    const records = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      return obj;
    });

    // =============================
    // 5️⃣ Buscar usuario
    // =============================

    const user = records.find(r =>
      r.email && r.email.toLowerCase() === email
    );

    if (!user) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Usuario no autorizado"
        })
      };
    }

    // =============================
    // 6️⃣ Construir respuesta
    // =============================

    const permissions = {
      Clinica_Diagonal: user.Clinica_Diagonal === "true",
      Clinica_Salus: user.Clinica_Salus === "true"
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        permissions
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error interno del servidor",
        message: error.message,
        stack: error.stack
      })
    };
  }
};
