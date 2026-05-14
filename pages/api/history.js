import { prisma } from '../../lib/db';
import { requireAdmin } from '../../middleware/admin';

async function handler(req, res) {
  const logs = await prisma.mailLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100 // Shows last 100 emails
  });
  res.json(logs);
}

export default requireAdmin(handler)