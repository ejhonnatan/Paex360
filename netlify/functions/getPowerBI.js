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
    // 2) Leer parámetros
    const { workspaceId, reportId } = JSON.parse(event.body);

    // 3) Credenciales + WSDL
    const username = process.env.PBI_USER;
    const password = process.env.PBI_PASS;
    const WSDL = "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl";

    // 4) Cliente SOAP
    const client = await soap.createClientAsync(WSDL);

    // 5) Login y sessionId
    const [loginRes] = await client.apiLoginAsync({ username, password });
    const sessionId = loginRes.return.$value;
    client.addHttpHeader("Cookie", "JSESSIONID=" + sessionId);

    // 6) Llamada embed con los 4 parámetros
    const [raw] = await client.apiGetPowerBiAccessAsync({
      username,
      password,
      workspaceId,
      reportId,
    });

    // 7) Parsear sólo si raw es string
    const data = (typeof raw === "string")
      ? JSON.parse(raw)
      : raw;

    // 8) Responder con CORS
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
