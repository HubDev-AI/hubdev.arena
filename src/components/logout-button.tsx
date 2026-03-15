"use client";

import { createClient } from "@/lib/supabase/browser";

export function LogoutButton({ dataMode }: { dataMode?: string }) {
  async function handleLogout() {
    if (dataMode === "mock") {
      await fetch("/api/dev/logout", { method: "POST" });
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="brutal-btn brutal-btn-outline text-[10px] px-3 py-2"
    >
      Sign out
    </button>
  );
}
