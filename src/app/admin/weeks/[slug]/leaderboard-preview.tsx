"use client";

import type { LeaderboardRow } from "@/lib/server/types";

export function LeaderboardPreview({
  leaderboard,
}: {
  leaderboard: LeaderboardRow[];
}) {
  return (
    <section className="brutal-card overflow-hidden p-0">
      <div className="bg-black/40 px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
          Leaderboard preview
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left" role="table">
          <thead>
            <tr className="border-b-[2px] border-[var(--line)] bg-black/20">
              <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Rank</th>
              <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Title</th>
              <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Builder</th>
              <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)] text-right">ELO</th>
              <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)] text-right">W</th>
              <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)] text-right">L</th>
            </tr>
          </thead>
          <tbody className="divide-y-[2px] divide-[var(--line)]">
            {leaderboard.map((row) => (
              <tr key={row.entrySlug} className="transition hover:bg-white/5">
                <td className="px-5 py-3 font-mono text-sm font-bold text-[var(--accent-green)]">
                  #{row.rank}
                </td>
                <td className="px-5 py-3 text-sm font-bold text-[var(--text-primary)]">
                  {row.title}
                </td>
                <td className="px-5 py-3 font-mono text-[11px] text-[var(--text-secondary)]">
                  {row.builderName}
                </td>
                <td className="px-5 py-3 font-mono text-sm font-bold text-[var(--accent-blue)] text-right">
                  {row.elo}
                </td>
                <td className="px-5 py-3 font-mono text-sm text-[var(--accent-green)] text-right">
                  {row.wins}
                </td>
                <td className="px-5 py-3 font-mono text-sm text-[var(--accent-red)] text-right">
                  {row.losses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
