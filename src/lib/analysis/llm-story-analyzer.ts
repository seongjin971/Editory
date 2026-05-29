import type { Manuscript, Project } from "@prisma/client";
import { StoryAnalysisSchema, type StoryAnalysis } from "./schema";
import type { StoryAnalyzer } from "./story-analyzer";

export const STORY_ANALYSIS_PROMPT_TEMPLATE = `
You are Editory's story structure analysis engine. Return only JSON that satisfies StoryAnalysisSchema.

Analyze the project and manuscripts for:
- storyline beats
- chronological timeline
- event extraction and proportions
- character concepts and arcs
- plot-to-manuscript mapping
- consistency issues
- pacing and tension diagnosis

Use Korean for all reader-facing analysis fields.
Use only the provided manuscript text. Do not invent copyrighted worlds, famous characters, or unsupported facts.
Keep recommendations practical for a fiction writer. Preserve the author's voice; analyze structure instead of rewriting the manuscript.
If the manuscript is short, produce fewer high-confidence items instead of padding the result.
`;

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_MAX_INPUT_CHARS = 18_000;

type LlmStoryAnalyzerOptions = {
  apiKey?: string;
  fallback?: StoryAnalyzer;
  maxInputChars?: number;
  model?: string;
};

type OpenAiResponseContent = {
  refusal?: string;
  text?: string;
  type?: string;
};

type OpenAiResponseOutput = {
  content?: OpenAiResponseContent[];
  type?: string;
};

type OpenAiResponseJson = {
  error?: {
    message?: string;
  };
  output?: OpenAiResponseOutput[];
  output_text?: string;
};

const stringSchema = { type: "string" } as const;
const stringArraySchema = {
  type: "array",
  items: stringSchema,
} as const;

const storyAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "storyline",
    "timeline",
    "characters",
    "eventWeights",
    "consistencyIssues",
    "recommendations",
  ],
  properties: {
    summary: stringSchema,
    storyline: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "beatOrder",
          "title",
          "summary",
          "involvedCharacters",
          "conflict",
          "outcome",
          "sourceChapterTitle",
        ],
        properties: {
          beatOrder: { type: "integer", minimum: 1 },
          title: stringSchema,
          summary: stringSchema,
          involvedCharacters: stringArraySchema,
          conflict: stringSchema,
          outcome: stringSchema,
          sourceChapterTitle: stringSchema,
        },
      },
    },
    timeline: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "chronologicalOrder",
          "narrativeOrder",
          "estimatedTimeLabel",
          "title",
          "description",
          "characters",
          "location",
          "cause",
          "effect",
          "confidence",
        ],
        properties: {
          chronologicalOrder: { type: "integer", minimum: 1 },
          narrativeOrder: { type: "integer", minimum: 1 },
          estimatedTimeLabel: stringSchema,
          title: stringSchema,
          description: stringSchema,
          characters: stringArraySchema,
          location: stringSchema,
          cause: stringSchema,
          effect: stringSchema,
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
    characters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "role",
          "desire",
          "weakness",
          "conflict",
          "relationshipNotes",
          "arcSummary",
          "firstAppearanceChapter",
          "importanceScore",
        ],
        properties: {
          name: stringSchema,
          role: {
            type: "string",
            enum: [
              "protagonist",
              "antagonist",
              "ally",
              "mentor",
              "rival",
              "love_interest",
              "side_character",
              "unknown",
            ],
          },
          desire: stringSchema,
          weakness: stringSchema,
          conflict: stringSchema,
          relationshipNotes: stringSchema,
          arcSummary: stringSchema,
          firstAppearanceChapter: stringSchema,
          importanceScore: { type: "integer", minimum: 0, maximum: 100 },
        },
      },
    },
    eventWeights: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "category",
          "characterCount",
          "percentage",
          "diagnosis",
          "recommendation",
        ],
        properties: {
          category: {
            type: "string",
            enum: [
              "도입",
              "일상/설정",
              "발단",
              "갈등",
              "추적/탐색",
              "감정선",
              "반전",
              "클라이맥스",
              "결말/후킹",
            ],
          },
          characterCount: { type: "integer", minimum: 0 },
          percentage: { type: "number", minimum: 0, maximum: 100 },
          diagnosis: {
            type: "string",
            enum: ["부족", "적정", "과다"],
          },
          recommendation: stringSchema,
        },
      },
    },
    consistencyIssues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "severity",
          "type",
          "description",
          "relatedChapter",
          "suggestion",
        ],
        properties: {
          severity: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          type: {
            type: "string",
            enum: [
              "timeline_contradiction",
              "motivation_inconsistency",
              "unresolved_event",
              "repeated_information",
              "missing_causal_link",
              "sudden_relationship_change",
              "other",
            ],
          },
          description: stringSchema,
          relatedChapter: stringSchema,
          suggestion: stringSchema,
        },
      },
    },
    recommendations: stringArraySchema,
  },
} as const;

