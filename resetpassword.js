const {PrismaClient} = require('@prisma/client')
const bcrypt = require('bcryptjs')
const p = new PrismaClient()
bcrypt.hash('SpidermanForever', 12).then(function(hash) {
  return p.admin.update({
    where: { email: 'admin@redalertsol.com' },
    data: { passwordHash: hash, failedAttempts: 0, lockedUntil: null }
  })
}).then(function(r) { console.log('Password reset for:', r.email) })