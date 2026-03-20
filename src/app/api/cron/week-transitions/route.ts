import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { getArenaService } from "@/lib/server/runtime";
import { getVoteEngine } from "@/lib/server/vote-engine";

function verifyBearerToken(authHeader: string | null, secret: string | undefined): boolean {
  if (!authHeader || !secret) return false;
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!verifyBearerToken(authHeader, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const service = getArenaService();
  const weeks = await service.listWeeks();
  const now = new Date();
  const transitions: string[] = [];

  for (const week of weeks) {
    try {
      if (week.status === "draft" && new Date(week.submissionOpenAt) <= now) {
        await service.setWeekStatus({
          adminEmail: "cron@system",
          weekSlug: week.slug,
          action: "open_submissions",
        });
        transitions.push(`${week.slug}: draft → submissions_open`);
      }

      if (week.status === "submissions_open" && new Date(week.votingOpenAt) <= now) {
        const entries = await service.getWeekAdminDetail(week.slug);
        const approvedCount = entries.entries.filter((e) => e.status === "approved").length;
        if (approvedCount >= 2) {
          await getVoteEngine().openVoting(week.slug, "cron@system");
          transitions.push(`${week.slug}: submissions_open → voting_open (${approvedCount} entries)`);
        } else {
          transitions.push(`${week.slug}: skipped voting_open (only ${approvedCount} approved entries)`);
        }
      }

      if (week.status === "voting_open" && new Date(week.votingCloseAt) <= now) {
        await getVoteEngine().lockWeek(week.slug, "cron@system");
        transitions.push(`${week.slug}: voting_open → locked`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      transitions.push(`${week.slug}: ERROR — ${message}`);
    }
  }

  return NextResponse.json({ transitions, checkedAt: now.toISOString() });
}
