"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/browser";

export function LogoutButton({ dataMode }: { dataMode?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      if (dataMode === "mock") {
        await fetch("/api/dev/logout", { method: "POST" });
      } else {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      window.location.href = "/";
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="brutal-btn brutal-btn-outline text-[10px] px-3 py-2 disabled:opacity-50 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)]"
    >
      {isLoading ? "..." : "Sign out"}
    </button>
  );
}
