// netlify/functions/getPermissions.js
const https = require("https");

exports.handler = async () => {
  const CSV_URL = "https://opinatlatam-my.sharepoint.com/:x:/g/personal/jecheverri_opinatlatam_onmicrosoft_com/IQC52WfdqM15QaCqWN0Wqsi-AY1RKp9z0nHaqH6s9XNP46c?download=1";

  try {
    const csvData = await new Promise((resolve, reject) => {
      https.get(CSV_URL, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }).on("error", reject);
    });

    // Quitar BOM si viene desde Excel
    let text = csvData.replace(/^\uFEFF/, "");

    // Normalizar saltos
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({})
      };
    }

    // Detectar separador por header (coma o punto y coma)
    const header = lines[0];
    const delimiter = header.includes(";") ? ";" : ",";

    // Helper: limpiar comillas y espacios
    const clean = (s) => String(s || "").trim().replace(/^"|"$/g, "");

    // Construir mapa: emailLower -> [centros]
    const permissions = {};

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter);

      const email = clean(parts[0]).toLowerCase();
      const center = clean(parts[1]);

      if (!email || !center) continue;

      if (!permissions[email]) permissions[email] = [];
      if (!permissions[email].includes(center)) permissions[email].push(center);
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(permissions)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
