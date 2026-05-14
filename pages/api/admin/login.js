import bcrypt from 'bcryptjs'
import { setLoginSession } from '../../../lib/auth'
// deleted — rateLimit import removed, manual attempts Map is used instead

const attempts = new Map()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  try {

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
      })
    }

    const adminEmail = process.env.ADMIN_EMAIL
    const adminHash = process.env.ADMIN_PASSWORD_HASH

    const ip =
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress

    const failed = attempts.get(ip)

    if (failed && failed.count >= 5) {
      const waitTime = 15 * 60 * 1000

      if (Date.now() - failed.lastAttempt < waitTime) {
        return res.status(429).json({
          error: 'Too many failed attempts',
        })
      }

      attempts.delete(ip)
    }

    if (email !== adminEmail) {
      return res.status(401).json({
        error: 'Invalid credentials',
      })
    }

    const valid = await bcrypt.compare(
      password,
      adminHash
    )

    if (!valid) {
      attempts.set(ip, {
        count: failed ? failed.count + 1 : 1,
        lastAttempt: Date.now(),
      })

      return res.status(401).json({
        error: 'Invalid credentials',
      })
    }

    attempts.delete(ip)

    await setLoginSession(req, res, {
      id: null,
      email,
      loggedIn: true,
    })

    return res.status(200).json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'Server error',
    })
  }
}