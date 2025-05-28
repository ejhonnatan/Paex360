// netlify/functions/getPowerBITestLogin.js
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
    const username = process.env.PBI_USER;
    const password = process.env.PBI_PASS;
    const WSDL = "https://bo-emea.opinat.com/index.php/ws/api-soap/ws?wsdl"; // o bo-latam
    
    const client = await soap.createClientAsync(WSDL);
    // Llamada al método de login
    const [loginRes] = await client.apiLoginAsync({ username, password });
    
    // Devolvemos el objeto completo para ver qué trae
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "https://ejhonnatan.github.io" },
      body: JSON.stringify(loginRes),
    };
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "https://ejhonnatan.github.io" },
      body: "LOGIN ERROR: " + err.message,
    };
  }
};
