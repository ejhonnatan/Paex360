const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`
    CREATE TABLE survey_response_headers (
      id INTEGER PRIMARY KEY, survey_code TEXT, center_code TEXT, respondent_email TEXT,
      respondent_name TEXT, status TEXT, current_question_number INTEGER,
      answered_questions_count INTEGER, total_questions INTEGER, created_at TEXT,
      updated_at TEXT, submitted_at TEXT, UNIQUE(survey_code, center_code, respondent_email));
    CREATE TABLE survey_response_answers (
      id INTEGER PRIMARY KEY, response_header_id INTEGER, question_id INTEGER, question_number INTEGER,
      self_score INTEGER, evidence_text TEXT, improvement_actions TEXT, tutor_comments TEXT,
      certifier_score INTEGER, certifier_observations TEXT, created_at TEXT, updated_at TEXT,
      UNIQUE(response_header_id, question_id));
    CREATE TABLE survey_uploaded_documents (
      id INTEGER PRIMARY KEY, response_header_id INTEGER, question_id INTEGER, question_number INTEGER,
      reference_file_name TEXT, original_file_name TEXT, mime_type TEXT, base64_content TEXT,
      byte_size INTEGER, created_at TEXT, updated_at TEXT, UNIQUE(response_header_id, question_id));
  `);
  function execute(query) {
    const sql = typeof query === 'string' ? query : query.sql;
    const args = typeof query === 'string' ? [] : query.args || [];
    const stmt = sqlite.prepare(sql);
    if (/^\s*SELECT/i.test(sql)) return Promise.resolve({ rows: stmt.all(...args) });
    return Promise.resolve({ rows: [], rowsAffected: Number(stmt.run(...args).changes) });
  }
  let queue = Promise.resolve();
  const db = { execute, async transaction() {
    const previous = queue;
    let release;
    queue = new Promise(resolve => { release = resolve; });
    await previous;
    sqlite.exec('BEGIN IMMEDIATE');
    return { execute, async commit() { sqlite.exec('COMMIT'); },
      async rollback() { sqlite.exec('ROLLBACK'); }, close() { release(); } };
  } };
  const cache = {};
  function load(name) {
    if (cache[name]) return cache[name];
    const module = { exports: {} };
    const source = fs.readFileSync(path.join(__dirname, '../netlify/functions', name + '.js'), 'utf8');
    vm.runInNewContext(source, { module, exports: module.exports, Buffer, console,
      require(id) { if (id === './db') return { getDb: () => db };
        if (id === './notificationAuth') return {
          async notificationUser(event) {
            const email = (event.headers?.authorization || '').replace('Bearer ', '');
            if (!email) { const e = new Error('No autenticado'); e.statusCode=401; throw e; }
            return {email,centers:email === 'admin' ? ['diagonal','salus','icr'] : email === 'salus' ? ['salus'] : ['diagonal']};
          },
          async requireCenterUser(event, center, email) {
            const actual = (event.headers?.authorization || '').replace('Bearer ', '');
            if(actual !== email) { const e=new Error('No autorizado');e.statusCode=403;throw e; }
            return {email:actual,displayName:actual + ' Nombre'};
          }
        };
        if (id.startsWith('./')) return load(id.slice(2)); return require(id); } });
    return cache[name] = module.exports;
  }
  async function call(name, email, questionId = 1, extra = {}) {
    return load(name).handler({ httpMethod: 'POST', headers:{authorization:`Bearer ${email}`}, body: JSON.stringify({
      surveyCode: 's1', center: 'diagonal', email, questionId, questionNumber: questionId,
      question: { id: questionId, number: questionId }, totalQuestions: 7,
      answer: { selfScore: 2, certifierScore: 4, certifierObservations: email },
      fileName: 'prueba.pdf', mimeType: 'application/pdf', base64Content: 'JVBERg==', ...extra
    }) });
  }
  return { sqlite, call };
}

