import type { Metadata } from "next";
import Link from "next/link";

import { AnimatedCounter } from "@/components/animated-counter";
import { AuroraBg } from "@/components/aurora-bg";
import { CountdownEnhanced } from "@/components/countdown-enhanced";
import { EntryMedia } from "@/components/entry-media";
import { GlitchText } from "@/components/glitch-text";
import { InfoTooltip } from "@/components/info-tooltip";
import { JsonLd } from "@/components/json-ld";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { LivePulse } from "@/components/live-pulse";
import { ParticleField } from "@/components/particle-field";
import { ScrollReveal } from "@/components/scroll-reveal";
import { TypingText } from "@/components/typing-text";
import { DecodeText } from "@/components/decode-text";
import { MagneticButton } from "@/components/magnetic-button";
import { SpotlightCard } from "@/components/spotlight-card";
import { TiltCard } from "@/components/tilt-card";
import { MusicVisualizer } from "@/components/music-visualizer";
import { safeHref } from "@/lib/safe-href";
import { getBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HubDev Arena — Weekly Battles for AI-Built Apps",
  description:
    "Compete in weekly AI app building challenges. Submit your AI-built app, vote in head-to-head matchups, and climb the live ELO leaderboard. New themes every week.",
  alternates: {
    canonical: "https://hubdev-arena.vercel.app",
  },
  openGraph: {
    title: "HubDev Arena — Weekly Battles for AI-Built Apps",
    description:
      "Compete in weekly AI app building challenges. Submit your AI-built app, vote in head-to-head matchups, and climb the live ELO leaderboard.",
    url: "https://hubdev-arena.vercel.app",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What counts as an AI-built app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Any application where AI tools were used significantly in the development process -- code generation, design, debugging, or any creative workflow.",
      },
    },
    {
      "@type": "Question",
      name: "How are matchups selected?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Matchups are randomized. You will see two entries side by side and pick the one you think is better. Each voting session includes 10 matchups.",
      },
    },
    {
      "@type": "Question",
      name: "Can I vote for my own entry?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The system automatically excludes your own submissions from your voting matchups to keep things fair.",
      },
    },
    {
      "@type": "Question",
      name: "When does the week reset?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Each challenge week runs on its own schedule. Check the countdown timer on the homepage for the current deadline.",
      },
    },
  ],
};

