"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/app/admin/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="brutal-btn brutal-btn-green text-[10px] px-3 py-1.5 disabled:opacity-50"
    >
      {pending ? "Processing..." : label}
    </button>
  );
}

function CancelButton({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onCancel}
      className="brutal-btn brutal-btn-outline text-[10px] px-3 py-1.5 disabled:opacity-50"
    >
      Cancel
    </button>
  );
}

export function ConfirmForm({
  action,
  confirmMessage,
  hiddenFields,
  buttonLabel,
  buttonClassName,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  confirmMessage: string;
  hiddenFields: Record<string, string>;
  buttonLabel: string;
  buttonClassName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction] = useActionState(action, { success: true });

  if (!confirming) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={buttonClassName}
        >
          {buttonLabel}
        </button>
        {!state.success && state.error ? (
          <div className="border-t-[2px] border-[var(--accent-red)] bg-red-900/20 px-3 py-2 mt-1">
            <p className="font-mono text-[10px] font-bold text-red-400">{state.error}</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <p className="font-mono text-[10px] text-[var(--accent-yellow)] max-w-xs leading-relaxed">
        {confirmMessage}
      </p>
      <div className="flex gap-2">
        <SubmitButton label="Confirm" />
        <CancelButton onCancel={() => setConfirming(false)} />
      </div>
      {!state.success && state.error ? (
        <div className="border-t-[2px] border-[var(--accent-red)] bg-red-900/20 px-3 py-2">
          <p className="font-mono text-[10px] font-bold text-red-400">{state.error}</p>
        </div>
      ) : null}
    </form>
  );
}
