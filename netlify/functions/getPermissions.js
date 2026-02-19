const https = require("https");

exports.handler = async () => {

  const CSV_URL = "https://opinatlatam-my.sharepoint.com/:x:/g/personal/jecheverri_opinatlatam_onmicrosoft_com/IQC52WfdqM15QaCqWN0Wqsi-AY1RKp9z0nHaqH6s9XNP46c?download=1";

  try {

    const csvData = await new Promise((resolve, reject) => {
      https.get(CSV_URL, (res) => {

        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => resolve(data));

      }).on("error", reject);
    });

    const lines = csvData.split(/\r?\n/).filter(l => l.trim() !== "");

    const permissions = {};

    for (let i = 1; i < lines.length; i++) {
      const [email, center] = lines[i].split(",");

      if (!permissions[email]) {
        permissions[email] = [];
      }

      permissions[email].push(center);
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(permissions)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
