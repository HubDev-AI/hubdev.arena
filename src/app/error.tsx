"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-bg page-bg-default">
    <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="brutal-card relative overflow-hidden p-8">
        {/* Red accent bar */}
        <div className="absolute inset-x-0 top-0 h-2 bg-[var(--accent-red)]" />

        <p className="brutal-label">Error</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-[var(--ink)]">
          Something went wrong
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="brutal-btn brutal-btn-green"
          >
            Try again
          </button>
          <Link href="/" className="brutal-btn brutal-btn-outline">
            Go home
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}
