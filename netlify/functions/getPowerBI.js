// netlify/functions/getPowerBI.js
const soap = require("soap");

exports.handler = async (event) => {
  /* ────────────── 1) Responder pre-flight CORS (OPTIONS) ────────────── */
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io", // ← tu dominio
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "OK",
    };
  }

  try {
    /* ────────────── 2) Datos de la petición POST ────────────── */
    const { workspaceId, reportId } = JSON.parse(event.body);

    /* ────────────── 3) Credenciales y WSDL ────────────── */
    const username = process.env.PBI_USER;
    const password = process.env.PBI_PASS;
    const WSDL =
      "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl"; // usa bo-latam si corresponde

    /* ────────────── 4) Llamada SOAP a la API ────────────── */
    const client = await soap.createClientAsync(WSDL);
    const [raw] = await client.apiGetPowerBiAccessAsync({
      username,
      password,
      workspaceId,
      reportId,
    });

    const data = JSON.parse(raw); // { embedToken, embedReports:[{id,embedUrl}] }

    /* ────────────── 5) Respuesta OK con cabecera CORS ────────────── */
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
      },
      body: JSON.stringify({
        embedToken: data.embedToken.token,
        embedUrl:  data.embedReports[0].embedUrl,
        reportId:  data.embedReports[0].id,
      }),
    };
  } catch (err) {
    /* ────────────── 6) Error: log + cabecera CORS ────────────── */
    console.error("POWER BI ERROR:", err); // aparecerá en Function log
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
      },
      body: "ERROR: " + err.message,
    };
  }
};