export default async function Home() {
  let week;
  let session;
  try {
    const service = getArenaService();
    session = await getBuilderSession();
    week = await service.getCurrentWeek();
  } catch {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="brutal-card p-8">
          <p className="brutal-label">System status</p>
          <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">
            Unable to load the arena right now. Please try again shortly.
          </p>
        </div>
      </div>
    );
  }

  if (!week) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="brutal-card p-8">
          <p className="brutal-label">System status</p>
          <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">No active challenge week exists yet.</p>
        </div>
      </div>
    );
  }

  const service = getArenaService();
  const leaderboard = await service.getLeaderboard({ weekSlug: week.slug });
  const featuredEntries = leaderboard.slice(0, 3);
  const pastWinners = await service.listPastWinners(2);

  return (
    <div className="page-bg page-bg-home">
    <JsonLd data={faqJsonLd} />
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Hero section */}
      <section aria-label="Hero banner" className="space-y-6">
        {/* Hero + sidebar grid */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Hero card with particle field */}
          <div className="brutal-card relative overflow-hidden arena-hero-bg p-6 text-white sm:p-8 scanlines rotating-border">
            {/* Aurora + Particle background */}
            <AuroraBg />
            <div className="absolute inset-0 z-0">
              <ParticleField />
            </div>
            {/* Accent corner decoration */}
            <div className="absolute right-0 top-0 h-24 w-24 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
            }} />
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
            <div className="relative z-10 flex h-full flex-col">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)] neon-text cursor-blink">
                  Weekly battles for AI-built apps
                </p>
              </div>
              <div className="mt-4 max-w-3xl">
                <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
                  <GlitchText text="HubDev" className="text-white" />{" "}
                  <GlitchText text="Arena" className="text-gradient-animated" />
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300 min-h-[28px]">
                  <TypingText
                    phrases={[
                      "Build with AI tools. Submit your entry. Fight for the top spot.",
                      "Ship fast. Vote hard. Climb the leaderboard.",
                      "10 votes. Live ELO. One winner per week.",
                    ]}
                    className="text-gray-300"
                  />
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <MagneticButton>
                  <Link href="/vote" className="brutal-btn brutal-btn-green hover-lift">
                    Start Voting
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link href="/submit" className="brutal-btn brutal-btn-outline hover-lift">
                    {session ? "Submit your build" : "Sign in"}
                  </Link>
                </MagneticButton>
                <MusicVisualizer className="ml-auto hidden sm:flex" />
              </div>

              {/* Stats row — pushed to bottom */}
              <div className="mt-auto pt-6 grid gap-3 sm:grid-cols-3">
                <div className="glass-card p-4 border-t-[3px] border-t-[var(--accent-green)]">
                  <InfoTooltip tip="Current phase of this week's competition: submissions → voting → completed.">
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">
                      Status
                    </p>
                  </InfoTooltip>
                  <p className="mt-2 text-lg font-black uppercase tracking-tight text-[var(--accent-green)] neon-text">
                    {week.status.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="glass-card p-4 border-t-[3px] border-t-[var(--accent-blue)]">
                  <InfoTooltip tip="Number of approved submissions competing this week.">
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">
                      Entrants
                    </p>
                  </InfoTooltip>
                  <p className="mt-2 text-lg font-black uppercase tracking-tight">
                    <AnimatedCounter value={leaderboard.length} />
                  </p>
                </div>
                <div className="glass-card p-4 border-t-[3px] border-t-[var(--accent-yellow)]">
                  <InfoTooltip tip="Total head-to-head matchup votes cast by all voters this week.">
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">
                      Total votes
                    </p>
                  </InfoTooltip>
                  <p className="mt-2 text-lg font-black uppercase tracking-tight">
                    <AnimatedCounter value={Math.round(leaderboard.reduce((sum, r) => sum + r.wins + r.losses, 0) / 2)} />
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar — stretches to match hero height */}
          <div className="flex flex-col gap-4">
            <CountdownEnhanced
              targetIso={week.status === "voting_open" ? week.votingCloseAt : week.submissionCloseAt}
              label={week.status === "voting_open" ? "Voting closes in" : "Submission deadline"}
            />

            {/* Live activity feed */}
            <LivePulse weekSlug={week.slug} />

            {/* Quick links — card grows to fill, links stay natural */}
            <SpotlightCard className="brutal-card flex flex-1 flex-col overflow-hidden p-0">
              <div className="bg-black/40 px-5 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">Quick links</p>
              </div>
              <div className="divide-y-[2px] divide-[var(--line)]">
                {[
                  { href: "/vote", label: "Vote now", desc: "Pick winners in 10 matchups" },
                  { href: "/leaderboard", label: "Leaderboard", desc: "Live ELO rankings" },
                  { href: "/rules", label: "Rules", desc: "How the arena works" },
                  { href: "/submit", label: "Submit", desc: "Enter your AI-built app" },
                ].map((link) => (
                  <Link key={link.href} href={link.href} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-white/5 group">
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-green)] transition">{link.label}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{link.desc}</p>
                    </div>
                    <span className="text-[var(--text-secondary)] group-hover:translate-x-1 group-hover:text-[var(--accent-green)] transition-all">&rarr;</span>
                  </Link>
                ))}
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Current theme — full width below grid */}
        <ScrollReveal>
          <div className="brutal-card overflow-hidden bg-[var(--surface)] p-0 hud-corners radar-sweep">
            <div className="flex items-stretch">
              <div className="hidden w-2 shrink-0 bg-[var(--accent-green)] sm:block" />
              <div className="flex-1 p-5 sm:p-6">
                <p className="brutal-label">Current theme</p>
                <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-[var(--text-primary)] sm:text-3xl">
                  <DecodeText text={week.themeTitle} speed={30} />
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
                  {week.themeDescription}
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {leaderboard.length} entries competing &middot; {Math.round(leaderboard.reduce((sum, r) => sum + r.wins + r.losses, 0) / 2)} votes cast
                </p>
              </div>
              <div className="flex items-center px-4 sm:px-6">
                <Link href="/submit" className="brutal-btn brutal-btn-green whitespace-nowrap hover-lift">
                  Enter now
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <div className="data-stream-divider" />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { num: "01", title: "Build", desc: "Ship an AI-powered app during the week", color: "#00FF41", glow: "rgba(0, 255, 65, 0.08)" },
          { num: "02", title: "Battle", desc: "Entries face off in head-to-head matchups", color: "#0033FF", glow: "rgba(0, 51, 255, 0.08)" },
          { num: "03", title: "Win", desc: "Top ELO at the end of voting takes the crown", color: "#FFD600", glow: "rgba(255, 214, 0, 0.08)" },
        ].map((step, i) => (
          <ScrollReveal key={step.num} delay={i * 100}>
            <div className="brutal-card overflow-hidden p-0 hover-lift noise-overlay" style={{ borderTop: `2px solid ${step.color}`, boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 20px ${step.glow}` }}>
              <div className="bg-black/40 px-4 py-3 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center font-mono text-sm font-bold" style={{ color: step.color, border: `1px solid ${step.color}30`, boxShadow: `0 0 10px ${step.glow}`, background: "rgba(0,0,0,0.3)" }}>{step.num}</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-current to-transparent" style={{ color: step.color }} />
              </div>
              <div className="p-5">
                <p className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{step.title}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </section>

      <div className="data-stream-divider" />

      <section className="space-y-5">
        <ScrollReveal>
          <div className="brutal-card flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
            <div>
              <p className="brutal-label">Featured entrants</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight sm:text-3xl text-gradient-animated">
                Current contenders
              </h2>
            </div>
            <Link href="/leaderboard" className="brutal-btn brutal-btn-outline text-[10px] px-3 py-2 hover-lift">
              Full board
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredEntries.map((entry, idx) => (
            <ScrollReveal key={entry.entrySlug} delay={idx * 120}>
              <TiltCard className="h-full">
              <article className={`brutal-card h-full overflow-hidden group glitch-hover ${idx === 0 ? "border-t-[3px] border-t-[var(--accent-yellow)]" : idx === 1 ? "border-t-[3px] border-t-[var(--accent-cyan)]" : "border-t-[3px] border-t-[var(--accent-purple)]"}`} style={idx === 0 ? { boxShadow: "0 4px 20px rgba(0,0,0,0.3), 0 0 20px rgba(255, 214, 0, 0.08)" } : idx === 1 ? { boxShadow: "0 4px 20px rgba(0,0,0,0.3), 0 0 15px rgba(0, 255, 170, 0.06)" } : { boxShadow: "0 4px 20px rgba(0,0,0,0.3), 0 0 15px rgba(139, 92, 246, 0.06)" }}>
                <div className="img-zoom relative">
                  <EntryMedia assetPath={entry.demoAssetUrl} title={entry.title} className="h-48" />
                  <div className={`absolute left-0 top-3 border-r-[2px] border-y-[2px] border-[var(--line)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${idx === 0 ? "bg-[var(--accent-yellow)] text-black" : idx === 1 ? "bg-[var(--accent-cyan)] text-black" : "bg-[var(--accent-purple)] text-white"}`}>
                    #{idx + 1}
                  </div>
                </div>
                {/* Dark info bar: title + author + record */}
                <div className="border-t border-[var(--line)] bg-black/50 px-4 py-3">
                  <Link
                    href={`/entry/${entry.entrySlug}`}
                    className="animated-underline block text-lg font-black tracking-tight text-white transition group-hover:text-[var(--accent-green)]"
                  >
                    {entry.title}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                    <span>by {entry.builderName}</span>
                    <span className="text-gray-600">&middot;</span>
                    <span className="font-mono font-bold whitespace-nowrap">
                      <span className="text-[var(--accent-green)]">{entry.wins}W</span>
                      {" / "}
                      <span className="text-red-400">{entry.losses}L</span>
                    </span>
                  </div>
                </div>
                {/* ELO + actions */}
                <div className="flex items-center justify-between gap-2 border-t-[2px] border-[var(--line)] px-4 py-3">
                  <InfoTooltip tip="ELO rating from head-to-head votes. Starts at 1200; wins against higher-rated entries earn more points.">
                    <span className="brutal-badge brutal-badge-elo">
                      ELO {entry.elo}
                    </span>
                  </InfoTooltip>
                  <div className="flex gap-2">
                    <a
                      href={safeHref(entry.liveUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="brutal-btn brutal-btn-green text-[10px] px-3 py-1.5 hover-lift"
                    >
                      Open
                    </a>
                    <Link
                      href={`/entry/${entry.entrySlug}`}
                      className="brutal-btn brutal-btn-outline text-[10px] px-3 py-1.5 hover-lift"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </article>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>

        {pastWinners.length > 0 ? (
          <ScrollReveal>
            <div className="brutal-card overflow-hidden divide-y-[2px] divide-[var(--line)] p-0 neon-box">
              <div className="bg-black/40 px-5 py-3 flow-border-bottom">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-yellow)]" style={{ textShadow: "0 0 10px rgba(255, 214, 0, 0.4)" }}>
                  Past winners
                </p>
              </div>
              {pastWinners.map((item) => (
                <div key={item.week.slug} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/5 group">
                  <div>
                    <p className="text-base font-black tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-green)] transition">
                      {item.topEntry?.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.week.themeTitle}</p>
                  </div>
                  <span className="brutal-badge brutal-badge-green pulse-ring">
                    Winner
                  </span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        ) : null}
      </section>

      {/* Leaderboard preview */}
      <ScrollReveal>
        <section aria-label="Weekly leaderboard">
          <LeaderboardTable rows={leaderboard.slice(0, 5)} />
        </section>
      </ScrollReveal>

      {/* How ELO works */}
      <ScrollReveal>
        <SpotlightCard className="brutal-card overflow-hidden p-0">
          <div className="bg-black/40 px-5 py-3 flow-border-bottom">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
              How ELO rating works
            </p>
          </div>
          <div className="grid gap-0 divide-y divide-[var(--line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-5 border-t-[2px] border-t-[var(--accent-green)]">
              <p className="text-3xl font-black text-[var(--accent-green)] neon-text" style={{ animation: "number-glow 3s ease-in-out infinite" }}>
                <AnimatedCounter value={1200} />
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">Starting rating</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">Every new entry starts at 1200 ELO. Your rating reflects how your app performs against other competitors.</p>
            </div>
            <div className="p-5 border-t-[2px] border-t-[var(--accent-blue)]">
              <p className="text-3xl font-black text-[var(--accent-blue)] neon-text-blue">+/-</p>
              <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">Points per matchup</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">Beat a higher-rated entry and gain more points. Lose to a lower-rated one and drop more. Upsets are rewarded.</p>
            </div>
            <div className="p-5 border-t-[2px] border-t-[var(--accent-yellow)]">
              <p className="text-3xl font-black text-[var(--accent-yellow)]" style={{ textShadow: "0 0 10px rgba(255, 214, 0, 0.4)" }}>K=32</p>
              <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">Sensitivity factor</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">We use a K-factor of 32 so early matchups can move the leaderboard quickly and every vote matters.</p>
            </div>
          </div>
        </SpotlightCard>
      </ScrollReveal>

      {/* FAQ */}
      <ScrollReveal>
        <section className="space-y-4">
          <div className="brutal-card overflow-hidden p-0">
            <div className="bg-black/40 px-5 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-blue)] neon-text-blue">
                Frequently asked
              </p>
            </div>
            <div className="grid gap-0 divide-y divide-[var(--line)] sm:grid-cols-2 sm:divide-x">
              {[
                { q: "What counts as an AI-built app?", a: "Any application where AI tools were used significantly in the development process — code generation, design, debugging, or any creative workflow.", accent: "var(--accent-green)" },
                { q: "How are matchups selected?", a: "Matchups are randomized. You'll see two entries side by side and pick the one you think is better. Each voting session includes 10 matchups.", accent: "var(--accent-blue)" },
                { q: "Can I vote for my own entry?", a: "No. The system automatically excludes your own submissions from your voting matchups to keep things fair.", accent: "var(--accent-cyan)" },
                { q: "When does the week reset?", a: "Each challenge week runs on its own schedule. Check the countdown timer on this page for the current deadline.", accent: "var(--accent-purple)" },
              ].map((item) => (
                <div key={item.q} className="p-5 transition hover:bg-white/5 group" style={{ borderLeft: `2px solid transparent` }}>
                  <p className="text-sm font-black tracking-tight text-[var(--text-primary)] transition group-hover:text-[var(--accent-green)]">{item.q}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* CTA Banner */}
      <ScrollReveal>
        <section className="brutal-card relative overflow-hidden bg-black p-6 text-white sm:p-8 neon-box scanlines blob-bg">
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
          }} />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-black sm:text-xl">
                <GlitchText text="Ready to compete?" className="text-white" />
              </p>
              <p className="mt-1 text-sm text-gray-300">Submit your AI-built app and let the community decide. Every vote shapes the leaderboard.</p>
            </div>
            <div className="flex gap-3">
              <MagneticButton>
                <Link href="/vote" className="brutal-btn brutal-btn-green shrink-0 hover-lift">
                  Start voting
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link href="/submit" className="brutal-btn brutal-btn-outline shrink-0 hover-lift">
                  Submit entry
                </Link>
              </MagneticButton>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
    </div>
  );
}
