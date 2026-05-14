export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  // These pull from your Railway Dashboard Variables
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@redalertsol.com";
  const ADMIN_PASSWORD = process.env.DASHBOARD_PASSWORD;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
import bcrypt from 'bcryptjs'
import { setLoginSession } from '../../lib/auth'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH;

const valid = await bcrypt.compare(password, ADMIN_HASH)
if (email === ADMIN_EMAIL && valid) {
    await setLoginSession(req, res, { id: null, email, loggedIn: true })
    return res.status(200).json({ success: true });
}
  return res.status(401).json({ error: 'Invalid email or password' });
}