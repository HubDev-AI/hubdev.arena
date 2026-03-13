"use client";

import Link from "next/link";
import { useState } from "react";

type ExistingEntry = {
  id: string;
  title: string;
  oneLiner: string;
  liveUrl: string;
  status: "pending" | "approved" | "rejected";
  rejectionNote: string | null;
};

export function SubmitForm({
  weekSlug,
  existingEntry,
  userId: _userId,
}: {
  weekSlug: string;
  existingEntry?: ExistingEntry | null;
  userId?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      const file = formData.get("demoAsset");
      let demoAssetPath: string | undefined;

      if (file instanceof File && file.size > 0) {
        setIsUploading(true);
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        const uploadResponse = await fetch("/api/assets", {
          method: "POST",
          body: uploadForm,
        });
        const uploadPayload = (await uploadResponse.json()) as {
          demoAssetPath?: string;
          error?: string;
        };

        if (!uploadResponse.ok || !uploadPayload.demoAssetPath) {
          throw new Error(uploadPayload.error ?? "Upload failed.");
        }

        demoAssetPath = uploadPayload.demoAssetPath;
        setIsUploading(false);
      } else if (!existingEntry) {
        throw new Error("Choose a GIF or MP4 demo asset first.");
      }

      const submissionResponse = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          weekSlug,
          title: formData.get("title"),
          oneLiner: formData.get("oneLiner"),
          liveUrl: formData.get("liveUrl"),
          ...(demoAssetPath ? { demoAssetPath } : {}),
        }),
      });
      const submissionPayload = (await submissionResponse.json()) as { error?: string };

      if (!submissionResponse.ok) {
        throw new Error(submissionPayload.error ?? "Submission failed.");
      }

      setSuccess(true);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="brutal-card space-y-4 p-6">
        <p className="border-[3px] border-[var(--accent-green)] bg-green-50 px-5 py-4 font-mono text-sm font-bold text-green-800">
          Your submission is pending review. An admin will approve or reject it shortly.
        </p>
        <Link
          href="/my-submissions"
          className="brutal-btn brutal-btn-outline inline-block"
        >
          View my submissions →
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Rejection note banner */}
      {existingEntry?.status === "rejected" && existingEntry.rejectionNote && (
        <div className="border-[3px] border-red-500 bg-red-50 px-5 py-4 font-mono text-sm font-bold text-red-700">
          Your previous submission was rejected: {existingEntry.rejectionNote}
        </div>
      )}

      <form action={handleSubmit} className="brutal-card space-y-5 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="brutal-label">Title</span>
            <input
              required
              name="title"
              defaultValue={existingEntry?.title ?? ""}
              className="brutal-input"
              placeholder="Prompt Forge"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="brutal-label">One-liner</span>
            <textarea
              required
              name="oneLiner"
              rows={3}
              defaultValue={existingEntry?.oneLiner ?? ""}
              className="brutal-input"
              placeholder="Stress-test prompts against real user friction before launch."
            />
          </label>
          <label className="space-y-2">
            <span className="brutal-label">Live URL</span>
            <input
              required
              name="liveUrl"
              type="url"
              defaultValue={existingEntry?.liveUrl ?? ""}
              className="brutal-input"
              placeholder="https://yourapp.example.com"
            />
          </label>
          <label className="space-y-2">
            <span className="brutal-label">
              Demo asset{existingEntry ? " (leave blank to keep existing)" : ""}
            </span>
            <input
              required={!existingEntry}
              name="demoAsset"
              type="file"
              accept="image/gif,video/mp4"
              className="brutal-input text-sm file:mr-4 file:cursor-pointer file:border-[2px] file:border-[var(--ink)] file:bg-[var(--ink)] file:px-3 file:py-2 file:font-mono file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-[var(--surface)] hover:file:bg-[var(--accent-green)] hover:file:text-[var(--ink)]"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="brutal-btn brutal-btn-green disabled:opacity-50"
        >
          {isUploading
            ? "Uploading asset..."
            : isSubmitting
              ? "Submitting..."
              : existingEntry
                ? "Update entry"
                : "Submit entry"}
        </button>

        {error ? (
          <p className="border-[2px] border-[var(--accent-red)] bg-red-50 px-4 py-3 font-mono text-sm font-bold text-[var(--accent-red)]">
            {error}
          </p>
        ) : null}
      </form>
    </>
  );
}
