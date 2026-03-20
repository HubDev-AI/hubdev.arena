/* eslint-disable @next/next/no-img-element -- demo assets are user-uploaded, not static; next/image requires known domains */
type EntryMediaProps = {
  assetPath: string;
  title: string;
  className?: string;
};

export function EntryMedia({ assetPath, title, className = "" }: EntryMediaProps) {
  if (!assetPath || assetPath.startsWith("mock://")) {
    return (
      <div
        className={`relative overflow-hidden bg-[var(--ink)] ${className}`}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div className="absolute left-0 top-0 h-full w-1.5 bg-[var(--accent-green)]" />
        <div className="relative flex h-full min-h-[12rem] flex-col justify-end p-5">
          <p className="max-w-[14ch] text-2xl font-black uppercase leading-[0.95] tracking-tight text-[var(--surface)] sm:text-3xl">
            {title}
          </p>
        </div>
      </div>
    );
  }

  if (assetPath.endsWith(".mp4")) {
    return (
      <video
        className={`h-full w-full object-cover ${className}`}
        autoPlay
        loop
        muted
        playsInline
        controls
        src={assetPath}
        aria-label={`${title} demo video`}
      />
    );
  }

  return (
    <img
      className={`h-full w-full object-cover ${className}`}
      src={assetPath}
      alt={`${title} demo asset`}
      loading="lazy"
    />
  );
}
