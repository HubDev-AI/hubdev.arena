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
        className={`relative overflow-hidden bg-gradient-to-br from-[#050810] to-[#0A1020] ${className}`}
      >
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: "linear-gradient(rgba(0,255,65,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.12) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }} />
        {/* Ambient gradient orbs */}
        <div className="absolute -top-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-[var(--accent-green)] opacity-[0.04] blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-[var(--accent-blue)] opacity-[0.03] blur-3xl" />
        {/* Shimmer sweep */}
        <div className="absolute inset-0 holo-shimmer" />
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[var(--accent-green)] via-[var(--accent-cyan)] to-transparent" style={{ boxShadow: "0 0 8px rgba(0, 255, 65, 0.3)" }} />
        {/* Content */}
        <div className="relative flex h-full min-h-[12rem] flex-col justify-end p-5">
          <p className="max-w-[14ch] text-2xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-3xl" style={{ textShadow: "0 2px 15px rgba(0,0,0,0.7)" }}>
            {title}
          </p>
          <div className="mt-2 h-[1px] w-16 bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-cyan)] to-transparent" />
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
