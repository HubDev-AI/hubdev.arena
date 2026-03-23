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

export type ActionResult = { success: boolean; error?: string };

export async function createWeekAction(formData: FormData): Promise<ActionResult> {
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
    return { success: false, error: firstError };
  }

  // M23: Validate chronological ordering of dates
  const { submissionOpenAt, submissionCloseAt, votingOpenAt, votingCloseAt } = parsed.data;
  const subOpen = new Date(submissionOpenAt).getTime();
  const subClose = new Date(submissionCloseAt).getTime();
  const voteOpen = new Date(votingOpenAt).getTime();
  const voteClose = new Date(votingCloseAt).getTime();

  if (subOpen >= subClose) {
    return { success: false, error: "Submission open must be before submission close." };
  }
  if (subClose > voteOpen) {
    return { success: false, error: "Submission close must be on or before voting open." };
  }
  if (voteOpen >= voteClose) {
    return { success: false, error: "Voting open must be before voting close." };
  }

  try {
    await getArenaService().createWeek({
      adminEmail: session.email,
      ...parsed.data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create week.";
    return { success: false, error: message };
  }

  revalidatePath("/admin/weeks");
  redirect(`/admin/weeks/${parsed.data.slug}`);
}

export async function reviewEntryAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdminSession("/admin/weeks");
    const slugResult = weekSlugSchema.safeParse(formData.get("weekSlug") ?? "");
    if (!slugResult.success) {
      return { success: false, error: "Invalid week slug." };
    }
    const weekSlug = slugResult.data;

    const entryResult = entryIdSchema.safeParse(formData.get("entryId") ?? "");
    if (!entryResult.success) {
      return { success: false, error: "Invalid entry ID." };
    }
    const entryId = entryResult.data;

    await getArenaService().reviewEntry({
      adminEmail: session.email,
      entryId,
      decision: String(formData.get("decision")) === "approved" ? "approved" : "rejected",
    });

    revalidatePath(`/admin/weeks/${weekSlug}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to review entry.";
    return { success: false, error: message };
  }
}

export async function openSubmissionsAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdminSession("/admin/weeks");
    const slugResult = weekSlugSchema.safeParse(formData.get("weekSlug") ?? "");
    if (!slugResult.success) {
      return { success: false, error: "Invalid week slug." };
    }
    const weekSlug = slugResult.data;

    await getArenaService().setWeekStatus({
      adminEmail: session.email,
      weekSlug,
      action: "open_submissions",
    });

    revalidatePath("/admin/weeks");
    revalidatePath(`/admin/weeks/${weekSlug}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to open submissions.";
    return { success: false, error: message };
  }
}

export async function openVotingAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdminSession("/admin/weeks");
    const slugResult = weekSlugSchema.safeParse(formData.get("weekSlug") ?? "");
    if (!slugResult.success) {
      return { success: false, error: "Invalid week slug." };
    }
    const weekSlug = slugResult.data;

    await getVoteEngine().openVoting(weekSlug, session.email);
    revalidatePath("/admin/weeks");
    revalidatePath(`/admin/weeks/${weekSlug}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to open voting.";
    return { success: false, error: message };
  }
}

export async function lockWeekAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdminSession("/admin/weeks");
    const slugResult = weekSlugSchema.safeParse(formData.get("weekSlug") ?? "");
    if (!slugResult.success) {
      return { success: false, error: "Invalid week slug." };
    }
    const weekSlug = slugResult.data;

    await getVoteEngine().lockWeek(weekSlug, session.email);
    revalidatePath("/admin/weeks");
    revalidatePath(`/admin/weeks/${weekSlug}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to lock week.";
    return { success: false, error: message };
  }
}

export async function archiveWeekAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireAdminSession("/admin/weeks");
    const slugResult = weekSlugSchema.safeParse(formData.get("weekSlug") ?? "");
    if (!slugResult.success) {
      return { success: false, error: "Invalid week slug." };
    }
    const weekSlug = slugResult.data;

    await getArenaService().setWeekStatus({
      adminEmail: session.email,
      weekSlug,
      action: "archive",
    });

    revalidatePath("/admin/weeks");
    revalidatePath(`/admin/weeks/${weekSlug}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to archive week.";
    return { success: false, error: message };
  }
}
