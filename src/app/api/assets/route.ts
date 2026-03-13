import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getDataMode } from "@/lib/env";
import { requireBuilderSession } from "@/lib/server/auth";

const ALLOWED_TYPES = new Set(["image/gif", "video/mp4"]);

export async function POST(request: Request) {
  try {
    const session = await requireBuilderSession("/submit");
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file upload is required." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Demo assets must be a GIF or MP4 file." },
        { status: 400 },
      );
    }

    if (getDataMode() === "mock") {
      return NextResponse.json({
        demoAssetPath: `mock://${session.userId}/${randomUUID()}-${file.name}`,
      });
    }

    return NextResponse.json(
      { error: "Supabase asset uploads are not configured yet." },
      { status: 501 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload the asset.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
