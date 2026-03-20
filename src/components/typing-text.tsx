"use client";

import { useEffect, useState } from "react";

export function TypingText({
  phrases,
  className = "",
  typingSpeed = 60,
  deletingSpeed = 30,
  pauseDuration = 2000,
}: {
  phrases: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}) {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (phrases.length === 0) return;

    const target = phrases[currentPhrase % phrases.length] ?? "";
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && currentText === target) {
      // Pause at full text
      timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else if (isDeleting && currentText === "") {
      // Move to next phrase
      setIsDeleting(false);
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    } else if (isDeleting) {
      timeout = setTimeout(() => {
        setCurrentText((prev) => prev.slice(0, -1));
      }, deletingSpeed);
    } else {
      timeout = setTimeout(() => {
        setCurrentText(target.slice(0, currentText.length + 1));
      }, typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentPhrase, phrases, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {currentText}
      <span className="inline-block w-[2px] h-[1em] bg-[var(--accent-green)] ml-[2px] align-middle" style={{ animation: "blink-cursor 1s step-end infinite" }} />
    </span>
  );
}
