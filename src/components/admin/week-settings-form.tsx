"use client";

import { useState } from "react";

import type { Week } from "@/lib/server/types";

type WeekSettingsFormProps = {
  week: Week;
  onSaved?: (updated: Week) => void;
};

const EDITABLE_STATUSES = new Set(["draft", "submissions_open"]);

export function WeekSettingsForm({ week, onSaved }: WeekSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isEditable = EDITABLE_STATUSES.has(week.status);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const data = new FormData(form);
    const body = {
      slug: String(data.get("slug") ?? ""),
      themeTitle: String(data.get("themeTitle") ?? ""),
      themeDescription: String(data.get("themeDescription") ?? ""),
      timezone: String(data.get("timezone") ?? ""),
      submissionOpenAt: String(data.get("submissionOpenAt") ?? ""),
      submissionCloseAt: String(data.get("submissionCloseAt") ?? ""),
      votingOpenAt: String(data.get("votingOpenAt") ?? ""),
      votingCloseAt: String(data.get("votingCloseAt") ?? ""),
    };

    try {
      const res = await fetch(`/api/admin/weeks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to save.");
      }
      const updated = (await res.json()) as Week;
      setSuccess(true);
      onSaved?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const fields: Array<[keyof Week, string]> = [
    ["slug", "Slug"],
    ["themeTitle", "Theme Title"],
    ["timezone", "Timezone"],
    ["submissionOpenAt", "Submission Open"],
    ["submissionCloseAt", "Submission Close"],
    ["votingOpenAt", "Voting Open"],
    ["votingCloseAt", "Voting Close"],
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {fields.map(([name, label]) => (
        <label key={name} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#666",
            }}
          >
            {label}
          </span>
          <input
            name={name}
            defaultValue={String(week[name] ?? "")}
            disabled={!isEditable}
            style={{
              border: "2px solid #000",
              background: isEditable ? "#fff" : "#f5f5f5",
              padding: "8px 12px",
              fontFamily: "Space Mono, monospace",
              fontSize: "13px",
              color: "#111",
              outline: "none",
              borderRadius: 0,
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </label>
      ))}

      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span
          style={{
            fontFamily: "Space Mono, monospace",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#666",
          }}
        >
          Theme Description
        </span>
        <textarea
          name="themeDescription"
          defaultValue={week.themeDescription}
          rows={4}
          disabled={!isEditable}
          style={{
            border: "2px solid #000",
            background: isEditable ? "#fff" : "#f5f5f5",
            padding: "8px 12px",
            fontFamily: "inherit",
            fontSize: "13px",
            color: "#111",
            outline: "none",
            borderRadius: 0,
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </label>

      {isEditable && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              border: "2px solid #000",
              background: "#000",
              color: "#fff",
              fontFamily: "Space Mono, monospace",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              padding: "10px 20px",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: saving ? "none" : "3px 3px 0 #000",
              opacity: saving ? 0.6 : 1,
              borderRadius: 0,
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {success && (
            <span style={{ color: "#15803d", fontFamily: "Space Mono", fontSize: "11px" }}>
              Saved!
            </span>
          )}
          {error && (
            <span style={{ color: "#b91c1c", fontFamily: "Space Mono", fontSize: "11px" }}>
              {error}
            </span>
          )}
        </div>
      )}

      {!isEditable && (
        <p
          style={{
            fontFamily: "Space Mono, monospace",
            fontSize: "11px",
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
          }}
        >
          Settings locked — week is {week.status.replaceAll("_", " ")}
        </p>
      )}
    </form>
  );
}
