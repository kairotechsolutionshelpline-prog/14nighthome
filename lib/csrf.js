import crypto from "crypto";

export function generateCSRF() {
  return crypto.randomBytes(32).toString("hex");
}