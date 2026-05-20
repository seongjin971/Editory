import type { Manuscript, Project } from "@prisma/client";
import type { StoryAnalysis } from "./schema";
import type { StoryAnalyzer } from "./story-analyzer";

export const STORY_ANALYSIS_PROMPT_TEMPLATE = `
You are a story structure analyst. Return only JSON that satisfies StoryAnalysisSchema.

Analyze the project and manuscripts for:
- storyline beats
- chronological timeline
- event extraction and proportions
- character concepts and arcs
- plot-to-manuscript mapping
- consistency issues
- pacing and tension diagnosis

Use Korean for all reader-facing analysis fields.
`;

export class LlmStoryAnalyzer implements StoryAnalyzer {
  async analyze(input: {
    project: Project;
    manuscripts: Manuscript[];
  }): Promise<StoryAnalysis> {
    void input;
    throw new Error(
      "LlmStoryAnalyzer is a placeholder. Wire an LLM provider here and validate the JSON with StoryAnalysisSchema.",
    );
  }
}
