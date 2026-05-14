import { requireAdmin } from '../../../middleware/admin'
import { generatePDF } from '../../../lib/pdfGenerator'

async function handler(req, res) {
  try {
    const pdfBuffer = await generatePDF(req.body)

    res.setHeader('Content-Type', 'application/pdf')

    return res.send(pdfBuffer)
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'PDF generation failed',
    })
  }
}

export default requireAdmin(handler)