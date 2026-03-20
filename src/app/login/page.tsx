import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuroraBg } from "@/components/aurora-bg";
import { GlitchText } from "@/components/glitch-text";
import { LoginForm } from "@/components/login-form";
import { MockLoginPanel } from "@/components/mock-login-panel";
import { ParticleField } from "@/components/particle-field";
import { getAdminAllowlist, getDataMode } from "@/lib/env";
import { resolveLoginRedirectPath } from "@/lib/login-redirect";
import { getBuilderSession } from "@/lib/server/auth";
import { getMockArenaRepository } from "@/lib/server/mock-seed";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to HubDev Arena to submit your AI-built apps and vote in head-to-head matchups.",
  robots: {
    index: false,
    follow: true,
  },
};

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
    <div className="page-bg page-bg-login">
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
      <div className="brutal-card relative overflow-hidden space-y-5 p-6 sm:p-8 holo-shimmer bg-[var(--ink)] text-white">
        <AuroraBg />
        <ParticleField className="opacity-30" />
        <div className="relative z-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
          Account auth
        </p>
        <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.08em] sm:text-6xl">
          <GlitchText text="Sign in to submit and vote" className="text-white" />
        </h1>
        <div className="h-[3px] w-24 bg-[var(--accent-green)]" style={{ boxShadow: "0 0 15px rgba(0, 255, 65, 0.4)" }} />
        <p className="max-w-xl text-sm leading-8 text-gray-400">
          {isMock
            ? "This local shell ships with mock member profiles so the end-to-end flow for submissions and voting can run without external auth setup."
            : "Sign in with your X account or email to submit apps and vote on matchups."}
        </p>
        {error === "auth_failed" ? (
          <p role="alert" className="border-[2px] border-[var(--accent-red)] bg-red-900/30 px-4 py-3 font-mono text-sm font-bold text-red-400">
            Authentication failed. Please try again.
          </p>
        ) : null}
        </div>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
      </div>
      <div className="brutal-card p-6 neon-box holo-shimmer">
        {isMock ? (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-green)]">
              Demo member profiles
            </p>
            <div className="mt-5">
              <MockLoginPanel
                builders={(await getMockArenaRepository().listProfiles()).map((profile) => ({
                  id: profile.id,
                  displayName: profile.displayName,
                  email: profile.email ?? "",
                  isAdmin: getAdminAllowlist().includes((profile.email ?? "").toLowerCase()),
                }))}
                redirectTo={redirectTo}
              />
            </div>
          </>
        ) : (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-green)]">
              Sign in
            </p>
            <div className="mt-5">
              <LoginForm redirectTo={redirectTo} />
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
