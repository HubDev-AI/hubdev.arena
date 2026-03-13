import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

const patchFoundingBuilderSchema = z.object({
  foundingBuilder: z.boolean(),
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
    const body = patchFoundingBuilderSchema.parse(await request.json());
    const profile = await getArenaService().setFoundingBuilder({
      adminEmail: admin.email ?? "",
      profileId: id,
      foundingBuilder: body.foundingBuilder,
    });
    return NextResponse.json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
