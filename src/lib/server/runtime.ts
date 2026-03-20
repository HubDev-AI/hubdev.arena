import { createArenaService } from "@/lib/server/arena-service";
import { getAdminAllowlist, getDataMode, getEnv } from "@/lib/env";
import { getMockArenaRepository } from "@/lib/server/mock-seed";
import { createSupabaseArenaRepository } from "@/lib/server/supabase-arena-repository";

type ArenaService = ReturnType<typeof createArenaService>;

declare global {
  var __hubdevArenaService: ArenaService | undefined;
}

export function getArenaService() {
  if (globalThis.__hubdevArenaService) {
    return globalThis.__hubdevArenaService;
  }

  const dataMode = getDataMode();
  const adminAllowlist = getAdminAllowlist();

  if (dataMode === "mock") {
    const service = createArenaService(getMockArenaRepository(), { adminAllowlist });
    globalThis.__hubdevArenaService = service;
    return service;
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

  // Cache the Supabase service too. The Supabase repository creates a client
  // per instantiation but is stateless otherwise, so caching the service
  // avoids redundant client construction on every request.
  const service = createArenaService(repository, { adminAllowlist });
  globalThis.__hubdevArenaService = service;
  return service;
}
