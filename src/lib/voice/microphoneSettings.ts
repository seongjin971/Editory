export type MicrophoneSettings = {
  autoGainControl: boolean;
  deviceId: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
};

export const DEFAULT_MICROPHONE_SETTINGS: MicrophoneSettings = {
  autoGainControl: true,
  deviceId: "",
  echoCancellation: true,
  noiseSuppression: true,
};

const STORAGE_KEY = "editory:voice-mic-settings";

export function loadMicrophoneSettings(): MicrophoneSettings {
  if (typeof window === "undefined") {
    return DEFAULT_MICROPHONE_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_MICROPHONE_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<MicrophoneSettings>;

    return {
      autoGainControl: parsed.autoGainControl ?? DEFAULT_MICROPHONE_SETTINGS.autoGainControl,
      deviceId: typeof parsed.deviceId === "string" ? parsed.deviceId : "",
      echoCancellation: parsed.echoCancellation ?? DEFAULT_MICROPHONE_SETTINGS.echoCancellation,
      noiseSuppression: parsed.noiseSuppression ?? DEFAULT_MICROPHONE_SETTINGS.noiseSuppression,
    };
  } catch {
    return DEFAULT_MICROPHONE_SETTINGS;
  }
}

export function saveMicrophoneSettings(settings: MicrophoneSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function buildAudioConstraints(settings: MicrophoneSettings): MediaStreamConstraints {
  const audio: MediaTrackConstraints = {
    autoGainControl: settings.autoGainControl,
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
  };

  if (settings.deviceId) {
    // `ideal` avoids hard failures when Chrome rotates pseudo device ids (`default`, `communications`).
    audio.deviceId = { ideal: settings.deviceId };
  }

  return { audio };
}
