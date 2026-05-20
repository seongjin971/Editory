import { MockStoryAnalyzer } from "./mock-story-analyzer";
import type { StoryAnalyzer } from "./story-analyzer";

export function getStoryAnalyzer(): StoryAnalyzer {
  return new MockStoryAnalyzer();
}

export type { StoryAnalyzer } from "./story-analyzer";
export type { StoryAnalysis } from "./schema";
export { StoryAnalysisSchema } from "./schema";
