import { randomUUID } from "node:crypto";

import type { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getEnv } from "@/lib/env";
import { getRequestIpAddress, hashFingerprint } from "@/lib/security/fingerprint";
import { signValue, verifySignedValue } from "@/lib/security/signed-value";
import { VOTER_COOKIE_NAME } from "@/lib/server/auth";

export async function getVoterIdentity(request: Request) {
  const cookieStore = await cookies();
  const cookieSecret = getEnv().HUBDEV_COOKIE_SECRET;
  const signedCookie = cookieStore.get(VOTER_COOKIE_NAME)?.value;
  const cookieId = verifySignedValue(signedCookie, cookieSecret) ?? randomUUID();
  const fingerprintHash = hashFingerprint({
    ipAddress: getRequestIpAddress(request),
    userAgent: request.headers.get("user-agent") ?? "unknown",
    secret: getEnv().HUBDEV_FINGERPRINT_SECRET,
  });

  return {
    cookieId,
    fingerprintHash,
    shouldSetCookie: !signedCookie,
  };
}

export function attachVoterCookie(response: NextResponse, cookieId: string) {
  response.cookies.set({
    name: VOTER_COOKIE_NAME,
    value: signValue(cookieId, getEnv().HUBDEV_COOKIE_SECRET),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
