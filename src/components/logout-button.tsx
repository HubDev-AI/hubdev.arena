"use client";

export function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/dev/logout", { method: "POST" });
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