test('usuarios simultáneos guardan preguntas distintas en una única encuesta', async () => {
  const { sqlite, call } = fixture();
  const locks = await Promise.all([call('acquireSurveyQuestionLock', 'a', 1), call('acquireSurveyQuestionLock', 'b', 2)]);
  locks.forEach(r => assert.equal(JSON.parse(r.body).locked, false));
  const saves = await Promise.all([call('upsertSurveyResponse', 'a', 1), call('upsertSurveyResponse', 'b', 2)]);
  saves.forEach(r => assert.equal(r.statusCode, 200));
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM survey_response_headers').get().n, 1);
  const answers = sqlite.prepare('SELECT certifier_score, certifier_observations FROM survey_response_answers ORDER BY question_id').all();
  assert.deepEqual(answers.map(r => [r.certifier_score, r.certifier_observations]), [[4, 'a'], [4, 'b']]);
});

test('clientes antiguos conservan bloqueo exclusivo hasta recargar la edición compartida', async () => {
  const { sqlite, call } = fixture();
  const locks = await Promise.all([call('acquireSurveyQuestionLock', 'a'), call('acquireSurveyQuestionLock', 'b')]);
  assert.deepEqual(locks.map(r => JSON.parse(r.body).locked), [false, true]);
  assert.equal((await call('upsertSurveyResponse', 'b')).statusCode, 423);
  assert.equal((await call('uploadSurveyDocument', 'b')).statusCode, 423);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM survey_response_headers').get().n, 0);
  assert.equal((await call('upsertSurveyResponse', 'a')).statusCode, 200);
  assert.equal((await call('uploadSurveyDocument', 'a')).statusCode, 200);
});

test('liberar y caducar bloqueos permite relevo sin perder respuestas ni documentos', async () => {
  const { sqlite, call } = fixture();
  await call('acquireSurveyQuestionLock', 'a');
  await call('upsertSurveyResponse', 'a');
  await call('uploadSurveyDocument', 'a');
  await call('releaseSurveyQuestionLock', 'b');
  assert.equal(JSON.parse((await call('acquireSurveyQuestionLock', 'b')).body).locked, true);
  await call('releaseSurveyQuestionLock', 'a');
  assert.equal(JSON.parse((await call('acquireSurveyQuestionLock', 'b')).body).renewed, false);
  const saved = JSON.parse((await call('getSurveyResponse', 'b')).body);
  assert.equal(saved.answers[0].certifier_observations, 'a');
  assert.equal(saved.uploadedDocuments.length, 1);
  assert.equal((await call('upsertSurveyResponse', 'b')).statusCode, 200);
  sqlite.exec("UPDATE survey_question_locks SET updated_at = datetime('now', '-3 minutes')");
  assert.equal((await call('upsertSurveyResponse', 'b')).statusCode, 423);
  assert.equal(JSON.parse((await call('acquireSurveyQuestionLock', 'a')).body).locked, false);
  assert.equal((await call('completeSurveyResponse', 'a')).statusCode, 200);
});

test('el bloqueo se separa por centro y encuesta y se renueva por su propietario', async () => {
  const { call } = fixture();
  await call('acquireSurveyQuestionLock', 'a');
  assert.equal(JSON.parse((await call('acquireSurveyQuestionLock', 'a')).body).renewed, true);
  assert.equal(JSON.parse((await call('acquireSurveyQuestionLock', 'b', 1, { center:'otro' })).body).locked, false);
  assert.equal(JSON.parse((await call('acquireSurveyQuestionLock', 'b', 1, { surveyCode:'s2' })).body).locked, false);
});

