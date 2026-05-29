"use client";

import { Mic, MicOff, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useVoiceMic } from "@/components/voice/voice-mic-context";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cleanVoiceDraftText } from "@/lib/voice/cleanVoiceDraftText";
import { delay } from "@/lib/voice/microphoneAccess";
import { MicLevelBar } from "@/components/voice/MicLevelBar";

type VoiceDraftPanelProps = {
  disabled?: boolean;
  onInsert: (text: string) => void;
};

export function VoiceDraftPanel({ disabled = false, onInsert }: VoiceDraftPanelProps) {
  const { setVoiceListening, stopPreview } = useVoiceMic();
  const {
    error,
    getInputLevel,
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

  useEffect(() => {
    setVoiceListening(listening);
  }, [listening, setVoiceListening]);

  async function handleStart() {
    setPanelError(null);
    setCleanedText("");
    setStarting(true);

    try {
      await stopPreview();
      await delay(250);
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
    void stopPreview();
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
            onClick={() => void handleStart()}
            type="button"
          >
            <Mic aria-hidden="true" className="h-4 w-4" />
            {starting ? "시작 중..." : listening ? "인식 중" : "음성 입력"}
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
            {starting
              ? "마이크를 준비하고 있습니다."
              : listening
                ? "인식 중입니다. 말을 멈추면 중지 버튼으로 종료하세요."
                : "대기 중입니다."}
          </span>
        </div>

        {listening ? (
          <MicLevelBar active getLevel={getInputLevel} suffix="인식" />
        ) : null}

        {visibleError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {visibleError}
          </p>
        ) : null}

        <p className="text-xs leading-5 text-[var(--muted)]">
          마이크 장치·테스트는{" "}
          <Link className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline" href="/settings">
            전역 설정
          </Link>
          에서 확인하세요.
        </p>

        <label className="block text-xs font-bold text-[var(--muted)]" htmlFor="voice-raw">
          인식된 원문
          {rawText ? (
            <span className="ml-2 font-semibold text-[var(--accent)]">
              {rawText.length.toLocaleString()}자
            </span>
          ) : null}
        </label>
        <textarea
          className="field-textarea max-h-64 min-h-24 overflow-y-auto text-sm"
          id="voice-raw"
          readOnly
          value={rawText}
        />
        <p className="text-xs text-[var(--muted)]">
          Chrome 받아쓰기는 약 1분 단위로 구간을 나누며 자동 이어집니다. 입력이 멈추면{" "}
          <strong>중지</strong> 후 <strong>원고에 삽입</strong>하고 다시 시작하세요.
        </p>

        <details className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-2 text-xs text-[var(--muted)]">
          <summary className="cursor-pointer select-none font-bold">
            받아쓰기 명령어 (말로 부호·줄바꿈 넣기)
          </summary>
          <ul className="mt-2 space-y-1 leading-5">
            <li>
              <code>&quot;마침표&quot;</code> / <code>&quot;온점&quot;</code> → .
            </li>
            <li>
              <code>&quot;쉼표&quot;</code> / <code>&quot;콤마&quot;</code> → ,
            </li>
            <li>
              <code>&quot;물음표&quot;</code> → ? &nbsp; <code>&quot;느낌표&quot;</code> → !
            </li>
            <li>
              <code>&quot;줄바꿈&quot;</code> / <code>&quot;엔터&quot;</code> → 줄 바꿈
            </li>
            <li>
              <code>&quot;새 문단&quot;</code> / <code>&quot;단락 나눔&quot;</code> → 문단 분리
            </li>
            <li className="pt-1 text-[var(--muted)]">
              <strong>문장 정리</strong>를 누르면 위 명령어가 실제 부호·줄바꿈으로 바뀌고, 접속사(하지만/그러나/따라서 등) 앞에 자동으로 마침표가 들어갑니다.
            </li>
          </ul>
        </details>

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
      </div>
    </details>
  );
}
