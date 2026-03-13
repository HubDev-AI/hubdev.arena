"use client";

import { useState } from "react";

export function SubmitForm({ weekSlug }: { weekSlug: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      const file = formData.get("demoAsset");
      if (!(file instanceof File)) {
        throw new Error("Choose a GIF or MP4 demo asset first.");
      }

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

      setIsUploading(false);

      const submissionResponse = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          weekSlug,
          title: formData.get("title"),
          oneLiner: formData.get("oneLiner"),
          liveUrl: formData.get("liveUrl"),
          demoAssetPath: uploadPayload.demoAssetPath,
        }),
      });
      const submissionPayload = (await submissionResponse.json()) as { error?: string };

      if (!submissionResponse.ok) {
        throw new Error(submissionPayload.error ?? "Submission failed.");
      }

      setStatus("Submission received. It is now waiting for manual approval.");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="brutal-card space-y-5 p-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="brutal-label">Title</span>
          <input
            required
            name="title"
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
            className="brutal-input"
            placeholder="https://yourapp.example.com"
          />
        </label>
        <label className="space-y-2">
          <span className="brutal-label">Demo asset</span>
          <input
            required
            name="demoAsset"
            type="file"
            accept="image/gif,video/mp4"
            className="brutal-input text-sm file:mr-4 file:border-[2px] file:border-[var(--ink)] file:bg-[var(--ink)] file:px-3 file:py-2 file:font-mono file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-[var(--surface)] file:cursor-pointer hover:file:bg-[var(--accent-green)] hover:file:text-[var(--ink)]"
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
            : "Submit entry"}
      </button>

      {status ? (
        <p className="border-[2px] border-[var(--accent-blue)] bg-blue-50 px-4 py-3 font-mono text-sm font-bold text-[var(--accent-blue)]">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="border-[2px] border-[var(--accent-red)] bg-red-50 px-4 py-3 font-mono text-sm font-bold text-[var(--accent-red)]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
