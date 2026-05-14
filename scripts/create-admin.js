	const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function run() {
  const email = 'admin@redalertsol.com'
  const password = 'SpidermanForever'

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.admin.create({
    data: {
      email,
      passwordHash,
    },
  })

  console.log('Admin created:', admin.email)
  await prisma.$disconnect()
}

run()