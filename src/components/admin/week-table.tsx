import Link from "next/link";

import type { Week } from "@/lib/server/types";
import type { WeekStatus } from "@/lib/domain/weeks";

const STATUS_STYLES: Record<WeekStatus, { bg: string; color: string; border: string }> = {
  draft: { bg: "#e5e5e5", color: "#333", border: "#000" },
  submissions_open: { bg: "#fbbf24", color: "#000", border: "#000" },
  voting_open: { bg: "#00FF41", color: "#000", border: "#000" },
  locked: { bg: "#fff", color: "#0033FF", border: "#0033FF" },
  archived: { bg: "#d4d4d4", color: "#666", border: "#999" },
};

function StatusBadge({ status }: { status: WeekStatus }) {
  const styles = STATUS_STYLES[status];
  return (
    <span
      style={{
        display: "inline-block",
        background: styles.bg,
        color: styles.color,
        border: `2px solid ${styles.border}`,
        fontFamily: "Space Mono, monospace",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        padding: "3px 8px",
        borderRadius: 0,
      }}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

type WeekWithCounts = Week & {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
};

export function WeekTable({ weeks }: { weeks: WeekWithCounts[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #000" }}>
            {["Theme Title", "Slug", "Status", "Pending", "Approved", "Rejected", "Actions"].map(
              (heading) => (
                <th
                  key={heading}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontFamily: "Space Mono, monospace",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#666",
                    background: "#fff",
                  }}
                >
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.id} style={{ borderBottom: "2px solid #000" }}>
              <td style={{ padding: "12px", fontWeight: 700, color: "#111" }}>
                {week.themeTitle}
              </td>
              <td
                style={{
                  padding: "12px",
                  fontFamily: "Space Mono, monospace",
                  fontSize: "12px",
                  color: "#555",
                }}
              >
                {week.slug}
              </td>
              <td style={{ padding: "12px" }}>
                <StatusBadge status={week.status} />
              </td>
              <td
                style={{
                  padding: "12px",
                  fontFamily: "Space Mono, monospace",
                  fontSize: "13px",
                  color: "#b45309",
                }}
              >
                {week.pendingCount}
              </td>
              <td
                style={{
                  padding: "12px",
                  fontFamily: "Space Mono, monospace",
                  fontSize: "13px",
                  color: "#15803d",
                }}
              >
                {week.approvedCount}
              </td>
              <td
                style={{
                  padding: "12px",
                  fontFamily: "Space Mono, monospace",
                  fontSize: "13px",
                  color: "#b91c1c",
                }}
              >
                {week.rejectedCount}
              </td>
              <td style={{ padding: "12px" }}>
                <Link
                  href={`/admin/weeks/${week.slug}`}
                  style={{
                    display: "inline-block",
                    border: "2px solid #000",
                    background: "#fff",
                    color: "#000",
                    fontFamily: "Space Mono, monospace",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    padding: "5px 12px",
                    textDecoration: "none",
                    boxShadow: "2px 2px 0 #000",
                    transition: "box-shadow 0.1s, transform 0.1s",
                  }}
                >
                  Manage
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
