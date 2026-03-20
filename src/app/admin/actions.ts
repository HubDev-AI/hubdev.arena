"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";
import { getVoteEngine } from "@/lib/server/vote-engine";

const slugPattern = /^[a-z0-9-]+$/;

const createWeekSchema = z.object({
  slug: z.string().min(1).max(50).regex(slugPattern, "Slug must be lowercase alphanumeric with dashes."),
  themeTitle: z.string().min(1, "Title is required.").max(100),
  themeDescription: z.string(),
  timezone: z.string().min(1),
  submissionOpenAt: z.string().datetime({ message: "Invalid date for submission open." }),
  submissionCloseAt: z.string().datetime({ message: "Invalid date for submission close." }),
  votingOpenAt: z.string().datetime({ message: "Invalid date for voting open." }),
  votingCloseAt: z.string().datetime({ message: "Invalid date for voting close." }),
});

const weekSlugSchema = z.string().min(1).max(50).regex(slugPattern, "Invalid week slug.");
const entryIdSchema = z.string().uuid("Invalid entry ID.");

export async function createWeekAction(formData: FormData) {
  const session = await requireAdminSession("/admin/weeks");

  const parsed = createWeekSchema.safeParse({
    slug: formData.get("slug") ?? "",
    themeTitle: formData.get("themeTitle") ?? "",
    themeDescription: formData.get("themeDescription") ?? "",
    timezone: formData.get("timezone") ?? "America/Los_Angeles",
    submissionOpenAt: formData.get("submissionOpenAt") ?? "",
    submissionCloseAt: formData.get("submissionCloseAt") ?? "",
    votingOpenAt: formData.get("votingOpenAt") ?? "",
    votingCloseAt: formData.get("votingCloseAt") ?? "",
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
    throw new Error(firstError);
  }

  await getArenaService().createWeek({
    adminEmail: session.email,
    ...parsed.data,
  });

  revalidatePath("/admin/weeks");
  redirect(`/admin/weeks/${parsed.data.slug}`);
}

export async function reviewEntryAction(formData: FormData) {
  const session = await requireAdminSession("/admin/weeks");
  const weekSlug = weekSlugSchema.parse(formData.get("weekSlug") ?? "");
  const entryId = entryIdSchema.parse(formData.get("entryId") ?? "");

  await getArenaService().reviewEntry({
    adminEmail: session.email,
    entryId,
    decision: String(formData.get("decision")) === "approved" ? "approved" : "rejected",
  });

  revalidatePath(`/admin/weeks/${weekSlug}`);
}

export async function openSubmissionsAction(formData: FormData) {
  const session = await requireAdminSession("/admin/weeks");
  const weekSlug = weekSlugSchema.parse(formData.get("weekSlug") ?? "");

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
  const weekSlug = weekSlugSchema.parse(formData.get("weekSlug") ?? "");

  await getVoteEngine().openVoting(weekSlug, session.email);
  revalidatePath("/admin/weeks");
  revalidatePath(`/admin/weeks/${weekSlug}`);
}

export async function lockWeekAction(formData: FormData) {
  const session = await requireAdminSession("/admin/weeks");
  const weekSlug = weekSlugSchema.parse(formData.get("weekSlug") ?? "");

  await getVoteEngine().lockWeek(weekSlug, session.email);
  revalidatePath("/admin/weeks");
  revalidatePath(`/admin/weeks/${weekSlug}`);
}

export async function archiveWeekAction(formData: FormData) {
  const session = await requireAdminSession("/admin/weeks");
  const weekSlug = weekSlugSchema.parse(formData.get("weekSlug") ?? "");

  await getArenaService().setWeekStatus({
    adminEmail: session.email,
    weekSlug,
    action: "archive",
  });

  revalidatePath("/admin/weeks");
  revalidatePath(`/admin/weeks/${weekSlug}`);
}
