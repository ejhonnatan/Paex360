// netlify/functions/getPermissions.js
const https = require("https");

const CSV_URL = "https://opinatlatam-my.sharepoint.com/:x:/g/personal/jecheverri_opinatlatam_onmicrosoft_com/IQC52WfdqM15QaCqWN0Wqsi-AY1RKp9z0nHaqH6s9XNP46c?download=1";

function fetchUrl(url, depth = 0) {
  return new Promise((resolve, reject) => {
    if (depth > 5) return reject(new Error("Too many redirects"));

    https.get(url, (res) => {
      const status = res.statusCode || 0;
      const loc = res.headers.location;

      // Follow redirects (301/302/303/307/308)
      if ([301, 302, 303, 307, 308].includes(status) && loc) {
        const nextUrl = loc.startsWith("http") ? loc : new URL(loc, url).toString();
        res.resume(); // discard data
        return resolve(fetchUrl(nextUrl, depth + 1));
      }

      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status, headers: res.headers, body: data }));
    }).on("error", reject);
  });
}

exports.handler = async () => {
  try {
    const { status, headers, body } = await fetchUrl(CSV_URL);

    // Si no es 200, devuelvo error con pista
    if (status !== 200) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: `No pude descargar CSV (HTTP ${status})`,
          contentType: headers["content-type"] || null
        })
      };
    }

    // Quitar BOM
    let text = String(body || "").replace(/^\uFEFF/, "");

    // Si SharePoint devolvió HTML en vez de CSV, lo detectamos
    const looksHtml = /^\s*</.test(text);
    if (looksHtml) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: "SharePoint devolvió HTML (no CSV). El link no es de descarga directa real.",
          contentType: headers["content-type"] || null
        })
      };
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({})
      };
    }

    const delimiter = lines[0].includes(";") ? ";" : ",";

    const clean = (s) => String(s || "").trim().replace(/^"|"$/g, "");

    const permissions = {};
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter);
      const email = clean(parts[0]).toLowerCase();
      const center = clean(parts[1]);

      if (!email || !center) continue;

      if (!permissions[email]) permissions[email] = [];
      if (!permissions[email].includes(center)) permissions[email].push(center);
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(permissions)
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: e.message })
    };
  }
};
