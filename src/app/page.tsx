import type { Metadata } from "next";
import Link from "next/link";

import { Countdown } from "@/components/countdown";
import { EntryMedia } from "@/components/entry-media";
import { InfoTooltip } from "@/components/info-tooltip";
import { JsonLd } from "@/components/json-ld";
import { LeaderboardTable } from "@/components/leaderboard-table";
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
          <p className="mt-2 text-xl font-bold text-[var(--ink)]">
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
          <p className="mt-2 text-xl font-bold text-[var(--ink)]">No active challenge week exists yet.</p>
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
          {/* Hero card */}
          <div className="brutal-card relative overflow-hidden arena-hero-bg p-6 text-white sm:p-8">
            {/* Accent corner decoration */}
            <div className="absolute right-0 top-0 h-24 w-24 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
            }} />
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
              Weekly battles for AI-built apps
            </p>
            <div className="mt-4 max-w-3xl">
              <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
                HubDev <span className="text-[var(--accent-green)]">Arena</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
                Build with AI tools. Submit your entry. Fight for the top spot through head-to-head voting.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/vote" className="brutal-btn brutal-btn-green">
                Start Voting
              </Link>
              <Link href="/submit" className="brutal-btn brutal-btn-outline">
                {session ? "Submit your build" : "Sign in"}
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border-[2px] border-gray-700 bg-gray-900 p-4 border-t-[3px] border-t-[var(--accent-green)]">
                <InfoTooltip tip="Current phase of this week's competition: submissions → voting → completed.">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">
                    Status
                  </p>
                </InfoTooltip>
                <p className="mt-2 text-lg font-black uppercase tracking-tight text-[var(--accent-green)]">
                  {week.status.replaceAll("_", " ")}
                </p>
              </div>
              <div className="border-[2px] border-gray-700 bg-gray-900 p-4 border-t-[3px] border-t-[var(--accent-blue)]">
                <InfoTooltip tip="Number of approved submissions competing this week.">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">
                    Entrants
                  </p>
                </InfoTooltip>
                <p className="mt-2 text-lg font-black uppercase tracking-tight">
                  {leaderboard.length}
                </p>
              </div>
              <div className="border-[2px] border-gray-700 bg-gray-900 p-4 border-t-[3px] border-t-[var(--accent-yellow)]">
                <InfoTooltip tip="Total head-to-head matchup votes cast by all voters this week.">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">
                    Total votes
                  </p>
                </InfoTooltip>
                <p className="mt-2 text-lg font-black uppercase tracking-tight">
                  {Math.round(leaderboard.reduce((sum, r) => sum + r.wins + r.losses, 0) / 2)}
                </p>
              </div>
            </div>
          </div>

          {/* Right sidebar — stretches to match hero height */}
          <div className="flex flex-col gap-4">
            <Countdown
              targetIso={week.status === "voting_open" ? week.votingCloseAt : week.submissionCloseAt}
              label={week.status === "voting_open" ? "Voting closes in" : "Submission deadline"}
            />

            {/* Quick links — card grows to fill, links stay natural */}
            <div className="brutal-card flex flex-1 flex-col overflow-hidden p-0">
              <div className="bg-[var(--ink)] px-5 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">Quick links</p>
              </div>
              <div className="divide-y-[2px] divide-[var(--ink)]">
                {[
                  { href: "/vote", label: "Vote now", desc: "Pick winners in 10 matchups" },
                  { href: "/leaderboard", label: "Leaderboard", desc: "Live ELO rankings" },
                  { href: "/rules", label: "Rules", desc: "How the arena works" },
                  { href: "/submit", label: "Submit", desc: "Enter your AI-built app" },
                ].map((link) => (
                  <Link key={link.href} href={link.href} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-[var(--paper)] group">
                    <div>
                      <p className="text-sm font-bold text-[var(--ink)] group-hover:text-[var(--accent-blue)]">{link.label}</p>
                      <p className="text-xs text-[var(--muted)]">{link.desc}</p>
                    </div>
                    <span className="text-[var(--muted)] group-hover:text-[var(--accent-blue)] transition">&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Current theme — full width below grid */}
        <div className="brutal-card overflow-hidden bg-[var(--paper)] p-0">
          <div className="flex items-stretch">
            <div className="hidden w-2 shrink-0 bg-[var(--accent-green)] sm:block" />
            <div className="flex-1 p-5 sm:p-6">
              <p className="brutal-label">Current theme</p>
              <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-[var(--ink)] sm:text-3xl">
                {week.themeTitle}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                {week.themeDescription}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {leaderboard.length} entries competing &middot; {Math.round(leaderboard.reduce((sum, r) => sum + r.wins + r.losses, 0) / 2)} votes cast
              </p>
            </div>
            <div className="flex items-center px-4 sm:px-6">
              <Link href="/submit" className="brutal-btn brutal-btn-green whitespace-nowrap">
                Enter now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { num: "01", icon: "\u2192", title: "Build", desc: "Ship an AI-powered app during the week" },
          { num: "02", icon: "VS", title: "Battle", desc: "Entries face off in head-to-head matchups" },
          { num: "03", icon: "\u2605", title: "Win", desc: "Top ELO at the end of voting takes the crown" },
        ].map((step) => (
          <div key={step.num} className="brutal-card overflow-hidden p-0">
            <div className="bg-[var(--ink)] px-4 py-2">
              <span className="font-mono text-sm font-bold text-[var(--accent-green)]">{step.num}</span>
            </div>
            <div className="p-4">
              <p className="text-2xl font-black tracking-tight text-[var(--ink)]">{step.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{step.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-5">
        <div className="brutal-card flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
          <div>
            <p className="brutal-label">Featured entrants</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-[var(--ink)] sm:text-3xl">
              Current contenders
            </h2>
          </div>
          <Link href="/leaderboard" className="brutal-btn brutal-btn-outline text-[10px] px-3 py-2">
            Full board
          </Link>
        </div>

        <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredEntries.map((entry, idx) => (
            <article key={entry.entrySlug} className={`brutal-card overflow-hidden group ${idx === 0 ? "border-[var(--accent-yellow)]" : idx === 1 ? "border-t-4 border-t-gray-300" : "border-t-4 border-t-[#CD7F32]"}`}>
              <div className="img-zoom relative">
                <EntryMedia assetPath={entry.demoAssetUrl} title={entry.title} className="h-48" />
                <div className={`absolute left-0 top-3 border-r-[3px] border-y-[3px] border-[var(--ink)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink)] ${idx === 0 ? "bg-[var(--accent-yellow)]" : idx === 1 ? "bg-gray-300" : "bg-[#CD7F32]"}`}>
                  #{idx + 1}
                </div>
              </div>
              {/* Dark info bar: title + author + record */}
              <div className="border-t-[3px] border-[var(--ink)] bg-[var(--ink)] px-4 py-3">
                <Link
                  href={`/entry/${entry.entrySlug}`}
                  className="block text-lg font-black tracking-tight text-white transition group-hover:text-[var(--accent-green)]"
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
              <div className="flex items-center justify-between gap-2 border-t-[2px] border-[var(--ink)] px-4 py-3">
                <InfoTooltip tip="ELO rating from head-to-head votes. Starts at 1200; wins against higher-rated entries earn more points.">
                  <span className="brutal-badge brutal-badge-green">
                    ELO {entry.elo}
                  </span>
                </InfoTooltip>
                <div className="flex gap-2">
                  <a
                    href={safeHref(entry.liveUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="brutal-btn brutal-btn-green text-[10px] px-3 py-1.5"
                  >
                    Open
                  </a>
                  <Link
                    href={`/entry/${entry.entrySlug}`}
                    className="brutal-btn brutal-btn-outline text-[10px] px-3 py-1.5"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {pastWinners.length > 0 ? (
          <div className="brutal-card overflow-hidden divide-y-[2px] divide-[var(--ink)] p-0">
            <div className="bg-[var(--ink)] px-5 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
                Past winners
              </p>
            </div>
            {pastWinners.map((item) => (
              <div key={item.week.slug} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[var(--paper)]">
                <div>
                  <p className="text-base font-black tracking-tight text-[var(--ink)]">
                    {item.topEntry?.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{item.week.themeTitle}</p>
                </div>
                <span className="brutal-badge brutal-badge-green">
                  Winner
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Leaderboard preview */}
      <section aria-label="Weekly leaderboard">
        <LeaderboardTable rows={leaderboard.slice(0, 5)} />
      </section>

      {/* How ELO works */}
      <section className="brutal-card overflow-hidden p-0">
        <div className="bg-[var(--ink)] px-5 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
            How ELO rating works
          </p>
        </div>
        <div className="grid gap-0 divide-y-[2px] divide-[var(--ink)] sm:grid-cols-3 sm:divide-x-[2px] sm:divide-y-0">
          <div className="p-5">
            <p className="text-3xl font-black text-[var(--accent-green)]">1200</p>
            <p className="mt-1 text-sm font-bold text-[var(--ink)]">Starting rating</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Every new entry starts at 1200 ELO. Your rating reflects how your app performs against other competitors.</p>
          </div>
          <div className="p-5">
            <p className="text-3xl font-black text-[var(--accent-blue)]">+/-</p>
            <p className="mt-1 text-sm font-bold text-[var(--ink)]">Points per matchup</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Beat a higher-rated entry and gain more points. Lose to a lower-rated one and drop more. Upsets are rewarded.</p>
          </div>
          <div className="p-5">
            <p className="text-3xl font-black text-[var(--accent-yellow)]">K=32</p>
            <p className="mt-1 text-sm font-bold text-[var(--ink)]">Sensitivity factor</p>
            <p className="mt-2 text-sm text-[var(--muted)]">We use a K-factor of 32 so early matchups can move the leaderboard quickly and every vote matters.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <div className="brutal-card overflow-hidden p-0">
          <div className="bg-[var(--ink)] px-5 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-blue)]">
              Frequently asked
            </p>
          </div>
          <div className="grid gap-0 divide-y-[2px] divide-[var(--ink)] sm:grid-cols-2 sm:divide-x-[2px]">
            {[
              { q: "What counts as an AI-built app?", a: "Any application where AI tools were used significantly in the development process — code generation, design, debugging, or any creative workflow." },
              { q: "How are matchups selected?", a: "Matchups are randomized. You'll see two entries side by side and pick the one you think is better. Each voting session includes 10 matchups." },
              { q: "Can I vote for my own entry?", a: "No. The system automatically excludes your own submissions from your voting matchups to keep things fair." },
              { q: "When does the week reset?", a: "Each challenge week runs on its own schedule. Check the countdown timer on this page for the current deadline." },
            ].map((item) => (
              <div key={item.q} className="p-5">
                <p className="text-sm font-black tracking-tight text-[var(--ink)]">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="brutal-card relative overflow-hidden bg-[var(--ink)] p-6 text-white sm:p-8">
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
        }} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-black sm:text-xl">Ready to compete?</p>
            <p className="mt-1 text-sm text-gray-300">Submit your AI-built app and let the community decide. Every vote shapes the leaderboard.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/vote" className="brutal-btn brutal-btn-green shrink-0">
              Start voting
            </Link>
            <Link href="/submit" className="brutal-btn brutal-btn-outline shrink-0">
              Submit entry
            </Link>
          </div>
        </div>
      </section>
    </div>
    </div>
  );
}
