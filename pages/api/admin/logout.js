import { destroyAdminSession } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  try {
    await destroyAdminSession(req, res)

    return res.status(200).json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'Internal server error',
    })
  }
}
