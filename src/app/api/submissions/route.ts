import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

const submissionSchema = z.object({
  weekSlug: z.string().min(1),
  title: z.string().min(3).max(60),
  oneLiner: z.string().min(10).max(140),
  liveUrl: z.string().url(),
  demoAssetPath: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await requireBuilderSession("/submit");
    const body = submissionSchema.parse(await request.json());
    const entry = await getArenaService().submitEntry({
      ...body,
      builderId: session.userId,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit entry.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
