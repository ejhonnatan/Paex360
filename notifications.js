const CENTERS = { diagonal:"Clínica Diagonal", salus:"Clínica SALUS", icr:"ICR" };
const FIELDS = { selfScore:"Autoevaluación", evidenceText:"Evidencia", improvementActions:"Acciones de mejora",
  tutorComments:"Comentarios de tutoría", certifierScore:"Evaluación de la certificadora",
  certifierObservations:"Observaciones de la certificadora", documents:"Documentos adjuntos" };
let stop = () => {};
export function initNotifications(user, { beforeNavigate } = {}) {
  stop();
  if (!user) return;
  const host = document.querySelector(".topbar .actions, .topbar .userbar, .topbar");
  if (!host) return;
  const widget = document.createElement("div");
  widget.className = "notification-widget";
  widget.innerHTML = `<button type="button" class="notification-bell" aria-expanded="false" aria-controls="notificationPanel">🔔 Notificaciones <span class="notification-badge" hidden></span></button>
    <section class="notification-panel" id="notificationPanel" aria-label="Notificaciones" hidden>
      <div class="notification-header"><h2>Notificaciones</h2><button type="button" class="notification-action notification-mark">Marcar todas leídas</button><button type="button" class="notification-action notification-close" aria-label="Cerrar notificaciones">Cerrar</button></div>
      <p class="notification-status" role="status">Cargando notificaciones...</p><div class="notification-list"></div>
      <button type="button" class="notification-action notification-more" hidden>Ver anteriores</button>
    </section>`;
  host.append(widget);
  const bell = widget.querySelector(".notification-bell");
  const badge = widget.querySelector(".notification-badge");
  const panel = widget.querySelector(".notification-panel");
  const list = widget.querySelector(".notification-list");
  const status = widget.querySelector(".notification-status");
  const more = widget.querySelector(".notification-more");
  const mark = widget.querySelector(".notification-mark");
  let disposed = false, timer, busy = false, rows = [], beforeId = null;
  const requests = new Set();
  async function api(name, body = {}) {
    const controller = new AbortController();
    requests.add(controller);
    try {
      const token = await user.getIdToken();
      if (disposed) throw new DOMException("Cancelled", "AbortError");
      const response = await fetch(`/.netlify/functions/${name}`, {
        method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body:JSON.stringify(body), signal:controller.signal
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron consultar las notificaciones.");
      return data;
    } finally { requests.delete(controller); }
  }
  const span = (text, className) => { const node = document.createElement("span"); node.textContent = text; if(className) node.className = className; return node; };
  function render(data) {
    const count = Number(data.unreadCount || 0);
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.hidden = count === 0;
    bell.setAttribute("aria-label", `Notificaciones: ${count} sin leer`);
    list.replaceChildren();
    for (const row of rows) {
      const link = document.createElement("a");
      link.className = `notification-item${Number(row.is_read) ? "" : " unread"}`;
      const params = new URLSearchParams({ center:row.center_code, survey:row.survey_code, question:String(row.question_id) });
      link.href = `survey.html?${params}`;
      const title = document.createElement("strong");
      title.textContent = `${CENTERS[row.center_code] || row.center_code} · Ámbito ${row.survey_code.replace("paex360-ambito", "")} · Pregunta ${row.question_number}`;
      const action = row.kind === "tutor_comment" ? "Cambió los comentarios de tutoría" : row.kind === "document_uploaded" ? "Adjuntó un documento" : "Modificó la respuesta";
      let fields = [];
      try { fields = JSON.parse(row.changed_fields); } catch (_) {}
      link.append(title, span(`${row.actor_email}: ${action}`), span(fields.map(key => FIELDS[key] || key).join(", ")));
      if (row.comment_preview) link.append(span(row.comment_preview));
      const date = new Date(`${row.created_at.replace(" ", "T")}Z`);
      link.append(span(Number.isNaN(date.getTime()) ? "" : date.toLocaleString("es-ES", {timeZone:"Europe/Madrid"}), "notification-meta"));
      link.addEventListener("click", async event => {
        event.preventDefault();
        status.textContent = "Abriendo la pregunta...";
        try {
          if (beforeNavigate && await beforeNavigate() === false) throw new Error("No se pudieron guardar tus cambios. Guarda la pregunta antes de abrir la notificación.");
          await api("markSurveyNotificationRead", { id:Number(row.id) });
          if (!disposed) window.location.assign(link.href);
        } catch (error) { if(!disposed) status.textContent = error.message; }
      });
      list.append(link);
    }
    status.textContent = rows.length ? "Selecciona un aviso para abrir la pregunta." : "No tienes notificaciones todavía.";
    more.hidden = !beforeId;
    mark.disabled = count === 0;
  }
  async function refresh(append = false) {
    if (disposed || busy) return;
    busy = true;
    clearTimeout(timer);
    try {
      const data = await api("getSurveyNotifications", append ? {beforeId} : {});
      if (disposed) return;
      rows = append ? [...rows, ...data.notifications] : data.notifications;
      beforeId = data.nextBeforeId;
      render(data);
    } catch (error) {
      if (!disposed) status.textContent = "No se pudieron actualizar los avisos. Se reintentará automáticamente.";
    } finally {
      busy = false;
      if (!disposed) timer = setTimeout(() => { if(!document.hidden) refresh(); else timer = setTimeout(refresh,30000); }, 30000);
    }
  }
  function close() { panel.hidden = true; bell.setAttribute("aria-expanded", "false"); }
  bell.addEventListener("click", () => { panel.hidden = !panel.hidden; bell.setAttribute("aria-expanded", String(!panel.hidden)); if(!panel.hidden) refresh(); });
  widget.querySelector(".notification-close").addEventListener("click", close);
  const escape = event => { if(event.key === "Escape" && !panel.hidden) {close(); bell.focus();} };
  const outside = event => { if(!widget.contains(event.target)) close(); };
  const visible = () => { if(!document.hidden) refresh(); };
  document.addEventListener("keydown", escape);
  document.addEventListener("click", outside);
  document.addEventListener("visibilitychange", visible);
  more.addEventListener("click", () => refresh(true));
  mark.addEventListener("click", async () => {
    if(!rows.length) return;
    mark.disabled = true;
    try { await api("markSurveyNotificationRead", {maxId:Math.max(...rows.map(row => Number(row.id)))}); await refresh(); }
    catch(error) { if(!disposed) {status.textContent = error.message; mark.disabled = false;} }
  });
  stop = () => {
    disposed = true; clearTimeout(timer); requests.forEach(request => request.abort());
    widget.remove(); document.removeEventListener("keydown",escape);
    document.removeEventListener("click",outside); document.removeEventListener("visibilitychange",visible);
  };
  refresh();
}
