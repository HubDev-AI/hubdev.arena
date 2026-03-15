import { createHmac } from "node:crypto";

type HashFingerprintInput = {
  ipAddress: string;
  userAgent: string;
  secret: string;
};

export function hashFingerprint({
  ipAddress,
  userAgent,
  secret,
}: HashFingerprintInput) {
  return createHmac("sha256", secret)
    .update(`${ipAddress}|${userAgent}`)
    .digest("hex");
}

export function getRequestIpAddress(request: Request) {
  // Prefer x-real-ip (set by Vercel/reverse proxy, not spoofable)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "127.0.0.1";
  }

  return "127.0.0.1";
}
