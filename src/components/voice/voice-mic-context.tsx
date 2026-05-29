"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useMicrophoneInput } from "@/hooks/useMicrophoneInput";
import { useMicrophonePreview } from "@/hooks/useMicrophonePreview";

type VoiceMicContextValue = ReturnType<typeof useMicrophoneInput> &
  ReturnType<typeof useMicrophonePreview> & {
    setVoiceListening: (listening: boolean) => void;
    voiceListening: boolean;
  };

const VoiceMicContext = createContext<VoiceMicContextValue | null>(null);

export function VoiceMicProvider({ children }: { children: ReactNode }) {
  const micInput = useMicrophoneInput();
  const micPreview = useMicrophonePreview();
  const { stopPreview } = micPreview;
  const [voiceListening, setVoiceListening] = useState(false);

  useEffect(() => {
    if (voiceListening) {
      void stopPreview();
    }
  }, [stopPreview, voiceListening]);

  return (
    <VoiceMicContext.Provider
      value={{
        ...micInput,
        ...micPreview,
        setVoiceListening,
        voiceListening,
      }}
    >
      {children}
    </VoiceMicContext.Provider>
  );
}

export function useVoiceMic() {
  const context = useContext(VoiceMicContext);

  if (!context) {
    throw new Error("useVoiceMic must be used within VoiceMicProvider");
  }

  return context;
}
