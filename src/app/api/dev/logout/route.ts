import { NextResponse } from "next/server";

import { BUILDER_COOKIE_NAME } from "@/lib/server/auth";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: BUILDER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
