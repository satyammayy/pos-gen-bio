// whatsapp.js
// -----------------------------------------------------------
// npm i @whiskeysockets/baileys link-preview-js qrcode-terminal
// Works with Baileys ≥ 6.7   (all interactive parts = raw proto blocks)
// -----------------------------------------------------------

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  getUrlInfo,
  proto,
  generateWAMessageFromContent,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

let sockPromise;

/* ────────────────────────────────────────────────────────── */
async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true,
    linkPreviewImageThumbnailWidth: 1024,
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) sockPromise = startSock();
    }
    if (connection === 'open') console.log('✅ WhatsApp ready');
  });

  await new Promise((res) =>
    sock.ev.on('connection.update', (u) => u.connection === 'open' && res())
  );
  return sock;
}

function getSocket() {
  if (!sockPromise) sockPromise = startSock();
  return sockPromise;
}

/* ────────────────────────────────────────────────────────── */
function cleanIndianMobile(raw) {
  let n = String(raw).replace(/[^0-9]/g, '').replace(/^0+/, '');
  if (n.length === 10) n = '91' + n;
  if (!/^91\d{10}$/.test(n)) throw new Error('Invalid Indian mobile number');
  return n;
}

async function sendRaw(sock, jid, obj) {
  const msg = generateWAMessageFromContent(
    jid,
    proto.Message.fromObject(obj),
    {}
  );
  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
}

/* ────────────────────────────────────────────────────────── */
async function sendJoinLink(
  phone,
  name,
  id,
  shift = 'morning',
  payment_mode = 'cash'
) {
  const sock = await getSocket();
  const jid = `${cleanIndianMobile(phone)}@s.whatsapp.net`;

  const groupLink =
    shift.toLowerCase() === 'evening'
      ? process.env.EVENING_GROUP_LINK || process.env.JOIN_LINK
      : process.env.MORNING_GROUP_LINK || process.env.JOIN_LINK;

  /* 0 ─ plain text receipt */
  const receipt = `🏫 *GENESIS BIOLOGY*
━━━━━━━━━━━━━━━━━━━━━
📝 *REGISTRATION RECEIPT*
Date: ${new Date().toLocaleDateString('en-IN')}
👤 *Student Details*
Name: ${name}
Registration No / Roll No.: ${id}
Phone: ${phone}
Shift: ${shift}
Payment Mode: ${payment_mode}

✅ *Registration Status*
Successfully Registered!
📱 *Important Instructions*
1. Join our WhatsApp Group for:
   • Daily Updates
   • Study Materials
   • Doubt Clearing
   • Important Announcements
2. Click here to join your ${shift} batch group 👇
${groupLink}
━━━━━━━━━━━━━━━━━━━━━
Thank you for choosing Genesis Biology!
For support contact:
1. +917005589986 (Sir Loya)
2. +916009989088 (Radip K)
3. +919863461949 (Satyam M)
4. +918415809253 (Ka Seitabanta)`;

  await sock.sendMessage(jid, { text: receipt });

  /* 1 ─ group link preview */
  const groupInfo = await getUrlInfo(groupLink);
  await sock.sendMessage(jid, {
    text: groupLink,
    linkPreview: {
      ...groupInfo,
      title: 'Genesis Biology – Join Your WhatsApp Batch',
      description: 'Daily updates, study materials, doubt clearing & more',
    },
  });

  /* 2 ─ Instagram preview */
  const insta = 'https://www.instagram.com/genesis_biology_official';
  const instaInfo = (await getUrlInfo(insta)) || {};
  await sock.sendMessage(jid, {
    text: insta,
    linkPreview: {
      ...instaInfo,
      title: 'Follow Genesis Biology on Instagram',
      description: 'Motivation, tips, toppers’ stories & announcements',
    },
  });

}

/* ────────────────────────────────────────────────────────── */
module.exports = { sendJoinLink };
