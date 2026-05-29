"use client";

import { useEffect, useRef } from "react";
import { smoothLevel } from "@/lib/voice/audioLevel";

type MicLevelBarProps = {
  active: boolean;
  /** Static level source (legacy). Prefer getLevel. */
  level?: number;
  /** Live level source polled every animation frame. */
  getLevel?: () => number;
  suffix: string;
};

export function MicLevelBar({ active, getLevel, level = 0, suffix }: MicLevelBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const displayRef = useRef(0);

  useEffect(() => {
    let raf = 0;

    const animate = () => {
      const target = active
        ? Math.min(1, Math.max(0, getLevel ? getLevel() : level))
        : 0;

      displayRef.current = smoothLevel(displayRef.current, target, 0.62, 0.12);
      const percent = Math.round(displayRef.current * 100);

      if (barRef.current) {
        barRef.current.style.width = `${percent}%`;
      }

      if (labelRef.current) {
        labelRef.current.textContent = active ? `${suffix} ${percent}%` : "대기";
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [active, getLevel, level, suffix]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-bold text-[var(--muted)]">
        <span>입력 레벨</span>
        <span ref={labelRef}>{active ? `${suffix} 0%` : "대기"}</span>
      </div>
      <div
        aria-hidden="true"
        className="h-2 overflow-hidden rounded-full bg-[var(--line)]"
      >
        <div
          ref={barRef}
          className="h-full rounded-full bg-[var(--accent)] will-change-[width]"
          style={{ width: "0%" }}
        />
      </div>
    </div>
  );
}
