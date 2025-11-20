const { google } = require("googleapis");

module.exports = async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = "Sheet1!A1:B1015";

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    res.status(200).json(result.data.values ?? []);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: "Could not load daily words.", details: err.message });
  }
};