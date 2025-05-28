// netlify/functions/getPowerBI.js
import soap from "soap";

export async function handler(event) {
  try {
    const { workspaceId, reportId } = JSON.parse(event.body);

    // credenciales guardadas como variables de entorno
    const username = process.env.PBI_USER;
    const password = process.env.PBI_PASS;

    const WSDL =
      "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl";  // o latam

    const client = await soap.createClientAsync(WSDL);

    const [raw] = await client.apiGetPowerBiAccessAsync({
      username,
      password,
      workspaceId,
      reportId,
    });

    const data = JSON.parse(raw);

    return {
      statusCode: 200,
      body: JSON.stringify({
        embedToken: data.embedToken.token,
        embedUrl:  data.embedReports[0].embedUrl,
        reportId:  data.embedReports[0].id,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: "Error generando token" };
  }
}
