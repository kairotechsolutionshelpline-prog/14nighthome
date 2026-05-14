import { PrismaClient } from '@prisma/client';
import { requireIntimation } from '../../middleware/requireIntimation';
// Bug #14 fix: use the shared emailProvider instead of instantiating Resend directly
import { sendEmail } from '../../lib/emailProvider';
// Bug #14 fix: import generatePDF so we can attach a PDF — matching every other send route
import { generatePDF } from '../../lib/pdfGenerator';

const prisma = new PrismaClient();

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { members, companyId, templateId } = req.body;

  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const template = await prisma.template.findUnique({ where: { id: templateId } });

    for (const member of members) {
      // Bug #14 fix: generate the PDF for this member before sending
      const pdfBuffer = await generatePDF({ company, template, client: member });

      // Bug #14 fix: send via lib/emailProvider (which handles Resend init, from-address
      // formatting, and the PDF attachment) instead of calling resend.emails.send directly
      const { error } = await sendEmail({
        to: member.email,
        subject: template.subject,
        html: template.emailBody,
        pdfBuffer,
        senderName: company.senderName,
        senderEmail: company.senderEmail,
      });

      // Log the send in the database history
      await prisma.mailLog.create({
        data: {
          recipientName: member.name,
          recipientEmail: member.email,
          companyName: company.name,
          senderName: company.senderName,
          status: error ? 'failed' : 'sent',
          failureReason: error ? error.message : null,
          companyId: company.id,
        }
      });

      // Mandatory 8–20 second randomised delay (Requirement #10)
      const waitTime = Math.floor(Math.random() * (20000 - 8000 + 1) + 8000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export default requireIntimation(handler);