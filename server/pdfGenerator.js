const puppeteer = require('puppeteer');

/**
 * Generate a branded PDF letter for a single client.
 * @param {Object} co       - Company object { name, phone, address, color, initials }
 * @param {Object} client   - Client object  { name, email, phone, address }
 * @param {Object} content  - Content object { pdfTitle, pdfGreeting, pdfBody, pdfClosing }
 * @returns {Buffer}        - PDF as a Buffer
 */
async function generatePDF(co, client, content) {
  const html = buildHTML(co, client, content);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

function fillPlaceholders(str, co, client) {
  if (!str) return '';
  return str
    .replace(/\{Name\}/g, client.name || '')
    .replace(/\{Email\}/g, client.email || '')
    .replace(/\{Phone\}/g, client.phone || '')
    .replace(/\{Address\}/g, client.address || '')
    .replace(/\{CompanyName\}/g, co.name || '')
    .replace(/\{CompanyPhone\}/g, co.phone || '')
    .replace(/\{CompanyAddress\}/g, co.address || '');
}

function buildHTML(co, client, content) {
  const fill = (s) => fillPlaceholders(s, co, client);

  // Convert newlines in body to paragraphs
  const bodyParagraphs = fill(content.pdfBody || '')
    .split('\n')
    .filter(l => l.trim() !== '')
    .map(l => {
      // Bullet points
      if (l.trim().startsWith('•') || l.trim().startsWith('-')) {
        return `<li style="margin-bottom:6px;">${l.replace(/^[•\-]\s*/, '')}</li>`;
      }
      return `<p style="margin:0 0 14px; line-height:1.85;">${l}</p>`;
    })
    .join('');

  // Wrap any consecutive <li> items in <ul>
  const bodyHTML = bodyParagraphs.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, (match) =>
    `<ul style="margin:0 0 14px; padding-left:20px;">${match}</ul>`
  );

  // Get today's date
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fill(content.pdfTitle)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:wght@600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Lato', Georgia, serif;
      color: #1a1a1a;
      background: white;
      font-size: 13px;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      background: white;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* ── Header ── */
    .header {
      background: ${co.color};
      padding: 28px 48px;
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .logo-circle {
      width: 52px;
      height: 52px;
      border-radius: 10px;
      background: rgba(255,255,255,0.22);
      border: 1.5px solid rgba(255,255,255,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-circle span {
      color: white;
      font-family: 'Lato', Arial, sans-serif;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 1px;
    }

    .header-info h1 {
      font-family: 'Lato', Arial, sans-serif;
      font-weight: 700;
      font-size: 20px;
      color: white;
      letter-spacing: 0.3px;
    }

    .header-info p {
      font-size: 11.5px;
      color: rgba(255,255,255,0.82);
      margin-top: 3px;
      font-weight: 300;
    }

    /* ── Decorative accent bar ── */
    .accent-bar {
      height: 4px;
      background: linear-gradient(90deg, ${co.color}dd, ${co.color}44);
    }

    /* ── Body ── */
    .body {
      flex: 1;
      padding: 36px 48px 40px;
    }

    /* Date + Ref row */
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }

    .date {
      font-size: 12px;
      color: #666;
    }

    /* Recipient block */
    .recipient-block {
      border-left: 3px solid ${co.color};
      padding: 10px 16px;
      background: #f8f9fa;
      border-radius: 0 6px 6px 0;
      margin-bottom: 28px;
      font-size: 13px;
      line-height: 1.7;
    }

    .recipient-block .r-name {
      font-weight: 700;
      font-size: 14px;
      color: #111;
    }

    .recipient-block .r-detail {
      color: #555;
    }

    /* Letter title */
    .letter-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 19px;
      font-weight: 600;
      color: ${co.color};
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e8e8e8;
    }

    /* Greeting */
    .greeting {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #111;
    }

    /* Body text */
    .letter-body {
      font-size: 13.5px;
      color: #333;
    }

    /* Closing */
    .closing-block {
      margin-top: 36px;
    }

    .closing-line {
      font-size: 13.5px;
      color: #333;
      margin-bottom: 40px;
    }

    .signature-name {
      font-weight: 700;
      font-size: 14px;
      color: #111;
    }

    .signature-title {
      font-size: 12px;
      color: #777;
      margin-top: 2px;
    }

    /* Stamp / seal area */
    .seal {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px dashed ${co.color}88;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 8px;
    }

    .seal span {
      font-size: 9px;
      color: ${co.color}99;
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid #e8e8e8;
      padding: 14px 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-left {
      font-size: 10.5px;
      color: #999;
      line-height: 1.6;
    }

    .footer-right {
      font-size: 10px;
      color: #bbb;
      text-align: right;
    }

    .footer-accent {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${co.color};
      margin-right: 5px;
      vertical-align: middle;
    }

    /* Confidential watermark ribbon */
    .confidential {
      position: absolute;
      top: 110px;
      right: -28px;
      background: ${co.color}18;
      color: ${co.color}88;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      padding: 4px 32px;
      transform: rotate(90deg);
      transform-origin: center;
      border: 1px solid ${co.color}22;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="confidential">Confidential</div>

    <div class="header">
      <div class="logo-circle">
        <span>${co.initials}</span>
      </div>
      <div class="header-info">
        <h1>${co.name}</h1>
        <p>${co.phone} &nbsp;·&nbsp; ${co.address}</p>
      </div>
    </div>

    <div class="accent-bar"></div>

    <div class="body">
      <div class="meta-row">
        <div class="date">Date: ${today}</div>
      </div>

      <div class="recipient-block">
        <div class="r-name">${client.name || 'Client'}</div>
        ${client.address ? `<div class="r-detail">${client.address}</div>` : ''}
        ${client.phone ? `<div class="r-detail">${client.phone}</div>` : ''}
        ${client.email ? `<div class="r-detail">${client.email}</div>` : ''}
      </div>

      <div class="letter-title">${fill(content.pdfTitle)}</div>

      <div class="greeting">${fill(content.pdfGreeting)}</div>

      <div class="letter-body">
        ${bodyHTML}
      </div>

      <div class="closing-block">
        <div class="closing-line">${fill(content.pdfClosing)}</div>
        <div class="signature-name">${co.name}</div>
        <div class="signature-title">${co.phone}</div>
        <div class="seal"><span>${co.initials}</span></div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <span class="footer-accent"></span><strong>${co.name}</strong><br>
        ${co.address}<br>
        ${co.phone}
      </div>
      <div class="footer-right">
        This is a computer-generated letter.<br>
        No signature required.
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { generatePDF };