export class LlmStoryAnalyzer implements StoryAnalyzer {
  private readonly apiKey: string | undefined;

  private readonly fallback: StoryAnalyzer | undefined;

  private readonly maxInputChars: number;

  private readonly model: string;

  constructor(options: LlmStoryAnalyzerOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    this.fallback = options.fallback;
    this.model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
    this.maxInputChars =
      options.maxInputChars ??
      readPositiveInteger(
        process.env.OPENAI_ANALYSIS_MAX_CHARS,
        DEFAULT_MAX_INPUT_CHARS,
      );
  }

  async analyze(input: {
    project: Project;
    manuscripts: Manuscript[];
  }): Promise<StoryAnalysis> {
    if (!this.apiKey) {
      return this.fallbackOrThrow(input, new Error("OPENAI_API_KEY is not set."));
    }

    try {
      return await this.analyzeWithOpenAI(input);
    } catch (error) {
      return this.fallbackOrThrow(input, error);
    }
  }

  private async analyzeWithOpenAI(input: {
    project: Project;
    manuscripts: Manuscript[];
  }) {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        instructions: STORY_ANALYSIS_PROMPT_TEMPLATE,
        input: buildUserPrompt(input, this.maxInputChars),
        max_output_tokens: 8_000,
        text: {
          format: {
            type: "json_schema",
            name: "story_analysis",
            strict: true,
            schema: storyAnalysisJsonSchema,
          },
        },
      }),
    });

    const payload = (await response
      .json()
      .catch(() => ({}))) as OpenAiResponseJson;

    if (!response.ok) {
      throw new Error(
        payload.error?.message ??
          `OpenAI Responses API request failed with status ${response.status}.`,
      );
    }

    const outputText = extractResponseText(payload);
    const parsed = parseJsonText(outputText);
    const analysis = StoryAnalysisSchema.parse(parsed);
    return {
      ...analysis,
      metadata: {
        provider: "openai" as const,
        model: this.model,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private async fallbackOrThrow(
    input: {
      project: Project;
      manuscripts: Manuscript[];
    },
    error: unknown,
  ) {
    if (!this.fallback) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[LlmStoryAnalyzer] Falling back to mock analyzer: ${message}`);
    return this.fallback.analyze(input);
  }
}

function buildUserPrompt(
  input: {
    project: Project;
    manuscripts: Manuscript[];
  },
  maxInputChars: number,
) {
  const manuscripts = [...input.manuscripts].sort(
    (a, b) => a.chapterNumber - b.chapterNumber,
  );
  let remainingChars = maxInputChars;
  const manuscriptBlocks: string[] = [];

  for (const manuscript of manuscripts) {
    if (remainingChars <= 0) {
      break;
    }

    const body = manuscript.body.trim();
    const clippedBody = truncateText(body, remainingChars);
    remainingChars -= clippedBody.length;

    manuscriptBlocks.push([
      `Chapter ${manuscript.chapterNumber}: ${manuscript.title}`,
      manuscript.memo ? `Memo: ${manuscript.memo}` : "Memo: ",
      "Plain text manuscript:",
      clippedBody || "(empty)",
    ].join("\n"));
  }

  return [
    "Analyze this Editory fiction project and return JSON only.",
    "",
    "Project metadata:",
    `Title: ${input.project.title}`,
    `Description: ${input.project.description || ""}`,
    `Genre: ${input.project.genre || ""}`,
    `Target audience: ${input.project.targetAudience || ""}`,
    "",
    "Manuscripts:",
    manuscriptBlocks.join("\n\n---\n\n") || "(no manuscript text)",
    "",
    "Output rules:",
    "- All prose fields must be Korean.",
    "- Use the exact event weight categories defined in the schema.",
    "- Use the exact diagnosis values 부족, 적정, 과다.",
    "- If there is no clear consistency issue, return an empty consistencyIssues array.",
    "- Make confidence a number between 0 and 1.",
  ].join("\n");
}

function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxChars - 80))}\n\n[입력 길이 제한으로 이후 원고 일부가 생략되었습니다.]`;
}

function extractResponseText(payload: OpenAiResponseJson) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const refusals: string[] = [];
  const chunks: string[] = [];

  for (const outputItem of payload.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (typeof contentItem.refusal === "string") {
        refusals.push(contentItem.refusal);
      }

      if (typeof contentItem.text === "string") {
        chunks.push(contentItem.text);
      }
    }
  }

  if (refusals.length > 0) {
    throw new Error(`OpenAI refused the request: ${refusals.join(" ")}`);
  }

  const text = chunks.join("\n").trim();
  if (!text) {
    throw new Error("OpenAI response did not include text output.");
  }

  return text;
}

function parseJsonText(text: string) {
  const trimmed = text.trim();
  const fencedJson = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fencedJson?.[1] ?? trimmed);
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
