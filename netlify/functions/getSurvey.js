exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    const surveyCode = event.queryStringParameters.surveyCode;

    if (!surveyCode) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "surveyCode requerido" })
      };
    }

    // 🔴 ÁMBITO 1 (TU ENCUESTA REAL)
    const ambito1 = {
      surveyCode: "paex360-ambito1",
      title: "Ámbito 1 Estrategia",
      version: "1.0.0",
      totalQuestions: 7,
      questions: [
        {
          id: 1,
          number: 1,
          text: "La misión, visión y valores de la organización tienen en cuenta la experiencia de los pacientes.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "La missió, visió i valors institucionals incorporen l’atenció centrada en la persona i l’experiència del pacient...",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 2,
          number: 2,
          text: "El Plan Estratégico del centro incluye como eje estratégico la mejora de la experiencia de los pacientes.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "El Pla Estratègic del centre incorpora l’experiència del pacient com a eix estratègic...",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 3,
          number: 3,
          text: "La organización planifica e identifica la evaluación y mejora de la experiencia de los pacientes...",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "L’organització disposa d’un model estructurat...",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 4,
          number: 4,
          text: "Las acciones planificadas en relación a la mejora de la experiencia paciente...",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Les accions de millora de l’experiència del pacient...",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 5,
          number: 5,
          text: "Las acciones planificadas en relación con la experiencia paciente se ejecutan...",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 1,
          defaultEvidenceText:
            "Les accions de millora de l’experiència del pacient es desenvolupen...",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 6,
          number: 6,
          text: "Las políticas clave del centro contemplan aspectos relacionados...",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "Les polítiques clau del centre incorporen aspectes...",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 7,
          number: 7,
          text: "Los proveedores y mercantiles están alineados con la política...",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "Els proveïdors i empreses mercantils estan alineats...",
          referenceFiles: ["Importar Documento"]
        }
      ]
    };

    // 🔹 GENERADOR PARA LOS OTROS ÁMBITOS
    function buildAmbito(code, title) {
      return {
        surveyCode: code,
        title: title,
        version: "1.0.0",
        totalQuestions: 7,
        questions: [
          {
            id: 1,
            number: 1,
            text: `${title} - Pregunta 1`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
            referenceFiles: []
          },
          {
            id: 2,
            number: 2,
            text: `${title} - Pregunta 2`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
            referenceFiles: []
          },
          {
            id: 3,
            number: 3,
            text: `${title} - Pregunta 3`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
            referenceFiles: []
          },
          {
            id: 4,
            number: 4,
            text: `${title} - Pregunta 4`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
            referenceFiles: []
          },
          {
            id: 5,
            number: 5,
            text: `${title} - Pregunta 5`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
            referenceFiles: []
          },
          {
            id: 6,
            number: 6,
            text: `${title} - Pregunta 6`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
            referenceFiles: []
          },
          {
            id: 7,
            number: 7,
            text: `${title} - Pregunta 7`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
            referenceFiles: []
          }
        ]
      };
    }

    // 🔹 TODAS LAS ENCUESTAS
    const surveys = {
      "paex360-ambito1": ambito1,
      "paex360-ambito2": buildAmbito("paex360-ambito2", "Ámbito 2 Liderazgo i Cultura"),
      "paex360-ambito3": buildAmbito("paex360-ambito3", "Ámbito 3 Estructura Participativa"),
      "paex360-ambito4": buildAmbito("paex360-ambito4", "Ámbito 4. PROCESOS"),
      "paex360-ambito5": buildAmbito("paex360-ambito5", "Ámbito 5 Procesos Clave"),
      "paex360-ambito6": buildAmbito("paex360-ambito6", "Ámbito 6 Evaluación de resultados")
    };

    const survey = surveys[surveyCode];

    if (!survey) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Encuesta no encontrada" })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify(survey)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Error obteniendo encuesta",
        detail: error.message
      })
    };
  }
};