export default async function handler(req, res) {
  console.log("Resend webhook:", req.body);

  return res.status(200).json({
    received: true,
  });
}