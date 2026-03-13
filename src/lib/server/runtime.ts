import { createArenaService } from "@/lib/server/arena-service";
import { getAdminAllowlist, getDataMode } from "@/lib/env";
import { getMockArenaRepository } from "@/lib/server/mock-seed";

export function getArenaService() {
  const dataMode = getDataMode();

  if (dataMode !== "mock") {
    throw new Error(
      "Supabase runtime wiring is not configured yet. Set HUBDEV_DATA_MODE=mock for local use.",
    );
  }

  return createArenaService(getMockArenaRepository(), {
    adminAllowlist: getAdminAllowlist(),
  });
}
