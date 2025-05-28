// netlify/functions/getPowerBI.js
const soap = require("soap");

exports.handler = async (event) => {
  // 1) Preflight CORS
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
    // 2) Leer workspaceId y reportId del body
    const { workspaceId, reportId } = JSON.parse(event.body);

    // 3) Credenciales y WSDL
    const username = process.env.PBI_USER;
    const password = process.env.PBI_PASS;
    const WSDL =
      "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl"; // o bo-latam si tu tenant es LATAM

    // 4) Crear cliente SOAP
    const client = await soap.createClientAsync(WSDL);

    // 5) Llamar a apiGetPowerBiAccess con los 4 parámetros requeridos
    const [raw] = await client.apiGetPowerBiAccessAsync({
      username,    // usuario _Back-Office_ de Opinat
      password,    // contraseña Back-Office
      workspaceId, // tu workspace ID
      reportId,    // tu report ID
    });

    // 6) A veces raw llega ya como objeto; parsear sólo si es string
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    // 7) Extraer token y URL
    const embedToken = data.embedToken?.token;
    const embedUrl   = data.embedReports?.[0]?.embedUrl;
    const outReportId= data.embedReports?.[0]?.id;

    if (!embedToken || !embedUrl || !outReportId) {
      console.error("Estructura inesperada:", JSON.stringify(data));
      throw new Error("Respuesta inválida de la API SOAP");
    }

    // 8) Responder al front con CORS
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
