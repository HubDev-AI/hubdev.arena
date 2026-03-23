import type { Metadata } from "next";

import { AuroraBg } from "@/components/aurora-bg";
import { GlitchText } from "@/components/glitch-text";
import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

import { CreateWeekForm } from "./create-week-form";
import { WeekList } from "./week-list";

export const metadata: Metadata = {
  title: "Admin: Weeks",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminWeeksPage() {
  await requireAdminSession("/admin/weeks");
  const weeks = await getArenaService().listWeeks();

  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        {/* Dark hero header */}
        <div className="brutal-card neon-box relative overflow-hidden arena-hero-bg p-6 text-white sm:p-8">
          <AuroraBg />
          <div className="absolute right-0 top-0 z-20 h-20 w-20 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
          }} />
          <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
          <div className="relative z-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
              Admin panel
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              <GlitchText text="Weekly round control" />
            </h1>
            <p className="mt-2 text-sm text-gray-300">
              Create weeks, manage submissions, control the voting lifecycle.
            </p>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* M19: Week list with pagination */}
          <WeekList weeks={weeks} />

          {/* Create week form */}
          <CreateWeekForm />
        </div>
      </div>
    </div>
  );
}
