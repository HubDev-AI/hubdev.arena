import { NextResponse } from "next/server";

import { getDataMode } from "@/lib/env";
import { resetMockArenaRepository } from "@/lib/server/mock-seed";

export async function POST() {
  if ((process.env.NODE_ENV as string) === "production" || getDataMode() !== "mock") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  resetMockArenaRepository();
  return NextResponse.json({ ok: true });
}
