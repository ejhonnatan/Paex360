// netlify/functions/getPowerBI.js
const soap = require("soap");

exports.handler = async (event) => {
  // ─── 1) CORS preflight ───
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
    // ─── 2) Leer workspaceId y reportId del body ───
    const { workspaceId, reportId } = JSON.parse(event.body);

    // ─── 3) Credenciales y WSDL ───
    const username = process.env.PBI_USER;
    const password = process.env.PBI_PASS;
    const WSDL =
      "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl"; // o bo-latam

    // ─── 4) Crear cliente SOAP ───
    const client = await soap.createClientAsync(WSDL);

    // ─── 5) Login y sessionId ───
    const [loginRes] = await client.apiLoginAsync({ username, password });
    const sessionId = loginRes.return.$value;
    client.addHttpHeader("Cookie", "JSESSIONID=" + sessionId);

    // ─── 6) Llamada al embed con los 4 parámetros ───
    const [raw] = await client.apiGetPowerBiAccessAsync({
      username,
      password,
      workspaceId,
      reportId,
    });

    // ─── 7) Parsear RAW ───
    let data;
    if (typeof raw === "string") {
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error("RAW no es JSON:", raw);
        throw new Error("Respuesta no JSON del API PowerBI");
      }
    } else {
      data = raw;
    }
    console.log("POWER BI DATA:", data);

    // ─── 8) Extraer token y URL con seguridad ───
    const embedToken = data.embedToken?.token;
    const embedUrl   = data.embedReports?.[0]?.embedUrl;
    const outReportId= data.embedReports?.[0]?.id;

    if (!embedToken || !embedUrl || !outReportId) {
      console.error("Estructura inesperada:", JSON.stringify(data));
      throw new Error("Estructura de respuesta inválida");
    }

    // ─── 9) Responder OK con CORS ───
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
