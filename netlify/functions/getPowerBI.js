// netlify/functions/getPowerBI.js
const soap = require("soap");

exports.handler = async (event) => {
  /* 1️⃣  Responder la petición pre-flight (OPTIONS) */
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "OK",
    };
  }

  try {
    const { workspaceId, reportId } = JSON.parse(event.body);
    const username = process.env.PBI_USER;
    const password = process.env.PBI_PASS;
    const WSDL =
      "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl"; // o latam

    const client = await soap.createClientAsync(WSDL);
    const [raw] = await client.apiGetPowerBiAccessAsync({
      username,
      password,
      workspaceId,
      reportId,
    });

    const data = JSON.parse(raw);

    /* 2️⃣  Respuesta normal con cabecera CORS */
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
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
      },
      body: "Error generando token",
    };
  }
};
