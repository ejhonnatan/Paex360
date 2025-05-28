// 1️⃣  Manejar la petición preflight
exports.handler = async (event) => {
  // Si es preflight (OPTIONS) responde 200 y cabeceras CORS
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

  /* ... tu lógica existente ... */

  // 2️⃣  En TODAS las respuestas 200 añade las cabeceras CORS
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
};
