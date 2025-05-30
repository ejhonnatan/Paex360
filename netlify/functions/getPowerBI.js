// netlify/functions/getPowerBI.js
const soap = require("soap");

exports.handler = async (event) => {
  // 1) CORS preflight
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
    const WSDL = "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl";

    // 2) Creamos el cliente
    const client = await soap.createClientAsync(WSDL);

    // 3) Llamamos a la API usando los nombres exactos:
    const [raw] = await client.apiGetPowerBiAccessAsync({
      username,
      password,
      workspace_id: workspaceId,
      report_id:    reportId,
    });

    // 4) Desenrollamos la respuesta SOAP:
    //    raw.return.$value contiene la cadena JSON
    const jsonString = raw?.return?.$value;
    if (!jsonString) {
      console.error("POWER BI ERROR: no viene raw.return.$value:", raw);
      throw new Error("Respuesta SOAP sin valor");
    }

    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      console.error("POWER BI ERROR: JSON inválido:", jsonString);
      throw new Error("JSON de respuesta inválido");
    }

    // 5) Extraemos token, URL y reportId
    const embedToken  = data.embedToken?.token;
    const embedUrl    = data.embedReports?.[0]?.embedUrl;
    const outReportId = data.embedReports?.[0]?.id;

    if (!embedToken || !embedUrl || !outReportId) {
      console.error("POWER BI ERROR: estructura inesperada:", data);
      throw new Error("Respuesta inválida de la API SOAP");
    }

    // 6) Devolvemos éxito con CORS
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
