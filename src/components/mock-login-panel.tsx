"use client";

import { useState } from "react";

type DemoBuilder = {
  id: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
};

export function MockLoginPanel({
  builders,
  redirectTo,
}: {
  builders: DemoBuilder[];
  redirectTo: string;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(profileId: string) {
    setPendingId(profileId);
    setError(null);

    const response = await fetch("/api/dev/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ profileId }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to sign in.");
      setPendingId(null);
      return;
    }

    window.location.assign(redirectTo);
  }

  return (
    <div className="space-y-4">
      {builders.map((builder) => (
        <button
          key={builder.id}
          type="button"
          onClick={() => handleLogin(builder.id)}
          disabled={pendingId !== null}
          className="flex w-full items-center justify-between rounded-[1.6rem] border border-[var(--line)] bg-white/85 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--ink)] hover:shadow-[0_18px_40px_rgba(8,18,30,0.08)] disabled:opacity-60"
        >
          <div>
            <p className="text-lg font-black tracking-[-0.04em] text-[var(--ink)]">
              {builder.displayName}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">{builder.email}</p>
          </div>
          <span className="rounded-full bg-[var(--ink)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--paper)]">
            {builder.isAdmin ? "Admin" : "Member"}
          </span>
        </button>
      ))}
      {error ? <p className="text-sm font-semibold text-[var(--rust)]">{error}</p> : null}
    </div>
  );
}
