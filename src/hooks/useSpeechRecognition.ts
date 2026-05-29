"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ensureMicrophonePermission,
  isSpeechRecognitionNetworkError,
} from "@/lib/voice/microphoneAccess";
import { decayLevelTarget, smoothLevel } from "@/lib/voice/audioLevel";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
  message?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  abort: () => void;
  start: () => void;
  stop: () => void;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type StartSpeechRecognitionOptions = {
  lang?: string;
};

const RESTART_DELAY_MS = 50;

function joinTranscriptSegment(current: string, next: string) {
  const chunk = next.trim();

  if (!chunk) {
    return current;
  }

  if (!current) {
    return chunk;
  }

  if (/[\s]$/.test(current) || /^[,.!?;:)]/.test(chunk)) {
    return `${current}${chunk}`.trim();
  }

  return `${current} ${chunk}`.trim();
}

function mergeInterimWithoutOverlap(current: string, interim: string) {
  const committed = current.trim();
  const pending = interim.trim();

  if (!pending) {
    return committed;
  }

  if (!committed) {
    return pending;
  }

  if (committed === pending || committed.endsWith(pending)) {
    return committed;
  }

  if (pending.startsWith(committed)) {
    return pending;
  }

  const maxOverlap = Math.min(committed.length, pending.length);

  for (let length = maxOverlap; length > 0; length -= 1) {
    if (committed.slice(-length) === pending.slice(0, length)) {
      return `${committed}${pending.slice(length)}`.trim();
    }
  }

  return joinTranscriptSegment(committed, pending);
}

