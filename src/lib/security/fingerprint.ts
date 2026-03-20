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
    .update(`${ipAddress}\0${userAgent}`)
    .digest("hex");
}

// DEPLOYMENT REQUIREMENT: This app MUST be deployed behind a trusted reverse
// proxy (Vercel, Nginx, etc.) that sets x-real-ip from the actual client
// connection and strips any client-supplied x-forwarded-for header. Without
// this, fingerprint-based rate limiting is bypassable via header spoofing.
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
