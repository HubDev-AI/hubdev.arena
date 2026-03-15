import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { MockLoginPanel } from "@/components/mock-login-panel";
import { getDataMode } from "@/lib/env";
import { resolveLoginRedirectPath } from "@/lib/login-redirect";
import { getBuilderSession } from "@/lib/server/auth";
import { getMockArenaRepository } from "@/lib/server/mock-seed";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string }>;
}) {
  const session = await getBuilderSession();
  const { next, error } = await searchParams;
  const redirectTo = resolveLoginRedirectPath(next);

  if (session) {
    redirect(redirectTo);
  }

  const isMock = getDataMode() === "mock";

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
      <div className="space-y-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
          Account auth
        </p>
        <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.08em] text-[var(--ink)]">
          Sign in to submit and vote
        </h1>
        <p className="max-w-xl text-lg leading-8 text-[var(--muted)]">
          {isMock
            ? "This local shell ships with mock member profiles so the end-to-end flow for submissions and voting can run without external auth setup."
            : "Sign in with your X account or email to submit apps and vote on matchups."}
        </p>
        {error === "auth_failed" ? (
          <p className="text-sm font-semibold text-[var(--rust)]">
            Authentication failed. Please try again.
          </p>
        ) : null}
      </div>
      <div className="brutal-card p-6">
        {isMock ? (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Demo member profiles
            </p>
            <div className="mt-5">
              <MockLoginPanel
                builders={(await getMockArenaRepository().listProfiles()).map((profile) => ({
                  id: profile.id,
                  displayName: profile.displayName,
                  email: profile.email ?? "unknown@example.com",
                  isAdmin: profile.email === "admin@example.com",
                }))}
                redirectTo={redirectTo}
              />
            </div>
          </>
        ) : (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Sign in
            </p>
            <div className="mt-5">
              <LoginForm redirectTo={redirectTo} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
