const { google } = require("googleapis");

module.exports = async function handler(req, res) {
  try {
    // Debug logging
    console.log('GOOGLE_CLIENT_EMAIL exists:', !!process.env.GOOGLE_CLIENT_EMAIL);
    console.log('PRIVATE_KEY exists:', !!process.env.PRIVATE_KEY);
    console.log('PRIVATE_KEY length:', process.env.PRIVATE_KEY?.length);
    console.log('PRIVATE_KEY first 50 chars:', process.env.PRIVATE_KEY?.substring(0, 50));
    
    if (!process.env.PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error('Missing required environment variables');
    }

    let credentials;
    try {
      credentials = JSON.parse(process.env.PRIVATE_KEY);
      console.log('Parsed as JSON, has private_key:', !!credentials.private_key);
    } catch {
      credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }

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
};