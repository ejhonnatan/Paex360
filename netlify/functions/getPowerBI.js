// netlify/functions/getPowerBI.js
const soap = require("soap");

exports.handler = async (event) => {
  // ================= CORS =================
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ ok: true }),
    };
  }

  try {
    const { workspaceId, reportId } = JSON.parse(event.body);

    const username = process.env.PBI_USER;
    const password = process.env.PBI_PASS;
    const WSDL = "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl";

    const client = await soap.createClientAsync(WSDL);

    const [raw] = await client.apiGetPowerBiAccessAsync({
      username,
      password,
      workspace_id: workspaceId,
      report_id: reportId,
    });

    const jsonString = raw?.return?.$value;
    if (!jsonString) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
        },
        body: JSON.stringify({
          error: "Respuesta SOAP sin valor",
          raw,
        }),
      };
    }

    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
        },
        body: JSON.stringify({
          error: "JSON inválido devuelto por SOAP",
          raw: jsonString,
        }),
      };
    }

    const embedToken = data.embedToken?.token;
    const embedUrl = data.embedReports?.[0]?.embedUrl;
    const outReportId = data.embedReports?.[0]?.id;

    if (!embedToken || !embedUrl || !outReportId) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
        },
        body: JSON.stringify({
          error: "Estructura inesperada del SOAP",
          data,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
      },
      body: JSON.stringify({
        embedToken,
        embedUrl,
        reportId: outReportId,
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
      },
      body: JSON.stringify({
        error: err.message,
        stack: err.stack,
      }),
    };
  }
};
