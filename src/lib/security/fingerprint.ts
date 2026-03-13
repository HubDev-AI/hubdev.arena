import { createHmac } from "node:crypto";

type HashFingerprintInput = {
  ipAddress: string;
  userAgent: string;
  secret: string;
};

export async function hashFingerprint({
  ipAddress,
  userAgent,
  secret,
}: HashFingerprintInput) {
  return createHmac("sha256", secret)
    .update(`${ipAddress}|${userAgent}`)
    .digest("hex");
}