test('notificaciones identifican cambios reales, comentarios y archivos sin duplicar guardados idénticos', async () => {
  const { sqlite, call } = fixture();
  await call('acquireSurveyQuestionLock','a');
  assert.equal((await call('upsertSurveyResponse','a')).statusCode,200);
  assert.equal((await call('upsertSurveyResponse','a')).statusCode,200);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM survey_notifications').get().n,1);
  assert.equal((await call('upsertSurveyResponse','a',1,{answer:{selfScore:2, certifierScore:4, certifierObservations:'a',tutorComments:'Comentario de tutoría'}})).statusCode,200);
  assert.equal((await call('uploadSurveyDocument','a')).statusCode,200);
  const events=sqlite.prepare('SELECT * FROM survey_notifications ORDER BY id').all();
  assert.deepEqual(events.map(e=>e.kind),['answer_changed','tutor_comment','document_uploaded']);
  assert.equal(events[1].comment_preview,'Comentario de tutoría');
  assert.equal(events[1].question_id,1);
  assert.equal(events[1].center_code,'diagonal');
  assert.equal((await call('upsertSurveyResponse','b')).statusCode,423);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM survey_notifications').get().n,3);
});

test('bandeja excluye cambios propios, respeta centros y guarda lecturas por usuario', async () => {
  const { call } = fixture();
  await call('acquireSurveyQuestionLock','a'); await call('upsertSurveyResponse','a');
  const inbox=JSON.parse((await call('getSurveyNotifications','b',1,{center:''})).body);
  assert.equal(inbox.unreadCount,1); assert.equal(inbox.notifications.length,1);
  assert.equal(JSON.parse((await call('getSurveyNotifications','a',1,{center:''})).body).unreadCount,0);
  assert.equal(JSON.parse((await call('getSurveyNotifications','salus',1,{center:''})).body).notifications.length,0);
  assert.equal((await call('markSurveyNotificationRead','salus',1,{center:'diagonal',id:inbox.notifications[0].id})).statusCode,403);
  await call('markSurveyNotificationRead','b',1,{center:'',id:inbox.notifications[0].id});
  assert.equal(JSON.parse((await call('getSurveyNotifications','b',1,{center:''})).body).unreadCount,0);
  assert.equal(JSON.parse((await call('getSurveyNotifications','admin',1,{center:''})).body).unreadCount,1);
  await call('markSurveyNotificationRead','admin',1,{center:'',maxId:inbox.notifications[0].id});
  assert.equal(JSON.parse((await call('getSurveyNotifications','admin',1,{center:''})).body).unreadCount,0);
});

test('marcar leídas no consume avisos posteriores y paginación conserva el historial', async () => {
  const { sqlite, call } = fixture();
  await call('acquireSurveyQuestionLock','a'); await call('upsertSurveyResponse','a');
  const insert=sqlite.prepare(`INSERT INTO survey_notifications(center_code,survey_code,question_id,question_number,actor_email,kind,changed_fields) VALUES ('diagonal','s1',1,1,'a','answer_changed','[]')`);
  for(let i=0;i<55;i++) insert.run();
  const page=JSON.parse((await call('getSurveyNotifications','b',1,{center:''})).body);
  assert.equal(page.notifications.length,50); assert(page.nextBeforeId);
  const older=JSON.parse((await call('getSurveyNotifications','b',1,{center:'',beforeId:page.nextBeforeId})).body);
  assert.equal(older.notifications.length,6);
  insert.run();
  await call('markSurveyNotificationRead','b',1,{center:'',maxId:page.notifications[0].id});
  assert.equal(JSON.parse((await call('getSurveyNotifications','b',1,{center:''})).body).unreadCount,1);
});

test('autenticación usa Firebase y rechaza correos suplantados y centros sin permiso', async () => {
  const auth = require('../netlify/functions/notificationAuth');
  const previousFetch = global.fetch;
  const previousKey = process.env.FIREBASE_API_KEY;
  process.env.FIREBASE_API_KEY = 'test-only';
  let enabled = true;
  global.fetch = async (url, options) => {
    assert(url.startsWith('https://identitytoolkit.googleapis.com/v1/accounts:lookup'));
    assert.equal(JSON.parse(options.body).idToken,'test-token');
    return { ok:enabled, json:async()=>enabled ? {users:[{email:'ejhonnatan@hotmail.com'}]} : {error:{message:'INVALID_ID_TOKEN'}} };
  };
  const event={headers:{authorization:'Bearer test-token'}};
  try {
    await assert.rejects(auth.notificationUser({headers:{}}), {statusCode:401});
    const user=await auth.notificationUser(event);
    assert.equal(user.email,'ejhonnatan@hotmail.com');
    assert.deepEqual(user.centers,['diagonal','salus','icr']);
    await assert.rejects(auth.requireCenterUser(event,'diagonal','otro@example.com'), {statusCode:403});
    await assert.rejects(auth.requireCenterUser(event,'centro-inexistente',user.email), {statusCode:403});
    enabled=false;
    await assert.rejects(auth.notificationUser(event), {statusCode:401});
  } finally {
    global.fetch=previousFetch;
    if(previousKey === undefined) delete process.env.FIREBASE_API_KEY; else process.env.FIREBASE_API_KEY=previousKey;
  }
});

