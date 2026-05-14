import { prisma } from '../../../lib/db'
import { requireIntimation } from '../../../middleware/requireIntimation'

async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const logs = await prisma.mailLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: { company: true },
      })
      return res.status(200).json(logs)
    }

    if (req.method === 'DELETE') {
      const { from, to } = req.body

      if (!from || !to) {
        return res.status(400).json({ error: 'Date range required' })
      }

      await prisma.mailLog.deleteMany({
        where: {
          createdAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        },
      })

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Server error' })
  }
}

export default requireIntimation(handler)