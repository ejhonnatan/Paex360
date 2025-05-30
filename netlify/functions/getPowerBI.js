// netlify/functions/getPowerBI.js
const soap = require("soap");

exports.handler = async (event) => {
  // 1) Responder OPTIONS para CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "OK",
    };
  }

  try {
    // 2) Leer workspaceId y reportId del body JSON
    const { workspaceId, reportId } = JSON.parse(event.body);

    // 3) Credenciales y punto SOAP (usar LATAM si tu tenant está en Latam)
    const username = process.env.PBI_USER;
    const password = process.env.PBI_PASS;
    const WSDL = "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl";

    // 4) Crear cliente SOAP
    const client = await soap.createClientAsync(WSDL);

    // 5) Llamar a la operación que devuelve token y URL
    const [raw] = await client.apiGetPowerBiAccessAsync({
      username,
      password,
      workspaceId,
      reportId,
    });

    // 6) Si raw es string, parsearlo; si no, usarlo directamente
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    // 7) Extraer los valores
    const embedToken = data.embedToken?.token;
    const embedUrl   = data.embedReports?.[0]?.embedUrl;
    const outReportId= data.embedReports?.[0]?.id;

    if (!embedToken || !embedUrl || !outReportId) {
      console.error("Respuesta inesperada:", JSON.stringify(data));
      throw new Error("Respuesta inválida de la API SOAP");
    }

    // 8) Devolver al front-end con CORS
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
      },
      body: JSON.stringify({ embedToken, embedUrl, reportId: outReportId }),
    };

  } catch (err) {
    console.error("POWER BI ERROR:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
      },
      body: "ERROR: " + err.message,
    };
  }
};
