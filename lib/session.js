import { getIronSession } from "iron-session";

export const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "kt_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export function withSession(handler) {
  return async (req, res) => {
    req.session = await getIronSession(req, res, sessionOptions);
    return handler(req, res);
  };
}
