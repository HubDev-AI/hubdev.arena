"use client";

export function AuroraBg({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Aurora layer 1 - green */}
      <div
        className="absolute -top-1/2 -left-1/4 h-[120%] w-[150%] opacity-[0.07]"
        style={{
          background: "radial-gradient(ellipse at 30% 50%, #00FF41 0%, transparent 60%)",
          animation: "aurora-drift-1 8s ease-in-out infinite alternate",
        }}
      />
      {/* Aurora layer 2 - blue */}
      <div
        className="absolute -top-1/4 -right-1/4 h-[120%] w-[150%] opacity-[0.05]"
        style={{
          background: "radial-gradient(ellipse at 70% 40%, #0033FF 0%, transparent 60%)",
          animation: "aurora-drift-2 10s ease-in-out infinite alternate",
        }}
      />
      {/* Aurora layer 3 - cyan accent */}
      <div
        className="absolute -bottom-1/4 left-1/4 h-[80%] w-[100%] opacity-[0.04]"
        style={{
          background: "radial-gradient(ellipse at 50% 80%, #00FFAA 0%, transparent 50%)",
          animation: "aurora-drift-3 12s ease-in-out infinite alternate",
        }}
      />
      {/* Subtle purple accent */}
      <div
        className="absolute top-1/4 right-0 h-[60%] w-[60%] opacity-[0.03]"
        style={{
          background: "radial-gradient(circle at 80% 30%, #8B5CF6 0%, transparent 50%)",
          animation: "aurora-drift-1 15s ease-in-out infinite alternate-reverse",
        }}
      />
    </div>
  );
}
