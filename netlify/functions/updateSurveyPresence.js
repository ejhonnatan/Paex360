const { getDb } = require("./db");
const { requireCenterUser } = require("./notificationAuth");
const { withSurveyTransaction } = require("./surveyConcurrency");
const { KEYS } = require("./surveyCollaboration");
const { handler:getResponse } = require("./getSurveyResponse");
const json = (statusCode, body) => ({statusCode, headers:{"Content-Type":"application/json","Cache-Control":"no-store"}, body:JSON.stringify(body)});
exports.handler = async event => {
  try {
    if (event.httpMethod !== "POST") return json(405, {error:"Método no permitido"});
    const body = JSON.parse(event.body || "{}");
    const surveyCode = String(body.surveyCode || "").trim();
    const center = String(body.center || "").trim().toLowerCase();
    const email = String(body.email || "").trim().toLowerCase();
    const sessionId = String(body.sessionId || "");
    const questionId = Number(body.questionId), questionNumber = Number(body.questionNumber);
    if (!surveyCode || !center || !email || !/^[a-zA-Z0-9-]{16,80}$/.test(sessionId) ||
        (!body.leave && (!Number.isSafeInteger(questionId) || questionId <= 0 || !Number.isSafeInteger(questionNumber) || questionNumber <= 0))) {
      return json(400, {error:"Datos de presencia no válidos"});
    }
    const user = await requireCenterUser(event, center, email);
    const participants = await withSurveyTransaction(getDb(), async db => {
      if (body.leave) {
        await db.execute({sql:"DELETE FROM survey_presence WHERE center_code = ? AND survey_code = ? AND session_id = ? AND user_email = ?", args:[center,surveyCode,sessionId,email]});
        return [];
      }
      await db.execute("DELETE FROM survey_presence WHERE updated_at < datetime('now', '-2 minutes')");
      const existing = await db.execute({sql:"SELECT user_email FROM survey_presence WHERE center_code = ? AND survey_code = ? AND session_id = ?",args:[center,surveyCode,sessionId]});
      if(existing.rows[0] && existing.rows[0].user_email !== email) {
        const error = new Error("Sesión de colaboración no válida"); error.statusCode=403;throw error;
      }
      await db.execute({
        sql:`INSERT INTO survey_presence(center_code,survey_code,session_id,user_email,user_name,question_id,question_number,active_field,is_editing)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(center_code,survey_code,session_id) DO UPDATE SET
          user_name=excluded.user_name, question_id=excluded.question_id, question_number=excluded.question_number,
          active_field=excluded.active_field,is_editing=excluded.is_editing,updated_at=CURRENT_TIMESTAMP`,
        args:[center,surveyCode,sessionId,email,user?.displayName || "",questionId,questionNumber,
          KEYS.includes(body.activeField) ? body.activeField : "",body.isEditing === true ? 1 : 0]
      });
      const result = await db.execute({sql:`SELECT session_id,survey_code,user_email,user_name,question_id,question_number,active_field,is_editing
        FROM survey_presence WHERE center_code = ? AND (CASE WHEN instr(survey_code, '@') > 0 THEN CAST(substr(survey_code, instr(survey_code, '@') + 1) AS INTEGER) ELSE 2026 END) = ? AND updated_at >= datetime('now', '-45 seconds') ORDER BY user_email`,args:[center,event.surveyYear]});
      return result.rows;
    });
    if(body.leave) return json(200,{ok:true});
    const saved = await getResponse({...event,body:JSON.stringify({surveyCode,center,email,year:event.surveyYear})});
    if(saved.statusCode !== 200) return saved;
    return json(200,{participants,...JSON.parse(saved.body)});
  } catch(error) { return json(error.statusCode || 500,{error:error.message}); }
};

const { withSurveyYear } = require("./surveyYears");
exports.handler = withSurveyYear(exports.handler);
