"use client";

export function GridBg({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none fixed inset-0 z-0 ${className}`} aria-hidden="true">
      {/* Static grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 65, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 65, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />
      {/* Smaller grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />
      {/* Animated horizontal scan line */}
      <div
        className="absolute left-0 right-0 h-[1px] opacity-[0.06]"
        style={{
          background: "linear-gradient(90deg, transparent, var(--accent-green), transparent)",
          animation: "scan-vertical 8s linear infinite",
        }}
      />
      <style>{`
        @keyframes scan-vertical {
          0% { top: -1px; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
