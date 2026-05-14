const { Resend } = require('resend');

/**
 * Send one email with a PDF attachment via Resend.
 */
async function sendEmail({ apiKey, fromEmail, replyTo, to, subject, bodyHtml, pdfBuffer, clientName }) {
  const resend = new Resend(apiKey);

  const filename = `letter_${(clientName || 'client').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  const payload = {
    from: fromEmail,
    to: [to],
    subject,
    html: bodyHtml,
    attachments: [
      {
        filename,
        content: pdfBuffer  // Buffer — Resend SDK accepts Buffer directly
      }
    ]
  };

  if (replyTo) payload.reply_to = replyTo;

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    throw new Error(error.message || JSON.stringify(error));
  }

  return data;
}

module.exports = { sendEmail };
