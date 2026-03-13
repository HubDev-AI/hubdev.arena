import { getEnv } from "@/lib/env";
import { hashFingerprint } from "@/lib/security/fingerprint";
import { getBuilderSession } from "@/lib/server/auth";

function getRequestIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "127.0.0.1";
  }

  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function getVoteRequestContext(request: Request) {
  const session = await getBuilderSession();

  if (!session) {
    return null;
  }

  const fingerprintHash = await hashFingerprint({
    ipAddress: getRequestIpAddress(request),
    userAgent: request.headers.get("user-agent") ?? "unknown",
    secret: getEnv().HUBDEV_FINGERPRINT_SECRET,
  });

  return {
    userId: session.userId,
    displayName: session.displayName,
    fingerprintHash,
  };
}
