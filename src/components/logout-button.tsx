"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/browser";

export function LogoutButton({ dataMode }: { dataMode?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoading(true);
    setError(null);
    try {
      if (dataMode === "mock") {
        await fetch("/api/dev/logout", {
          method: "POST",
          headers: { "X-Requested-With": "XMLHttpRequest" },
        });
      } else {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      window.location.href = "/";
    } catch {
      setError("Sign out failed. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="brutal-btn brutal-btn-outline text-[10px] px-3 py-2 disabled:opacity-50 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)]"
      >
        {isLoading ? "..." : "Sign out"}
      </button>
      {error ? (
        <span className="font-mono text-[10px] text-red-400">{error}</span>
      ) : null}
    </div>
  );
}
