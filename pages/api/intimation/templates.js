import { prisma } from '../../../lib/db'
import { requireIntimation } from '../../../middleware/requireIntimation'

async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const templates = await prisma.template.findMany({
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(templates)
    }

    if (req.method === 'POST') {
      const { name, subject, emailBody, pdfTitle, pdfBody } = req.body

      if (!name || !subject || !emailBody || !pdfTitle || !pdfBody) {
        return res.status(400).json({ error: 'All fields are required' })
      }

      const template = await prisma.template.create({
        data: { name, subject, emailBody, pdfTitle, pdfBody },
      })
      return res.status(200).json(template)
    }

    if (req.method === 'PUT') {
      const { id, name, subject, emailBody, pdfTitle, pdfBody } = req.body

      if (!id) return res.status(400).json({ error: 'Template ID required' })

      const template = await prisma.template.update({
        where: { id },
        data: { name, subject, emailBody, pdfTitle, pdfBody },
      })
      return res.status(200).json(template)
    }

    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'Template ID required' })

      await prisma.template.delete({ where: { id } })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Server error' })
  }
}

export default requireIntimation(handler)