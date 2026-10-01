const ANSWER_FIELDS = {
  selfScore:["self_score", "Puntuación de autoevaluación"],
  evidenceText:["evidence_text", "Evidencia"],
  improvementActions:["improvement_actions", "Acciones de mejora"],
  tutorComments:["tutor_comments", "Comentarios de tutoría"],
  certifierScore:["certifier_score", "Evaluación de la certificadora"],
  certifierObservations:["certifier_observations", "Observaciones de la certificadora"]
};
async function ensureNotifications(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS survey_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT, center_code TEXT NOT NULL,
    survey_code TEXT NOT NULL, question_id INTEGER NOT NULL, question_number INTEGER NOT NULL,
    actor_email TEXT NOT NULL, kind TEXT NOT NULL, changed_fields TEXT NOT NULL,
    comment_preview TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.execute(`CREATE INDEX IF NOT EXISTS survey_notifications_center ON survey_notifications(center_code, id)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS survey_notification_reads (
    notification_id INTEGER NOT NULL, user_email TEXT NOT NULL,
    read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(notification_id, user_email)
  )`);
}
function changedAnswerFields(previous = {}, answer = {}) {
  return Object.keys(ANSWER_FIELDS).filter(key => {
    const column = ANSWER_FIELDS[key][0];
    const numeric = key === "selfScore" || key === "certifierScore";
    const before = previous[column] ?? (numeric ? null : "");
    const after = answer[key] ?? (numeric ? null : "");
    return numeric ? (before === null ? null : Number(before)) !== (after === null ? null : Number(after)) : String(before) !== String(after);
  });
}
async function addNotification(db, { center, surveyCode, questionId, questionNumber, email, kind, fields, preview = "" }) {
  await db.execute({
    sql:`INSERT INTO survey_notifications
      (center_code, survey_code, question_id, question_number, actor_email, kind, changed_fields, comment_preview)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args:[center, surveyCode, questionId, questionNumber, email, kind, JSON.stringify(fields), String(preview).slice(0,300)]
  });
}
module.exports = { ANSWER_FIELDS, ensureNotifications, changedAnswerFields, addNotification };