test('el aviso y la respuesta se guardan juntos o se revierten juntos', async () => {
  const {sqlite,call}=fixture();
  await call('acquireSurveyQuestionLock','a');
  sqlite.exec(`CREATE TRIGGER fail_notification BEFORE INSERT ON survey_notifications BEGIN SELECT RAISE(ABORT, 'test_failure'); END;`);
  assert.equal((await call('upsertSurveyResponse','a')).statusCode,500);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM survey_response_answers').get().n,0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM survey_notifications').get().n,0);
  sqlite.exec('DROP TRIGGER fail_notification');
  assert.equal((await call('upsertSurveyResponse','a')).statusCode,200);
});

test('el enlace selecciona el ámbito y la pregunta solicitados al entrar en la encuesta', () => {
  const html=fs.readFileSync(path.join(__dirname,'../survey.html'),'utf8');
  const code=html.match(/let currentSurveyCode = [\s\S]*?;/)[0];
  const selection=html.match(/const requestedQuestion = [\s\S]*?if \(requestedIndex >= 0\) currentQuestionIndex = requestedIndex;/)[0];
  const state={params:new URLSearchParams('survey=paex360-ambito2&question=9'),surveyData:{questions:[{id:8},{id:9}]},currentQuestionIndex:0};
  vm.createContext(state);
  vm.runInContext(code+'globalThis.selectedSurvey = currentSurveyCode;'+selection,state);
  assert.equal(state.selectedSurvey,'paex360-ambito2');assert.equal(state.currentQuestionIndex,1);
  const invalid={params:new URLSearchParams('survey=invalid&question=999'),surveyData:{questions:[{id:8},{id:9}]},currentQuestionIndex:0};
  vm.createContext(invalid);vm.runInContext(code+'globalThis.selectedSurvey = currentSurveyCode;'+selection,invalid);
  assert.equal(invalid.selectedSurvey,'paex360-ambito1');assert.equal(invalid.currentQuestionIndex,0);
});

const COLLAB_BASE = {selfScore:0,evidenceText:'',improvementActions:'',tutorComments:'',certifierScore:null,certifierObservations:''};

test('dos editores guardan campos distintos de la misma pregunta sin sobrescribirse', async () => {
  const {sqlite,call}=fixture();
  const responses=await Promise.all([
    call('upsertSurveyResponse','a',1,{baseAnswer:COLLAB_BASE,changedFields:['evidenceText'],answer:{...COLLAB_BASE,evidenceText:'Evidencia de A'}}),
    call('upsertSurveyResponse','b',1,{baseAnswer:COLLAB_BASE,changedFields:['tutorComments'],answer:{...COLLAB_BASE,tutorComments:'Tutoría de B'}})
  ]);
  responses.forEach(response=>assert.equal(response.statusCode,200));
  const answer=sqlite.prepare('SELECT * FROM survey_response_answers').get();
  assert.equal(answer.evidence_text,'Evidencia de A');assert.equal(answer.tutor_comments,'Tutoría de B');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM survey_response_headers').get().n,1);
  assert.equal(JSON.parse(responses[1].body).answer.evidenceText,'Evidencia de A');
});

