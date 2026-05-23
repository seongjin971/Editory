"use client";

import { Mic, MicOff, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cleanVoiceDraftText } from "@/lib/voice/cleanVoiceDraftText";

type VoiceDraftPanelProps = {
  disabled?: boolean;
  onInsert: (text: string) => void;
};

export function VoiceDraftPanel({ disabled = false, onInsert }: VoiceDraftPanelProps) {
  const {
    error,
    interimTranscript,
    listening,
    reset,
    start,
    stop,
    supported,
    transcript,
  } = useSpeechRecognition();
  const [cleanedText, setCleanedText] = useState("");
  const [panelError, setPanelError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const rawText = useMemo(
    () => [transcript, interimTranscript].filter(Boolean).join(" ").trim(),
    [interimTranscript, transcript],
  );
  const visibleError = panelError ?? error;

  async function handleStart() {
    setPanelError(null);
    setCleanedText("");
    setStarting(true);

    try {
      await start({ lang: "ko-KR" });
    } finally {
      setStarting(false);
    }
  }

  function handleClean() {
    const source = rawText.trim();

    if (!source) {
      setPanelError("정리할 음성 원문이 없습니다.");
      return;
    }

    setCleanedText(cleanVoiceDraftText(source));
    setPanelError(null);
  }

  function handleInsert() {
    const source = (cleanedText || rawText).trim();

    if (!source) {
      setPanelError("원고에 삽입할 문장이 없습니다.");
      return;
    }

    onInsert(source);
    reset();
    setCleanedText("");
    setPanelError(null);
  }

  function handleCancel() {
    stop();
    reset();
    setCleanedText("");
    setPanelError(null);
  }

  return (
    <details
      className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3"
      open
    >
      <summary className="cursor-pointer select-none text-sm font-bold text-[var(--foreground)]">
        음성 입력
      </summary>

      <div className="mt-3 space-y-3">
        {!supported ? (
          <p className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 text-sm text-[var(--muted)]">
            이 브라우저에서는 음성 입력을 지원하지 않습니다.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--accent)] px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!supported || disabled || listening || starting}
            onClick={handleStart}
            type="button"
          >
            <Mic aria-hidden="true" className="h-4 w-4" />
            {starting ? "권한 확인 중" : "음성 입력"}
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!listening}
            onClick={stop}
            type="button"
          >
            <MicOff aria-hidden="true" className="h-4 w-4" />
            중지
          </button>
          <span className="text-sm text-[var(--muted)]" role="status" aria-live="polite">
            {starting ? "마이크 권한을 확인하고 있습니다." : listening ? "인식 중입니다." : "대기 중입니다."}
          </span>
        </div>

        <label className="block text-xs font-bold text-[var(--muted)]" htmlFor="voice-raw">
          인식된 원문
        </label>
        <textarea
          className="field-textarea min-h-24 text-sm"
          id="voice-raw"
          readOnly
          value={rawText}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!rawText}
            onClick={handleClean}
            type="button"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            문장 정리
          </button>
          <button
            className="inline-flex h-9 items-center rounded-md bg-[var(--accent)] px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || (!rawText && !cleanedText)}
            onClick={handleInsert}
            type="button"
          >
            원고에 삽입
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-sm font-semibold"
            onClick={handleCancel}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            취소
          </button>
        </div>

        <label className="block text-xs font-bold text-[var(--muted)]" htmlFor="voice-cleaned">
          정리된 문장
        </label>
        <textarea
          className="field-textarea min-h-24 text-sm"
          id="voice-cleaned"
          onChange={(event) => setCleanedText(event.target.value)}
          value={cleanedText}
        />

        {visibleError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {visibleError}
          </p>
        ) : null}
      </div>
    </details>
  );
}
