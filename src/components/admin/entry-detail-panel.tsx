"use client";

import { useState } from "react";

import type { Entry, Profile } from "@/lib/server/types";

type EntryDetailPanelProps = {
  entry: Entry;
  builder: Profile | null;
  onApprove: (entryId: string) => void;
  onReject: (entryId: string, note: string) => void;
  onClose: () => void;
  onToggleFoundingBuilder: (profileId: string, value: boolean) => void;
};

export function EntryDetailPanel({
  entry,
  builder,
  onApprove,
  onReject,
  onClose,
  onToggleFoundingBuilder,
}: EntryDetailPanelProps) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");

  const isVideo =
    entry.demoAssetPath.endsWith(".mp4") ||
    entry.demoAssetPath.endsWith(".webm") ||
    entry.demoAssetPath.endsWith(".mov");

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "480px",
          maxWidth: "100vw",
          background: "#fff",
          borderLeft: "2px solid #000",
          overflowY: "auto",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "2px solid #000",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#666",
            }}
          >
            Entry Detail
          </span>
          <button
            onClick={onClose}
            style={{
              border: "2px solid #000",
              background: "#fff",
              color: "#000",
              fontFamily: "Space Mono, monospace",
              fontSize: "18px",
              lineHeight: 1,
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 0,
              boxShadow: "2px 2px 0 #000",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Demo asset */}
          <div
            style={{
              border: "2px solid #000",
              background: "#f5f5f5",
              aspectRatio: "16/9",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {entry.demoAssetPath ? (
              isVideo ? (
                <video
                  src={entry.demoAssetPath}
                  controls
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.demoAssetPath}
                  alt={entry.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )
            ) : (
              <span
                style={{
                  fontFamily: "Space Mono, monospace",
                  fontSize: "11px",
                  color: "#999",
                }}
              >
                No demo asset
              </span>
            )}
          </div>

          {/* Title & meta */}
          <div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#111",
                margin: 0,
              }}
            >
              {entry.title}
            </h2>
            <p style={{ marginTop: "8px", color: "#555", fontSize: "14px", lineHeight: 1.5 }}>
              {entry.oneLiner}
            </p>
          </div>

          {/* Builder info */}
          {builder && (
            <div
              style={{
                border: "2px solid #000",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
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
                  Builder
                </p>
                <p style={{ fontWeight: 700, color: "#111", margin: "4px 0 0" }}>
                  {builder.displayName}
                  {builder.username ? (
                    <span style={{ color: "#666", fontWeight: 400 }}> @{builder.username}</span>
                  ) : null}
                </p>
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontFamily: "Space Mono, monospace",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#555",
                }}
              >
                <input
                  type="checkbox"
                  checked={builder.foundingBuilder}
                  onChange={(e) => onToggleFoundingBuilder(builder.id, e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#00FF41" }}
                />
                Founding Builder
              </label>
            </div>
          )}

          {/* Live URL */}
          <a
            href={entry.liveUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              border: "2px solid #000",
              background: "#fff",
              color: "#000",
              fontFamily: "Space Mono, monospace",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              padding: "10px 16px",
              textDecoration: "none",
              boxShadow: "3px 3px 0 #000",
              alignSelf: "flex-start",
            }}
          >
            Open App →
          </a>

          {/* Status */}
          <div>
            <span
              style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#666",
              }}
            >
              Status:{" "}
            </span>
            <span
              style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "11px",
                fontWeight: 700,
                color:
                  entry.status === "approved"
                    ? "#15803d"
                    : entry.status === "rejected"
                      ? "#b91c1c"
                      : "#b45309",
              }}
            >
              {entry.status.toUpperCase()}
            </span>
          </div>

          {/* Rejection note (if already rejected) */}
          {entry.status === "rejected" && entry.rejectionNote && (
            <div
              style={{
                border: "2px solid #b91c1c",
                background: "#fef2f2",
                padding: "12px 16px",
              }}
            >
              <p
                style={{
                  fontFamily: "Space Mono, monospace",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#b91c1c",
                  margin: "0 0 6px",
                }}
              >
                Rejection Note
              </p>
              <p style={{ fontSize: "13px", color: "#333", margin: 0 }}>{entry.rejectionNote}</p>
            </div>
          )}

          {/* Approve / Reject */}
          {entry.status !== "approved" && !rejecting && (
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => onApprove(entry.id)}
                style={{
                  flex: 1,
                  border: "2px solid #15803d",
                  background: "#15803d",
                  color: "#fff",
                  fontFamily: "Space Mono, monospace",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  padding: "12px",
                  cursor: "pointer",
                  boxShadow: "3px 3px 0 #000",
                  borderRadius: 0,
                }}
              >
                Approve
              </button>
              <button
                onClick={() => setRejecting(true)}
                style={{
                  flex: 1,
                  border: "2px solid #b91c1c",
                  background: "#b91c1c",
                  color: "#fff",
                  fontFamily: "Space Mono, monospace",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  padding: "12px",
                  cursor: "pointer",
                  boxShadow: "3px 3px 0 #000",
                  borderRadius: 0,
                }}
              >
                Reject
              </button>
            </div>
          )}

          {/* Approve for already-rejected entries */}
          {entry.status === "rejected" && !rejecting && (
            <button
              onClick={() => onApprove(entry.id)}
              style={{
                border: "2px solid #15803d",
                background: "#15803d",
                color: "#fff",
                fontFamily: "Space Mono, monospace",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                padding: "12px",
                cursor: "pointer",
                boxShadow: "3px 3px 0 #000",
                borderRadius: 0,
              }}
            >
              Re-Approve
            </button>
          )}

          {/* Rejection form */}
          {rejecting && (
            <div
              style={{
                border: "2px solid #b91c1c",
                background: "#fef2f2",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span
                  style={{
                    fontFamily: "Space Mono, monospace",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#b91c1c",
                  }}
                >
                  Rejection Note (optional)
                </span>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  rows={3}
                  placeholder="Reason for rejection..."
                  style={{
                    border: "2px solid #b91c1c",
                    background: "#fff",
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    color: "#111",
                    outline: "none",
                    resize: "vertical",
                    borderRadius: 0,
                  }}
                />
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    onReject(entry.id, rejectionNote);
                    setRejecting(false);
                    setRejectionNote("");
                  }}
                  style={{
                    flex: 1,
                    border: "2px solid #b91c1c",
                    background: "#b91c1c",
                    color: "#fff",
                    fontFamily: "Space Mono, monospace",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    padding: "10px",
                    cursor: "pointer",
                    borderRadius: 0,
                  }}
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => {
                    setRejecting(false);
                    setRejectionNote("");
                  }}
                  style={{
                    border: "2px solid #000",
                    background: "#fff",
                    color: "#000",
                    fontFamily: "Space Mono, monospace",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    padding: "10px 16px",
                    cursor: "pointer",
                    borderRadius: 0,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
