import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminAllowlist, getDataMode, getEnv } from "@/lib/env";
import { verifySignedValue } from "@/lib/security/signed-value";
import { getMockArenaRepository } from "@/lib/server/mock-seed";

export const BUILDER_COOKIE_NAME = "va-builder";
export const VOTER_COOKIE_NAME = "va-voter";

export type BuilderSession = {
  userId: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
};

export async function getBuilderSession(): Promise<BuilderSession | null> {
  if (getDataMode() !== "mock") {
    return null;
  }

  const cookieStore = await cookies();
  const signedBuilderId = cookieStore.get(BUILDER_COOKIE_NAME)?.value;
  const builderId = verifySignedValue(signedBuilderId, getEnv().HUBDEV_COOKIE_SECRET);

  if (!builderId) {
    return null;
  }

  const profile = await getMockArenaRepository().getProfileById(builderId);
  if (!profile || !profile.email) {
    return null;
  }

  return {
    userId: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    isAdmin: getAdminAllowlist().includes(profile.email.toLowerCase()),
  };
}

export async function requireBuilderSession(nextPath?: string) {
  const session = await getBuilderSession();

  if (!session) {
    const destination = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
    redirect(destination);
  }

  return session;
}

export async function requireAdminSession(nextPath?: string) {
  const session = await requireBuilderSession(nextPath);

  if (!session.isAdmin) {
    redirect("/");
  }

  return session;
}
