import { prisma } from '../../../lib/db'
import { requireIntimation } from '../../../middleware/requireIntimation'
import { validateClient } from '../../../lib/validateClient'
import { generatePDF } from '../../../lib/pdfGenerator'
import { sendEmail } from '../../../lib/emailProvider'

function replacePlaceholders(text, client, company) {
  return text
    .replaceAll('{Name}', client.name || '')
    .replaceAll('{Email}', client.email || '')
    .replaceAll('{Phone}', client.phone || '')
    .replaceAll('{Address}', client.address || '')
    .replaceAll('{CompanyName}', company.name || '')
    .replaceAll('{CompanyPhone}', company.phone || '')
    .replaceAll('{CompanyAddress}', company.address || '')
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { companyId, templateId, clients, senderName } = req.body

    if (!companyId || !templateId || !clients || !Array.isArray(clients)) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } })
    const template = await prisma.template.findUnique({ where: { id: templateId } })

    if (!company) return res.status(404).json({ error: 'Company not found' })
    if (!template) return res.status(404).json({ error: 'Template not found' })

    const results = []

    for (const client of clients) {
      const validationError = validateClient(client)
      if (validationError) {
        results.push({ email: client.email, status: 'skipped', reason: validationError })
        continue
      }

      try {
        const pdfBuffer = await generatePDF({ company, template, client })

        const subject = replacePlaceholders(template.subject, client, company)
        const html = replacePlaceholders(template.emailBody, client, company)

        await sendEmail({
          to: client.email,
          subject,
          html,
          pdfBuffer,
          senderName: senderName || company.senderName,
          senderEmail: company.senderEmail,
        })

        await prisma.mailLog.create({
          data: {
            recipientName: client.name,
            recipientEmail: client.email,
            companyName: company.name,
            senderName: senderName || company.senderName,
            status: 'sent',
            queueStatus: 'completed',
            companyId: company.id,
          },
        })

        results.push({ email: client.email, status: 'sent' })

        const randomDelay = Math.floor(Math.random() * 12000) + 8000
        await delay(randomDelay)
      } catch (error) {
        console.error(error)

        await prisma.mailLog.create({
          data: {
            recipientName: client.name,
            recipientEmail: client.email,
            companyName: company.name,
            senderName: senderName || company.senderName,
            status: 'failed',
            queueStatus: 'failed',
            failureReason: error.message,
            companyId: company.id,
          },
        })

        results.push({ email: client.email, status: 'failed', reason: error.message })
      }
    }

    return res.status(200).json({ success: true, results })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Bulk send failed' })
  }
}

export default requireIntimation(handler)