"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

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
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    stoppingRef.current = true;

    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current?.abort();
    }

    setListening(false);
  }, []);

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

    const permissionReady = await requestMicrophoneAccess();

    if (!permissionReady.ok) {
      setError(permissionReady.message ?? "마이크 권한을 확인하지 못했습니다.");
      return false;
    }

    recognitionRef.current?.abort();
    stoppingRef.current = false;
    transcriptRef.current = "";
    interimTranscriptRef.current = "";

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.lang ?? "ko-KR";
    recognition.maxAlternatives = 1;

    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setListening(true);

    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalText = `${finalText} ${text}`.trim();
        } else {
          interimText = `${interimText} ${text}`.trim();
        }
      }

      if (finalText) {
        transcriptRef.current = `${transcriptRef.current} ${finalText}`.trim();
        setTranscript(transcriptRef.current);
      }

      interimTranscriptRef.current = interimText;
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      setError(mapRecognitionError(event));
      setListening(false);
    };

    recognition.onend = () => {
      if (interimTranscriptRef.current) {
        transcriptRef.current =
          `${transcriptRef.current} ${interimTranscriptRef.current}`.trim();
        setTranscript(transcriptRef.current);
      }

      setListening(false);
      setInterimTranscript("");
      interimTranscriptRef.current = "";
      recognitionRef.current = null;
      stoppingRef.current = false;
    };

    try {
      recognition.start();
      return true;
    } catch {
      setError("음성 입력을 시작하지 못했습니다. 브라우저를 새로고침한 뒤 다시 시도해 주세요.");
      setListening(false);
      recognitionRef.current = null;
      return false;
    }
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    error,
    interimTranscript,
    listening,
    reset,
    start,
    stop,
    supported,
    transcript,
  };
}

async function requestMicrophoneAccess() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: true };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { ok: true };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";

    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return {
        ok: false,
        message: "마이크 권한이 거부되었습니다. 주소창의 권한 설정에서 마이크를 허용해 주세요.",
      };
    }

    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return {
        ok: false,
        message: "사용 가능한 마이크를 찾지 못했습니다. 입력 장치를 확인해 주세요.",
      };
    }

    return {
      ok: false,
      message: "마이크를 시작하지 못했습니다. 다른 앱이 마이크를 사용 중인지 확인해 주세요.",
    };
  }
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
    return "브라우저 음성 인식 서비스에 연결하지 못했습니다. Chrome 또는 Edge에서 네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  }

  if (event.error === "language-not-supported") {
    return "현재 브라우저가 한국어 음성 인식을 지원하지 않습니다.";
  }

  if (event.error === "aborted") {
    return "음성 입력이 중지되었습니다.";
  }

  return event.message || "음성 입력 중 오류가 발생했습니다.";
}
