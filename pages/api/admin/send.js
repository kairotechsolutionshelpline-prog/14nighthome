import { prisma } from '../../../lib/db'
import { requireAdmin } from '../../../middleware/admin'
import { validateClient } from '../../../lib/validateClient'
import { generatePDF } from '../../../lib/pdfGenerator'
import { sendEmail } from '../../../lib/emailProvider'

function replacePlaceholders(text, data) {
  return text
    .replaceAll('{Name}', data.name || '')
    .replaceAll('{Email}', data.email || '')
    .replaceAll('{Phone}', data.phone || '')
    .replaceAll('{Address}', data.address || '')
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      company,
      template,
      clients,
      senderName,
    } = req.body

    for (const client of clients) {
      const validationError = validateClient(client)

      if (validationError) {
        continue
      }

      try {
        const pdfBuffer = await generatePDF({
          company,
          template,
          client,
        })

        const subject = replacePlaceholders(
          template.subject,
          client
        )

        const html = replacePlaceholders(
          template.emailBody,
          client
        )

        await sendEmail({
          to: client.email,
          subject,
          html,
          pdfBuffer,
          senderName,
          senderEmail: company.senderEmail,
        })

        await prisma.mailLog.create({
          data: {
            recipientName: client.name,
            recipientEmail: client.email,
            companyName: company.name,
            senderName,
            status: 'sent',
            queueStatus: 'completed',
            companyId: company.id,
          },
        })

        const randomDelay =
          Math.floor(Math.random() * 12000) + 8000

        await delay(randomDelay)
      } catch (error) {
        console.error(error)

        await prisma.mailLog.create({
          data: {
            recipientName: client.name,
            recipientEmail: client.email,
            companyName: company.name,
            senderName,
            status: 'failed',
            queueStatus: 'failed',
            failureReason: error.message,
            companyId: company.id,
          },
        })
      }
    }

    return res.status(200).json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'Bulk send failed',
    })
  }
}

export default requireAdmin(handler)