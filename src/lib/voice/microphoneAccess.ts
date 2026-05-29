const MIC_HANDOFF_DELAY_MS = 250;

export async function queryMicrophonePermissionState() {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unknown" as const;
  }

  try {
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });

    return status.state;
  } catch {
    return "unknown" as const;
  }
}

export async function ensureMicrophonePermission() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: true as const, openedMic: false };
  }

  const permissionState = await queryMicrophonePermissionState();

  if (permissionState === "granted") {
    return { ok: true as const, openedMic: false };
  }

  if (permissionState === "denied") {
    return {
      ok: false as const,
      openedMic: false,
      message: "마이크 권한이 거부되었습니다. 주소창의 권한 설정에서 마이크를 허용해 주세요.",
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    await delay(MIC_HANDOFF_DELAY_MS);

    return { ok: true as const, openedMic: true };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";

    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return {
        ok: false as const,
        openedMic: false,
        message: "마이크 권한이 거부되었습니다. 주소창의 권한 설정에서 마이크를 허용해 주세요.",
      };
    }

    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return {
        ok: false as const,
        openedMic: false,
        message: "사용 가능한 마이크를 찾지 못했습니다. 입력 장치를 확인해 주세요.",
      };
    }

    return {
      ok: false as const,
      openedMic: false,
      message: "마이크를 시작하지 못했습니다. 다른 앱이 마이크를 사용 중인지 확인해 주세요.",
    };
  }
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function isSpeechRecognitionNetworkError(errorCode: string | undefined) {
  return errorCode === "network";
}
