const {PrismaClient} = require('@prisma/client')
const p = new PrismaClient()
p.admin.findMany().then(function(r) { console.log(r) }).finally(function() { p.disconnect() })