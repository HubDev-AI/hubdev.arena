"use client";

import { useRef, useState } from "react";
import timezones from "timezones-list";

import { createWeekAction } from "@/app/admin/actions";

const dateFields = [
  ["submissionOpenAt", "Submission open"],
  ["submissionCloseAt", "Submission close"],
  ["votingOpenAt", "Voting open"],
  ["votingCloseAt", "Voting close"],
] as const;

export function CreateWeekForm() {
  const [tz, setTz] = useState("America/Los_Angeles");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);

    // Convert datetime-local values to ISO 8601 using selected timezone offset
    const selected = timezones.find((t) => t.tzCode === tz);
    const offsetMatch = selected?.utc?.match(/([+-]\d{2}):(\d{2})/);

    for (const [name] of dateFields) {
      const raw = formData.get(name);
      if (typeof raw === "string" && raw) {
        // datetime-local gives "YYYY-MM-DDTHH:MM", append timezone offset
        if (offsetMatch) {
          formData.set(name, `${raw}:00${offsetMatch[0]}`);
        } else {
          formData.set(name, `${raw}:00Z`);
        }
      }
    }

    try {
      // H15: createWeekAction now returns { success, error? } instead of throwing
      const result = await createWeekAction(formData);
      if (!result.success && result.error) {
        setError(result.error);
      }
      // On success, the action redirects to the new week detail page
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="brutal-card space-y-4 p-6"
    >
      <div>
        <p className="brutal-label">
          Create week
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.05em] text-[var(--text-primary)]">
          Seed the next round
        </h2>
      </div>

      {/* Slug */}
      <label className="block space-y-2">
        <span className="brutal-label">Slug</span>
        <input
          required
          name="slug"
          className="brutal-input"
          placeholder="week-1"
        />
      </label>

      {/* Theme title */}
      <label className="block space-y-2">
        <span className="brutal-label">Theme title</span>
        <input
          required
          name="themeTitle"
          className="brutal-input"
          placeholder="Your theme title"
        />
      </label>

      {/* L30: Theme description moved here, directly after title */}
      <label className="block space-y-2">
        <span className="brutal-label">Theme description</span>
        <textarea
          required
          name="themeDescription"
          rows={4}
          className="brutal-input"
          placeholder="Describe the theme for this week's challenge..."
        />
      </label>

      {/* Timezone dropdown */}
      <label className="block space-y-2">
        <span className="brutal-label">Timezone</span>
        <select
          name="timezone"
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className="brutal-input cursor-pointer"
        >
          {timezones.map((t) => (
            <option key={t.tzCode} value={t.tzCode}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {/* Datetime pickers */}
      {dateFields.map(([name, label]) => (
        <label key={name} className="block space-y-2">
          <span className="brutal-label">{label}</span>
          <input
            required
            type="datetime-local"
            name={name}
            className="brutal-input"
          />
        </label>
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="brutal-btn brutal-btn-primary disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create draft week"}
      </button>

      {error ? (
        <div className="border-t-[2px] border-[var(--accent-red)] bg-red-900/20 px-4 py-3">
          <p className="font-mono text-sm font-bold text-red-400">{error}</p>
        </div>
      ) : null}
    </form>
  );
}
