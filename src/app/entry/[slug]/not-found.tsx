import Link from "next/link";

import { AuroraBg } from "@/components/aurora-bg";
import { GlitchText } from "@/components/glitch-text";

export default function EntryNotFound() {
  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="brutal-card relative overflow-hidden bg-[var(--ink)] text-white neon-box scanlines" style={{ minHeight: "320px" }}>
          <AuroraBg />
          {/* Scanline overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] z-[1]" style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.1) 2px, rgba(0,255,65,0.1) 4px)",
          }} />

          <div className="relative z-10 p-8 sm:p-12">
            <div className="flex items-center gap-3">
              <p className="brutal-label text-[var(--accent-green)] neon-text">Entry not found</p>
              <div className="h-[1px] w-16 bg-gradient-to-r from-[var(--accent-green)] to-transparent" />
            </div>

            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              <GlitchText text="Missing entry" className="text-white" />
            </h1>

            <p className="mt-4 max-w-lg text-base leading-7 text-gray-400">
              This entry may have been removed or is still pending review.
              Approved entries appear on the leaderboard once voting opens.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/leaderboard" className="brutal-btn brutal-btn-green hover-lift">
                View leaderboard
              </Link>
              <Link href="/" className="brutal-btn brutal-btn-outline hover-lift">
                Back to arena
              </Link>
            </div>
          </div>

          {/* Bottom gradient accent */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-cyan)] via-[var(--accent-blue)] to-transparent" style={{ boxShadow: "0 0 10px rgba(0, 255, 65, 0.3)" }} />
        </div>
      </div>
    </div>
  );
}
