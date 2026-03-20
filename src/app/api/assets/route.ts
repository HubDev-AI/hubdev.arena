import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getDataMode, getEnv } from "@/lib/env";
import { getBuilderSession } from "@/lib/server/auth";
import { buildDemoAssetObjectPath } from "@/lib/server/storage";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set(["image/gif", "video/mp4"]);
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function validateMagicBytes(buffer: ArrayBuffer): boolean {
  const header = new Uint8Array(buffer.slice(0, 12));
  // GIF87a or GIF89a
  const isGif = header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46;
  // MP4 ftyp box
  const isMp4 = header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70;
  return isGif || isMp4;
}

export async function POST(request: Request) {
  const session = await getBuilderSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to upload." }, { status: 401 });
  }

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

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File must be under 50 MB." },
      { status: 400 },
    );
  }

  const buffer = await file.arrayBuffer();

  if (!validateMagicBytes(buffer)) {
    return NextResponse.json(
      { error: "File content does not match a valid GIF or MP4." },
      { status: 400 },
    );
  }

  if (getDataMode() === "mock") {
    return NextResponse.json({
      demoAssetPath: `mock://${session.userId}/${randomUUID()}-${file.name}`,
    });
  }

  try {
    const objectPath = buildDemoAssetObjectPath(session.userId, file.name);
    const supabase = await createClient();
    const { error } = await supabase.storage
      .from("demo-assets")
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: "Failed to upload asset." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("demo-assets")
      .getPublicUrl(objectPath);

    return NextResponse.json({ demoAssetPath: urlData.publicUrl });
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
