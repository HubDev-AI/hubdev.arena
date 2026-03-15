"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/browser";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

  async function handleTwitterLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
  }

  if (status === "sent") {
    return (
      <div className="space-y-4 text-center">
        <div className="text-4xl">✉️</div>
        <p className="text-lg font-black tracking-[-0.04em] text-[var(--ink)]">
          Check your email
        </p>
        <p className="text-sm text-[var(--muted)]">
          We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm text-[var(--muted)] underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={handleTwitterLogin}
        className="brutal-btn brutal-btn-primary w-full"
      >
        Sign in with X
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--line)]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]">
          or
        </span>
        <div className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full border-2 border-[var(--ink)] bg-white px-4 py-3 font-mono text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--green)]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="brutal-btn brutal-btn-outline w-full disabled:opacity-60"
        >
          {status === "loading" ? "Sending..." : "Send magic link"}
        </button>
      </form>

      {errorMessage ? (
        <p className="text-sm font-semibold text-[var(--rust)]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
