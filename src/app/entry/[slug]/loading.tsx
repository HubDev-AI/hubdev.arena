export default function EntryDetailLoading() {
  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Hero banner skeleton */}
        <div className="brutal-card overflow-hidden bg-[var(--ink)] p-6 text-white sm:p-8">
          {/* Back link */}
          <div className="h-3 w-36 animate-pulse rounded bg-gray-700" />

          {/* Breadcrumb */}
          <div className="mt-4 h-3 w-52 animate-pulse rounded bg-gray-700" />

          {/* Title + badge */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="h-9 w-64 animate-pulse rounded bg-gray-700" />
            <div className="h-7 w-24 animate-pulse rounded bg-gray-700" />
          </div>

          {/* One-liner */}
          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-gray-700" />

          {/* Stats row */}
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-3 border-t-[3px] border-t-gray-700">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-700" />
                <div className="mt-2 h-5 w-28 animate-pulse rounded bg-gray-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Demo + actions skeleton */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          {/* Demo area */}
          <div className="brutal-card overflow-hidden p-0">
            <div className="h-64 animate-pulse bg-gradient-to-br from-gray-800 to-gray-900 sm:h-80 lg:h-96" />
          </div>

          {/* Sidebar */}
          <div className="brutal-card overflow-hidden p-0 border-l-[4px] border-l-gray-700">
            <div className="bg-[var(--ink)] px-5 py-3">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-700" />
            </div>
            <div className="space-y-3 p-4">
              <div className="h-10 w-full animate-pulse rounded bg-gray-700" />
              <div className="h-10 w-full animate-pulse rounded bg-gray-700" />
            </div>
            <div className="mt-auto border-t-[2px] border-gray-700 px-4 py-3">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-700" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-700" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
