"use client";

import { ThemeSettingsSection } from "@/components/settings/theme-settings-section";
import { VoiceMicrophoneSettingsPanel } from "@/components/voice/VoiceMicrophoneSettingsPanel";
import { VoiceMicProvider } from "@/components/voice/voice-mic-context";

export function GlobalSettingsPanel() {
  return (
    <VoiceMicProvider>
      <div className="space-y-5">
        <ThemeSettingsSection />
        <VoiceMicrophoneSettingsPanel />
      </div>
    </VoiceMicProvider>
  );
}
