import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.PRIVATE_KEY
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.SPREADSHEET_ID!;
    const range = "Sheet1!A1:B1015";

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    res.status(200).json(result.data.values ?? []);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Could not load daily words."});
  }
}