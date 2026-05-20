import type { Manuscript, Project } from "@prisma/client";
import type { StoryAnalysis } from "./schema";

export interface StoryAnalyzer {
  analyze(input: {
    project: Project;
    manuscripts: Manuscript[];
  }): Promise<StoryAnalysis>;
}
