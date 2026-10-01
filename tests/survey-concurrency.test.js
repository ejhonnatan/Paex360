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

test('una misma pregunta tiene un solo editor y rechaza guardados y adjuntos ajenos', async () => {
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

test('la pantalla recupera cambios recientes y permanece en consulta si falla el bloqueo', async () => {
  const html = fs.readFileSync(path.join(__dirname, '../survey.html'), 'utf8');
  const start = html.indexOf('    function setQuestionReadOnly');
  const end = html.indexOf('    async function releaseQuestionLockById', start);
  const control = () => ({ disabled: false });
  let reply = { locked:false, renewed:false };
  let fail = false;
  let reloaded = 0;
  const state = { isQuestionLockedByOther:true, currentUser:{email:'b'}, surveyData:{surveyCode:'s1'},
    center:'diagonal', lockedQuestionId:null, autosaveTimer:null, clearTimeout,
    evidenceText:control(), improvementActions:control(), tutorComments:control(),
    certifierObservations:control(), fileInput:control(), saveBtn:control(),
    document:{querySelectorAll:()=>[]}, getCurrentQuestion:()=>({id:1,number:1}),
    answers:{1:{evidenceText:'antiguo'}},
    mergeSavedAnswers(rows){ state.answers[1] = rows[0]; }, mergeUploadedDocuments(){},
    loadStateIntoForm(){ reloaded++; }, clearMessages(){}, showError(){}, setSaveState(){},
    async fetchJSON(url){ if(fail) throw new Error('offline');
      if(url.includes('acquire')) return reply;
      return {answers:[{question_id:1,evidence_text:'reciente'}],uploadedDocuments:[]}; }
  };
  vm.createContext(state);
  vm.runInContext(html.slice(start,end),state);
  await state.acquireQuestionLock({id:1,number:1});
  assert.equal(state.evidenceText.disabled,false);
  assert.equal(state.answers[1].evidence_text,'reciente');
  assert.equal(reloaded,1);
  reply={locked:false,renewed:true};
  await state.acquireQuestionLock({id:1,number:1});
  assert.equal(reloaded,1);
  reply={locked:true,ownerEmail:'a'};
  await state.acquireQuestionLock({id:1,number:1});
  assert.equal(state.evidenceText.disabled,true);
  fail=true;
  await state.acquireQuestionLock({id:1,number:1});
  assert.equal(state.saveBtn.disabled,true);
  fail=false; reply={locked:false,renewed:true};
  await state.acquireQuestionLock({id:1,number:1});
  assert.equal(reloaded,2);
  assert.equal(state.saveBtn.disabled,false);
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
