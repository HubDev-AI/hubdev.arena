import { NextResponse } from "next/server";

import { getDataMode } from "@/lib/env";
import { resetMockArenaRepository } from "@/lib/server/mock-seed";

export async function POST() {
  if (getDataMode() !== "mock") {
    return NextResponse.json({ error: "Mock reset is disabled." }, { status: 404 });
  }

  resetMockArenaRepository();
  return NextResponse.json({ ok: true });
}
