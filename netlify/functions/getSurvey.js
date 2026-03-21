exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    const survey = {
      surveyCode: "paex360-certificacion-v1",
      title: "Encuesta de certificación Paex360",
      version: "1.0.0",
      totalQuestions: 8,
      questions: [
        {
          id: 1,
          number: 1,
          text: "La misión, visión y valores de la organización tienen en cuenta la experiencia de los pacientes.",
          category: "FUNDAMENTAL",
          required: true
        },
        {
          id: 2,
          number: 2,
          text: "La organización cuenta con políticas y lineamientos orientados a la experiencia del paciente.",
          category: "FUNDAMENTAL",
          required: true
        },
        {
          id: 3,
          number: 3,
          text: "Se identifican y priorizan oportunidades de mejora relacionadas con la experiencia del paciente.",
          category: "FUNDAMENTAL",
          required: true
        },
        {
          id: 4,
          number: 4,
          text: "La organización realiza seguimiento a planes de acción relacionados con experiencia del paciente.",
          category: "FUNDAMENTAL",
          required: true
        },
        {
          id: 5,
          number: 5,
          text: "Se cuenta con mecanismos para escuchar activamente la voz del paciente.",
          category: "FUNDAMENTAL",
          required: true
        },
        {
          id: 6,
          number: 6,
          text: "La experiencia del paciente está integrada en la cultura organizacional.",
          category: "FUNDAMENTAL",
          required: true
        },
        {
          id: 7,
          number: 7,
          text: "Los líderes promueven activamente prácticas centradas en el paciente.",
          category: "FUNDAMENTAL",
          required: true
        },
        {
          id: 8,
          number: 8,
          text: "La organización evidencia resultados derivados de la gestión de experiencia del paciente.",
          category: "FUNDAMENTAL",
          required: true
        }
      ]
    };

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
