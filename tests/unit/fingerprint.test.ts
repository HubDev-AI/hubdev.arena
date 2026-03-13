import { hashFingerprint } from "@/lib/security/fingerprint";

describe("hashFingerprint", () => {
  it("returns a stable secret-derived hash", async () => {
    const first = await hashFingerprint({
      ipAddress: "203.0.113.9",
      userAgent: "Mozilla/5.0 Test Browser",
      secret: "local-secret",
    });
    const second = await hashFingerprint({
      ipAddress: "203.0.113.9",
      userAgent: "Mozilla/5.0 Test Browser",
      secret: "local-secret",
    });

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
    expect(first).not.toContain("203.0.113.9");
  });

  it("changes when the identifying input changes", async () => {
    const first = await hashFingerprint({
      ipAddress: "203.0.113.9",
      userAgent: "Mozilla/5.0 Test Browser",
      secret: "local-secret",
    });
    const second = await hashFingerprint({
      ipAddress: "203.0.113.10",
      userAgent: "Mozilla/5.0 Test Browser",
      secret: "local-secret",
    });

    expect(first).not.toBe(second);
  });
});
