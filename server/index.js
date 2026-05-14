const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { generatePDF } = require('./pdfGenerator');
const { sendEmail } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Config file path (persists companies + content between restarts)
const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Default config ──────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  companies: [
    {
      id: 1,
      name: 'Acme Pvt. Ltd.',
      phone: '+91 98765 43210',
      address: 'Ring Road, Surat, Gujarat 395001',
      color: '#185FA5',
      initials: 'AC',
      fromEmail: ''
    }
  ],
  content: {
    subject: 'Important update from {CompanyName}',
    senderName: '',
    replyTo: '',
    emailBody: 'Dear {Name},\n\nPlease find your personalised document attached.\n\nRegards,\n{CompanyName}',
    pdfTitle: 'Account Notification',
    pdfGreeting: 'Dear {Name},',
    pdfBody: 'We are writing to inform you about an update regarding your account with {CompanyName}.\n\nYour registered details:\n• Name: {Name}\n• Address: {Address}\n• Contact: {Phone}\n\nIf you have any queries, please reach out to us at {CompanyPhone}.',
    pdfClosing: 'Warm regards,'
  },
  apiKey: '',
  fromEmail: ''
};

// ── Load / save config ───────────────────────────────────────────────────────
async function loadConfig() {
  try {
    await fs.ensureDir(path.dirname(CONFIG_PATH));
    if (await fs.pathExists(CONFIG_PATH)) {
      return await fs.readJson(CONFIG_PATH);
    }
  } catch (e) {}
  return { ...DEFAULT_CONFIG };
}

async function saveConfig(config) {
  await fs.ensureDir(path.dirname(CONFIG_PATH));
  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
}

// ── API Routes ───────────────────────────────────────────────────────────────

// GET config (never expose apiKey to frontend)
app.get('/api/config', async (req, res) => {
  const config = await loadConfig();
  const safe = { ...config, apiKey: config.apiKey ? '••••••••' : '' };
  res.json(safe);
});

// SAVE full content + companies
app.post('/api/config', async (req, res) => {
  const config = await loadConfig();
  const { companies, content, fromEmail } = req.body;
  if (companies) config.companies = companies;
  if (content) config.content = content;
  if (fromEmail !== undefined) config.fromEmail = fromEmail;
  await saveConfig(config);
  res.json({ ok: true });
});

// SAVE API key separately (POST only, never returned)
app.post('/api/settings', async (req, res) => {
  const config = await loadConfig();
  const { apiKey, fromEmail } = req.body;
  if (apiKey && !apiKey.includes('•')) config.apiKey = apiKey;
  if (fromEmail) config.fromEmail = fromEmail;
  await saveConfig(config);
  res.json({ ok: true, hasKey: !!config.apiKey });
});

