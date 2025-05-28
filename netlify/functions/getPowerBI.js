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
    // 2) Leer parámetros de la petición
    const { workspaceId, reportId } = JSON.parse(event.body);

    // 3) Credenciales y endpoint SOAP
    const username = process.env.PBI_USER;
    const password = process.env.PBI_PASS;
    const WSDL = "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl"; // o bo-latam si aplica

    // 4) Crear cliente SOAP
    const client = await soap.createClientAsync(WSDL);

    // 5) Paso de login: obtener sessionId
    const [loginRes] = await client.apiLoginAsync({ username, password });
    // Según tu prueba, viene en loginRes.return.$value
    const sessionId = loginRes.return.$value;

    // 6) Inyectar la cookie de sesión para siguientes llamadas
    client.addHttpHeader("Cookie", "JSESSIONID=" + sessionId);

    // 7) Llamada a la API para obtener embedToken y embedUrl
    const [raw] = await client.apiGetPowerBiAccessAsync({
      workspaceId,
      reportId,
    });
    const data = JSON.parse(raw);

    // 8) Responder al front con CORS
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
      },
      body: JSON.stringify({
        embedToken: data.embedToken.token,
        embedUrl: data.embedReports[0].embedUrl,
        reportId: data.embedReports[0].id,
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
