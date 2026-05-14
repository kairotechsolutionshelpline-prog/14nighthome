const { execSync } = require('child_process')

console.log('Running Prisma migrations...')

try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  console.log('✅ Migrations done.')
} catch (e) {
  console.error('❌ Migration failed:', e.message)
  process.exit(1)
}