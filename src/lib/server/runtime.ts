import { createArenaService } from "@/lib/server/arena-service";
import { getAdminAllowlist, getDataMode, getEnv } from "@/lib/env";
import { getMockArenaRepository } from "@/lib/server/mock-seed";
import { createSupabaseArenaRepository } from "@/lib/server/supabase-arena-repository";

export function getArenaService() {
  const dataMode = getDataMode();
  const adminAllowlist = getAdminAllowlist();

  if (dataMode === "mock") {
    return createArenaService(getMockArenaRepository(), { adminAllowlist });
  }

  const env = getEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase URL and service role key are required when HUBDEV_DATA_MODE=supabase.",
    );
  }

  const repository = createSupabaseArenaRepository(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  return createArenaService(repository, { adminAllowlist });
}
