"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { MicLevelBar } from "@/components/voice/MicLevelBar";
import { useVoiceMic } from "@/components/voice/voice-mic-context";

export function VoiceMicrophoneSettingsPanel() {
  const {
    devices,
    devicesLoading,
    ensurePermissionAndRefresh,
    getPreviewLevel,
    previewError,
    previewing,
    requestPermissionAndRefresh,
    settings,
    startPreview,
    stopPreview,
    updateSettings,
    voiceListening,
  } = useVoiceMic();

  useEffect(() => {
    void ensurePermissionAndRefresh();
  }, [ensurePermissionAndRefresh]);

  async function handleMicPreviewToggle() {
    if (previewing) {
      await stopPreview();
      return;
    }

    await startPreview(settings);
  }

  async function handleRefreshDevices() {
    await requestPermissionAndRefresh();
  }

  return (
    <section className="space-y-3 rounded-lg border border-[var(--line)] bg-white p-5">
      <div>
        <p className="text-sm font-semibold text-[#34413b]">음성 입력 · 마이크</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          장치 확인과 레벨 테스트는 여기서 합니다. 받아쓰기 중에는 Chrome/Edge가 Windows
          기본 마이크를 사용합니다.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--line)] bg-white px-2 text-xs font-semibold disabled:opacity-50"
          disabled={devicesLoading || voiceListening}
          onClick={() => void handleRefreshDevices()}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
          장치 새로고침
        </button>
        <button
          className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--line)] bg-white px-2 text-xs font-semibold disabled:opacity-50"
          disabled={voiceListening}
          onClick={() => void handleMicPreviewToggle()}
          type="button"
        >
          {previewing ? "테스트 중지" : "마이크 테스트"}
        </button>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-bold text-[var(--muted)]">입력 장치</span>
        <select
          className="field-input w-full text-sm"
          disabled={voiceListening || devicesLoading}
          onChange={(event) => updateSettings({ deviceId: event.target.value })}
          value={settings.deviceId}
        >
          <option value="">시스템 기본 마이크</option>
          {devices.map((device) => (
            <option key={device.deviceId || device.label} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <MicSettingToggle
          checked={settings.autoGainControl}
          disabled={voiceListening}
          label="자동 게인"
          onChange={(autoGainControl) => updateSettings({ autoGainControl })}
        />
        <MicSettingToggle
          checked={settings.noiseSuppression}
          disabled={voiceListening}
          label="노이즈 제거"
          onChange={(noiseSuppression) => updateSettings({ noiseSuppression })}
        />
      </div>

      <MicLevelBar active={previewing} getLevel={getPreviewLevel} suffix="테스트" />

      {previewError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {previewError}
        </p>
      ) : null}
    </section>
  );
}

function MicSettingToggle({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold">
      {label}
      <input
        checked={checked}
        className="h-4 w-4 accent-[var(--accent)]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}
