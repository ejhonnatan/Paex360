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
            "La missió, visió i valors institucionals incorporen l’atenció centrada en la persona i l’experiència del pacient, reflectida en principis com el respecte, l’empatia, l’acollida, el servei i la humilitat, tal com es recull a la Política d’Experiència del Pacient.",
          referenceFiles: [
            "SALUCAEXPE1001.pdf"
          ]
        },
        {
          id: 2,
          number: 2,
          text: "El Plan Estratégico del centro incluye como eje estratégico la mejora de la experiencia de los pacientes.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "El Pla Estratègic del centre incorpora l’experiència del pacient com a eix estratègic, situant les persones al centre de l’atenció i recollint les seves necessitats i preferències des de la planificació dels serveis, així com promovent una cultura d’atenció orientada a garantir una òptima experiència del pacient.",
          referenceFiles: [
            "SALUGGESTE0402.pdf"
          ]
        },
        {
          id: 3,
          number: 3,
          text: "La organización planifica e identifica la evaluación y mejora de la experiencia de los pacientes, aprobado por la Dirección y alineado con el resto de planes de la organización.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "L’organització disposa d’un model estructurat de planificació, avaluació i millora de l’experiència del pacient, recollit en la Política de participació ciutadana, que inclou mecanismes d’escolta activa, així com el seguiment mitjançant indicadors definits, orientats a la millora contínua dels processos i alineats amb el model assistencial del centre.",
          referenceFiles: [
            "SALUGGPOLE0701.pdf"
          ]
        },
        {
          id: 4,
          number: 4,
          text: "Las acciones planificadas en relación a la mejora de la experiencia paciente tienen en cuenta los grupos de interés clave y la participación de pacientes y profesionales.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Les accions de millora de l’experiència del pacient es planifiquen incorporant els grups d’interès clau, incloent pacients, famílies i professionals (apartat 4.1.1), així com la seva participació activa mitjançant diferents metodologies d’escolta i treball (apartat 4.1.2), integrant-se els resultats en la presa de decisions i en la millora dels processos assistencials.",
          referenceFiles: [
            "SALUCAEXPE1001.pdf"
          ]
        },
        {
          id: 5,
          number: 5,
          text: "Las acciones planificadas en relación con la experiencia paciente se ejecutan mediante un grupo multidisciplinar de profesionales y se rinden cuentas al equipo directivo.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 1,
          defaultEvidenceText:
            "Les accions de millora de l’experiència del pacient es desenvolupen mitjançant el PAO EXP, que inclou accions concretes amb responsables i equips de referència, integrant la participació de professionals i pacients, amb seguiment mitjançant indicadors i presentació periòdica dels resultats als òrgans de Direcció.",
          referenceFiles: [
            "SALUCAEXPE1001.pdf"
          ]
        },
        {
          id: 6,
          number: 6,
          text: "Las políticas clave del centro contemplan aspectos relacionados con la experiencia paciente (código ético, plan de humanización, plan de acogida, plan de género...).",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "Les polítiques clau del centre incorporen aspectes relacionats amb l’experiència del pacient, tal com es recull en la Política d’Experiència del Pacient, que s’alinea amb el Codi Ètic, el Canal Ètic, el Pla d’Acollida i els protocols assistencials, garantint una atenció centrada en la persona i orientada a la humanització i la qualitat assistencial.",
          referenceFiles: [
            "SALUCAEXPE1001.pdf"
          ]
        },
        {
          id: 7,
          number: 7,
          text: "Los proveedores y mercantiles están alineados con la política de humanización y experiencia de los pacientes.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "Els proveïdors i empreses mercantils estan alineats amb la política d’experiència del pacient, ja que han d’actuar d’acord amb el model d’atenció centrada en la persona i els valors institucionals, complir el Codi Ètic i subscriure un compromís formal en el procés de contractació, amb seguiment continu mitjançant el Canal Ètic, reclamacions i indicadors de qualitat.",
          referenceFiles: [
            "SALUCAEXPE1001.pdf"
          ]
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
