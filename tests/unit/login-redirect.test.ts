import { resolveLoginRedirectPath } from "@/lib/login-redirect";

describe("resolveLoginRedirectPath", () => {
  it("keeps a safe internal path", () => {
    expect(resolveLoginRedirectPath("/vote")).toBe("/vote");
  });

  it("falls back to the home page for external URLs", () => {
    expect(resolveLoginRedirectPath("https://evil.example.com/phish")).toBe("/");
    expect(resolveLoginRedirectPath("//evil.example.com/phish")).toBe("/");
  });

  it("falls back to the home page for blank or malformed values", () => {
    expect(resolveLoginRedirectPath("")).toBe("/");
    expect(resolveLoginRedirectPath("vote")).toBe("/");
    expect(resolveLoginRedirectPath(["/vote", "/submit"])).toBe("/");
    expect(resolveLoginRedirectPath(undefined)).toBe("/");
  });
});
