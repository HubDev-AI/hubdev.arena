import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-bg page-bg-default">
    <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="brutal-card relative overflow-hidden p-8">
        {/* Dark accent bar along the top */}
        <div className="absolute inset-x-0 top-0 h-2 bg-[var(--ink)]" />

        {/* Large display number */}
        <p
          className="select-none font-black leading-none text-[var(--ink)]"
          style={{ fontSize: "clamp(6rem, 20vw, 12rem)", opacity: 0.07 }}
          aria-hidden="true"
        >
          404
        </p>

        <div className="-mt-10 relative">
          <p className="brutal-label">Page not found</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-[var(--ink)]">
            Nothing here
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-[var(--muted)]">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="brutal-btn brutal-btn-green">
              Back to arena
            </Link>
            <Link href="/leaderboard" className="brutal-btn brutal-btn-outline">
              View leaderboard
            </Link>
          </div>
        </div>

        {/* Bottom gradient accent */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[var(--accent-green)] to-transparent" />
      </div>
    </div>
    </div>
  );
}
