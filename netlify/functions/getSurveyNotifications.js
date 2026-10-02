const { getDb } = require("./db");
const { notificationUser } = require("./notificationAuth");
const { ensureNotifications } = require("./surveyNotifications");
const json = (statusCode, body) => ({statusCode, headers:{ "Content-Type":"application/json", "Cache-Control":"no-store" }, body:JSON.stringify(body)});
exports.handler = async event => {
  try {
    if (event.httpMethod !== "POST") return json(405, {error:"Método no permitido"});
    const user = await notificationUser(event);
    const body = JSON.parse(event.body || "{}");
    const centers = body.center ? user.centers.filter(c => c === body.center) : user.centers;
    if (!centers.length) return json(200, {notifications:[], unreadCount:0});
    const db = getDb();
    await ensureNotifications(db);
    const allowed = centers.map(() => "?").join(",");
    const scope = `n.center_code IN (${allowed}) AND n.actor_email <> ?`;
    const args = [user.email, ...centers, user.email];
    const beforeId = Number(body.beforeId || 0);
    const list = await db.execute({
      sql:`SELECT n.*, CASE WHEN r.notification_id IS NULL THEN 0 ELSE 1 END AS is_read
        FROM survey_notifications n LEFT JOIN survey_notification_reads r
        ON r.notification_id = n.id AND r.user_email = ?
        WHERE ${scope} ${beforeId > 0 ? "AND n.id < ?" : ""} ORDER BY n.id DESC LIMIT 50`,
      args:beforeId > 0 ? [...args, beforeId] : args
    });
    const count = await db.execute({
      sql:`SELECT COUNT(*) AS unread_count FROM survey_notifications n LEFT JOIN survey_notification_reads r
        ON r.notification_id = n.id AND r.user_email = ? WHERE ${scope} AND r.notification_id IS NULL`, args
    });
    return json(200, {notifications:list.rows, unreadCount:Number(count.rows[0]?.unread_count || 0),
      nextBeforeId:list.rows.length === 50 ? Number(list.rows[49].id) : null});
  } catch(error) { return json(error.statusCode || 500, {error:error.message}); }
};

const { withSurveyYear } = require("./surveyYears");
exports.handler = withSurveyYear(exports.handler);
