const bcrypt = require('bcryptjs')

async function run() {
  const password = 'YOUR_ADMIN_PASSWORD'

  const hash = await bcrypt.hash(password, 12)

  console.log(hash)
}

run()