test('conflicto en un mismo campo conserva el servidor y permite elegir una versión', async () => {
  const {sqlite,call}=fixture();
  const patch={baseAnswer:COLLAB_BASE,changedFields:['evidenceText']};
  await call('upsertSurveyResponse','a',1,{...patch,answer:{...COLLAB_BASE,evidenceText:'Versión A'}});
  const conflict=await call('upsertSurveyResponse','b',1,{...patch,answer:{...COLLAB_BASE,evidenceText:'Versión B'}});
  assert.equal(conflict.statusCode,409);
  const detail=JSON.parse(conflict.body);
  assert.deepEqual(detail.conflicts,['evidenceText']);
  assert.equal(detail.currentAnswer.evidenceText,'Versión A');
  assert.equal(sqlite.prepare('SELECT evidence_text FROM survey_response_answers').get().evidence_text,'Versión A');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM survey_notifications').get().n,1);
  const resolved=await call('upsertSurveyResponse','b',1,{baseAnswer:detail.currentAnswer,changedFields:['evidenceText'],answer:{...detail.currentAnswer,evidenceText:'Versión B'}});
  assert.equal(resolved.statusCode,200);
  assert.equal(sqlite.prepare('SELECT evidence_text FROM survey_response_answers').get().evidence_text,'Versión B');
});

test('reintentar el mismo cambio y guardar sin campos modificados no deshace cambios ajenos', async () => {
  const {sqlite,call}=fixture();
  const patch={baseAnswer:COLLAB_BASE,changedFields:['evidenceText'],answer:{...COLLAB_BASE,evidenceText:'Coincidente'}};
  await call('upsertSurveyResponse','a',1,patch);
  assert.equal((await call('upsertSurveyResponse','b',1,patch)).statusCode,200);
  assert.equal((await call('upsertSurveyResponse','c',1,{baseAnswer:COLLAB_BASE,changedFields:[],answer:COLLAB_BASE})).statusCode,200);
  assert.equal(sqlite.prepare('SELECT evidence_text FROM survey_response_answers').get().evidence_text,'Coincidente');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM survey_notifications').get().n,1);
  assert.equal((await call('upsertSurveyResponse','c',1,{baseAnswer:{},changedFields:['evidenceText']})).statusCode,400);
  assert.equal((await call('upsertSurveyResponse','c',1,{baseAnswer:COLLAB_BASE,changedFields:['inexistente']})).statusCode,400);
});

test('adjuntos simultáneos de la misma pregunta mantienen ambos documentos', async () => {
  const {sqlite,call}=fixture();
  const results=await Promise.all([
    call('uploadSurveyDocument','a',1,{collaborative:true}),
    call('uploadSurveyDocument','b',1,{collaborative:true})
  ]);
  results.forEach(result=>assert.equal(result.statusCode,200));
  const docs=sqlite.prepare('SELECT question_id FROM survey_uploaded_documents ORDER BY id').all();
  assert.deepEqual(docs.map(doc=>doc.question_id),[100001,100002]);
});

test('presencia muestra identidad verificada, pregunta y campo y caduca sesiones desconectadas', async () => {
  const {sqlite,call}=fixture();
  const a={sessionId:'session-a-0000000001',activeField:'evidenceText',isEditing:true};
  const b={sessionId:'session-b-0000000002',activeField:'tutorComments',isEditing:false};
  assert.equal((await call('updateSurveyPresence','a',1,a)).statusCode,200);
  const result=await call('updateSurveyPresence','b',2,b);
  assert.equal(result.statusCode,200);
  const people=JSON.parse(result.body).participants;
  assert.equal(people.length,2);
  assert.equal(people[0].user_email,'a');assert.equal(people[0].user_name,'a Nombre');
  assert.equal(people[0].active_field,'evidenceText');assert.equal(people[0].is_editing,1);
  assert.equal(people[1].question_number,2);
  assert.equal((await call('updateSurveyPresence','b',1,a)).statusCode,403);
  sqlite.exec("UPDATE survey_presence SET updated_at=datetime('now','-46 seconds') WHERE user_email='a'");
  assert.equal(JSON.parse((await call('updateSurveyPresence','b',2,b)).body).participants.length,1);
  await call('updateSurveyPresence','b',2,{...b,leave:true});
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM survey_presence WHERE user_email='b'").get().n,0);
});

