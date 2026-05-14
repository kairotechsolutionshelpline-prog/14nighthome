import { getIronSession } from 'iron-session'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: 'kt_admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}

export async function getSession(req, res) {
  return getIronSession(req, res, sessionOptions)
}

export async function requireAdmin(req, res) {
  const session = await getSession(req, res)

  if (!session?.admin?.loggedIn) {
    res.status(404).json({ error: 'Not found' })
    return null
  }

  return session
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export async function createAdminSession(req, res, admin) {
  const session = await getSession(req, res)

  session.admin = {
    id: admin.id,
    email: admin.email,
    loggedIn: true,
    loginTime: Date.now(),
  }

  await session.save()
}
export const setLoginSession = createAdminSession
export async function destroyAdminSession(req, res) {
  const session = await getSession(req, res)
  session.destroy()
}

export async function checkLoginAttempts(email) {
  const admin = await prisma.admin.findUnique({
    where: { email },
  })

  if (!admin) {
    return {
      allowed: false,
      reason: 'Invalid credentials',
    }
  }

  if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
    return {
      allowed: false,
      reason: 'Account temporarily locked',
    }
  }

  return {
    allowed: true,
    admin,
  }
}

export async function registerFailedLogin(adminId) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  })

  const attempts = (admin.failedAttempts || 0) + 1

  let lockedUntil = null

  if (attempts >= 5) {
    lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
  }

  await prisma.admin.update({
    where: { id: adminId },
    data: {
      failedAttempts: attempts,
      lockedUntil,
    },
  })
}

export async function resetLoginAttempts(adminId) {
  await prisma.admin.update({
    where: { id: adminId },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
    },
  })
}