export function useSpeechRecognition() {
  const supported = useSyncExternalStore(
    subscribeToBrowserCapability,
    getSpeechRecognitionSupport,
    () => false,
  );
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const stoppingRef = useRef(false);
  const errorOccurredRef = useRef(false);
  const processedFinalCountRef = useRef(0);
  const lastSpeechAtRef = useRef<number | null>(null);
  const listeningStartedAtRef = useRef<number | null>(null);
  const sessionStartedRef = useRef(false);
  const inputLevelRef = useRef(0);
  const inputLevelTargetRef = useRef(0);
  const levelRafRef = useRef<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInputLevel = useCallback(() => inputLevelRef.current, []);

  const stopLevelLoop = useCallback(() => {
    if (levelRafRef.current !== null) {
      cancelAnimationFrame(levelRafRef.current);
      levelRafRef.current = null;
    }

    inputLevelRef.current = 0;
    inputLevelTargetRef.current = 0;
  }, []);

  const bumpInputLevel = useCallback((amount: number) => {
    inputLevelTargetRef.current = Math.min(
      1,
      Math.max(inputLevelTargetRef.current, amount),
    );
  }, []);

  const startLevelLoop = useCallback(() => {
    if (levelRafRef.current !== null) {
      return;
    }

    const tick = () => {
      inputLevelTargetRef.current = decayLevelTarget(inputLevelTargetRef.current);
      inputLevelRef.current = smoothLevel(
        inputLevelRef.current,
        inputLevelTargetRef.current,
        0.58,
        0.14,
      );
      levelRafRef.current = requestAnimationFrame(tick);
    };

    levelRafRef.current = requestAnimationFrame(tick);
  }, []);

  const markSpeechActivity = useCallback((text: string) => {
    if (!text.trim()) {
      return;
    }

    lastSpeechAtRef.current = Date.now();
    bumpInputLevel(
      Math.min(1, 0.48 + Math.min(text.trim().length, 18) * 0.022),
    );
  }, [bumpInputLevel]);

  const stop = useCallback(() => {
    stoppingRef.current = true;

    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current?.abort();
    }

    setListening(false);
    stopLevelLoop();
    lastSpeechAtRef.current = null;
    listeningStartedAtRef.current = null;
  }, [stopLevelLoop]);

  const reset = useCallback(() => {
    transcriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  const start = useCallback(async (options: StartSpeechRecognitionOptions = {}) => {
    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition) {
      setError(
        "이 브라우저에서는 음성 입력을 지원하지 않습니다. 최신 Chrome 또는 Edge에서 다시 시도해 주세요.",
      );
      return false;
    }

    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setError("음성 입력은 HTTPS 또는 localhost 환경에서만 사용할 수 있습니다.");
      return false;
    }

    const permissionReady = await ensureMicrophonePermission();

    if (!permissionReady.ok) {
      setError(permissionReady.message ?? "마이크 권한을 확인하지 못했습니다.");
      return false;
    }

    const stale = recognitionRef.current;
    recognitionRef.current = null;

    if (stale) {
      try {
        stale.abort();
      } catch {
        // ignore: aborting an already-ended instance is harmless
      }
    }

    stoppingRef.current = false;
    errorOccurredRef.current = false;
    processedFinalCountRef.current = 0;
    sessionStartedRef.current = false;
    transcriptRef.current = "";
    interimTranscriptRef.current = "";
    lastSpeechAtRef.current = null;

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.lang ?? "ko-KR";
    recognition.maxAlternatives = 1;

    setError(null);
    setTranscript("");
    setInterimTranscript("");
    stopLevelLoop();

    recognition.onstart = () => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      sessionStartedRef.current = true;
      processedFinalCountRef.current = 0;
      listeningStartedAtRef.current = Date.now();
      lastSpeechAtRef.current = Date.now();
      setListening(true);
      setError(null);
      startLevelLoop();
    };

    recognition.onsoundstart = () => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      bumpInputLevel(0.34 + Math.random() * 0.14);
    };

    recognition.onspeechstart = () => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      bumpInputLevel(0.58 + Math.random() * 0.2);
    };

    recognition.onsoundend = () => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      inputLevelTargetRef.current *= 0.35;
    };

    recognition.onspeechend = () => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      inputLevelTargetRef.current = Math.min(inputLevelTargetRef.current, 0.1);
    };

    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];

        if (!result.isFinal || index < processedFinalCountRef.current) {
          continue;
        }

        const chunk = (result[0]?.transcript ?? "").trim();

        if (chunk) {
          transcriptRef.current = joinTranscriptSegment(transcriptRef.current, chunk);
          setTranscript(transcriptRef.current);
          markSpeechActivity(chunk);
        }

        processedFinalCountRef.current = index + 1;
      }

      let sessionInterim = "";

      for (
        let index = processedFinalCountRef.current;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];

        if (!result.isFinal) {
          sessionInterim += result[0]?.transcript ?? "";
        }
      }

      interimTranscriptRef.current = sessionInterim.trim();

      if (!stoppingRef.current) {
        setInterimTranscript(interimTranscriptRef.current);
      } else {
        setInterimTranscript("");
      }

      if (sessionInterim.trim()) {
        markSpeechActivity(sessionInterim);
      }
    };

    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      errorOccurredRef.current = true;
      setError(mapRecognitionError(event));
      setListening(false);
      stopLevelLoop();

      if (isSpeechRecognitionNetworkError(event.error)) {
        recognitionRef.current = null;
        stoppingRef.current = false;
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      // Drop interim on segment boundaries. Committing it here duplicates text once
      // Chrome finalizes the same phrase in the next session.
      if (stoppingRef.current && interimTranscriptRef.current.trim()) {
        const merged = mergeInterimWithoutOverlap(
          transcriptRef.current,
          interimTranscriptRef.current,
        );

        if (merged !== transcriptRef.current) {
          transcriptRef.current = merged;
          setTranscript(merged);
        }
      }

      interimTranscriptRef.current = "";
      setInterimTranscript("");
      processedFinalCountRef.current = 0;

      if (!sessionStartedRef.current && !stoppingRef.current) {
        errorOccurredRef.current = true;
        setError(mapImmediateEndError());
        setListening(false);
        stopLevelLoop();
        recognitionRef.current = null;
        stoppingRef.current = false;
        errorOccurredRef.current = false;
        lastSpeechAtRef.current = null;
        listeningStartedAtRef.current = null;
        return;
      }

      if (stoppingRef.current || errorOccurredRef.current) {
        setListening(false);
        stopLevelLoop();
        recognitionRef.current = null;
        stoppingRef.current = false;
        errorOccurredRef.current = false;
        lastSpeechAtRef.current = null;
        listeningStartedAtRef.current = null;
        return;
      }

      window.setTimeout(() => {
        if (
          recognitionRef.current !== recognition ||
          stoppingRef.current ||
          errorOccurredRef.current
        ) {
          return;
        }

        try {
          recognition.start();
        } catch {
          window.setTimeout(() => {
            if (
              recognitionRef.current !== recognition ||
              stoppingRef.current ||
              errorOccurredRef.current
            ) {
              return;
            }

            try {
              recognition.start();
            } catch {
              errorOccurredRef.current = true;
              setError(
                "음성 인식을 다시 시작하지 못했습니다. 중지 후 Chrome 또는 Edge에서 다시 시도해 주세요.",
              );
              setListening(false);
              stopLevelLoop();
              recognitionRef.current = null;
              stoppingRef.current = false;
              errorOccurredRef.current = false;
              lastSpeechAtRef.current = null;
              listeningStartedAtRef.current = null;
            }
          }, RESTART_DELAY_MS);
        }
      }, RESTART_DELAY_MS);
    };

    try {
      recognition.start();
      setListening(true);
      return true;
    } catch {
      setError("음성 입력을 시작하지 못했습니다. 브라우저를 새로고침한 뒤 다시 시도해 주세요.");
      setListening(false);
      recognitionRef.current = null;
      return false;
    }
  }, [bumpInputLevel, markSpeechActivity, startLevelLoop, stopLevelLoop]);

  useEffect(() => {
    return () => {
      stopLevelLoop();
      recognitionRef.current?.abort();
    };
  }, [stopLevelLoop]);

  return {
    error,
    getInputLevel,
    interimTranscript,
    listening,
    reset,
    start,
    stop,
    supported,
    transcript,
  };
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function getSpeechRecognitionSupport() {
  return getSpeechRecognitionConstructor() !== null;
}

