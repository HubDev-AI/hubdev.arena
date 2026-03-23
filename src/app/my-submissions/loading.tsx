export default function MySubmissionsLoading() {
  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="brutal-card relative overflow-hidden bg-[var(--ink)] p-6 sm:p-8 neon-box">
          <div className="relative z-10 space-y-3">
            <div className="h-3 w-28 animate-pulse rounded bg-gray-700" />
            <div className="h-10 w-64 animate-pulse rounded bg-gray-700" />
            <div className="h-4 w-80 animate-pulse rounded bg-gray-700" />
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
        </div>

        {/* Submission group skeletons */}
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, groupIdx) => (
            <div key={groupIdx} className="brutal-card p-6 holo-shimmer">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-[var(--line)]" />
                  <div className="h-8 w-48 animate-pulse rounded bg-[var(--line)]" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded bg-[var(--line)]" />
              </div>
              <div className="mt-6 grid gap-4">
                {Array.from({ length: 2 }).map((_, entryIdx) => (
                  <div
                    key={entryIdx}
                    className="relative overflow-hidden border-[2px] border-[var(--line)] bg-[var(--surface)] px-5 py-4"
                  >
                    <div className="absolute left-0 top-0 h-full w-1.5 animate-pulse bg-[var(--line)]" />
                    <div className="flex flex-wrap items-start justify-between gap-4 pl-3">
                      <div className="flex-1 space-y-2">
                        <div className="h-6 w-40 animate-pulse rounded bg-[var(--line)]" />
                        <div className="h-4 w-64 animate-pulse rounded bg-[var(--line)]" />
                      </div>
                      <div className="h-6 w-16 animate-pulse rounded bg-[var(--line)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
