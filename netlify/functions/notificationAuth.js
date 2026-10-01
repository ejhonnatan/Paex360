const fs = require("fs");
const path = require("path");
const CENTER_COLUMNS = { diagonal:"Clinica_Diagonal", salus:"Clinica_Salus", icr:"Clinica_ICR" };
function fail(statusCode, message) { const e = new Error(message); e.statusCode = statusCode; throw e; }

async function notificationUser(event) {
  const header = event.headers?.authorization || event.headers?.Authorization || "";
  const token = /^Bearer (.+)$/i.exec(header)?.[1];
  if (!token) fail(401, "Debes iniciar sesión para consultar las notificaciones.");
  if (!process.env.FIREBASE_API_KEY) fail(500, "Falta la configuración de Firebase.");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(process.env.FIREBASE_API_KEY)}`, {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ idToken:token }), signal:AbortSignal.timeout(10000)
  });
  const data = await response.json();
  const user = data.users?.[0];
  if (!response.ok || !user?.email || user.disabled) fail(401, "La sesión ha caducado. Vuelve a iniciar sesión.");
  const email = user.email.trim().toLowerCase();
  const lines = fs.readFileSync(path.join(__dirname, "Permisos_pagina.csv"), "utf8").trim().split(/\r?\n/);
  const headers = lines.shift().split(",").map(v => v.trim());
  const row = lines.map(line => Object.fromEntries(line.split(",").map((v,i) => [headers[i],v.trim()])))
    .find(row => row.email?.toLowerCase() === email);
  if (!row) fail(403, "Usuario sin permisos registrados.");
  const centers = Object.keys(CENTER_COLUMNS).filter(center => row[CENTER_COLUMNS[center]]?.toLowerCase() === "true");
  return { email, centers };
}
async function requireCenterUser(event, center, email) {
  const user = await notificationUser(event);
  if (user.email !== email || !user.centers.includes(center)) fail(403, "No tienes permisos para modificar esta encuesta.");
  return user;
}
module.exports = { notificationUser, requireCenterUser };
