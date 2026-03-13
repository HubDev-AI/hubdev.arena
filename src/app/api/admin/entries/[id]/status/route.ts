import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

const patchEntryStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionNote: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const { id } = await params;
    const body = patchEntryStatusSchema.parse(await request.json());
    const adminEmail = admin.email ?? "";

    const entry = await getArenaService().reviewEntry({
      adminEmail,
      entryId: id,
      decision: body.status,
      rejectionNote: body.rejectionNote,
    });
    return NextResponse.json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update entry status.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
