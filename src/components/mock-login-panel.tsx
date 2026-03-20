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
          className="brutal-card flex w-full items-center justify-between px-5 py-4 text-left disabled:opacity-60 hover-lift inner-glow"
        >
          <div>
            <p className="text-lg font-black tracking-[-0.04em] text-[var(--text-primary)]">
              {builder.displayName}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{builder.email}</p>
          </div>
          <span className="brutal-badge brutal-badge-green">
            {builder.isAdmin ? "Admin" : "Member"}
          </span>
        </button>
      ))}
      {error ? <p className="text-sm font-semibold text-[var(--rust)]">{error}</p> : null}
    </div>
  );
}
