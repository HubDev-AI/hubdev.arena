"use client";

export default function MySubmissionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-20 sm:px-6 lg:px-8">
        <div className="brutal-card w-full max-w-lg p-8 text-center neon-box">
          <div className="mx-auto flex h-14 w-14 items-center justify-center border-[3px] border-[var(--accent-red)] bg-red-900/30">
            <span className="text-2xl" aria-hidden="true">!</span>
          </div>
          <h2 className="mt-4 text-2xl font-black uppercase tracking-[-0.04em] text-[var(--text-primary)]">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {error.message || "We couldn\u2019t load your submissions. Please try again."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="brutal-btn brutal-btn-outline mt-6 hover-lift"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
