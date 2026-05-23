"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

type SpeakOptions = {
  lang?: string;
  rate?: number;
};

export function useTextToSpeech() {
  const supported = useSyncExternalStore(
    subscribeToBrowserCapability,
    getTextToSpeechSupport,
    () => false,
  );
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRateState] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (!getTextToSpeechSupport()) {
      return;
    }

    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (!getTextToSpeechSupport() || !window.speechSynthesis.speaking) {
      return;
    }

    window.speechSynthesis.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (!getTextToSpeechSupport()) {
      return;
    }

    window.speechSynthesis.resume();
    setSpeaking(window.speechSynthesis.speaking);
    setPaused(false);
  }, []);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      const content = text.replace(/\s+/g, " ").trim();

      if (!getTextToSpeechSupport()) {
        setError("이 브라우저에서는 원고 읽어주기를 지원하지 않습니다.");
        return false;
      }

      if (!content) {
        setError("읽을 원고가 없습니다.");
        return false;
      }

      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = options.lang ?? "ko-KR";
      utterance.rate = clampRate(options.rate ?? rate);

      utterance.onstart = () => {
        setError(null);
        setSpeaking(true);
        setPaused(false);
      };
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
      };
      utterance.onerror = () => {
        setError("원고를 읽는 중 오류가 발생했습니다.");
        setSpeaking(false);
        setPaused(false);
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
      setPaused(false);
      setError(null);

      return true;
    },
    [rate],
  );

  const setRate = useCallback((nextRate: number) => {
    setRateState(clampRate(nextRate));
  }, []);

  useEffect(() => {
    return () => {
      if (getTextToSpeechSupport()) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
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
  };
}

function getTextToSpeechSupport() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function subscribeToBrowserCapability(onStoreChange: () => void) {
  const timer = window.setTimeout(onStoreChange, 0);

  return () => window.clearTimeout(timer);
}

function clampRate(value: number) {
  return Math.min(1.4, Math.max(0.75, value));
}
