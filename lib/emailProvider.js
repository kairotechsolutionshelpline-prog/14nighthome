import { Resend } from 'resend'
import nodemailer from 'nodemailer'

const resend = new Resend(process.env.RESEND_API_KEY)

const gmailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
  pdfBuffer,
  senderName,
  senderEmail,
  provider = 'resend',
}) {
  if (provider === 'gmail') {
    return gmailTransport.sendMail({
      from: `${senderName} <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      attachments: [{ filename: 'intimation.pdf', content: pdfBuffer }],
    })
  }

  return resend.emails.send({
    from: `${senderName} <${senderEmail}>`,
    to,
    subject,
    html,
    attachments: [{ filename: 'intimation.pdf', content: pdfBuffer }],
  })
}
