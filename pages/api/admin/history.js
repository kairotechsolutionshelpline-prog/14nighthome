import { prisma } from '../../../lib/db'
import { requireAdmin } from '../../../middleware/admin'

async function handler(req, res) {
  try {
    const logs = await prisma.mailLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.status(200).json(logs)
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'Server error',
    })
  }
}

export default requireAdmin(handler)