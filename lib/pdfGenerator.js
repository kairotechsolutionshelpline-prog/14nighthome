import { getBrowser } from './browserInstance'

export async function generatePDF({ company, template, client }) {
  const browser = await getBrowser()
  const page = await browser.newPage()

  function replace(text) {
    return (text || '')
      .replaceAll('{Name}', client.name || '')
      .replaceAll('{Email}', client.email || '')
      .replaceAll('{Phone}', client.phone || '')
      .replaceAll('{Address}', client.address || '')
      .replaceAll('{CompanyName}', company.name || '')
      .replaceAll('{CompanyPhone}', company.phone || '')
      .replaceAll('{CompanyAddress}', company.address || '')
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Inter', Arial, sans-serif;
          color: #1a1a18;
          background: #fff;
          padding: 48px;
          font-size: 14px;
          line-height: 1.7;
        }

        /* Watermark */
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 90px;
          font-weight: 900;
          color: rgba(24, 95, 165, 0.06);
          letter-spacing: 12px;
          z-index: 0;
          pointer-events: none;
          white-space: nowrap;
          font-family: Arial, sans-serif;
        }

        .content { position: relative; z-index: 1; }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 3px solid ${company.brandColor || '#185FA5'};
          padding-bottom: 16px;
          margin-bottom: 32px;
        }

        .company-name {
          font-size: 24px;
          font-weight: 700;
          color: ${company.brandColor || '#185FA5'};
          letter-spacing: 0.5px;
        }

        .company-detail {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
        }

        .doc-info {
          text-align: right;
          font-size: 12px;
          color: #888;
        }

        /* Title Banner */
        .title-banner {
          background: ${company.brandColor || '#185FA5'};
          color: #fff;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 28px;
          letter-spacing: 0.5px;
        }

        /* Greeting */
        .greeting {
          font-size: 15px;
          margin-bottom: 20px;
        }

        .greeting strong {
          color: ${company.brandColor || '#185FA5'};
        }

        /* Body text */
        .body-text {
          color: #333;
          margin-bottom: 24px;
          white-space: pre-line;
        }

        /* Details box */
        .details-box {
          background: #f0f6ff;
          border-left: 4px solid ${company.brandColor || '#185FA5'};
          border-radius: 6px;
          padding: 16px 20px;
          margin-bottom: 28px;
        }

        .details-box table {
          width: 100%;
          border-collapse: collapse;
        }

        .details-box td {
          padding: 6px 0;
          font-size: 13px;
        }

        .details-box .label {
          color: #888;
          width: 140px;
        }

        .details-box .value {
          font-weight: 600;
          color: #1a1a18;
        }

        .details-box .value.email {
          color: ${company.brandColor || '#185FA5'};
        }

        /* Warning box */
        .warning-box {
          background: #fff8e6;
          border: 1px solid #f5c842;
          border-radius: 6px;
          padding: 14px 18px;
          margin-bottom: 28px;
        }

        .warning-title {
          font-size: 13px;
          font-weight: 700;
          color: #854F0B;
          margin-bottom: 6px;
        }

        .warning-text {
          font-size: 13px;
          color: #633806;
          line-height: 1.7;
        }

        /* Footer */
        .footer {
          border-top: 2px solid ${company.brandColor || '#185FA5'};
          padding-top: 16px;
          margin-top: 32px;
        }

        .footer-regards {
          font-size: 13px;
          color: #555;
          margin-bottom: 4px;
        }

        .footer-company {
          font-size: 15px;
          font-weight: 700;
          color: ${company.brandColor || '#185FA5'};
          margin-bottom: 2px;
        }

        .footer-address {
          font-size: 12px;
          color: #888;
        }
      </style>
    </head>
    <body>

      <!-- Watermark -->
      <div class="watermark">CONFIDENTIAL</div>

      <div class="content">

        <!-- Header -->
        <div class="header">
          <div>
            <div class="company-name">${company.name}</div>
            <div class="company-detail">${company.address || ''} ${company.phone ? '| ' + company.phone : ''}</div>
          </div>
          <div class="doc-info">
            Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
            Ref: KT-${Date.now().toString().slice(-6)}
          </div>
        </div>

        <!-- Title Banner -->
        <div class="title-banner">📄 ${replace(template.pdfTitle)}</div>

        <!-- Greeting -->
        <p class="greeting">Dear <strong>${client.name || 'Sir/Madam'}</strong>,</p>

        <!-- PDF Body -->
        <div class="body-text">${replace(template.pdfBody)}</div>

        <!-- Details Box -->
        <div class="details-box">
          <table>
            <tr>
              <td class="label">👤 Full Name</td>
              <td class="value">${client.name || '—'}</td>
            </tr>
            <tr>
              <td class="label">📧 Email</td>
              <td class="value email">${client.email || '—'}</td>
            </tr>
            <tr>
              <td class="label">📞 Phone</td>
              <td class="value">${client.phone || '—'}</td>
            </tr>
            <tr>
              <td class="label">🏠 Address</td>
              <td class="value">${client.address || '—'}</td>
            </tr>
          </table>
        </div>

        <!-- Warning Box -->
        <div class="warning-box">
          <div class="warning-title">⚠️ Important Notice</div>
          <div class="warning-text">
            Please review your details carefully. If any information is incorrect,
            kindly contact us immediately at <strong>${company.phone || company.senderEmail}</strong>.
            Failure to report discrepancies may affect your account status.
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-regards">Warm regards,</div>
          <div class="footer-company">${company.name}</div>
          <div class="footer-address">${company.address || ''}</div>
        </div>

      </div>
    </body>
    </html>
  `

  await page.setContent(html, { waitUntil: 'networkidle0' })

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
  })

  await page.close()

  return pdf
}