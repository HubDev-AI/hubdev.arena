import type { VoterSession, Vote } from "@/lib/server/types";

type VoterStatsProps = {
  voterSessions: VoterSession[];
  votes: Vote[];
};

export function VoterStats({ voterSessions, votes }: VoterStatsProps) {
  const uniqueVoterCount = voterSessions.length;
  const totalVotes = votes.length;
  const avgVotesPerVoter =
    uniqueVoterCount > 0 ? (totalVotes / uniqueVoterCount).toFixed(1) : "0";

  const stats = [
    { label: "Unique Voters", value: uniqueVoterCount },
    { label: "Total Votes", value: totalVotes },
    { label: "Avg / Voter", value: avgVotesPerVoter },
  ];

  return (
    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            border: "2px solid #000",
            background: "#fff",
            padding: "20px 28px",
            boxShadow: "4px 4px 0 #000",
            minWidth: "140px",
          }}
        >
          <p
            style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#666",
              margin: 0,
            }}
          >
            {stat.label}
          </p>
          <p
            style={{
              fontSize: "36px",
              fontWeight: 900,
              color: "#111",
              margin: "8px 0 0",
              letterSpacing: "-0.04em",
            }}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
