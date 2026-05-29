import { LlmStoryAnalyzer } from "./llm-story-analyzer";
import { MockStoryAnalyzer } from "./mock-story-analyzer";
import type { StoryAnalyzer } from "./story-analyzer";

export type StoryAnalyzerScope = "chapter" | "project";

export function getStoryAnalyzer(
  scope: StoryAnalyzerScope = "chapter",
): StoryAnalyzer {
  const fallback = new MockStoryAnalyzer();

  if (!shouldUseOpenAI(scope)) {
    return fallback;
  }

  return new LlmStoryAnalyzer({ fallback });
}

export type { StoryAnalyzer } from "./story-analyzer";
export type { StoryAnalysis } from "./schema";
export { StoryAnalysisSchema } from "./schema";

function shouldUseOpenAI(scope: StoryAnalyzerScope) {
  const provider = process.env.STORY_ANALYZER_PROVIDER?.trim().toLowerCase();
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const llmScope =
    process.env.STORY_ANALYZER_LLM_SCOPE?.trim().toLowerCase() ?? "chapter";

  if (provider !== "openai" || !apiKey) {
    return false;
  }

  return llmScope === "all" || llmScope === scope;
}
