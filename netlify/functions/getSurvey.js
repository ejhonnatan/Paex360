exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    const queryParams = event.queryStringParameters || {};
    const surveyCode = queryParams.surveyCode;

    if (!surveyCode) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "surveyCode requerido" })
      };
    }

    // 🔴 ÁMBITO 1
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
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 2,
          number: 2,
          text: "El Plan Estratégico del centro incluye como eje estratégico la mejora de la experiencia de los pacientes.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 3,
          number: 3,
          text: "La organización planifica e identifica la evaluación y mejora de la experiencia de los pacientes...",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 4,
          number: 4,
          text: "Las acciones planificadas en relación a la mejora de la experiencia paciente...",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 5,
          number: 5,
          text: "Las acciones planificadas en relación con la experiencia paciente se ejecutan...",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 6,
          number: 6,
          text: "Las políticas clave del centro contemplan aspectos relacionados...",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 7,
          number: 7,
          text: "Los proveedores y mercantiles están alineados con la política...",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        }
      ]
    };

    // 🔴 ÁMBITO 2
    const ambito2 = {
      surveyCode: "paex360-ambito2",
      title: "Ámbito 2 Liderazgo i Cultura",
      version: "1.0.0",
      totalQuestions: 11,
      questions: [
        {
          id: 8,
          number: 8,
          text: "La organización tiene un liderazgo y funciones claras a la hora de evaluar e implementar mejoras relacionadas con la experiencia de los pacientes.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 9,
          number: 9,
          text: "La Dirección participa regular, directa o indirectamente, con grupos de pacientes y se presentan resultados periódicamente a la Dirección sobre la experiencia de los pacientes.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 10,
          number: 10,
          text: "La organización facilita canales al personal de primera línea donde reportar mejoras y realizar propuestas para mejora de la experiencia de los pacientes. Da feedback en un periodo de tiempo determinado.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 11,
          number: 11,
          text: "La organización impulsa y premia propuestas orientadas a mejorar la experiencia de los pacientes. Se reconocen las iniciativas y buenas prácticas. Se impulsan y premian propuestas relacionadas con la evaluación y mejora de la experiencia de los pacientes.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 12,
          number: 12,
          text: "La gestión de personas está alineada con la evaluación y mejora de la experiencia de los pacientes.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 13,
          number: 13,
          text: "En el plan de acogida se contempla una formación específica en valores y aspectos clave de la experiencia del paciente.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 14,
          number: 14,
          text: "Se da formación específica, de forma regular, relacionada con los valores y la cultura enfocada en la experiencia de los pacientes.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 15,
          number: 15,
          text: "Los objetivos de las personas contemplan aspectos relacionados con la mejora de la experiencia de los pacientes.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 16,
          number: 16,
          text: "Se valora la participación en proyectos de mejora de la experiencia de los pacientes, formaciones específicas, participación en jornadas y congresos (visibilidad externa).",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 17,
          number: 17,
          text: "Los profesionales están orientados y formados para ofrecer una atención humana, involucrando a los pacientes en la toma de decisiones, proporcionando soporte emocional, siendo sensibles y respetando valores y creencias.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 18,
          number: 18,
          text: "La organización evalúa y tiene en cuenta el sentimiento de pertenencia de los profesionales, el orgullo y alineación con los valores, y la cultura orientada en la excelencia sobre la experiencia del paciente.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        }
      ]
    };

    // 🔴 ÁMBITO 3
    const ambito3 = {
      surveyCode: "paex360-ambito3",
      title: "Ámbito 3 Estructura Participativa",
      version: "1.0.0",
      totalQuestions: 7,
      questions: [
        {
          id: 19,
          number: 19,
          text: "La organización cuenta con distintos canales oficiales que garantizan la recogida de la voz del paciente, accesible a los distintos segmentos de pacientes.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 20,
          number: 20,
          text: "La organización dispone de mecanismos para implicar a pacientes y familias.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 21,
          number: 21,
          text: "En los proyectos o iniciativas que la organización lleva a cabo se tiene en cuenta la participación, co-creación e implicación de los pacientes.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 22,
          number: 22,
          text: "Siempre que se solicita participación a los pacientes y familias, se da una respuesta oficial o feedback, en un periodo máximo determinado.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 23,
          number: 23,
          text: "En los casos que se requiere tomar decisiones compartidas, se asegura la educación e información estructurada necesaria con el objetivo que los pacientes tomen sus decisiones fundamentadas en conocimiento.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 24,
          number: 24,
          text: "En aquellos casos que los pacientes requieren de mayor información, se ofrecen pautas, información i/o formación específica en relación a los circuitos, los servicios, la estructura de la organización y el sistema de salud.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        }
      ]
    };

    // 🔴 ÁMBITO 4
    const ambito4 = {
      surveyCode: "paex360-ambito4",
      title: "Ámbito 4. PROCESOS",
      version: "1.0.0",
      totalQuestions: 5,
      questions: [
        {
          id: 25,
          number: 25,
          text: "Se realiza el patient journey map de los principales procesos de la organización, identificando los principales pain points desde la perspectiva del paciente y desde la perspectiva de los procesos.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 26,
          number: 26,
          text: "Los principales procesos de la organización tienen segmentados los perfiles de paciente prevalente, identificando las principales necesidades por perfil.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 27,
          number: 27,
          text: "Se lleva a cabo trabajo de campo para recoger la voz del paciente, de los perfiles más prevalentes (entrevistas, observaciones, grupos focales...).",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 28,
          number: 28,
          text: "A partir de la elaboración del patient journey map y el trabajo de campo se identifican los grandes ámbitos de mejora y se elabora un plan de trabajo con acciones específicas para cubrir las necesidades no cubiertas.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        }
      ]
    };

    // 🔴 ÁMBITO 5
    const ambito5 = {
      surveyCode: "paex360-ambito5",
      title: "Ámbito 5 Procesos Clave",
      version: "1.0.0",
      totalQuestions: 11,
      questions: [
        {
          id: 29,
          number: 29,
          text: "Se prioriza la gestión del tiempo(se garantizan aspectos como: la coordinación de pruebas y visitas, la adecuación de canales de atención, el cumplimiento de citas y horarios...).",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 30,
          number: 30,
          text: "Se garantiza la accesibilidad a los profesionales. Los pacientes conocen los canales, disponibilidades, y saben cómo contactar con los servicios que le atienden.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 31,
          number: 31,
          text: "Se tiene en cuenta la adecuación del servicio (duración de la visita, si ha habido interrupciones, si el paciente ha entendido el diagnóstico/tratamiento, si ha podido tomar decisiones, si se ha sentido escuchado, si ha podido resolver todas sus dudas...).",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 32,
          number: 32,
          text: "Se garantiza el apoyo emocional y trato (se priorizan aspectos relacionados con la puntualidad, la proximidad, la amabilidad, la confianza y la implicación de la familia y el entorno).",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 33,
          number: 33,
          text: "La atención garantiza la información al paciente, y que esta sea comprensible y útil. Se pone especial énfasis en caso de cambios y transiciones. Si procede, se proporciona al paciente información por otros canales y se facilitan fuentes de información.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 34,
          number: 34,
          text: "Siempre que los pacientes deben atenderse en otros dispositivos asistenciales se garantiza la coordinación e integración de la información.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 35,
          number: 35,
          text: "Se garantiza la adecuación de la prescripción y se tiene en cuenta el valor de la adherencia.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 36,
          number: 36,
          text: "Se trabajan aspectos relacionados con el entorno físico, la luz, el ruido, la limpieza, la comodidad, el confort y la intimidad.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 37,
          number: 37,
          text: "Se tienen en cuenta aspectos relacionados con la propia percepción del dolor y se hace todo lo posible por medirlo y calmarlo.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 38,
          number: 38,
          text: "Se respetan los valores de los pacientes, tratando de valorar aspectos relacionados con el estilo de vida, la dignidad, creencias religiosas y espirituales, y la privacidad y el respeto.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        }
      ]
    };

    // 🔴 ÁMBITO 6
    const ambito6 = {
      surveyCode: "paex360-ambito6",
      title: "Ámbito 6 Evaluación de resultados",
      version: "1.0.0",
      totalQuestions: 13,
      questions: [
        {
          id: 39,
          number: 39,
          text: "El cuadro de mandos realiza el seguimiento de los puntos de contacto clave del recorrido del paciente en los procesos principales de la organización.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 40,
          number: 40,
          text: "El cuadro de mandos recoge los indicadores operativos que permiten monitorizar el cumplimiento de las dimensiones clave.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 41,
          number: 41,
          text: "La organización implementa y recoge datos, de forma periódica y estructurada, relacionados con los patient reported experience measures (PREMs).",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 42,
          number: 42,
          text: "La organización implementa y recoge datos, de forma periódica y estructurada, relacionados con los patient reported outcomes measures (PROMs) de los procesos/patologías principales.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 43,
          number: 43,
          text: "Se analiza periódicamente la tendencia de los indicadores clave.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 44,
          number: 44,
          text: "Se establecen objetivos concretos relacionados con la recogida de datos y los indicadores.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 45,
          number: 45,
          text: "La organización cuenta con un sistema de análisis de la voz del paciente obtenida mediante los distintos canales oficiales.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 46,
          number: 46,
          text: "La organización cuenta con un sistema de análisis de la voz de los pacientes obtenida durante el trabajo de campo del análisis de los distintos procesos.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 47,
          number: 47,
          text: "Se elaboran informes periódicos, asegurando su difusión, con el resultado del análisis de la información.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
        },
        {
          id: 48,
          number: 48,
          text: "Se identifican e implementan acciones de mejora a partir del resultado de la evaluación de la voz de los pacientes.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
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
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
          },
          {
            id: 2,
            number: 2,
            text: `${title} - Pregunta 2`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
          },
          {
            id: 3,
            number: 3,
            text: `${title} - Pregunta 3`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
          },
          {
            id: 4,
            number: 4,
            text: `${title} - Pregunta 4`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
          },
          {
            id: 5,
            number: 5,
            text: `${title} - Pregunta 5`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
          },
          {
            id: 6,
            number: 6,
            text: `${title} - Pregunta 6`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
          },
          {
            id: 7,
            number: 7,
            text: `${title} - Pregunta 7`,
            category: "GENERAL",
            required: true,
            defaultSelfScore: 0,
            defaultEvidenceText: "",
          referenceFiles: ["Importar Documento 1", "Importar Documento 2"]
          }
        ]
      };
    }

    // 🔹 TODAS LAS ENCUESTAS
    const surveys = {
      "paex360-ambito1": ambito1,
      "paex360-ambito2": ambito2,
      "paex360-ambito3": ambito3,
      "paex360-ambito4": ambito4,
      "paex360-ambito5": ambito5,
      "paex360-ambito6": ambito6
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
