import type { Metadata } from "next";

import { AuroraBg } from "@/components/aurora-bg";
import { GlitchText } from "@/components/glitch-text";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SubmitForm } from "@/components/submit-form";
import { requireBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const metadata: Metadata = {
  title: "Submit Your AI-Built App",
  description:
    "Submit your AI-built app entry to this week's HubDev Arena challenge. Provide a live URL and demo asset to compete for the top ELO ranking.",
  alternates: {
    canonical: "https://hubdev-arena.vercel.app/submit",
  },
  openGraph: {
    title: "Submit Your AI-Built App — HubDev Arena",
    description:
      "Enter your AI-built app in this week's competition. Provide a live URL and demo asset to compete.",
    url: "https://hubdev-arena.vercel.app/submit",
  },
  twitter: {
    card: "summary",
    title: "Submit Your AI-Built App — HubDev Arena",
    description:
      "Enter your AI-built app in this week's HubDev Arena competition.",
  },
};

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  await requireBuilderSession("/submit");
  const weeks = await getArenaService().listWeeks();
  const openWeek = weeks.find((week) => week.status === "submissions_open");

  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="brutal-card relative overflow-hidden neon-box bg-[var(--ink)] text-white p-6 sm:p-8 holo-shimmer">
          <AuroraBg />
          <div className="relative z-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
              Builder submission
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em]">
              <GlitchText text="Ship one entry this week" className="text-white" />
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">
              A live URL and one demo asset are required. Submissions stay pending until an admin approves them.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
        </div>

        {openWeek ? (
          <>
            <ScrollReveal>
              <div className="brutal-card neon-box neon-text border-l-[4px] border-l-[var(--accent-green)] p-5 hover-lift">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
                  Open week
                </p>
                <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-[var(--ink)]" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  {openWeek.themeTitle}
                </p>
                <p className="mt-2 text-base text-[var(--muted)]">{openWeek.themeDescription}</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <SubmitForm weekSlug={openWeek.slug} />
            </ScrollReveal>
          </>
        ) : (
          <div className="brutal-card neon-box p-6">
            <p className="text-base leading-7 text-[var(--muted)]">
              No week is currently open for submissions. An admin needs to create or open the next round first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
