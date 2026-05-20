import { z } from "zod";

export const ProjectInputSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(120),
  description: z.string().trim().max(1000).default(""),
  genre: z.string().trim().max(80).default(""),
  targetAudience: z.string().trim().max(120).default(""),
});

export const ManuscriptInputSchema = z.object({
  projectId: z.string().min(1),
  chapterNumber: z.coerce.number().int().min(1).max(999),
  title: z.string().trim().min(1, "챕터 제목을 입력해 주세요.").max(160),
  body: z.string().default(""),
  contentHtml: z.string().optional().nullable(),
  contentJson: z.string().optional().nullable(),
  editorSettings: z.string().optional().nullable(),
  memo: z.string().default(""),
});

export const CharacterConceptInputSchema = z.object({
  projectId: z.string().min(1),
  conceptId: z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().min(1).optional().nullable(),
  ),
  name: z.string().trim().min(1, "인물 이름을 입력해 주세요.").max(80),
  role: z.string().trim().max(40).default("unknown"),
  status: z.string().trim().max(40).default("draft"),
  tags: z.string().trim().max(500).default(""),
  logline: z.string().trim().max(300).default(""),
  description: z.string().trim().max(1200).default(""),
  appearance: z.string().trim().max(1200).default(""),
  voice: z.string().trim().max(1200).default(""),
  goal: z.string().trim().max(1200).default(""),
  motivation: z.string().trim().max(1200).default(""),
  desire: z.string().trim().max(1200).default(""),
  fear: z.string().trim().max(1200).default(""),
  wound: z.string().trim().max(1200).default(""),
  secret: z.string().trim().max(1200).default(""),
  strength: z.string().trim().max(1200).default(""),
  weakness: z.string().trim().max(1200).default(""),
  conflict: z.string().trim().max(1200).default(""),
  relationshipNotes: z.string().trim().max(2000).default(""),
  backstory: z.string().trim().max(2000).default(""),
  arcStart: z.string().trim().max(1200).default(""),
  arcTurningPoint: z.string().trim().max(1200).default(""),
  arcEnd: z.string().trim().max(1200).default(""),
  plotFunction: z.string().trim().max(1200).default(""),
});

export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
