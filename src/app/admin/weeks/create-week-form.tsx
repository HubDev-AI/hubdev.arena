"use client";

import { useRef, useState } from "react";
import timezones from "timezones-list";

import { createWeekAction } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-[1.3rem] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent-blue)]";

const labelClass =
  "font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]";

const dateFields = [
  ["submissionOpenAt", "Submission open"],
  ["submissionCloseAt", "Submission close"],
  ["votingOpenAt", "Voting open"],
  ["votingCloseAt", "Voting close"],
] as const;

export function CreateWeekForm() {
  const [tz, setTz] = useState("America/Los_Angeles");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
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

    return createWeekAction(formData);
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-4 rounded-[2rem] border border-[var(--line)] bg-white/86 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]"
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Create week
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.05em] text-[var(--ink)]">
          Seed the next round
        </h2>
      </div>

      {/* Slug */}
      <label className="block space-y-2">
        <span className={labelClass}>Slug</span>
        <input
          required
          name="slug"
          className={inputClass}
          placeholder="week-1"
        />
      </label>

      {/* Theme title */}
      <label className="block space-y-2">
        <span className={labelClass}>Theme title</span>
        <input
          required
          name="themeTitle"
          className={inputClass}
          placeholder="Your theme title"
        />
      </label>

      {/* Timezone dropdown */}
      <label className="block space-y-2">
        <span className={labelClass}>Timezone</span>
        <select
          name="timezone"
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className={inputClass + " cursor-pointer"}
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
          <span className={labelClass}>{label}</span>
          <input
            required
            type="datetime-local"
            name={name}
            className={inputClass}
          />
        </label>
      ))}

      {/* Theme description */}
      <label className="block space-y-2">
        <span className={labelClass}>Theme description</span>
        <textarea
          required
          name="themeDescription"
          rows={4}
          className={inputClass}
          placeholder="Describe the theme for this week's challenge..."
        />
      </label>

      <button
        type="submit"
        className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--paper)] transition hover:bg-[var(--accent-blue)] hover:text-white"
      >
        Create draft week
      </button>
    </form>
  );
}