// TEST connection
app.get('/api/test-connection', async (req, res) => {
  const config = await loadConfig();
  if (!config.apiKey) return res.json({ ok: false, message: 'No API key saved.' });
  try {
    const r = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${config.apiKey}` }
    });
    if (r.status === 200) res.json({ ok: true, message: 'Connected! API key is valid.' });
    else res.json({ ok: false, message: `Resend returned status ${r.status}` });
  } catch (e) {
    res.json({ ok: false, message: 'Connection failed: ' + e.message });
  }
});

// PREVIEW PDF in browser (GET, used by iframe)
app.get('/api/preview-pdf-view', async (req, res) => {
  const companyId = parseInt(req.query.companyId);
  const config = await loadConfig();
  const co = config.companies.find(c => c.id === companyId) || config.companies[0];
  if (!co) return res.status(400).send('Company not found');
  const sampleClient = { name: 'Sample Client', email: 'client@example.com', phone: '+91 98765 00000', address: '123 Street, Surat, Gujarat' };
  try {
    const pdfBuffer = await generatePDF(co, sampleClient, config.content);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'inline; filename="preview.pdf"');
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).send('PDF generation error: ' + e.message);
  }
});

// PREVIEW PDF (returns PDF bytes)
app.post('/api/preview-pdf', async (req, res) => {
  const { companyId } = req.body;
  const config = await loadConfig();
  const co = config.companies.find(c => c.id === companyId) || config.companies[0];
  if (!co) return res.status(400).json({ error: 'Company not found' });

  const sampleClient = {
    name: 'Sample Client',
    email: 'client@example.com',
    phone: '+91 98765 00000',
    address: '123 Street, Surat, Gujarat'
  };

  try {
    const pdfBuffer = await generatePDF(co, sampleClient, config.content);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'inline; filename="preview.pdf"');
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SEND bulk emails
app.post('/api/send', async (req, res) => {
  const { companyId, clients } = req.body;
  if (!clients || !clients.length) return res.status(400).json({ error: 'No clients provided' });

  const config = await loadConfig();
  if (!config.apiKey) return res.status(400).json({ error: 'No Resend API key configured. Go to API Settings.' });
  if (!config.fromEmail) return res.status(400).json({ error: 'No From email configured. Go to API Settings.' });

  const co = config.companies.find(c => c.id === companyId);
  if (!co) return res.status(400).json({ error: 'Company not found' });

  // Use SSE to stream progress back to browser
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  let sent = 0, failed = 0;

  send({ type: 'start', total: clients.length });

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    try {
      const pdfBuffer = await generatePDF(co, client, config.content);
      await sendEmail({
        apiKey: config.apiKey,
        fromEmail: config.fromEmail,
        replyTo: config.content.replyTo || undefined,
        to: client.email,
        subject: fillPlaceholders(config.content.subject, co, client),
        bodyHtml: buildEmailBody(co, client, config.content),
        pdfBuffer,
        clientName: client.name || 'client'
      });
      sent++;
      send({ type: 'progress', index: i + 1, total: clients.length, sent, failed, email: client.email, status: 'ok' });
    } catch (e) {
      failed++;
      send({ type: 'progress', index: i + 1, total: clients.length, sent, failed, email: client.email, status: 'error', error: e.message });
    }
  }

  send({ type: 'done', sent, failed });
  res.end();
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function fillPlaceholders(str, co, client) {
  return str
    .replace(/\{Name\}/g, client.name || '')
    .replace(/\{Email\}/g, client.email || '')
    .replace(/\{Phone\}/g, client.phone || '')
    .replace(/\{Address\}/g, client.address || '')
    .replace(/\{CompanyName\}/g, co.name || '')
    .replace(/\{CompanyPhone\}/g, co.phone || '')
    .replace(/\{CompanyAddress\}/g, co.address || '');
}

function buildEmailBody(co, client, content) {
  const fill = (s) => fillPlaceholders(s, co, client);
  const bodyText = fill(content.emailBody).replace(/\n/g, '<br>');
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #222;">
      <div style="background: ${co.color}; padding: 24px 32px; margin-bottom: 24px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:44px; height:44px; background:rgba(255,255,255,0.2); border-radius:8px; text-align:center; vertical-align:middle;">
            <span style="color:white; font-family:Arial,sans-serif; font-weight:700; font-size:14px;">${co.initials}</span>
          </td>
          <td style="padding-left:14px;">
            <div style="color:white; font-family:Arial,sans-serif; font-size:18px; font-weight:600;">${co.name}</div>
            <div style="color:rgba(255,255,255,0.8); font-family:Arial,sans-serif; font-size:12px;">${co.phone}</div>
          </td>
        </tr></table>
      </div>
      <div style="padding: 0 32px 32px; font-size:15px; line-height:1.8;">
        ${bodyText}
        <br><br>
        <div style="background:#f5f5f5; border-left:3px solid ${co.color}; padding:10px 16px; font-size:13px; color:#555; border-radius:0 4px 4px 0;">
          📎 Your personalised letter is attached as a PDF.
        </div>
      </div>
      <div style="border-top:1px solid #eee; padding: 16px 32px; font-size:12px; color:#999; font-family:Arial,sans-serif;">
        ${co.name} · ${co.phone} · ${co.address}
      </div>
    </div>`;
}

app.listen(PORT, () => {
  console.log(`\n✅ MailBlast server running at http://localhost:${PORT}\n`);
});
