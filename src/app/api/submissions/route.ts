import { NextResponse } from "next/server";
import { z } from "zod";

import { assertCsrf } from "@/lib/security/csrf";
import { getBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

const submissionSchema = z.object({
  weekSlug: z.string().min(1),
  title: z.string().min(3).max(60),
  oneLiner: z.string().min(10).max(140),
  liveUrl: z.string().url().refine((url) => url.startsWith("https://"), {
    message: "Live URL must use HTTPS.",
  }),
  demoAssetPath: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    assertCsrf(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const session = await getBuilderSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in to submit." }, { status: 401 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const body = submissionSchema.parse(json);
    const entry = await getArenaService().submitEntry({
      ...body,
      builderId: session.userId,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data.", fields: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    if (error instanceof Error && /rate.?limit|limited/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
