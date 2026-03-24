exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    const surveyCode = event.queryStringParameters?.surveyCode;

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
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 9,
          number: 9,
          text: "La Dirección participa regular, directa o indirectamente, con grupos de pacientes y se presentan resultados periódicamente a la Dirección sobre la experiencia de los pacientes.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "Els resultats de les enquestes d’experiència del pacient (Opinat) es presenten periòdicament al Comitè Directiu i a la Junta de l’Institut per al seu seguiment i valoració per part de la Direcció. Aquest procés permet analitzar la percepció dels pacients i identificar oportunitats de millora en l’atenció. Les actes de les sessions i els informes de resultats es documenten com a evidència del seguiment per part de la Direcció.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 10,
          number: 10,
          text: "La organización facilita canales al personal de primera línea donde reportar mejoras y realizar propuestas para mejora de la experiencia de los pacientes. Da feedback en un periodo de tiempo determinado.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "El centre disposa d’una bústia de correu electrònic habilitada per a la recepció de suggeriments, propostes de millora i iniciatives dels professionals relacionades amb la qualitat assistencial. Aquest canal també està destinat a recollir propostes vinculades a la millora de l’experiència del pacient per part del personal del centre.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 11,
          number: 11,
          text: "La organización impulsa y premia propuestas orientadas a mejorar la experiencia de los pacientes. Se reconocen las iniciativas y buenas prácticas. Se impulsan y premian propuestas relacionadas con la evaluación y mejora de la experiencia de los pacientes.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 3,
          defaultEvidenceText:
            "El centre ha creat el ‘Premi a la Millor Iniciativa d’Experiència del Pacient’, un concurs intern per impulsar i reconèixer propostes dels professionals orientades a millorar l’experiència dels pacients i les seves famílies. Les iniciatives es presenten mitjançant una breu proposta i es valoren segons criteris d’impacte en l’experiència del pacient, innovació i viabilitat.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 12,
          number: 12,
          text: "La gestión de personas está alineada con la evaluación y mejora de la experiencia de los pacientes.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "El centre incorpora la dimensió d’Experiència del Pacient dins del Pla de Formació, amb accions formatives orientades a la humanització de l’atenció, la comunicació amb el pacient, el suport emocional i les decisions compartides, amb l’objectiu de reforçar les competències dels professionals en una atenció centrada en la persona.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 13,
          number: 13,
          text: "En el plan de acogida se contempla una formación específica en valores y aspectos clave de la experiencia del paciente.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 3,
          defaultEvidenceText:
            "El Pla d’Acollida dels nous professionals inclou la presentació del model d’Experiència del Pacient del centre i del Manual de Bones Pràctiques, on es recullen les principals dimensions de l’experiència del pacient (gestió del temps, accessibilitat, informació, tracte, coordinació, entorn físic, control del dolor i valors del pacient). Aquest contingut forma part de la integració inicial dels professionals.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 14,
          number: 14,
          text: "Se da formación específica, de forma regular, relacionada con los valores y la cultura enfocada en la experiencia de los pacientes.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "El centre promou formació específica i periòdica en Experiència del Pacient dins del Pla de Formació institucional, amb continguts orientats a la humanització de l’atenció, la comunicació amb el pacient i les decisions compartides. A més, en el document d’acollida dels nous professionals s’inclouen píndoles formatives sobre experiència del pacient i bones pràctiques assistencials.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 15,
          number: 15,
          text: "Los objetivos de las personas contemplan aspectos relacionados con la mejora de la experiencia de los pacientes.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 1,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 16,
          number: 16,
          text: "Se valora la participación en proyectos de mejora de la experiencia de los pacientes, formaciones específicas, participación en jornadas y congresos (visibilidad externa).",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 1,
          defaultEvidenceText:
            "El centre promou la participació dels professionals en formació, projectes de millora i activitats externes relacionades amb la qualitat assistencial i l’Experiència del Pacient. El Pla de Formació estableix criteris per facilitar l’assistència a cursos, jornades o congressos, incloent compensació d’hores de formació o suport econòmic segons les necessitats.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 17,
          number: 17,
          text: "Los profesionales están orientados y formados para ofrecer una atención humana, involucrando a los pacientes en la toma de decisiones, proporcionando soporte emocional, siendo sensibles y respetando valores y creencias.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 2,
          defaultEvidenceText:
            "Els professionals del centre són orientats i formats en els principis d’atenció centrada en la persona a través de les accions formatives incloses al Pla de Formació i recollides a la Política d’Experiència del Pacient. Aquestes formacions inclouen continguts relacionats amb la humanització de l’atenció, la comunicació amb el pacient, el suport emocional i les decisions compartides.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 18,
          number: 18,
          text: "La organización evalúa y tiene en cuenta el sentimiento de pertenencia de los profesionales, el orgullo y alineación con los valores, y la cultura orientada en la excelencia sobre la experiencia del paciente.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "L’organització avalua el sentiment de pertinença, compromís i alineació amb els valors mitjançant l’enquesta de clima i compromís professional adreçada a tot el personal del centre. L’enquesta inclou preguntes específiques relacionades amb l’orgull de pertinença, el compromís amb la missió i els valors, la satisfacció i la vinculació amb l’organització.",
          referenceFiles: ["Importar Documento"]
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
          defaultSelfScore: 4,
          defaultEvidenceText:
            "L’organització disposa de diversos canals estructurats per recollir la veu del pacient i de les seves famílies. Aquests inclouen enquestes d’experiència del pacient (OPINAT), enquestes telefòniques, canals digitals i presencials (web, xarxes socials, WhatsApp, formularis, bústies, reclamacions i suggeriments), així com metodologies qualitatives com entrevistes i grups focals. Els resultats es recullen periòdicament i es presenten a Direcció per al seu seguiment.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 20,
          number: 20,
          text: "La organización dispone de mecanismos para implicar a pacientes y familias.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "L’organització disposa de diversos mecanismes per implicar pacients i famílies, com enquestes, formularis, bústies de suggeriments, canals digitals i espais participatius com grups focals i grups de treball amb pacients per identificar oportunitats de millora en l’experiència assistencial. Aquests mecanismes estan recollits a la Política de participació ciutadana del centre.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 21,
          number: 21,
          text: "En los proyectos o iniciativas que la organización lleva a cabo se tiene en cuenta la participación, co-creación e implicación de los pacientes.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "L’organització disposa d’un document institucional per a la definició i gestió de projectes que incorpora l’anàlisi de la realitat i l’experiència del pacient en el disseny de les iniciatives. Aquest model preveu instruments com enquestes, entrevistes o grups de discussió per recollir la seva percepció i afavorir la participació dels pacients en la millora de l’atenció.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 22,
          number: 22,
          text: "Siempre que se solicita participación a los pacientes y familias, se da una respuesta oficial o feedback, en un periodo máximo determinado.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "El centre garanteix un retorn o resposta oficial als pacients i famílies quan se sol·licita la seva participació. Aquest compromís de feedback en un termini màxim establert està recollit a la Política de participació ciutadana del centre. Ho trobem en el document SALU-GG-POL-E-07-01. Punt 4.6.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 23,
          number: 23,
          text: "En los casos que se requiere tomar decisiones compartidas, se asegura la educación e información estructurada necesaria con el objetivo que los pacientes tomen sus decisiones fundamentadas en conocimiento.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "El centre disposa d’un protocol d’actuació sobre el Document de Voluntats Anticipades i el Consentiment Informat que garanteix que els pacients rebin informació clara i estructurada per participar en la presa de decisions sobre la seva atenció. Aquest procés inclou informació al pacient i la família, lliurament de documentació informativa i registre a la història clínica.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 24,
          number: 24,
          text: "En aquellos casos que los pacientes requieren de mayor información, se ofrecen pautas, información i/o formación específica en relación a los circuitos, los servicios, la estructura de la organización y el sistema de salud.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "El centre facilita informació i suport als pacients perquè puguin comprendre els circuits assistencials i participar en les decisions sobre la seva salut. A més de la informació proporcionada pels professionals i l’acompanyament del SEAR, s’han implementat materials informatius i missatges institucionals als espais del centre que promouen el dret del pacient a estar informat i orientat dins l’organització.",
          referenceFiles: ["Importar Documento"]
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
          defaultSelfScore: 3,
          defaultEvidenceText:
            "El centre ha iniciat el treball de mapatge de l’experiència del pacient mitjançant l’elaboració d’un Patient Journey Map del pacient traumatològic de mútua atès al servei d’urgències, amb l’objectiu d’identificar els principals punts de contacte i possibles àrees de millora des de la perspectiva del pacient i dels processos.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 26,
          number: 26,
          text: "Los principales procesos de la organización tienen segmentados los perfiles de paciente prevalente, identificando las principales necesidades por perfil.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 3,
          defaultEvidenceText:
            "En el procés analitzat s’han definit diferents perfils de pacient amb l’objectiu d’identificar les seves necessitats específiques. Concretament, en el treball realitzat sobre el circuit d’urgències s’ha elaborat un perfil principal i un perfil secundari de pacient traumatològic, fet que ha permès analitzar les seves necessitats, expectatives i possibles punts de millora al llarg del recorregut assistencial.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 27,
          number: 27,
          text: "Se lleva a cabo trabajo de campo para recoger la voz del paciente, de los perfiles más prevalentes (entrevistas, observaciones, grupos focales...).",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 28,
          number: 28,
          text: "A partir de la elaboración del patient journey map y el trabajo de campo se identifican los grandes ámbitos de mejora y se elabora un plan de trabajo con acciones específicas para cubrir las necesidades no cubiertas.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento"]
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
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Al nostre centre es prioritza la gestió del temps mitjançant ingressos directes a planta quan és possible, derivacions directes a especialistes des d’urgències i coordinació de proves i visites per reduir esperes i millorar la continuïtat assistencial.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 30,
          number: 30,
          text: "Se garantiza la accesibilidad a los profesionales. Los pacientes conocen los canales, disponibilidades, y saben cómo contactar con los servicios que le atienden.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Al nostre centre es garanteix l’accessibilitat als professionals mitjançant la inclusió de telèfons i canals de contacte als informes d’alta i la disponibilitat de diferents canals de comunicació recollits a la política de participació ciutadana.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 31,
          number: 31,
          text: "Se tiene en cuenta la adecuación del servicio (duración de la visita, si ha habido interrupciones, si el paciente ha entendido el diagnóstico/tratamiento, si ha podido tomar decisiones, si se ha sentido escuchado, si ha podido resolver todas sus dudas...).",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Al nostre centre es valora l’adequació del servei mitjançant l’enquesta de satisfacció (NPS), que incorpora ítems sobre temps d’espera, compliment d’horaris, qualitat de la informació i tracte rebut.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 32,
          number: 32,
          text: "Se garantiza el apoyo emocional y trato (se priorizan aspectos relacionados con la puntualidad, la proximidad, la amabilidad, la confianza y la implicación de la familia y el entorno).",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Al nostre centre es garanteix el suport emocional i el tracte mitjançant l’avaluació periòdica de la satisfacció del pacient (NPS), incloent aspectes com el tracte rebut, l’acompanyament i la relació amb els professionals.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 33,
          number: 33,
          text: "La atención garantiza la información al paciente, y que esta sea comprensible y útil. Se pone especial énfasis en caso de cambios y transiciones. Si procede, se proporciona al paciente información por otros canales y se facilitan fuentes de información.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Al nostre centre es garanteix la informació al pacient mitjançant l’entrega de fulls i recomanacions a urgències, informació sobre procediments i proves complementàries, i canals addicionals quan cal per facilitar comprensió i continuïtat.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 34,
          number: 34,
          text: "Siempre que los pacientes deben atenderse en otros dispositivos asistenciales se garantiza la coordinación e integración de la información.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Al nostre centre es garanteix la coordinació i integració de la informació mitjançant registre a la història clínica compartida i ús d’eines de coordinació per assegurar la continuïtat assistencial quan el pacient és derivat a altres dispositius.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 35,
          number: 35,
          text: "Se garantiza la adecuación de la prescripción y se tiene en cuenta el valor de la adherencia.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Al nostre centre es garanteix l’adequació de la prescripció i l’adherència als tractaments mitjançant l’aplicació del protocol de conciliació de la medicació, especialment en transicions assistencials.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 36,
          number: 36,
          text: "Se trabajan aspectos relacionados con el entorno físico, la luz, el ruido, la limpieza, la comodidad, el confort y la intimidad.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Al nostre centre es treballen aspectes de l’entorn físic a través de l’enquesta de satisfacció (Opinat), amb preguntes específiques sobre neteja, estat d’instal·lacions, confort, soroll i privacitat del pacient.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 37,
          number: 37,
          text: "Se tienen en cuenta aspectos relacionados con la propia percepción del dolor y se hace todo lo posible por medirlo y calmarlo.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Al nostre centre es té en compte la percepció del dolor mitjançant l’avaluació a través de l’enquesta de satisfacció (Opinat), que inclou preguntes específiques sobre la preocupació pel dolor i les molèsties del pacient.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 38,
          number: 38,
          text: "Se respetan los valores de los pacientes, tratando de valorar aspectos relacionados con el estilo de vida, la dignidad, creencias religiosas y espirituales, y la privacidad y el respeto.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "Al nostre centre es respecten els valors dels pacients mitjançant l’existència d’una figura específica d’acompanyament espiritual i religiós (SAER), espais per a la pràctica religiosa i protocols d’atenció respectuosa amb la dignitat i la privacitat.",
          referenceFiles: ["Importar Documento"]
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
          defaultSelfScore: 4,
          defaultEvidenceText:
            "El centre realitza el seguiment dels punts de contacte del recorregut del pacient mitjançant resultats de satisfacció de l’eina OPINAT, desglossats per processos assistencials (urgències, hospitalització, consultes externes, etc.), així com indicadors com NPS i anàlisi de motius per identificar àrees de millora.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 40,
          number: 40,
          text: "El cuadro de mandos recoge los indicadores operativos que permiten monitorizar el cumplimiento de las dimensiones clave.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "El centre disposa d’indicadors associats a dimensions clau de l’experiència del pacient (temps d’espera, satisfacció, informació, dolor, entre d’altres), obtinguts principalment a través de l’eina OPINAT i càlcul del NPS, que permeten monitoritzar-ne el compliment de forma periòdica.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 41,
          number: 41,
          text: "La organización implementa y recoge datos, de forma periódica y estructurada, relacionados con los patient reported experience measures (PREMs).",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 4,
          defaultEvidenceText:
            "El centre recull de forma periòdica i estructurada dades sobre l’experiència del pacient mitjançant diferents eines de mesura dels PREMs, com l’enquesta de satisfacció OPINAT i enquesta PLANSA, que inclouen ítems relacionats amb diverses dimensions de l’experiència del pacient.",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 42,
          number: 42,
          text: "La organización implementa y recoge datos, de forma periódica y estructurada, relacionados con los patient reported outcomes measures (PROMs) de los procesos/patologías principales.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 43,
          number: 43,
          text: "Se analiza periódicamente la tendencia de los indicadores clave.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 44,
          number: 44,
          text: "Se establecen objetivos concretos relacionados con la recogida de datos y los indicadores.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 45,
          number: 45,
          text: "La organización cuenta con un sistema de análisis de la voz del paciente obtenida mediante los distintos canales oficiales.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 46,
          number: 46,
          text: "La organización cuenta con un sistema de análisis de la voz de los pacientes obtenida durante el trabajo de campo del análisis de los distintos procesos.",
          category: "FUNDAMENTAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 47,
          number: 47,
          text: "Se elaboran informes periódicos, asegurando su difusión, con el resultado del análisis de la información.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
          referenceFiles: ["Importar Documento"]
        },
        {
          id: 48,
          number: 48,
          text: "Se identifican e implementan acciones de mejora a partir del resultado de la evaluación de la voz de los pacientes.",
          category: "GENERAL",
          required: true,
          defaultSelfScore: 0,
          defaultEvidenceText: "",
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
      "paex360-ambito2": ambito2,
      "paex360-ambito3": ambito3,
      "paex360-ambito4": ambito4,
      "paex360-ambito5": ambito5,
      "paex360-ambito6": ambito6
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
