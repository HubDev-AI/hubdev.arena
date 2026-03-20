"use client";

import Link from "next/link";

import { AuroraBg } from "@/components/aurora-bg";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-bg page-bg-default">
    <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="brutal-card relative overflow-hidden bg-[var(--ink)] p-8 text-white" style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.4), 0 0 30px rgba(255, 51, 51, 0.1)" }}>
        <AuroraBg />
        {/* Red accent bar */}
        <div className="absolute inset-x-0 top-0 h-2 bg-[var(--accent-red)]" style={{ boxShadow: "0 0 15px rgba(255, 51, 51, 0.3)" }} />

        <p className="brutal-label text-[var(--accent-red)]" style={{ textShadow: "0 0 10px rgba(255, 51, 51, 0.4)" }}>System error</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-white">
          Something went wrong
        </h1>
        <p className="mt-4 text-base leading-7 text-gray-400">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="brutal-btn brutal-btn-green hover-lift"
          >
            Try again
          </button>
          <Link href="/" className="brutal-btn brutal-btn-outline hover-lift">
            Go home
          </Link>
        </div>

        {/* Bottom gradient accent */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[var(--accent-red)] to-transparent" />
      </div>
    </div>
    </div>
  );
}
