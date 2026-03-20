"use client";

import { type ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function InfoTooltip({
  children,
  tip,
  className = "",
}: {
  children: ReactNode;
  tip: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);

  function show() {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const above = rect.top > 100;
    setPos({
      left: rect.left + rect.width / 2,
      top: above ? rect.top - 8 : rect.bottom + 8,
      above,
    });
  }

  function hide() {
    setPos(null);
  }

  return (
    <span
      ref={ref}
      className={`info-tip ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
    >
      {children}
      {pos &&
        createPortal(
          <span
            className="info-tip-popup"
            style={{
              position: "fixed",
              zIndex: 9999,
              left: pos.left,
              top: pos.top,
              transform: pos.above
                ? "translate(-50%, -100%)"
                : "translate(-50%, 0)",
            }}
          >
            {tip}
          </span>,
          document.body,
        )}
    </span>
  );
}
