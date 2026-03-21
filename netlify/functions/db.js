const { createClient } = require("@libsql/client");

let clientInstance = null;

function getDb() {
  if (clientInstance) return clientInstance;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("Falta TURSO_DATABASE_URL");
  }

  if (!authToken) {
    throw new Error("Falta TURSO_AUTH_TOKEN");
  }

  clientInstance = createClient({
    url,
    authToken
  });

  return clientInstance;
}

module.exports = { getDb };