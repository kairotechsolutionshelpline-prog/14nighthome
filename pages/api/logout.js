import { withSession } from "../../lib/session";

async function handler(req, res) {
  req.session.destroy();

  return res.status(200).json({
    success: true,
  });
}

export default withSession(handler);