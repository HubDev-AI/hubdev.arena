import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rules — HubDev Arena",
  description: "How HubDev Arena works: submissions, voting, ELO scoring, and weekly rounds.",
};

export default function RulesPage() {
  return (
    <div className="page-bg page-bg-rules">
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="brutal-card relative overflow-hidden bg-[var(--ink)] p-6 text-white sm:p-8">
        <div className="absolute right-0 top-0 h-20 w-20 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
        <p className="brutal-label text-[var(--accent-green)]">Rules</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em]">
          HubDev Arena ruleset
        </h1>
      </div>

      <div className="stagger-children grid gap-5">
        {[
          {
            num: "01",
            accent: "text-[var(--accent-green)]",
            gradientFrom: "from-[var(--accent-green)]",
            title: "Builders get one active entry per week",
            body: "Every builder signs in, submits one live app URL, and includes one GIF or short MP4 demo asset. Entries stay out of voting until manually approved.",
          },
          {
            num: "02",
            accent: "text-[var(--accent-blue)]",
            gradientFrom: "from-[var(--accent-blue)]",
            title: "Voters sign in before they vote",
            body: "Voting is tied to an authenticated HubDev account. Each signed-in session gives you 10 head-to-head picks. Hashed IP and user-agent fingerprints are kept as secondary abuse signals.",
          },
          {
            num: "03",
            accent: "text-[var(--accent-yellow)]",
            gradientFrom: "from-[var(--accent-yellow)]",
            title: "The leaderboard is weekly and live",
            body: "All approved entries start at 1200 ELO with K = 24. Every vote updates both entries. Rankings break ties by wins, then fewer losses, then earlier approval time.",
          },
          {
            num: "04",
            accent: "text-[var(--accent-red)]",
            gradientFrom: "from-[var(--accent-red)]",
            title: "Every round is curated",
            body: "Each weekly round has a theme set by the HubDev team. Submissions are reviewed and approved before entering voting. Results are locked at the end of the voting window and published on the leaderboard.",
          },
        ].map((item) => (
          <section
            key={item.title}
            className="brutal-card overflow-hidden p-0"
          >
            <div className="flex items-start gap-5 p-6">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--ink)] font-mono text-lg font-bold ${item.accent}`}>
                {item.num}
              </span>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-[-0.05em] text-[var(--ink)]">
                  {item.title}
                </h2>
                <p className="mt-3 text-base leading-7 text-[var(--muted)]">{item.body}</p>
              </div>
            </div>
            <div className={`h-1 w-full bg-gradient-to-r ${item.gradientFrom} to-transparent`} />
          </section>
        ))}
      </div>
    </div>
    </div>
  );
}
