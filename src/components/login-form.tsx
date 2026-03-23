"use client";

import { useCallback, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/browser";

/** Common email domain typos and their corrections */
const EMAIL_TYPO_MAP: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmali.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gamil.com": "gmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlool.com": "outlook.com",
  "hotmal.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "protonmal.com": "protonmail.com",
  "protonmai.com": "protonmail.com",
};

function detectEmailTypo(email: string): string | null {
  const parts = email.split("@");
  if (parts.length !== 2) return null;
  const domain = parts[1]?.toLowerCase();
  if (!domain) return null;
  const correction = EMAIL_TYPO_MAP[domain];
  if (correction) {
    return `${parts[0]}@${correction}`;
  }
  return null;
}

type ErrorSource = "oauth" | "email" | "general";

export function LoginForm({ redirectTo, urlError }: { redirectTo: string; urlError?: string | null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorSource, setErrorSource] = useState<ErrorSource>("general");
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  // H29: Map URL error params to specific messages
  const urlErrorMessage = useMemo(() => {
    if (!urlError) return null;
    switch (urlError) {
      case "auth_failed":
        return "Something went wrong \u2014 please try again.";
      case "expired":
      case "otp_expired":
        return "Your magic link has expired \u2014 please request a new one.";
      case "cancelled":
      case "access_denied":
        return "Sign-in was cancelled.";
      default:
        return "Something went wrong \u2014 please try again.";
    }
  }, [urlError]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    setEmailSuggestion(null);
  }, []);

  function handleEmailChange(value: string) {
    setEmail(value);
    // M54: Check for typos on every change
    const suggestion = detectEmailTypo(value);
    setEmailSuggestion(suggestion);
    // Clear email errors when user types
    if (errorSource === "email") {
      clearError();
    }
  }

  function acceptSuggestion() {
    if (emailSuggestion) {
      setEmail(emailSuggestion);
      setEmailSuggestion(null);
    }
  }

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    clearError();

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setErrorSource("email");
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

  async function handleResendLink() {
    setStatus("loading");
    clearError();

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setErrorSource("email");
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

  async function handleTwitterLogin() {
    clearError();
    setOauthLoading(true);
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
        setErrorSource("oauth");
        setStatus("error");
        setOauthLoading(false);
      }
      // On success, the browser redirects — no need to reset loading
    } catch {
      setErrorMessage("Failed to start sign-in. Please try again.");
      setErrorSource("oauth");
      setStatus("error");
      setOauthLoading(false);
    }
  }

  // H40: Magic link sent confirmation with extra info
  if (status === "sent") {
    return (
      <div className="brutal-card relative overflow-hidden p-6 text-center" aria-live="polite">
        {/* Green accent bar */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[var(--accent-green)]" />

        <div className="mx-auto flex h-14 w-14 items-center justify-center border-[3px] border-[var(--line)] bg-[var(--accent-green)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 8l9 6 9-6" stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="2" y="5" width="20" height="14" rx="1" stroke="var(--text-primary)" strokeWidth="2.5" fill="none" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-black tracking-[-0.04em] text-[var(--text-primary)]">
          Check your email
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          We sent a magic link to <strong className="text-[var(--text-primary)]">{email}</strong>. Click the link to sign in.
        </p>
        {/* H40: Additional info */}
        <div className="mt-4 space-y-1 text-xs text-[var(--text-secondary)]">
          <p>The link expires in 1 hour.</p>
          <p>Check your spam folder if you don&apos;t see it.</p>
        </div>
        <div className="mt-4 flex flex-col items-center gap-2">
          {/* H40: Resend link button */}
          <button
            type="button"
            onClick={handleResendLink}
            className="text-sm font-semibold text-[var(--accent-green)] underline underline-offset-2 transition-colors hover:text-[var(--text-primary)]"
          >
            Resend link
          </button>
          <button
            type="button"
            onClick={() => { setStatus("idle"); clearError(); }}
            className="text-sm font-semibold text-[var(--text-secondary)] underline underline-offset-2 transition-colors hover:text-[var(--text-primary)]"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" aria-live="polite">
      {/* H29: URL-based error message shown at the top */}
      {urlErrorMessage && !errorMessage ? (
        <p role="alert" className="border-[2px] border-[var(--accent-red)] bg-red-900/30 px-4 py-3 font-mono text-sm font-bold text-red-400">
          {urlErrorMessage}
        </p>
      ) : null}

      {/* H30: OAuth button with loading state */}
      <button
        type="button"
        onClick={handleTwitterLogin}
        disabled={oauthLoading}
        className="brutal-btn brutal-btn-primary w-full gap-2.5 disabled:opacity-60"
      >
        {oauthLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirecting...
          </>
        ) : (
          <>
            <span className="flex h-5 w-5 items-center justify-center bg-white text-[var(--text-primary)] text-xs font-black leading-none">
              X
            </span>
            Sign in with X
          </>
        )}
      </button>

      {/* H41: OAuth error shown near OAuth button */}
      {errorMessage && errorSource === "oauth" ? (
        <p role="alert" className="text-sm font-semibold text-red-400">{errorMessage}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--line)]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-secondary)]">
          or
        </span>
        <div className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <div>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
            className="brutal-input font-mono text-sm"
            aria-describedby={emailSuggestion ? "email-suggestion" : undefined}
          />
          {/* M54: Email typo suggestion */}
          {emailSuggestion ? (
            <p id="email-suggestion" className="mt-1.5 text-xs text-[var(--text-secondary)]">
              Did you mean{" "}
              <button
                type="button"
                onClick={acceptSuggestion}
                className="font-semibold text-[var(--accent-green)] underline underline-offset-2"
              >
                {emailSuggestion}
              </button>
              ?
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="brutal-btn brutal-btn-outline w-full disabled:opacity-60"
        >
          {status === "loading" ? "Sending..." : "Send magic link"}
        </button>
      </form>

      {/* H41: Email error shown near email form */}
      {errorMessage && errorSource === "email" ? (
        <p role="alert" className="text-sm font-semibold text-red-400">{errorMessage}</p>
      ) : null}

      {/* General errors (e.g. from URL) */}
      {errorMessage && errorSource === "general" ? (
        <p role="alert" className="text-sm font-semibold text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  );
}
