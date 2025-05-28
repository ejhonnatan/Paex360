const soap = require("soap");

exports.handler = async (event) => {
  // CORS pre-flight
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
    const { workspaceId, reportId } = JSON.parse(event.body);
    const username = process.env.PBI_USER;
    const password = process.env.PBI_PASS;
    const WSDL =
      "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl"; // o https://bo-latam.opinat.com/... si aplica

    // 1) Crear cliente SOAP
    const client = await soap.createClientAsync(WSDL);

    // 2) Autenticar (apiLogin)
    const [loginRes] = await client.apiLoginAsync({
      username,
      password,
    });
    const sessionId = loginRes.sessionId;
    // Inyectar cookie de sesión
    client.addHttpHeader("Cookie", `JSESSIONID=${sessionId}`);

    // 3) Obtener embed token
    const [raw] = await client.apiGetPowerBiAccessAsync({
      sessionId,
      workspaceId,
      reportId,
    });
    const data = JSON.parse(raw);

    // 4) Responder con token + CORS
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "https://ejhonnatan.github.io" },
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
      headers: { "Access-Control-Allow-Origin": "https://ejhonnatan.github.io" },
      body: "ERROR: " + (err.message || err.toString()),
    };
  }
};
