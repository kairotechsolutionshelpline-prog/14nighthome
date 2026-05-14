import { prisma } from '../../lib/db';
import { requireAdmin } from '../../middleware/admin';

async function handler(req, res) {
  const data = await prisma.company.findMany();
  res.json(data);
}

export default requireAdmin(handler)