import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

const createWeekSchema = z.object({
  slug: z.string().min(1),
  themeTitle: z.string().min(1),
  themeDescription: z.string().min(1),
  timezone: z.string().min(1),
  submissionOpenAt: z.string().min(1),
  submissionCloseAt: z.string().min(1),
  votingOpenAt: z.string().min(1),
  votingCloseAt: z.string().min(1),
});

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const body = createWeekSchema.parse(await request.json());
    const week = await getArenaService().createWeek({
      adminEmail: admin.email ?? "",
      ...body,
    });
    return NextResponse.json(week, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create week.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
