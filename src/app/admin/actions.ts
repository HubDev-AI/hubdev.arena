"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

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
