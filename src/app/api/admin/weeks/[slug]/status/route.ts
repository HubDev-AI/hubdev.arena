import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";
import { getVoteEngine } from "@/lib/server/vote-engine";

const patchStatusSchema = z.object({
  targetStatus: z.enum(["submissions_open", "voting_open", "locked", "archived"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const { slug } = await params;
    const body = patchStatusSchema.parse(await request.json());
    const adminEmail = admin.email ?? "";

    if (body.targetStatus === "voting_open") {
      // Check ≥2 approved entries before opening voting
      const detail = await getArenaService().getWeekAdminDetail(slug);
      const approvedCount = detail.entries.filter((e) => e.status === "approved").length;
      if (approvedCount < 2) {
        return NextResponse.json(
          { error: `Need at least 2 approved entries to open voting. Currently have ${approvedCount}.` },
          { status: 400 },
        );
      }
      const result = await getVoteEngine().openVoting(slug, adminEmail);
      return NextResponse.json(result);
    }

    if (body.targetStatus === "locked") {
      const result = await getVoteEngine().lockWeek(slug, adminEmail);
      return NextResponse.json(result);
    }

    const actionMap: Record<string, "open_submissions" | "archive"> = {
      submissions_open: "open_submissions",
      archived: "archive",
    };

    const action = actionMap[body.targetStatus];
    if (!action) {
      return NextResponse.json({ error: "Invalid target status." }, { status: 400 });
    }

    const result = await getArenaService().setWeekStatus({
      adminEmail,
      weekSlug: slug,
      action,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update week status.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
