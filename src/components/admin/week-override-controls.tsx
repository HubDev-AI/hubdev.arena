"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { WeekStatus } from "@/lib/domain/weeks";

const STATUS_TRANSITIONS: Partial<Record<WeekStatus, { targetStatus: WeekStatus; label: string; danger?: boolean }[]>> = {
  draft: [{ targetStatus: "submissions_open", label: "Open Submissions" }],
  submissions_open: [{ targetStatus: "voting_open", label: "Generate Matchups + Open Voting" }],
  voting_open: [{ targetStatus: "locked", label: "Lock Results", danger: true }],
  locked: [{ targetStatus: "archived", label: "Archive Week" }],
};

type WeekOverrideControlsProps = {
  weekSlug: string;
  currentStatus: WeekStatus;
  approvedEntryCount: number;
};

export function WeekOverrideControls({
  weekSlug,
  currentStatus,
  approvedEntryCount,
}: WeekOverrideControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];

  async function handleTransition(targetStatus: WeekStatus) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/weeks/${weekSlug}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetStatus }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to transition.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transition.");
    } finally {
      setLoading(false);
    }
  }

  if (transitions.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {transitions.map(({ targetStatus, label, danger }) => {
        const needsApproved = targetStatus === "voting_open";
        const insufficient = needsApproved && approvedEntryCount < 2;

        return (
          <div key={targetStatus}>
            {insufficient && (
              <p
                style={{
                  fontFamily: "Space Mono, monospace",
                  fontSize: "11px",
                  color: "#b45309",
                  background: "#fef3c7",
                  border: "2px solid #f59e0b",
                  padding: "8px 12px",
                  marginBottom: "8px",
                  letterSpacing: "0.1em",
                }}
              >
                Warning: only {approvedEntryCount} approved{" "}
                {approvedEntryCount === 1 ? "entry" : "entries"} — need at least 2 to open voting.
              </p>
            )}
            <button
              onClick={() => void handleTransition(targetStatus)}
              disabled={loading || insufficient}
              style={{
                width: "100%",
                border: `2px solid ${danger ? "#b91c1c" : "#000"}`,
                background: danger ? "#b91c1c" : "#000",
                color: "#fff",
                fontFamily: "Space Mono, monospace",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                padding: "12px 16px",
                cursor: loading || insufficient ? "not-allowed" : "pointer",
                opacity: loading || insufficient ? 0.6 : 1,
                boxShadow: loading || insufficient ? "none" : "3px 3px 0 #000",
                borderRadius: 0,
              }}
            >
              {loading ? "Working..." : label}
            </button>
          </div>
        );
      })}

      {error && (
        <p
          style={{
            fontFamily: "Space Mono, monospace",
            fontSize: "11px",
            color: "#b91c1c",
            border: "2px solid #b91c1c",
            padding: "8px 12px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
