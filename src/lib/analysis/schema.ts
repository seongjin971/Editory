import { z } from "zod";

export const CharacterRoleSchema = z.enum([
  "protagonist",
  "antagonist",
  "ally",
  "mentor",
  "rival",
  "love_interest",
  "side_character",
  "unknown",
]);

export const EventCategorySchema = z.enum([
  "도입",
  "일상/설정",
  "발단",
  "갈등",
  "추적/탐색",
  "감정선",
  "반전",
  "클라이맥스",
  "결말/후킹",
]);

export const DiagnosisSchema = z.enum(["부족", "적정", "과다"]);
export const IssueSeveritySchema = z.enum(["low", "medium", "high"]);
export const AnalysisProviderSchema = z.enum(["mock", "openai", "unknown"]);

export const IssueTypeSchema = z.enum([
  "timeline_contradiction",
  "motivation_inconsistency",
  "unresolved_event",
  "repeated_information",
  "missing_causal_link",
  "sudden_relationship_change",
  "other",
]);

export const StoryAnalysisSchema = z.object({
  metadata: z
    .object({
      provider: AnalysisProviderSchema,
      model: z.string().optional(),
      generatedAt: z.string().optional(),
    })
    .optional(),
  summary: z.string(),
  storyline: z.array(
    z.object({
      beatOrder: z.number().int().positive(),
      title: z.string(),
      summary: z.string(),
      involvedCharacters: z.array(z.string()),
      conflict: z.string(),
      outcome: z.string(),
      sourceChapterTitle: z.string(),
    }),
  ),
  timeline: z.array(
    z.object({
      chronologicalOrder: z.number().int().positive(),
      narrativeOrder: z.number().int().positive(),
      estimatedTimeLabel: z.string(),
      title: z.string(),
      description: z.string(),
      characters: z.array(z.string()),
      location: z.string(),
      cause: z.string(),
      effect: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
  characters: z.array(
    z.object({
      name: z.string(),
      role: CharacterRoleSchema,
      desire: z.string(),
      weakness: z.string(),
      conflict: z.string(),
      relationshipNotes: z.string(),
      arcSummary: z.string(),
      firstAppearanceChapter: z.string(),
      importanceScore: z.number().int().min(0).max(100),
    }),
  ),
  eventWeights: z.array(
    z.object({
      category: EventCategorySchema,
      characterCount: z.number().int().min(0),
      percentage: z.number().min(0).max(100),
      diagnosis: DiagnosisSchema,
      recommendation: z.string(),
    }),
  ),
  consistencyIssues: z.array(
    z.object({
      severity: IssueSeveritySchema,
      type: IssueTypeSchema,
      description: z.string(),
      relatedChapter: z.string(),
      suggestion: z.string(),
    }),
  ),
  recommendations: z.array(z.string()),
});

export type StoryAnalysis = z.infer<typeof StoryAnalysisSchema>;
export type EventCategory = z.infer<typeof EventCategorySchema>;
