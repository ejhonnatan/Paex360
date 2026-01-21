// netlify/functions/getPowerBI.js
const soap = require("soap");

exports.handler = async (event) => {

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ ok: true })
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
      report_id: reportId // 👈 ESTE ES EL ID SOAP (NO GUID)
    });

    const jsonString = raw?.return?.$value;

    if (!jsonString || jsonString.startsWith("KO")) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "https://ejhonnatan.github.io"
        },
        body: JSON.stringify({
          error: "SOAP rechazó el Report ID",
          raw: jsonString
        })
      };
    }

    const data = JSON.parse(jsonString);

    const embedToken = data.embedToken?.token;
    const embedUrl = data.embedReports?.[0]?.embedUrl;
    const outReportId = data.embedReports?.[0]?.id;

    if (!embedToken || !embedUrl || !outReportId) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://ejhonnatan.github.io"
        },
        body: JSON.stringify({
          error: "Respuesta SOAP incompleta",
          data
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io"
      },
      body: JSON.stringify({
        embedToken,
        embedUrl,
        reportId: outReportId
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://ejhonnatan.github.io"
      },
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
