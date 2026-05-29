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

      // Chunk content to avoid Chrome's ~15s silent-pause bug on long single utterances.
      const chunks = splitTextForSpeech(content, 180);

      if (chunks.length === 0) {
        setError("읽을 원고가 없습니다.");
        return false;
      }

      const lang = options.lang ?? "ko-KR";
      const utteranceRate = clampRate(options.rate ?? rate);
      const lastIndex = chunks.length - 1;

      const utterances = chunks.map((chunk, index) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = lang;
        utterance.rate = utteranceRate;

        if (index === 0) {
          utterance.onstart = () => {
            setError(null);
            setSpeaking(true);
            setPaused(false);
          };
        }

        if (index === lastIndex) {
          utterance.onend = () => {
            setSpeaking(false);
            setPaused(false);
          };
        }

        utterance.onerror = (event) => {
          // 'canceled' / 'interrupted' fire on stop()/cancel(); not a user-facing error.
          const reason = event.error ?? "";
          if (reason === "canceled" || reason === "interrupted") {
            return;
          }

          setError("원고를 읽는 중 오류가 발생했습니다.");
          setSpeaking(false);
          setPaused(false);
        };

        return utterance;
      });

      window.speechSynthesis.cancel();
      // Chrome may carry a paused state across cancel/speak; resume() clears it harmlessly.
      window.speechSynthesis.resume();

      setError(null);
      setSpeaking(true);
      setPaused(false);

      for (const utterance of utterances) {
        window.speechSynthesis.speak(utterance);
      }

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

function splitTextForSpeech(text: string, maxLen: number) {
  const sentences = text
    .split(/(?<=[.!?。！？…])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return splitByLength(text, maxLen);
  }

  const chunks: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    if (sentence.length > maxLen) {
      if (buffer) {
        chunks.push(buffer);
        buffer = "";
      }
      chunks.push(...splitByLength(sentence, maxLen));
      continue;
    }

    const candidate = buffer ? `${buffer} ${sentence}` : sentence;
    if (candidate.length > maxLen) {
      chunks.push(buffer);
      buffer = sentence;
    } else {
      buffer = candidate;
    }
  }

  if (buffer) {
    chunks.push(buffer);
  }

  return chunks;
}

function splitByLength(value: string, maxLen: number) {
  const result: string[] = [];

  for (let cursor = 0; cursor < value.length; cursor += maxLen) {
    result.push(value.slice(cursor, cursor + maxLen));
  }

  return result;
}
