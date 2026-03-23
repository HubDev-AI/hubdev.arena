export default function LeaderboardLoading() {
  return (
    <div className="page-bg page-bg-board">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="brutal-card overflow-hidden p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="h-3 w-40 animate-pulse rounded bg-[var(--line)]" />
              <div className="mt-4 h-10 w-72 animate-pulse rounded bg-[var(--line)]" />
              <div className="mt-3 h-4 w-96 animate-pulse rounded bg-[var(--line)]" />
            </div>
            <div className="flex gap-4">
              <div className="h-20 w-24 animate-pulse border-[2px] border-[var(--line)] bg-[var(--surface)]" />
              <div className="h-20 w-24 animate-pulse border-[2px] border-[var(--line)] bg-[var(--surface)]" />
            </div>
          </div>
        </div>

        {/* Week selector skeleton */}
        <div className="h-10 w-64 animate-pulse rounded bg-[var(--line)]" />

        {/* Table skeleton */}
        <div className="brutal-card overflow-hidden p-0">
          <div className="border-b border-[var(--line)] bg-black/40 px-5 py-3">
            <div className="h-3 w-48 animate-pulse rounded bg-[var(--line)]" />
          </div>
          {/* Table header skeleton */}
          <div className="border-b border-[var(--line)] bg-black/20 px-5 py-3">
            <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)_200px]">
              <div className="h-3 w-16 animate-pulse rounded bg-[var(--line)]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[var(--line)]" />
              <div className="ml-auto h-3 w-24 animate-pulse rounded bg-[var(--line)]" />
            </div>
          </div>
          {/* Row skeletons */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grid gap-4 border-b border-[var(--line)] px-5 py-4 sm:grid-cols-[120px_minmax(0,1fr)_200px]"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-12 animate-pulse rounded bg-[var(--line)]" />
                <div className="h-6 w-14 animate-pulse rounded bg-[var(--line)]" />
              </div>
              <div>
                <div className="h-5 w-48 animate-pulse rounded bg-[var(--line)]" />
                <div className="mt-2 h-3 w-28 animate-pulse rounded bg-[var(--line)]" />
              </div>
              <div className="flex items-center justify-end gap-3">
                <div className="h-4 w-16 animate-pulse rounded bg-[var(--line)]" />
                <div className="h-8 w-16 animate-pulse rounded bg-[var(--line)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
