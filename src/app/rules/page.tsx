export const dynamic = "force-dynamic";

export default function RulesPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
          Rules
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
          HubDev Arena MVP ruleset
        </h1>
      </div>

      <div className="grid gap-5">
        {[
          {
            title: "Builders get one active entry per week",
            body: "Every builder signs in, submits one live app URL, and includes one GIF or short MP4 demo asset. Entries stay out of voting until manually approved.",
          },
          {
            title: "Voters sign in before they vote",
            body: "Voting is tied to an authenticated HubDev account, with hashed IP and user-agent fingerprints kept as secondary abuse signals. The MVP caps voting at 30 votes per 10 minutes and 100 votes per day per signed-in voter and fingerprint.",
          },
          {
            title: "The leaderboard is weekly and live",
            body: "All approved entries start at 1200 ELO with K = 24. Every vote updates both entries. Rankings break ties by wins, then fewer losses, then earlier approval time.",
          },
          {
            title: "Every round is curated",
            body: "Each weekly round has a theme set by the HubDev team. Submissions are reviewed and approved before entering voting. Results are locked at the end of the voting window and published on the leaderboard.",
          },
        ].map((item) => (
          <section
            key={item.title}
            className="rounded-[2rem] border border-[var(--line)] bg-white/86 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]"
          >
            <h2 className="text-2xl font-black uppercase tracking-[-0.05em] text-[var(--ink)]">
              {item.title}
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--muted)]">{item.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
