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
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "twitter",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) {
        setErrorMessage(error.message);
        setStatus("error");
      }
    } catch {
      setErrorMessage("Failed to start sign-in. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="brutal-card relative overflow-hidden p-6 text-center">
        {/* Green accent bar */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[var(--accent-green)]" />

        <div className="mx-auto flex h-14 w-14 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--accent-green)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 8l9 6 9-6" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="2" y="5" width="20" height="14" rx="1" stroke="var(--ink)" strokeWidth="2.5" fill="none" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-black tracking-[-0.04em] text-[var(--ink)]">
          Check your email
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          We sent a magic link to <strong className="text-[var(--ink)]">{email}</strong>. Click the link to sign in.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-semibold text-[var(--muted)] underline underline-offset-2 transition-colors hover:text-[var(--ink)]"
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
        className="brutal-btn brutal-btn-primary w-full gap-2.5"
      >
        <span className="flex h-5 w-5 items-center justify-center bg-white text-[var(--ink)] text-xs font-black leading-none">
          X
        </span>
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
          className="w-full border-2 border-[var(--ink)] bg-white px-4 py-3 font-mono text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)]"
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
        <p role="alert" className="text-sm font-semibold text-red-700">{errorMessage}</p>
      ) : null}
    </div>
  );
}
