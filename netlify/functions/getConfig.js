exports.handler = async () => {
  try {
    // ✅ Pega aquí tu firebaseConfig (NO es secreto)
    const firebaseConfig = {
      apiKey: "PEGA_AQUI",
      authDomain: "PEGA_AQUI",
      projectId: "PEGA_AQUI",
      storageBucket: "PEGA_AQUI",
      messagingSenderId: "PEGA_AQUI",
      appId: "PEGA_AQUI"
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify(firebaseConfig)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Error getConfig", message: err.message })
    };
  }
};
