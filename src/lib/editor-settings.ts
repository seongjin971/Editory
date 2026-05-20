import { z } from "zod";

export const EditorSettingsSchema = z.object({
  fontFamily: z.enum(["system", "serif", "sans", "mono"]).default("system"),
  fontSize: z.number().min(14).max(22).default(17),
  lineHeight: z.number().min(1.4).max(2.2).default(1.8),
  paragraphSpacing: z.number().min(0).max(28).default(12),
  documentWidth: z.number().min(620).max(920).default(760),
  smartQuotes: z.boolean().default(true),
  typewriterMode: z.boolean().default(false),
  showCharacterCount: z.boolean().default(true),
});

export type EditorSettings = z.infer<typeof EditorSettingsSchema>;

export const defaultEditorSettings: EditorSettings = {
  fontFamily: "system",
  fontSize: 17,
  lineHeight: 1.8,
  paragraphSpacing: 12,
  documentWidth: 760,
  smartQuotes: true,
  typewriterMode: false,
  showCharacterCount: true,
};

export function parseEditorSettings(value?: string | null): EditorSettings {
  if (!value) {
    return defaultEditorSettings;
  }

  try {
    return EditorSettingsSchema.parse({
      ...defaultEditorSettings,
      ...JSON.parse(value),
    });
  } catch {
    return defaultEditorSettings;
  }
}
