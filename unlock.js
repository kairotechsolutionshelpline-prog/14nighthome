const {PrismaClient} = require('@prisma/client')
const p = new PrismaClient()
p.admin.update({
  where: { email: 'admin@redalertsol.com' },
  data: { failedAttempts: 0, lockedUntil: null }
}).then(function(r) { console.log('Unlocked:', r.email) })