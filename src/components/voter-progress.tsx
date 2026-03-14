"use client";

export function VoterProgress({
  votesCast,
  total = 10,
}: {
  votesCast: number;
  total?: number;
}) {
  const clamped = Math.min(votesCast, total);
  const pct = total > 0 ? (clamped / total) * 100 : 0;

  return (
    <div className="brutal-card flex flex-col gap-3 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="brutal-label">Voting streak</p>
          <p className="text-xl font-black tracking-tight text-[var(--ink)]">
            {clamped} / {total}
          </p>
        </div>
        <div
          style={{
            border: "2px solid #000",
            background: "#00FF41",
            padding: "0.25rem 0.6rem",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#000",
            whiteSpace: "nowrap",
          }}
        >
          ~{Math.max(1, total - clamped)} left
        </div>
      </div>

      {/* Progress track */}
      <div
        style={{
          height: 12,
          background: "#F5F5F5",
          border: "2px solid #000",
          boxShadow: "2px 2px 0 #000",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            right: `${100 - pct}%`,
            background: "#00FF41",
            transition: "right 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
