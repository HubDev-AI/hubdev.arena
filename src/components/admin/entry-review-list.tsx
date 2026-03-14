"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Entry, EntryStatus, Profile } from "@/lib/server/types";

import { EntryDetailPanel } from "./entry-detail-panel";

type EntryWithBuilder = Entry & { builder: Profile | null };

type FilterTab = EntryStatus | "all";

type EntryReviewListProps = {
  entries: EntryWithBuilder[];
  weekSlug: string;
};

export function EntryReviewList({ entries, weekSlug }: EntryReviewListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [localEntries, setLocalEntries] = useState<EntryWithBuilder[]>(entries);

  const pendingCount = localEntries.filter((e) => e.status === "pending").length;
  const approvedCount = localEntries.filter((e) => e.status === "approved").length;
  const rejectedCount = localEntries.filter((e) => e.status === "rejected").length;

  const filteredEntries =
    filter === "all" ? localEntries : localEntries.filter((e) => e.status === filter);

  const selectedEntry = selectedEntryId
    ? (localEntries.find((e) => e.id === selectedEntryId) ?? null)
    : null;

  const tabs: Array<{ key: FilterTab; label: string; count: number }> = [
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved", count: approvedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
    { key: "all", label: "All", count: localEntries.length },
  ];

  async function handleApprove(entryId: string) {
    try {
      const res = await fetch(`/api/admin/entries/${entryId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to approve.");
      }
      const updated = (await res.json()) as Entry;
      setLocalEntries((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, ...updated, builder: e.builder } : e,
        ),
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve.");
    }
  }

  async function handleReject(entryId: string, rejectionNote: string) {
    try {
      const res = await fetch(`/api/admin/entries/${entryId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejectionNote }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to reject.");
      }
      const updated = (await res.json()) as Entry;
      setLocalEntries((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, ...updated, builder: e.builder } : e,
        ),
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject.");
    }
  }

  async function handleToggleFoundingBuilder(profileId: string, value: boolean) {
    try {
      const res = await fetch(`/api/admin/profiles/${profileId}/founding-builder`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ foundingBuilder: value }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to update.");
      }
      setLocalEntries((prev) =>
        prev.map((e) =>
          e.builder?.id === profileId
            ? { ...e, builder: e.builder ? { ...e.builder, foundingBuilder: value } : e.builder }
            : e,
        ),
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update founding builder.");
    }
  }

  return (
    <div>
      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #000",
          marginBottom: "20px",
          gap: 0,
        }}
      >
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              border: "none",
              borderBottom: filter === key ? "3px solid #000" : "3px solid transparent",
              background: "transparent",
              fontFamily: "Space Mono, monospace",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              padding: "10px 16px",
              cursor: "pointer",
              color: filter === key ? "#000" : "#888",
              marginBottom: "-2px",
            }}
          >
            {label}{" "}
            <span
              style={{
                background: filter === key ? "#000" : "#e5e5e5",
                color: filter === key ? "#fff" : "#555",
                fontFamily: "Space Mono, monospace",
                fontSize: "10px",
                padding: "2px 6px",
                marginLeft: "4px",
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Entry list */}
      {filteredEntries.length === 0 && (
        <p
          style={{
            fontFamily: "Space Mono, monospace",
            fontSize: "12px",
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
          }}
        >
          No entries in this filter.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filteredEntries.map((entry) => (
          <button
            key={entry.id}
            onClick={() =>
              setSelectedEntryId(selectedEntryId === entry.id ? null : entry.id)
            }
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: `2px solid ${selectedEntryId === entry.id ? "#000" : "#ccc"}`,
              background: selectedEntryId === entry.id ? "#f0f0f0" : "#fff",
              padding: "12px 16px",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              boxShadow: selectedEntryId === entry.id ? "3px 3px 0 #000" : "none",
              borderRadius: 0,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontWeight: 700,
                  color: "#111",
                  margin: 0,
                  fontSize: "15px",
                  letterSpacing: "-0.02em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entry.title}
              </p>
              <p
                style={{
                  fontFamily: "Space Mono, monospace",
                  fontSize: "11px",
                  color: "#666",
                  margin: "4px 0 0",
                }}
              >
                {entry.builder?.displayName ?? "Unknown"}
                {entry.builder?.username ? ` @${entry.builder.username}` : ""}
                {" · "}
                {new Date(entry.submittedAt).toLocaleDateString()}
              </p>
            </div>
            <span
              style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color:
                  entry.status === "approved"
                    ? "#15803d"
                    : entry.status === "rejected"
                      ? "#b91c1c"
                      : "#b45309",
                marginLeft: "12px",
                flexShrink: 0,
              }}
            >
              {entry.status}
            </span>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      {selectedEntry && (
        <EntryDetailPanel
          entry={selectedEntry}
          builder={selectedEntry.builder}
          onApprove={(id) => void handleApprove(id)}
          onReject={(id, note) => void handleReject(id, note)}
          onClose={() => setSelectedEntryId(null)}
          onToggleFoundingBuilder={(profileId, value) =>
            void handleToggleFoundingBuilder(profileId, value)
          }
        />
      )}
    </div>
  );
}
