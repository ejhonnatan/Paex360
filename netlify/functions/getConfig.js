exports.handler = async () => {
  try {
    // =========================
    // 1) Leer env vars Netlify
    // =========================
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };

    // =========================
    // 2) Validación dura
    // =========================
    const faltantes = Object.entries(firebaseConfig)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    if (faltantes.length) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({
          error: "Faltan variables de entorno en Netlify",
          faltantes
        })
      };
    }

    // =========================
    // 3) Respuesta
    // =========================
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
