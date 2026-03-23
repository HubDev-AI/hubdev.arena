import type { Metadata } from "next";
import Link from "next/link";

import { AuroraBg } from "@/components/aurora-bg";
import { GlitchText } from "@/components/glitch-text";
import { ParticleField } from "@/components/particle-field";
import { ScrollReveal } from "@/components/scroll-reveal";

export const metadata: Metadata = {
  title: "Rules and How It Works",
  description:
    "How HubDev Arena works: weekly themes, AI-built app submissions, authenticated head-to-head voting, ELO scoring with K=24, and curated rounds.",
  alternates: {
    canonical: "https://hubdev-arena.vercel.app/rules",
  },
  openGraph: {
    title: "Rules — HubDev Arena",
    description:
      "How HubDev Arena works: submissions, voting, ELO scoring, and weekly rounds.",
    url: "https://hubdev-arena.vercel.app/rules",
  },
  twitter: {
    card: "summary",
    title: "Rules — HubDev Arena",
    description:
      "How HubDev Arena works: submissions, voting, ELO scoring, and weekly rounds.",
  },
};

export default function RulesPage() {
  return (
    <div className="page-bg page-bg-rules">
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="brutal-card relative overflow-hidden bg-[var(--ink)] p-6 text-white sm:p-8 neon-box scanlines">
        <AuroraBg />
        <ParticleField className="opacity-40" />
        {/* Corner accent + bottom bar — z-20 so they render above particles/aurora */}
        <div className="absolute right-0 top-0 z-20 h-20 w-20 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
        <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
        <div className="relative z-10">
          <p className="brutal-label text-[var(--accent-green)] neon-text">Rules</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em]">
            <GlitchText text="HubDev Arena ruleset" />
          </h1>
          <p className="mt-3 text-sm text-gray-400">The laws of the arena. Built for fair competition.</p>
        </div>
      </div>

      <div className="grid gap-5">
        {[
          {
            num: "01",
            accent: "text-[var(--accent-green)]",
            gradientFrom: "from-[var(--accent-green)]",
            borderAccent: "border-l-[4px] border-l-[var(--accent-green)]",
            title: "Builders get one active entry per week",
            body: "Every builder signs in, submits one live app URL, and includes one GIF or short MP4 demo asset. Entries stay out of voting until manually approved.",
          },
          {
            num: "02",
            accent: "text-[var(--accent-blue)]",
            gradientFrom: "from-[var(--accent-blue)]",
            borderAccent: "border-l-[4px] border-l-[var(--accent-blue)]",
            title: "Voters sign in before they vote",
            body: "Voting is tied to an authenticated HubDev account. Each signed-in session gives you 10 head-to-head picks. You can vote in multiple sessions throughout the week. Hashed IP and user-agent fingerprints are kept as secondary abuse signals.",
          },
          {
            num: "03",
            accent: "text-[var(--accent-yellow)]",
            gradientFrom: "from-[var(--accent-yellow)]",
            borderAccent: "border-l-[4px] border-l-[var(--accent-yellow)]",
            title: "The leaderboard is weekly and live",
            body: "All approved entries start at 1200 ELO with K = 24. Every vote updates both entries. Rankings break ties by wins, then fewer losses, then earlier approval time.",
          },
          {
            num: "04",
            accent: "text-[var(--accent-red)]",
            gradientFrom: "from-[var(--accent-red)]",
            borderAccent: "border-l-[4px] border-l-[var(--accent-red)]",
            title: "Every round is curated",
            body: "Each weekly round has a theme set by the HubDev team. Submissions are reviewed and approved before entering voting. Results are locked at the end of the voting window and published on the leaderboard.",
          },
        ].map((item, i) => (
          <ScrollReveal key={item.title} delay={i * 100}>
            <section className={`brutal-card overflow-hidden p-0 hover-lift holo-shimmer neon-box ${item.borderAccent}`}>
              <div className="flex items-start gap-5 p-6">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-[var(--line)] bg-[var(--ink)] font-mono text-lg font-bold ${item.accent}`} style={{ boxShadow: "0 0 12px rgba(0, 255, 65, 0.1)" }}>
                  {item.num}
                </span>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-[-0.05em] text-[var(--text-primary)]">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">{item.body}</p>
                </div>
              </div>
              <div className={`h-1 w-full bg-gradient-to-r ${item.gradientFrom} to-transparent`} />
            </section>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={400}>
        <div className="brutal-card relative overflow-hidden bg-[var(--ink)] p-6 text-white sm:p-8 neon-box">
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-black sm:text-xl">Know the rules. Enter the arena.</p>
              <p className="mt-1 text-sm text-gray-400">Submit your AI-built app and compete for the top spot.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/vote" className="brutal-btn brutal-btn-outline hover-lift">Start voting</Link>
              <Link href="/leaderboard" className="brutal-btn brutal-btn-outline hover-lift">View leaderboard</Link>
              <Link href="/submit" className="brutal-btn brutal-btn-green hover-lift">Submit entry</Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
    </div>
  );
}
