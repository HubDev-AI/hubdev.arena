"use client";

import { useId } from "react";

export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 3,
  className = "",
}: {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const gradientId = useId();
  const titleId = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ transform: "rotate(-90deg)" }}
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>Win rate: {Math.round(progress)}%</title>
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--line)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-green)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
