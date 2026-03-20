"use client";

import type { ReactNode } from "react";

export function ConfirmForm({
  action,
  confirmMessage,
  children,
}: {
  action: (formData: FormData) => void;
  confirmMessage: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
