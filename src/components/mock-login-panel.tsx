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
        "x-requested-with": "XMLHttpRequest",
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
    <div className="space-y-4" aria-live="polite">
      {builders.map((builder) => (
        <button
          key={builder.id}
          type="button"
          onClick={() => handleLogin(builder.id)}
          disabled={pendingId !== null}
          className="brutal-card flex w-full items-center justify-between px-5 py-4 text-left disabled:opacity-60 hover-lift inner-glow"
        >
          <div className="flex items-center gap-3">
            {/* M56: Show spinner on the specific button being clicked */}
            {pendingId === builder.id ? (
              <svg className="h-5 w-5 flex-shrink-0 animate-spin text-[var(--accent-green)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            <div>
              <p className="text-lg font-black tracking-[-0.04em] text-[var(--text-primary)]">
                {builder.displayName}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{builder.email}</p>
            </div>
          </div>
          <span className="brutal-badge brutal-badge-green">
            {builder.isAdmin ? "Admin" : "Member"}
          </span>
        </button>
      ))}
      {error ? <p role="alert" className="text-sm font-semibold text-[var(--rust)]">{error}</p> : null}
    </div>
  );
}
