import { prisma } from '../../../lib/db';
import { requireAdmin } from '../../../middleware/admin';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  try {
    const template = await prisma.template.create({ data: req.body });
    res.status(200).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default requireAdmin(handler)