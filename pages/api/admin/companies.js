import { prisma } from '../../../lib/db'
import { requireAdmin } from '../../../middleware/admin'

async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const companies = await prisma.company.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

      return res.status(200).json(companies)
    }

    if (req.method === 'POST') {
      const count = await prisma.company.count()

      if (count >= 3) {
        return res.status(400).json({
          error: 'Maximum 3 companies allowed',
        })
      }

      const {
        name,
        phone,
        address,
        brandColor,
        initials,
        senderEmail,
        senderName,
        logo,
      } = req.body

      const company = await prisma.company.create({
        data: {
          name,
          phone,
          address,
          brandColor,
          initials,
          senderEmail,
          senderName,
          logo,
        },
      })

      return res.status(200).json(company)
    }

    if (req.method === 'PUT') {
      const {
        id,
        name,
        phone,
        address,
        brandColor,
        initials,
        senderEmail,
        senderName,
        logo,
      } = req.body

      const company = await prisma.company.update({
        where: {
          id,
        },
        data: {
          name,
          phone,
          address,
          brandColor,
          initials,
          senderEmail,
          senderName,
          logo,
        },
      })

      return res.status(200).json(company)
    }

    if (req.method === 'DELETE') {
      const { id } = req.body

      await prisma.company.delete({
        where: {
          id,
        },
      })

      return res.status(200).json({
        success: true,
      })
    }

    return res.status(405).json({
      error: 'Method not allowed',
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'Server error',
    })
  }
}

export default requireAdmin(handler)