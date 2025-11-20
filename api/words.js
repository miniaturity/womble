const { google } = require("googleapis");

module.exports = async function handler(req, res) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = "WombleAPI!A1:B1015";

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    res.status(200).json(result.data.values ?? []);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ 
      error: "Could not load daily words.", 
      details: err.message 
    });
  }
}