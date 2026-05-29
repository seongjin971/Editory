"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildAudioConstraints,
  type MicrophoneSettings,
} from "@/lib/voice/microphoneSettings";
import { measureRmsFromAnalyser } from "@/lib/voice/audioLevel";

export function useMicrophonePreview() {
  const levelRef = useRef(0);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const getPreviewLevel = useCallback(() => levelRef.current, []);

  const stopPreview = useCallback(async () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current = null;
    levelRef.current = 0;

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;

    if (audioContext) {
      try {
        await audioContext.close();
      } catch {
        // ignore: closing an already-closed context is harmless
      }
    }

    setPreviewing(false);
  }, []);

  const startPreview = useCallback(
    async (settings: MicrophoneSettings) => {
      await stopPreview();
      setPreviewError(null);

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setPreviewError("이 브라우저에서는 마이크 미리보기를 지원하지 않습니다.");
        return false;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia(buildAudioConstraints(settings));
        streamRef.current = stream;

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.35;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        setPreviewing(true);

        const tick = () => {
          const node = analyserRef.current;

          if (!node) {
            return;
          }

          levelRef.current = measureRmsFromAnalyser(node);
          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return true;
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";

        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setPreviewError("마이크 권한이 거부되었습니다.");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setPreviewError("사용 가능한 마이크를 찾지 못했습니다.");
        } else if (name === "OverconstrainedError") {
          setPreviewError("선택한 마이크를 사용할 수 없습니다. 다른 장치를 선택해 주세요.");
        } else {
          setPreviewError("마이크 테스트를 시작하지 못했습니다.");
        }

        await stopPreview();
        return false;
      }
    },
    [stopPreview],
  );

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  return {
    getPreviewLevel,
    previewError,
    previewing,
    startPreview,
    stopPreview,
  };
}
