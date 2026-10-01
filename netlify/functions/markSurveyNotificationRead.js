const { getDb } = require("./db");
const { notificationUser } = require("./notificationAuth");
const { ensureNotifications } = require("./surveyNotifications");
const json = (statusCode, body) => ({statusCode, headers:{ "Content-Type":"application/json", "Cache-Control":"no-store" }, body:JSON.stringify(body)});
exports.handler = async event => {
  try {
    if (event.httpMethod !== "POST") return json(405, {error:"Método no permitido"});
    const user = await notificationUser(event);
    const body = JSON.parse(event.body || "{}");
    const id = Number(body.id || body.maxId || 0);
    if (!Number.isSafeInteger(id) || id <= 0) return json(400, {error:"Notificación no válida"});
    const centers = body.center ? user.centers.filter(c => c === body.center) : user.centers;
    if (!centers.length) return json(403, {error:"Sin acceso a las notificaciones de este centro"});
    const db = getDb();
    await ensureNotifications(db);
    await db.execute({
      sql:`INSERT OR IGNORE INTO survey_notification_reads (notification_id, user_email)
        SELECT id, ? FROM survey_notifications WHERE id ${body.id ? "=" : "<="} ?
        AND center_code IN (${centers.map(() => "?").join(",")}) AND actor_email <> ?`,
      args:[user.email, id, ...centers, user.email]
    });
    return json(200, {ok:true});
  } catch(error) { return json(error.statusCode || 500, {error:error.message}); }
};
