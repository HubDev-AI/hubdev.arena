import { buildDemoAssetObjectPath } from "@/lib/server/storage";
import { resolveDataMode } from "@/lib/env";

describe("resolveDataMode", () => {
  it("prefers an explicit HUBDEV_DATA_MODE value", () => {
    expect(
      resolveDataMode({
        HUBDEV_DATA_MODE: "mock",
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      }),
    ).toBe("mock");
  });

  it("detects supabase mode when all required Supabase keys exist", () => {
    expect(
      resolveDataMode({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      }),
    ).toBe("supabase");
  });

  it("falls back to mock mode when production adapters are not configured", () => {
    expect(resolveDataMode({})).toBe("mock");
  });
});

describe("buildDemoAssetObjectPath", () => {
  it("scopes uploaded demo assets to the builder folder and preserves the file extension", () => {
    expect(buildDemoAssetObjectPath("user-123", "Cool Demo FINAL.mp4")).toBe(
      "user-123/cool-demo-final.mp4",
    );
  });

  it("falls back to a safe filename when the original name is empty", () => {
    expect(buildDemoAssetObjectPath("user-123", "")).toBe("user-123/demo-asset");
  });
});
