// netlify/functions/getPermissions.js
const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  try {
    const filePath = path.join(process.cwd(), "Permisos_pagina.csv");
    const csvData = fs.readFileSync(filePath, "utf8");

    const text = String(csvData || "").replace(/^\uFEFF/, "");
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
