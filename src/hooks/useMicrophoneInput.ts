"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureMicrophonePermission,
  queryMicrophonePermissionState,
} from "@/lib/voice/microphoneAccess";
import {
  loadMicrophoneSettings,
  saveMicrophoneSettings,
  type MicrophoneSettings,
} from "@/lib/voice/microphoneSettings";

export type MicrophoneDeviceOption = {
  deviceId: string;
  label: string;
};

export function useMicrophoneInput() {
  const [settings, setSettingsState] = useState<MicrophoneSettings>(() =>
    loadMicrophoneSettings(),
  );
  const [devices, setDevices] = useState<MicrophoneDeviceOption[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      setDevices([]);
      setDevicesLoading(false);
      return;
    }

    setDevicesLoading(true);

    try {
      const entries = await navigator.mediaDevices.enumerateDevices();
      const inputs = entries.filter((device) => device.kind === "audioinput");

      setDevices(
        inputs.map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `마이크 ${index + 1}`,
        })),
      );
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      return;
    }

    const handleDeviceChange = () => {
      void refreshDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
  }, [refreshDevices]);

  const updateSettings = useCallback((next: Partial<MicrophoneSettings>) => {
    setSettingsState((current) => {
      const merged = { ...current, ...next };
      saveMicrophoneSettings(merged);
      return merged;
    });
  }, []);

  const ensurePermissionAndRefresh = useCallback(async () => {
    await refreshDevices();
    return (await queryMicrophonePermissionState()) === "granted";
  }, [refreshDevices]);

  const requestPermissionAndRefresh = useCallback(async () => {
    const permission = await ensureMicrophonePermission();

    if (!permission.ok) {
      await refreshDevices();
      return false;
    }

    await refreshDevices();
    return true;
  }, [refreshDevices]);

  return {
    devices,
    devicesLoading,
    ensurePermissionAndRefresh,
    refreshDevices,
    requestPermissionAndRefresh,
    settings,
    updateSettings,
  };
}
