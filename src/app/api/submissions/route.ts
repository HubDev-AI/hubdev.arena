import { NextResponse } from "next/server";
import { z } from "zod";

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
      return NextResponse.json({ error: "Invalid submission data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit entry." }, { status: 400 });
  }
}
