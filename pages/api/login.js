import bcrypt from 'bcryptjs'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../lib/auth'
import { prisma } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  try {
    const admin = await prisma.admin.findUnique({ where: { email } })

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, admin.passwordHash)

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const session = await getIronSession(req, res, sessionOptions)
    session.admin = { id: admin.id, email: admin.email, loggedIn: true, isIntimation: true, loginTime: Date.now() }
    await session.save()

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Server error' })
  }
}