import { redirect } from "next/navigation";

import { MockLoginPanel } from "@/components/mock-login-panel";
import { getDataMode } from "@/lib/env";
import { resolveLoginRedirectPath } from "@/lib/login-redirect";
import { getBuilderSession } from "@/lib/server/auth";
import { getMockArenaRepository } from "@/lib/server/mock-seed";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const session = await getBuilderSession();
  const { next } = await searchParams;
  const redirectTo = resolveLoginRedirectPath(next);

  if (session) {
    redirect(redirectTo);
  }

  if (getDataMode() !== "mock") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-lg text-[var(--muted)]">
          Supabase auth wiring is pending. Set `HUBDEV_DATA_MODE=mock` for the local MVP shell.
        </p>
      </div>
    );
  }

  const builders = (await getMockArenaRepository().listProfiles()).map((profile) => ({
    id: profile.id,
    displayName: profile.displayName,
    email: profile.email ?? "unknown@example.com",
    isAdmin: profile.email === "admin@example.com",
  }));

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
          Production auth is X / Twitter OAuth with magic-link fallback. This local shell ships with mock member profiles so the end-to-end flow for submissions and voting can run without external auth setup.
        </p>
      </div>
      <div className="brutal-card p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Demo member profiles
        </p>
        <div className="mt-5">
          <MockLoginPanel builders={builders} redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}
