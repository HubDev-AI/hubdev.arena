import { NextResponse } from "next/server";

import { getDataMode, getEnv } from "@/lib/env";
import { signValue } from "@/lib/security/signed-value";
import { BUILDER_COOKIE_NAME } from "@/lib/server/auth";
import { getMockArenaRepository } from "@/lib/server/mock-seed";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  if (getDataMode() !== "mock") {
    return NextResponse.json({ error: "Mock login is disabled." }, { status: 404 });
  }

  const body = (await request.json()) as { profileId?: string };
  const profileId = body.profileId;

  if (!profileId) {
    return NextResponse.json({ error: "profileId is required." }, { status: 400 });
  }

  const profile = await getMockArenaRepository().getProfileById(profileId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: BUILDER_COOKIE_NAME,
    value: signValue(profile.id, getEnv().HUBDEV_COOKIE_SECRET),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
