import { NextResponse } from "next/server";
import { z } from "zod";

import { getDataMode, getEnv } from "@/lib/env";
import { assertCsrf } from "@/lib/security/csrf";
import { getBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const submissionSchema = z.object({
  weekSlug: z.string().min(1),
  title: z.string().min(3).max(60),
  oneLiner: z.string().min(10).max(140),
  liveUrl: z.string().url().refine((url) => url.startsWith("https://"), {
    message: "Live URL must use HTTPS.",
  }),
  demoAssetPath: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    assertCsrf(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const session = await getBuilderSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in to submit." }, { status: 401 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const body = submissionSchema.parse(json);

    // M16: If submission fails after asset upload, clean up the orphaned file.
    try {
      const entry = await getArenaService().submitEntry({
        ...body,
        builderId: session.userId,
      });

      return NextResponse.json(entry, { status: 201 });
    } catch (submissionError) {
      // Attempt to delete the uploaded asset to prevent orphaned files.
      // Only applies to Supabase mode — mock paths use synthetic URLs.
      if (
        getDataMode() !== "mock" &&
        body.demoAssetPath &&
        !body.demoAssetPath.startsWith("mock://")
      ) {
        try {
          const env = getEnv();
          if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
            const supabase = createSupabaseClient(
              env.NEXT_PUBLIC_SUPABASE_URL,
              env.SUPABASE_SERVICE_ROLE_KEY,
              { auth: { autoRefreshToken: false, persistSession: false } },
            );
            // Extract the object path from the public URL
            const bucketPrefix = "/storage/v1/object/public/demo-assets/";
            const pathIndex = body.demoAssetPath.indexOf(bucketPrefix);
            if (pathIndex >= 0) {
              const objectPath = body.demoAssetPath.slice(pathIndex + bucketPrefix.length);
              await supabase.storage.from("demo-assets").remove([objectPath]);
            }
          }
        } catch {
          // Best-effort cleanup — don't mask the original submission error.
        }
      }
      throw submissionError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data.", fields: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    if (error instanceof Error && /rate.?limit|limited/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
