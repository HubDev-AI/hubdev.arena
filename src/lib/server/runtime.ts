import { createArenaService } from "@/lib/server/arena-service";
import { getAdminAllowlist, getDataMode } from "@/lib/env";
import { getMockArenaRepository } from "@/lib/server/mock-seed";
import { createSupabaseArenaRepository } from "@/lib/server/supabase-arena-repository";
import { createServiceRoleClient } from "@/lib/supabase";

export function getArenaService() {
  const dataMode = getDataMode();
  const repository =
    dataMode === "mock"
      ? getMockArenaRepository()
      : createSupabaseArenaRepository(createServiceRoleClient());
  return createArenaService(repository, { adminAllowlist: getAdminAllowlist() });
}
