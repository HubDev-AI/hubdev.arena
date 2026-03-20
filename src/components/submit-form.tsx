"use client";

import { useRef, useState } from "react";

export function SubmitForm({ weekSlug }: { weekSlug: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [titleLen, setTitleLen] = useState(0);
  const [oneLinerLen, setOneLinerLen] = useState(0);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      const file = formData.get("demoAsset");
      if (!(file instanceof File)) {
        throw new Error("Choose a GIF or MP4 demo asset first.");
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File must be under 50 MB.");
      }

      const liveUrlValue = formData.get("liveUrl");
      if (typeof liveUrlValue === "string" && !liveUrlValue.startsWith("https://")) {
        throw new Error("Live URL must start with https://");
      }

      setIsUploading(true);
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      const uploadResponse = await fetch("/api/assets", {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
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
          "X-Requested-With": "XMLHttpRequest",
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
      formRef.current?.reset();
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
      ref={formRef}
      action={handleSubmit}
      className="brutal-card overflow-hidden p-0 neon-box"
    >
      <div className="bg-black/40 px-6 py-4 flow-border-bottom">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)] neon-text">
          Entry details
        </p>
      </div>
      <div className="grid gap-5 p-6 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="brutal-label text-[var(--accent-green)]">Title</span>
            <span className={`font-mono text-[10px] ${titleLen >= 48 ? "text-red-400" : "text-[var(--muted)]"}`}>
              {titleLen}/60
            </span>
          </div>
          <input
            required
            name="title"
            maxLength={60}
            className="brutal-input"
            placeholder="Your app name"
            onChange={(e) => setTitleLen(e.target.value.length)}
          />
        </label>
        <label className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="brutal-label text-[var(--accent-green)]">One-liner</span>
            <span className={`font-mono text-[10px] ${oneLinerLen >= 112 ? "text-red-400" : "text-[var(--muted)]"}`}>
              {oneLinerLen}/140
            </span>
          </div>
          <textarea
            required
            name="oneLiner"
            rows={3}
            maxLength={140}
            className="brutal-input"
            placeholder="What does your app do in one sentence?"
            onChange={(e) => setOneLinerLen(e.target.value.length)}
          />
        </label>
        <label className="space-y-2">
          <span className="brutal-label text-[var(--accent-green)]">Live URL</span>
          <input
            required
            name="liveUrl"
            type="url"
            pattern="https://.*"
            title="URL must start with https://"
            className="brutal-input"
            placeholder="https://your-app.com"
          />
        </label>
        <label className="space-y-2">
          <span className="brutal-label text-[var(--accent-green)]">Demo asset (GIF or MP4)</span>
          <input
            required
            name="demoAsset"
            type="file"
            accept="image/gif,video/mp4"
            className="brutal-input text-sm file:mr-4 file:border file:border-[var(--accent-green)]/30 file:bg-[var(--accent-green)]/10 file:px-3 file:py-2 file:font-mono file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-[var(--accent-green)] file:cursor-pointer file:transition-all hover:file:bg-[var(--accent-green)] hover:file:text-black hover:file:shadow-[0_0_10px_rgba(0,255,65,0.2)]"
          />
        </label>
      </div>

      <div className="border-t-[2px] border-[var(--line)] px-6 py-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="brutal-btn brutal-btn-green disabled:opacity-50 hover-lift"
        >
          {isUploading
            ? "Uploading asset..."
            : isSubmitting
              ? "Submitting..."
              : "Submit entry"}
        </button>
      </div>

      {status ? (
        <div className="border-t-[2px] border-[var(--accent-green)] bg-green-900/20 px-6 py-4">
          <p className="font-mono text-sm font-bold text-green-400">
            {status}
          </p>
        </div>
      ) : null}
      {error ? (
        <div className="border-t-[2px] border-[var(--accent-red)] bg-red-900/20 px-6 py-4">
          <p className="font-mono text-sm font-bold text-red-400">
            {error}
          </p>
        </div>
      ) : null}
    </form>
  );
}
