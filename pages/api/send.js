import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { requireAdmin } from '../../middleware/admin'

const resend = new Resend(process.env.RESEND_API_KEY)
const gmailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})
function getCountdownText(deadlineDate) {
  const now = new Date()
  const deadline = new Date(deadlineDate)
  deadline.setHours(0, 0, 0, 0)
  const diff = deadline - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

function buildHTML(name, email, submissionDate) {
  const deadline = submissionDate ? new Date(submissionDate) : null
  const formatted = deadline ? deadline.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null
  const countdown = deadline ? getCountdownText(submissionDate) : null

const countdownBlock = deadline ? `
<div style="background:#FFF8E6;border:1px solid #F5C842;border-radius:8px;padding:10px 14px;margin-bottom:16px;text-align:center;">
  <p style="font-size:11px;font-weight:600;color:#7A5C00;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">⏰ Submission Deadline</p>
  <p style="font-size:14px;font-weight:700;color:#C0392B;margin:0 0 6px;">📅 ${formatted}</p>
  <p style="font-size:12px;color:#7A5C00;margin:0 0 4px;">⚠️ Please complete your submission by <strong>the previous night — 11:59 PM</strong></p>
  <p style="font-size:11px;color:#999;margin:0;">The deadline day is for verification, not submission.</p>
</div>` : ''

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;">
<div style="background:#185FA5;padding:18px 24px;display:flex;align-items:center;gap:12px;">
  <img src="https://kairotechsolutions-production.up.railway.app/logo.png" style="width:40px;height:40px;border-radius:50%;object-fit:cover;display:inline-block;flex-shrink:0;" alt="Kairotech Logo" />
  <div style="display:inline-block;margin-left:12px;">
    <div style="color:#E6F1FB;font-size:16px;font-weight:600;">Kairotech Solutions</div>
    <div style="color:#B5D4F4;font-size:12px;">Registration Confirmation</div>
  </div>
</div>
<div style="padding:24px;background:#ffffff;">
  <p style="font-size:15px;font-weight:600;margin-bottom:6px;">Dear ${name},</p>
  <div style="display:inline-block;background:#EAF3DE;color:#3B6D11;border-radius:6px;padding:5px 12px;font-size:13px;font-weight:600;margin-bottom:14px;">✅ Registered successfully</div>
  <p style="font-size:14px;color:#444;margin-bottom:20px;">You have been registered successfully with Kairotech Solutions.<br>Thank you for working with us!</p>
  <div style="background:#f5f5f5;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
    <p style="font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Your login credentials</p>
    <p style="font-size:13px;margin:6px 0;">🔗 <strong>Login:</strong> <a href="https://redalertsol.com/" style="color:#185FA5;">Click here to login</a></p>
    <p style="font-size:13px;margin:6px 0;">👤 <strong>Username:</strong> ${email}</p>
    <p style="font-size:13px;margin:6px 0;">🔑 <strong>Password:</strong> Your Phone Number</p>
  </div>
  ${countdownBlock}
  <a href="https://redalertsol.com/" style="display:block;text-align:center;background:#185FA5;color:#ffffff;border-radius:8px;padding:11px;font-size:14px;font-weight:600;text-decoration:none;margin-bottom:20px;">🔗 Go to Login Page</a>
  <div style="background:#E6F1FB;border-radius:8px;padding:16px;margin-bottom:16px;">
    <p style="font-size:14px;font-weight:600;color:#0C447C;margin-bottom:8px;">🌟 Need Help? We're Here for You!</p>
    <p style="font-size:13px;color:#185FA5;margin-bottom:10px;">If you have any questions or need assistance, feel free to contact our Helpline Team. We'll be happy to help! 😊</p>
    <p style="font-size:13px;color:#185FA5;margin:4px 0;">📞 7434921437</p>
    <p style="font-size:13px;color:#185FA5;margin:4px 0;">📧 kairotechsolutionshelpline@gmail.com</p>
    <div style="background:#fff;border-radius:6px;padding:8px 12px;margin-top:8px;font-size:12px;color:#555;">🕒 Helpline Working Hours<br>Monday – Saturday &nbsp;|&nbsp; 10:00 AM – 5:00 PM</div>
  </div>
  <p style="font-size:12px;color:#888;margin-bottom:16px;">☎️ If your call is not connected, kindly send us an email and our team will get back to you as soon as possible.</p>
  <div style="border-top:1px solid #eee;padding-top:14px;text-align:center;font-size:12px;color:#888;">
    Thank you for reaching out to us! 💙<br><br>
    Warm regards,<br><strong>Kairotech Solutions Team</strong>
  </div>
</div></body></html>`
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { members, submissionDate, senderName, senderPrefix, provider } = req.body
  if (!members || !Array.isArray(members)) return res.status(400).json({ error: 'Invalid members list' })

  const fromName = senderName || process.env.SENDER_NAME
  const fromEmail = senderPrefix ? `${senderPrefix}@trulogictech.com` : process.env.SENDER_EMAIL

  const results = []
  for (const member of members) {
    try {
      if (provider === 'gmail') {
        await gmailTransport.sendMail({
          from: `${fromName} <${process.env.GMAIL_USER}>`,
          to: member.email,
          subject: 'You have been registered successfully with Kairotech Solutions',
          html: buildHTML(member.name, member.email, submissionDate),
        })
      } else {
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [member.email],
        subject: 'You have been registered successfully with Kairotech Solutions',
        html: buildHTML(member.name, member.email, submissionDate),
        tags: [{ name: 'member', value: member.email.replace('@','_').replace(/\./g,'_') }]
      })  
        }
      results.push({ email: member.email, status: 'sent' })
    } catch (e) {
      results.push({ email: member.email, status: 'failed', error: e.message })
    }
    await new Promise(r => setTimeout(r, 200))
  }
  return res.status(200).json({ results })
}

export default requireAdmin(handler)
