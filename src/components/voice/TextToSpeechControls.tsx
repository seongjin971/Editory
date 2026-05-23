"use client";

import { Pause, Play, RotateCcw, Square } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

type ReadRange = "selection" | "chapter";

type TextToSpeechControlsProps = {
  getFullText: () => string;
  getSelectedText: () => string;
};

const rateLabels = [
  { label: "느리게", value: 0.85 },
  { label: "보통", value: 1 },
  { label: "빠르게", value: 1.2 },
];

export function TextToSpeechControls({
  getFullText,
  getSelectedText,
}: TextToSpeechControlsProps) {
  const {
    error,
    pause,
    paused,
    rate,
    resume,
    setRate,
    speak,
    speaking,
    stop,
    supported,
  } = useTextToSpeech();
  const [readRange, setReadRange] = useState<ReadRange>("selection");
  const [panelError, setPanelError] = useState<string | null>(null);
  const visibleError = panelError ?? error;

  function getReadableText() {
    if (readRange === "chapter") {
      return getFullText();
    }

    return getSelectedText() || getFullText();
  }

  function handleSpeak() {
    const text = getReadableText();

    if (!text.trim()) {
      setPanelError("읽을 원고가 없습니다.");
      return;
    }

    setPanelError(null);
    speak(text, { lang: "ko-KR", rate });
  }

  function handleResume() {
    if (paused) {
      resume();
      return;
    }

    handleSpeak();
  }

  return (
    <details
      className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3"
      open
    >
      <summary className="cursor-pointer select-none text-sm font-bold text-[var(--foreground)]">
        원고 읽어주기
      </summary>

      <div className="mt-3 space-y-3">
        {!supported ? (
          <p className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 text-sm text-[var(--muted)]">
            이 브라우저에서는 원고 읽어주기를 지원하지 않습니다.
          </p>
        ) : null}

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold text-[var(--muted)]">읽을 범위</legend>
          <div className="flex flex-wrap gap-2">
            <RangeButton
              active={readRange === "selection"}
              onClick={() => setReadRange("selection")}
            >
              현재 선택 영역
            </RangeButton>
            <RangeButton active={readRange === "chapter"} onClick={() => setReadRange("chapter")}>
              현재 챕터 전체
            </RangeButton>
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold text-[var(--muted)]">읽기 속도</legend>
          <div className="flex flex-wrap gap-2">
            {rateLabels.map((item) => (
              <RangeButton
                active={Math.abs(rate - item.value) < 0.05}
                key={item.label}
                onClick={() => setRate(item.value)}
              >
                {item.label}
              </RangeButton>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--accent)] px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!supported}
            onClick={handleSpeak}
            type="button"
          >
            <Play aria-hidden="true" className="h-4 w-4" />
            읽어주기
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!supported || !speaking || paused}
            onClick={pause}
            type="button"
          >
            <Pause aria-hidden="true" className="h-4 w-4" />
            일시정지
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!supported}
            onClick={handleResume}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            다시 재생
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!supported || (!speaking && !paused)}
            onClick={stop}
            type="button"
          >
            <Square aria-hidden="true" className="h-4 w-4" />
            정지
          </button>
        </div>

        <p className="text-sm text-[var(--muted)]" role="status" aria-live="polite">
          {speaking ? (paused ? "읽기가 일시정지되었습니다." : "원고를 읽고 있습니다.") : "대기 중입니다."}
        </p>

        {visibleError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {visibleError}
          </p>
        ) : null}
      </div>
    </details>
  );
}

function RangeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={
        active
          ? "rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-bold text-white"
          : "rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm font-semibold"
      }
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
