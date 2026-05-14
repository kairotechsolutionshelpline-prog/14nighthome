import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/auth'

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions)

  if (!session?.admin?.loggedIn) {
    return res.status(401).json({ authenticated: false })
  }

  return res.status(200).json({ authenticated: true, email: session.admin.email })
}