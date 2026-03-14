"use client";

import { useEffect, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function AuthGateModal({
  onSkip,
  onSignedIn,
  returnTo,
}: {
  onSkip: () => void;
  onSignedIn: () => void;
  returnTo?: string;
}) {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSignedInRef = useRef(onSignedIn);
  onSignedInRef.current = onSignedIn;

  // Listen for auth state changes so we can react when the user signs in
  // (e.g. after clicking the magic link in another tab, or completing OAuth)
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        onSignedInRef.current();
      }
    });
    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function handleTwitterSignIn() {
    setIsSubmitting(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      window.location.origin;
    const callbackReturnTo = returnTo ?? "/vote";
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${siteUrl}/auth/callback?returnTo=${encodeURIComponent(callbackReturnTo)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setIsSubmitting(false);
    }
    // If no error, the browser will redirect — nothing more to do here
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      window.location.origin;
    const callbackReturnTo = returnTo ?? "/vote";
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?returnTo=${encodeURIComponent(callbackReturnTo)}`,
      },
    });
    if (otpError) {
      setError(otpError.message);
      setIsSubmitting(false);
      return;
    }
    setEmailSent(true);
    setIsSubmitting(false);
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10, 10, 10, 0.75)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSkip();
      }}
    >
      {/* Modal panel */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          border: "3px solid #000",
          boxShadow: "8px 8px 0 #000",
          padding: "2rem",
          position: "relative",
        }}
      >
        {/* Header label */}
        <p
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: 8,
          }}
        >
          Save your vote
        </p>

        <h2
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontWeight: 900,
            fontSize: "1.75rem",
            textTransform: "uppercase",
            letterSpacing: "-0.05em",
            lineHeight: 1,
            color: "#000",
            marginBottom: "0.5rem",
          }}
        >
          Sign in to save your votes
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body, system-ui, sans-serif)",
            fontSize: 14,
            color: "#555",
            marginBottom: "1.5rem",
            lineHeight: 1.5,
          }}
        >
          Your pick is ready — create an account to record it and keep your
          streak.
        </p>

        {/* Status / error banners */}
        {emailSent && (
          <p
            style={{
              background: "#00FF41",
              border: "2px solid #000",
              padding: "0.5rem 0.75rem",
              fontFamily: "monospace",
              fontSize: 12,
              color: "#000",
              marginBottom: "1rem",
            }}
          >
            Magic link sent! Check your inbox.
          </p>
        )}
        {error && (
          <p
            style={{
              background: "#FF3B3B",
              border: "2px solid #000",
              padding: "0.5rem 0.75rem",
              fontFamily: "monospace",
              fontSize: 12,
              color: "#fff",
              marginBottom: "1rem",
            }}
          >
            {error}
          </p>
        )}

        {/* Twitter sign-in */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleTwitterSignIn()}
          style={{
            display: "block",
            width: "100%",
            background: "#00FF41",
            color: "#000",
            border: "3px solid #000",
            boxShadow: "4px 4px 0 #000",
            padding: "0.75rem 1rem",
            fontFamily: "var(--font-mono, monospace)",
            fontWeight: 700,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            marginBottom: "1.25rem",
            borderRadius: 0,
            opacity: isSubmitting ? 0.6 : 1,
            transition: "transform 0.1s, box-shadow 0.1s",
          }}
        >
          SIGN IN WITH X →
        </button>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ flex: 1, height: 2, background: "#000" }} />
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#555",
              whiteSpace: "nowrap",
            }}
          >
            or continue with email
          </span>
          <div style={{ flex: 1, height: 2, background: "#000" }} />
        </div>

        {/* Email / magic link form */}
        <form
          onSubmit={(e) => void handleEmailSubmit(e)}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div>
            <label
              htmlFor="auth-gate-email"
              style={{
                display: "block",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#555",
                marginBottom: 4,
              }}
            >
              Email address
            </label>
            <input
              id="auth-gate-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                display: "block",
                width: "100%",
                border: "2px solid #000",
                padding: "0.6rem 0.75rem",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 13,
                background: "#F5F5F5",
                color: "#000",
                outline: "none",
                borderRadius: 0,
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || emailSent}
            style={{
              display: "block",
              width: "100%",
              background: "#0033FF",
              color: "#fff",
              border: "3px solid #000",
              boxShadow: "4px 4px 0 #000",
              padding: "0.75rem 1rem",
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 700,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              cursor: isSubmitting || emailSent ? "not-allowed" : "pointer",
              borderRadius: 0,
              opacity: isSubmitting || emailSent ? 0.6 : 1,
              transition: "transform 0.1s, box-shadow 0.1s",
            }}
          >
            Send magic link →
          </button>
        </form>

        {/* Skip link */}
        <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
          <button
            type="button"
            onClick={onSkip}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#555",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