function subscribeToBrowserCapability(onStoreChange: () => void) {
  const timer = window.setTimeout(onStoreChange, 0);

  return () => window.clearTimeout(timer);
}

function mapImmediateEndError() {
  return "음성 인식이 바로 종료되었습니다. 마이크 테스트를 중지한 뒤 잠시 기다리거나, Chrome/Edge에서 http://127.0.0.1:3000 을 직접 열어 주세요.";
}

function mapRecognitionError(event: SpeechRecognitionErrorEventLike) {
  if (event.error === "not-allowed" || event.error === "service-not-allowed") {
    return "마이크 권한이 거부되었습니다. 주소창의 권한 설정에서 마이크를 허용해 주세요.";
  }

  if (event.error === "no-speech") {
    return "인식된 음성이 없습니다. 조금 더 가까이 말한 뒤 다시 시도해 주세요.";
  }

  if (event.error === "audio-capture") {
    return "마이크 입력을 가져오지 못했습니다. 다른 앱이 마이크를 사용 중인지 확인해 주세요.";
  }

  if (event.error === "network") {
    return "브라우저 음성 인식 서비스에 연결하지 못했습니다. Cursor 내장 브라우저에서는 동작하지 않을 수 있습니다. Chrome 또는 Edge에서 http://127.0.0.1:3000 을 직접 열어 주세요.";
  }

  if (event.error === "language-not-supported") {
    return "현재 브라우저가 한국어 음성 인식을 지원하지 않습니다.";
  }

  if (event.error === "aborted") {
    return "음성 입력이 중지되었습니다.";
  }

  return event.message || "음성 입력 중 오류가 발생했습니다.";
}
