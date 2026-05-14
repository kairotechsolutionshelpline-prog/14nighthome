import { getIronSession } from 'iron-session'
import { sessionOptions } from '../lib/auth'

export function requireAdmin(handler) {
  return async (req, res) => {
    const session = await getIronSession(req, res, sessionOptions)

    if (!session?.admin?.loggedIn) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    return handler(req, res)
  }
}