test('clientes antiguos no pueden sobrescribir a editores conectados con la nueva versión', async () => {
  const {call}=fixture();
  await call('acquireSurveyQuestionLock','a');
  await call('updateSurveyPresence','b',1,{sessionId:'session-b-0000000002'});
  assert.equal((await call('upsertSurveyResponse','a')).statusCode,423);
});

test('sincronización conserva borradores locales y cambios escritos durante un guardado', () => {
  const code=fs.readFileSync(path.join(__dirname,'../collaboration.js'),'utf8').replace(/export /g,'');
  const context={};vm.createContext(context);vm.runInContext(code,context);
  const local={...COLLAB_BASE,evidenceText:'Mi borrador'};
  const remote={...COLLAB_BASE,tutorComments:'Comentario remoto'};
  const merged=context.reconcileRemote(COLLAB_BASE,local,remote);
  assert.equal(merged.local.evidenceText,'Mi borrador');assert.equal(merged.local.tutorComments,'Comentario remoto');
  assert.equal(merged.base.evidenceText,'');assert.equal(merged.base.tutorComments,'Comentario remoto');
  const duringSave={...local,evidenceText:'Mi borrador más reciente'};
  const saved=context.reconcileSaved(local,duringSave,{...local,tutorComments:'Comentario remoto'});
  assert.equal(saved.local.evidenceText,'Mi borrador más reciente');assert.equal(saved.base.evidenceText,'Mi borrador');
  assert.equal(saved.local.tutorComments,'Comentario remoto');
});

test('tres colaboradores combinan preguntas y campos y sus cambios generan avisos separados', async () => {
  const {sqlite,call}=fixture();
  const results=await Promise.all([
    call('upsertSurveyResponse','a',1,{baseAnswer:COLLAB_BASE,changedFields:['evidenceText'],answer:{...COLLAB_BASE,evidenceText:'A'}}),
    call('upsertSurveyResponse','b',1,{baseAnswer:COLLAB_BASE,changedFields:['tutorComments'],answer:{...COLLAB_BASE,tutorComments:'B'}}),
    call('upsertSurveyResponse','c',1,{baseAnswer:COLLAB_BASE,changedFields:['certifierScore'],answer:{...COLLAB_BASE,certifierScore:4}})
  ]);
  results.forEach(response=>assert.equal(response.statusCode,200));
  const saved=sqlite.prepare('SELECT * FROM survey_response_answers').get();
  assert.equal(saved.evidence_text,'A');assert.equal(saved.tutor_comments,'B');assert.equal(saved.certifier_score,4);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM survey_notifications').get().n,3);
});

test('una puntuación pendiente no se convierte automáticamente en cero', () => {
  const html=fs.readFileSync(path.join(__dirname,'../survey.html'),'utf8');
  const start=html.indexOf('    function createScoreOptions('),end=html.indexOf('    const documentViewer',start);
  const makeNode=()=>({children:[],appendChild(child){this.children.push(child);},addEventListener(){}});
  const state={document:{createElement:makeNode}};vm.createContext(state);vm.runInContext(html.slice(start,end),state);
  const group=makeNode();state.createScoreOptions(group,'certifierScore',null);
  assert(group.children.every(label=>label.children.find(child=>'checked' in child)?.checked === false));
});

test('presencia muestra otros ámbitos del mismo centro y separa centros diferentes', async () => {
  const {call}=fixture();
  await call('updateSurveyPresence','a',1,{sessionId:'session-a-0000000001',surveyCode:'s1'});
  const scope=await call('updateSurveyPresence','b',2,{sessionId:'session-b-0000000002',surveyCode:'s2'});
  assert.deepEqual(JSON.parse(scope.body).participants.map(person=>person.survey_code),['s1','s2']);
  const otherCenter=await call('updateSurveyPresence','admin',1,{sessionId:'session-c-0000000003',center:'salus'});
  assert.equal(JSON.parse(otherCenter.body).participants.length,1);
});
