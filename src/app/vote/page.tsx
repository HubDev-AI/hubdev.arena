import type { Metadata } from "next";
import Link from "next/link";

import { AuroraBg } from "@/components/aurora-bg";
import { DecodeText } from "@/components/decode-text";
import { GlitchText } from "@/components/glitch-text";
import { MagneticButton } from "@/components/magnetic-button";
import { ParticleField } from "@/components/particle-field";
import { ScrollReveal } from "@/components/scroll-reveal";
import { MusicVisualizer } from "@/components/music-visualizer";
import { SpotlightCard } from "@/components/spotlight-card";
import { TypingText } from "@/components/typing-text";
import { VoteClient } from "@/components/vote-client";
import { getBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vote on AI-Built Apps",
  description:
    "Pick the best AI-built app in head-to-head matchups. Cast 10 votes per session and shape the live ELO leaderboard on HubDev Arena.",
  alternates: {
    canonical: "https://hubdev-arena.vercel.app/vote",
  },
  openGraph: {
    title: "Vote on AI-Built Apps — HubDev Arena",
    description:
      "Pick the best AI-built app in head-to-head matchups. 10 votes per session shape the live ELO leaderboard.",
    url: "https://hubdev-arena.vercel.app/vote",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vote on AI-Built Apps — HubDev Arena",
    description:
      "Pick the best AI-built app in head-to-head matchups. 10 votes per session.",
  },
};

export default async function VotePage() {
  const session = await getBuilderSession();

  if (!session) {
    return (
      <div className="page-bg page-bg-vote">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="brutal-card neon-box scanlines relative overflow-hidden bg-[var(--ink)] p-8 text-white sm:p-10 rotating-border">
          <AuroraBg />
          <div className="absolute inset-0 z-0">
            <ParticleField />
          </div>
          <div className="absolute right-0 top-0 z-30 h-24 w-24 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
          }} />
          <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
          <div className="relative z-10">
          <p className="neon-text font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)] cursor-blink">
            Authenticated voting
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
            <GlitchText text="Sign in to vote" />
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300 min-h-[28px]">
            <TypingText
              phrases={[
                "Every vote is authenticated. One account, one voice, zero bots.",
                "Shape the leaderboard. Pick the apps worth opening again.",
                "Vote in head-to-head matchups. Live ELO. Real impact on rankings.",
              ]}
              className="text-gray-300"
            />
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <MagneticButton>
              <Link href="/login?next=%2Fvote" className="brutal-btn brutal-btn-green hover-lift">
                Sign in to start voting
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link href="/leaderboard" className="brutal-btn brutal-btn-outline hover-lift">
                View leaderboard
              </Link>
            </MagneticButton>
          </div>
          </div>
        </div>

        {/* How it works */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { num: "01", title: "Sign in", desc: "Use X or magic link email", color: "#00FF41", glow: "rgba(0, 255, 65, 0.15)", delay: 0 },
            { num: "02", title: "Pick winners", desc: "Vote in head-to-head matchups", color: "#00FFAA", glow: "rgba(0, 255, 170, 0.15)", delay: 150 },
            { num: "03", title: "Shape the board", desc: "Live ELO updates instantly", color: "#0033FF", glow: "rgba(0, 51, 255, 0.15)", delay: 300 },
          ].map((step) => (
            <ScrollReveal key={step.num} delay={step.delay}>
              <SpotlightCard className="brutal-card hover-lift inner-glow p-5 h-full" spotlightColor={step.glow}>
                <div style={{ borderTop: `2px solid ${step.color}` }} className="pt-5 -mt-5 -mx-5 px-5">
                  <span className="flex h-10 w-10 items-center justify-center border border-current/30 bg-black/30 font-mono text-sm font-bold" style={{ color: step.color, boxShadow: `0 0 12px ${step.glow}` }}>
                    {step.num}
                  </span>
                  <p className="mt-3 text-lg font-black tracking-tight text-[var(--text-primary)]">
                    <DecodeText text={step.title} startDelay={step.delay + 200} />
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{step.desc}</p>
                </div>
              </SpotlightCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
      </div>
    );
  }

  let week;
  try {
    week = await getArenaService().getCurrentWeek();
  } catch {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="brutal-card neon-box p-8">
          <p className="brutal-label">Voting</p>
          <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">
            Unable to load voting right now. Please try again shortly.
          </p>
        </div>
      </div>
    );
  }

  if (!week || week.status !== "voting_open") {
    return (
      <div className="page-bg page-bg-vote">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="brutal-card neon-box p-8">
          <p className="brutal-label">Voting</p>
          <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">
            No active voting round right now. Check back when a week opens for voting.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/leaderboard" className="brutal-btn brutal-btn-outline">View leaderboard</Link>
          </div>
        </div>
      </div>
      </div>
    );
  }

  const leaderboard = await getArenaService().getLeaderboard({ weekSlug: week.slug });

  return (
    <div className="page-bg page-bg-vote">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="brutal-card hud-corners holo-shimmer p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <p className="neon-text font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
            Authenticated head-to-head voting
          </p>
          <MusicVisualizer preset="battle" className="hidden sm:flex" />
        </div>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--text-primary)]">
          Pick the app you would open again tomorrow
        </h1>
        <div className="mt-4 h-[2px] w-32 bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-cyan)] to-transparent" />
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
          One tap per matchup. Ten picks. Live ELO updates. Signed in as {session.displayName}.
        </p>
      </div>
      <VoteClient weekSlug={week.slug} weekId={week.id} initialLeaderboard={leaderboard} />
    </div>
    </div>
  );
}
