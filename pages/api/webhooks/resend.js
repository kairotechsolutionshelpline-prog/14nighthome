import prisma from '../../../lib/db'

export default async function handler(req, res) {
  try {
    const payload = req.body

    console.log('Webhook:', payload)

    return res.status(200).json({
      received: true,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'Webhook failed',
    })
  }
}