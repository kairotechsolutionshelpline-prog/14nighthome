import bcrypt from 'bcryptjs'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

const attempts = new Map()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' })
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress

  const failed = attempts.get(ip)
  if (failed && failed.count >= 5) {
    const waitTime = 15 * 60 * 1000
    if (Date.now() - failed.lastAttempt < waitTime) {
      return res.status(429).json({ error: 'Too many failed attempts. Try after 15 minutes.' })
    }
    attempts.delete(ip)
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { email } })

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      return res.status(429).json({ error: 'Account temporarily locked' })
    }

    const valid = await bcrypt.compare(password, admin.passwordHash)

    if (!valid) {
      attempts.set(ip, {
        count: failed ? failed.count + 1 : 1,
        lastAttempt: Date.now(),
      })

      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          failedAttempts: { increment: 1 },
          lockedUntil: admin.failedAttempts >= 4
            ? new Date(Date.now() + 15 * 60 * 1000)
            : null,
        },
      })

      return res.status(401).json({ error: 'Invalid credentials' })
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { failedAttempts: 0, lockedUntil: null },
    })

    attempts.delete(ip)

    const session = await getIronSession(req, res, sessionOptions)
    session.admin = {
      id: admin.id,
      email: admin.email,
      loggedIn: true,
      isIntimation: true,
      loginTime: Date.now(),
    }
    await session.save()

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Server error' })
  }
}