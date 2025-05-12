const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);
const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.SHEET_ID;

async function appendRow(values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'A:L',  // Extended range to include all fields
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function nextSerial() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A:A',
  });
  const rows = res.data.values || [];
  const startingRoll = parseInt(process.env.STARTING_ROLL_NUMBER || '1000');
  
  let lastNumber = startingRoll;
  if (rows.length > 0) {
    const lastValue = rows[rows.length - 1][0];
    const parsed = parseInt(lastValue);
    if (!isNaN(parsed)) {
      lastNumber = parsed;
    }
  }
  
  return (lastNumber + 1).toString().padStart(4, '0');
}

module.exports = { appendRow, nextSerial };
