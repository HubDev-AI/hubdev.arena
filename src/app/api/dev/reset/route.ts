import { NextResponse } from "next/server";

import { getDataMode } from "@/lib/env";
import { resetMockArenaRepository } from "@/lib/server/mock-seed";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  if (getDataMode() !== "mock") {
    return NextResponse.json({ error: "Mock reset is disabled." }, { status: 404 });
  }

  resetMockArenaRepository();
  return NextResponse.json({ ok: true });
}
