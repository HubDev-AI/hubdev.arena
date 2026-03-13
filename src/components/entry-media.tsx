/* eslint-disable @next/next/no-img-element */
type EntryMediaProps = {
  assetPath: string;
  title: string;
  className?: string;
};

export function EntryMedia({ assetPath, title, className = "" }: EntryMediaProps) {
  if (assetPath.startsWith("mock://")) {
    return (
      <div
        className={`relative overflow-hidden border-[var(--ink)] bg-[var(--ink)] ${className}`}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        {/* Accent stripe */}
        <div className="absolute left-0 top-0 h-full w-1.5 bg-[var(--accent-green)]" />
        <div className="relative flex h-full min-h-[12rem] flex-col justify-between p-5">
          <span className="w-fit border-[2px] border-gray-600 bg-gray-800 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.26em] text-gray-400">
            Demo asset placeholder
          </span>
          <div>
            <p className="max-w-[12ch] text-2xl font-black uppercase leading-[0.95] tracking-tight text-[var(--surface)] sm:text-3xl">
              {title}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-gray-500">
              GIF / MP4 preview in mock mode
            </p>
          </div>
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
        src={assetPath}
      />
    );
  }

  return (
    <img
      className={`h-full w-full object-cover ${className}`}
      src={assetPath}
      alt={`${title} demo asset`}
    />
  );
}
