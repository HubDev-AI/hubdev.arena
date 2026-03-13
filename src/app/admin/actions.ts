"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";
import { getVoteEngine } from "@/lib/server/vote-engine";

export async function createWeekAction(formData: FormData) {
  const session = await requireAdminSession("/admin/weeks");
  const slug = String(formData.get("slug") ?? "");

  await getArenaService().createWeek({
    adminEmail: session.email,
    slug,
    themeTitle: String(formData.get("themeTitle") ?? ""),
    themeDescription: String(formData.get("themeDescription") ?? ""),
    timezone: String(formData.get("timezone") ?? "America/Los_Angeles"),
    submissionOpenAt: String(formData.get("submissionOpenAt") ?? ""),
    submissionCloseAt: String(formData.get("submissionCloseAt") ?? ""),
    votingOpenAt: String(formData.get("votingOpenAt") ?? ""),
    votingCloseAt: String(formData.get("votingCloseAt") ?? ""),
  });

  revalidatePath("/admin/weeks");
  redirect(`/admin/weeks/${slug}`);
}

export async function reviewEntryAction(formData: FormData) {
  const session = await requireAdminSession("/admin/weeks");
  const weekSlug = String(formData.get("weekSlug") ?? "");

  await getArenaService().reviewEntry({
    adminEmail: session.email,
    entryId: String(formData.get("entryId") ?? ""),
    decision: String(formData.get("decision")) === "approved" ? "approved" : "rejected",
  });

  revalidatePath(`/admin/weeks/${weekSlug}`);
}

export async function openSubmissionsAction(formData: FormData) {
  const session = await requireAdminSession("/admin/weeks");
  const weekSlug = String(formData.get("weekSlug") ?? "");

  await getArenaService().setWeekStatus({
    adminEmail: session.email,
    weekSlug,
    action: "open_submissions",
  });

  revalidatePath("/admin/weeks");
  revalidatePath(`/admin/weeks/${weekSlug}`);
}

export async function openVotingAction(formData: FormData) {
  const session = await requireAdminSession("/admin/weeks");
  const weekSlug = String(formData.get("weekSlug") ?? "");

  await getVoteEngine().openVoting(weekSlug, session.email);
  revalidatePath("/admin/weeks");
  revalidatePath(`/admin/weeks/${weekSlug}`);
}

export async function lockWeekAction(formData: FormData) {
  const session = await requireAdminSession("/admin/weeks");
  const weekSlug = String(formData.get("weekSlug") ?? "");

  await getVoteEngine().lockWeek(weekSlug, session.email);
  revalidatePath("/admin/weeks");
  revalidatePath(`/admin/weeks/${weekSlug}`);
}

export async function archiveWeekAction(formData: FormData) {
  const session = await requireAdminSession("/admin/weeks");
  const weekSlug = String(formData.get("weekSlug") ?? "");

  await getArenaService().setWeekStatus({
    adminEmail: session.email,
    weekSlug,
    action: "archive",
  });

  revalidatePath("/admin/weeks");
  revalidatePath(`/admin/weeks/${weekSlug}`);
}
