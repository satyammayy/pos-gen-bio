const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Get shift-specific WhatsApp group links from environment variables
const MORNING_GROUP_LINK = process.env.MORNING_GROUP_LINK || process.env.JOIN_LINK;
const EVENING_GROUP_LINK = process.env.EVENING_GROUP_LINK || process.env.JOIN_LINK;

const { appendRow, nextSerial } = require('./googleSheets');

const { sendJoinLink } = require('./whatsapp');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));



app.post('/register', async (req, res) => {
  try {
    const { form_no, name, dob, phone, address, father, shift, payment_mode } = req.body;
    const id = form_no;  // Use the form number as ID
    // 1. store to Sheets
    await appendRow([id, name, dob, phone, address, father, shift, payment_mode, new Date().toLocaleString('en-IN')]);
    // 2. send WhatsApp link with shift and payment info
    await sendJoinLink(phone, name, id, shift, payment_mode);
    res.json({ ok: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.listen(process.env.PORT, () => console.log(`API on ${process.env.PORT}`));
