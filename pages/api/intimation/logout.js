import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getIronSession(req, res, sessionOptions)
  session.destroy()

  return res.status(200).json({ success: true })
}