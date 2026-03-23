import { NextResponse } from "next/server";

import { getDataMode } from "@/lib/env";
import { resetMockArenaRepository } from "@/lib/server/mock-seed";

export async function POST() {
  if ((process.env.NODE_ENV as string) === "production" || getDataMode() !== "mock") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  resetMockArenaRepository();
  // M24: Also clear the cached service so the next request creates a fresh
  // instance backed by the new repository. Without this, the old service
  // still references the stale (pre-reset) repository.
  globalThis.__hubdevArenaService = undefined;
  return NextResponse.json({ ok: true });
}
