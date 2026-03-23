"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type FieldErrors = Record<string, string[] | undefined>;

type FilePreview = {
  name: string;
  size: number;
  type: string;
  url: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CharCounter({
  current,
  max,
  id,
}: {
  current: number;
  max: number;
  id: string;
}) {
  const ratio = current / max;
  const nearLimit = ratio > 0.8 && ratio < 1;
  const atLimit = ratio >= 1;

  let colorClass = "text-[var(--muted)]";
  let suffix = "";

  if (atLimit) {
    colorClass = "text-red-400";
    suffix = " (at limit)";
  } else if (nearLimit) {
    colorClass = "text-amber-400";
    suffix = " (near limit)";
  }

  return (
    <span id={id} className={`font-mono text-[10px] ${colorClass}`} aria-live="polite">
      {current}/{max}{suffix}
    </span>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function UploadProgressBar({ progress }: { progress: number }) {
  return (
    <div className="space-y-1" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
      <div className="flex items-center justify-between font-mono text-[10px] text-[var(--accent-green)]">
        <span>Uploading asset...</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden border border-[var(--line)] bg-black/40">
        <div
          className="h-full bg-[var(--accent-green)] transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="brutal-card neon-box mx-4 w-full max-w-md p-6">
        <h2 id="confirm-dialog-title" className="text-lg font-black uppercase tracking-tight text-[var(--text-primary)]">
          Confirm submission
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Ready to submit <strong className="text-[var(--text-primary)]">{title}</strong>? This will use your submission slot for this week.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="brutal-btn brutal-btn-green hover-lift"
            onClick={onConfirm}
            autoFocus
          >
            Confirm
          </button>
          <button
            type="button"
            className="brutal-btn hover-lift"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function FilePreviewDisplay({ preview }: { preview: FilePreview }) {
  const isVideo = preview.type === "video/mp4";

  return (
    <div className="mt-3 space-y-2 border border-[var(--line)] bg-black/20 p-3">
      {isVideo ? (
        <video
          src={preview.url}
          controls
          muted
          className="max-h-48 w-full object-contain"
          aria-label={`Video preview: ${preview.name}`}
        >
          <track kind="captions" />
        </video>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element -- blob URL from createObjectURL; next/image requires remote/static src */
        <img
          src={preview.url}
          alt={`Preview: ${preview.name}`}
          className="max-h-48 w-full object-contain"
        />
      )}
      <p className="font-mono text-[10px] text-[var(--muted)]">
        {preview.name} ({formatFileSize(preview.size)})
      </p>
    </div>
  );
}

export function SubmitForm({
  weekSlug,
  hasPendingEntry,
}: {
  weekSlug: string;
  hasPendingEntry: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTitle, setSuccessTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [titleLen, setTitleLen] = useState(0);
  const [oneLinerLen, setOneLinerLen] = useState(0);
  const [titleValue, setTitleValue] = useState("");
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingFormDataRef = useRef<FormData | null>(null);

  // Client-side validation matching server Zod schema
  function validateFields(formData: FormData): FieldErrors {
    const errors: FieldErrors = {};
    const title = formData.get("title");
    const oneLiner = formData.get("oneLiner");
    const liveUrl = formData.get("liveUrl");

    if (typeof title === "string") {
      if (title.length < 3) {
        errors.title = ["Title must be at least 3 characters."];
      } else if (title.length > 60) {
        errors.title = ["Title must be at most 60 characters."];
      }
    } else {
      errors.title = ["Title is required."];
    }

    if (typeof oneLiner === "string") {
      if (oneLiner.length < 10) {
        errors.oneLiner = ["One-liner must be at least 10 characters."];
      } else if (oneLiner.length > 140) {
        errors.oneLiner = ["One-liner must be at most 140 characters."];
      }
    } else {
      errors.oneLiner = ["One-liner is required."];
    }

    if (typeof liveUrl === "string") {
      if (!liveUrl.startsWith("https://")) {
        errors.liveUrl = ["Live URL must start with https://"];
      }
    } else {
      errors.liveUrl = ["Live URL is required."];
    }

    return errors;
  }

  function uploadWithProgress(file: File): Promise<{ demoAssetPath?: string; error?: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const uploadForm = new FormData();
      uploadForm.append("file", file);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        try {
          const payload = JSON.parse(xhr.responseText) as { demoAssetPath?: string; error?: string };
          if (xhr.status >= 200 && xhr.status < 300 && payload.demoAssetPath) {
            resolve(payload);
          } else {
            resolve({ error: payload.error ?? "Upload failed." });
          }
        } catch {
          resolve({ error: "Upload failed — invalid server response." });
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload."));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload was cancelled."));
      });

      xhr.open("POST", "/api/assets");
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      xhr.send(uploadForm);
    });
  }

  async function performSubmission(formData: FormData) {
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const file = formData.get("demoAsset");
      if (!(file instanceof File) || file.size === 0) {
        throw new Error("Choose a GIF or MP4 demo asset first.");
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File must be under 50 MB.");
      }

      // Client-side validation
      const clientErrors = validateFields(formData);
      if (Object.keys(clientErrors).length > 0) {
        setFieldErrors(clientErrors);
        setIsSubmitting(false);
        return;
      }

      // Upload with progress
      setIsUploading(true);
      setUploadProgress(0);

      const uploadPayload = await uploadWithProgress(file);

      if (uploadPayload.error || !uploadPayload.demoAssetPath) {
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
      const submissionPayload = (await submissionResponse.json()) as {
        error?: string;
        fields?: FieldErrors;
      };

      if (!submissionResponse.ok) {
        // H11: Parse Zod field errors from API response
        if (submissionPayload.fields) {
          setFieldErrors(submissionPayload.fields);
        }
        throw new Error(submissionPayload.error ?? "Submission failed.");
      }

      // H9: Store title for success state
      const submittedTitle = (formData.get("title") as string) || "your entry";
      setSuccessTitle(submittedTitle);
      formRef.current?.reset();
      setTitleLen(0);
      setOneLinerLen(0);
      setTitleValue("");
      setFilePreview(null);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});

    // Client-side validation first (before confirmation dialog)
    const file = formData.get("demoAsset");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a GIF or MP4 demo asset first.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File must be under 50 MB.");
      return;
    }

    const clientErrors = validateFields(formData);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    // H10: Show confirmation dialog
    pendingFormDataRef.current = formData;
    setShowConfirm(true);
  }

  function handleConfirm() {
    setShowConfirm(false);
    if (pendingFormDataRef.current) {
      performSubmission(pendingFormDataRef.current);
      pendingFormDataRef.current = null;
    }
  }

  function handleCancel() {
    setShowConfirm(false);
    pendingFormDataRef.current = null;
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    // Clean up previous preview URL
    if (filePreview) {
      URL.revokeObjectURL(filePreview.url);
    }

    const file = event.target.files?.[0];
    if (file) {
      setFilePreview({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      });
    } else {
      setFilePreview(null);
    }
  }

  function resetForm() {
    setSuccessTitle(null);
    setError(null);
    setFieldErrors({});
    setTitleLen(0);
    setOneLinerLen(0);
    setTitleValue("");
    if (filePreview) {
      URL.revokeObjectURL(filePreview.url);
    }
    setFilePreview(null);
    formRef.current?.reset();
  }

  // H9: Success state replaces entire form
  if (successTitle) {
    return (
      <div className="brutal-card overflow-hidden p-0 neon-box">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="text-[var(--accent-green)]">
            <CheckCircleIcon />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-primary)]">
            Submission received!
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">{successTitle}</strong> is now waiting for admin approval.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/my-submissions"
              className="brutal-btn brutal-btn-green hover-lift"
            >
              View my submissions
            </Link>
            <button
              type="button"
              className="brutal-btn hover-lift"
              onClick={resetForm}
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* H10: Confirmation dialog */}
      {showConfirm && (
        <ConfirmDialog
          title={titleValue || "your entry"}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      <form
        ref={formRef}
        action={handleSubmit}
        className="brutal-card overflow-hidden p-0 neon-box"
      >
        {/* C7: Pending entry overwrite warning */}
        {hasPendingEntry && (
          <div className="flex items-start gap-3 border-b-[2px] border-[var(--accent-yellow)] bg-amber-900/20 px-6 py-4">
            <span className="mt-0.5 shrink-0 text-[var(--accent-yellow)]">
              <WarningIcon />
            </span>
            <p className="font-mono text-sm font-bold text-amber-300">
              You already have a pending submission for this week. Submitting again will replace it.
            </p>
          </div>
        )}

        <div className="bg-black/40 px-6 py-4 flow-border-bottom">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)] neon-text">
            Entry details
          </p>
        </div>
        <div className="grid gap-5 p-6 md:grid-cols-2">
          {/* Title field */}
          <label className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="brutal-label text-[var(--accent-green)]" id="title-label">Title</span>
              <CharCounter current={titleLen} max={60} id="title-counter" />
            </div>
            <input
              required
              name="title"
              minLength={3}
              maxLength={60}
              className="brutal-input"
              placeholder="Your app name"
              aria-describedby={fieldErrors.title ? "title-error title-counter" : "title-counter"}
              onChange={(e) => {
                setTitleLen(e.target.value.length);
                setTitleValue(e.target.value);
              }}
            />
            {fieldErrors.title && (
              <p id="title-error" className="font-mono text-xs text-red-400" role="alert">
                {fieldErrors.title[0]}
              </p>
            )}
          </label>

          {/* One-liner field */}
          <label className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="brutal-label text-[var(--accent-green)]" id="oneliner-label">One-liner</span>
              <CharCounter current={oneLinerLen} max={140} id="oneliner-counter" />
            </div>
            <textarea
              required
              name="oneLiner"
              rows={3}
              minLength={10}
              maxLength={140}
              className="brutal-input"
              placeholder="What does your app do in one sentence?"
              aria-describedby={fieldErrors.oneLiner ? "oneliner-error oneliner-counter" : "oneliner-counter"}
              onChange={(e) => {
                setOneLinerLen(e.target.value.length);
              }}
            />
            {fieldErrors.oneLiner && (
              <p id="oneliner-error" className="font-mono text-xs text-red-400" role="alert">
                {fieldErrors.oneLiner[0]}
              </p>
            )}
          </label>

          {/* Live URL field */}
          <label className="space-y-2">
            <span className="brutal-label text-[var(--accent-green)]" id="liveurl-label">Live URL</span>
            <input
              required
              name="liveUrl"
              type="url"
              pattern="https://.*"
              title="URL must start with https://"
              className="brutal-input"
              placeholder="https://your-app.com"
              aria-describedby={fieldErrors.liveUrl ? "liveurl-error" : undefined}
            />
            {fieldErrors.liveUrl && (
              <p id="liveurl-error" className="font-mono text-xs text-red-400" role="alert">
                {fieldErrors.liveUrl[0]}
              </p>
            )}
          </label>

          {/* Demo asset field */}
          <div className="space-y-2">
            <span className="brutal-label text-[var(--accent-green)]" id="demo-label">Demo asset (GIF or MP4)</span>
            <input
              required
              name="demoAsset"
              type="file"
              accept="image/gif,video/mp4"
              className="brutal-input text-sm file:mr-4 file:border file:border-[var(--accent-green)]/30 file:bg-[var(--accent-green)]/10 file:px-3 file:py-2 file:font-mono file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-[var(--accent-green)] file:cursor-pointer file:transition-all hover:file:bg-[var(--accent-green)] hover:file:text-black hover:file:shadow-[0_0_10px_rgba(0,255,65,0.2)]"
              aria-describedby="demo-help"
              onChange={handleFileChange}
            />
            {/* M12: File type/size helper text */}
            <p id="demo-help" className="font-mono text-[10px] text-[var(--muted)]">
              Accepted: GIF or MP4, max 50 MB
            </p>
            {/* C6: File preview */}
            {filePreview && <FilePreviewDisplay preview={filePreview} />}
          </div>
        </div>

        <div className="border-t-[2px] border-[var(--line)] px-6 py-4 space-y-3">
          {/* H8: Upload progress bar */}
          {isUploading && <UploadProgressBar progress={uploadProgress} />}

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

        {error ? (
          <div className="border-t-[2px] border-[var(--accent-red)] bg-red-900/20 px-6 py-4" role="alert">
            <p className="font-mono text-sm font-bold text-red-400">
              {error}
            </p>
          </div>
        ) : null}
      </form>
    </>
  );
}
