import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
  pdfBuffer,
  senderName,
  senderEmail,
}) {
  return resend.emails.send({
    from: `${senderName} <${senderEmail}>`,
    to,
    subject,
    html,

    attachments: [
      {
        filename: 'intimation.pdf',
        content: pdfBuffer,
      },
    ],
  })
}