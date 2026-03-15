import { getEnv } from "@/lib/env";
import { getRequestIpAddress, hashFingerprint } from "@/lib/security/fingerprint";
import { getBuilderSession } from "@/lib/server/auth";

export async function getVoteRequestContext(request: Request) {
  const session = await getBuilderSession();

  if (!session) {
    return null;
  }

  const fingerprintHash = hashFingerprint({
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
