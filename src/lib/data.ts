import "server-only";

import { StoryAnalysisSchema, type StoryAnalysis } from "@/lib/analysis/schema";
import { parseStringList } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export async function getDashboardProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          manuscripts: true,
        },
      },
      analysisRuns: {
        where: { status: "completed" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          _count: {
            select: {
              characters: true,
              timelineEvents: true,
            },
          },
        },
      },
    },
  });

  return projects.map((project) => {
    const latestRun = project.analysisRuns[0];

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      genre: project.genre,
      targetAudience: project.targetAudience,
      updatedAt: project.updatedAt,
      manuscriptCount: project._count.manuscripts,
      characterCount: latestRun?._count.characters ?? 0,
      eventCount: latestRun?._count.timelineEvents ?? 0,
    };
  });
}

export async function getProject(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
  });
}

export async function getProjectOverview(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manuscripts: {
        orderBy: { chapterNumber: "asc" },
      },
      analysisRuns: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          _count: {
            select: {
              storyBeats: true,
              timelineEvents: true,
              characters: true,
              eventWeights: true,
              issues: true,
            },
          },
        },
      },
    },
  });
}

export async function getManuscripts(projectId: string) {
  return prisma.manuscript.findMany({
    where: { projectId },
    orderBy: { chapterNumber: "asc" },
  });
}

export async function getManuscript(projectId: string, manuscriptId: string) {
  return prisma.manuscript.findFirst({
    where: {
      id: manuscriptId,
      projectId,
    },
  });
}

export async function getCharacterConcepts(projectId: string) {
  return prisma.characterConcept.findMany({
    where: { projectId },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
  });
}

export async function getLatestAnalysis(projectId: string) {
  const run = await prisma.analysisRun.findFirst({
    where: {
      projectId,
      status: "completed",
    },
    orderBy: { createdAt: "desc" },
    include: {
      storyBeats: {
        orderBy: { beatOrder: "asc" },
      },
      timelineEvents: {
        orderBy: [{ chronologicalOrder: "asc" }, { narrativeOrder: "asc" }],
      },
      characters: {
        orderBy: { importanceScore: "desc" },
      },
      eventWeights: {
        orderBy: { id: "asc" },
      },
      issues: {
        orderBy: [{ severity: "desc" }, { id: "asc" }],
      },
    },
  });

  if (!run) {
    return null;
  }

  const raw = parseRawAnalysis(run.rawJson);
  const metadata = raw?.metadata ?? inferAnalysisMetadata(run);

  return {
    ...run,
    metadata,
    recommendations: raw?.recommendations ?? [],
    storyBeats: run.storyBeats.map((beat) => ({
      ...beat,
      involvedCharacters: parseStringList(beat.involvedCharactersJson),
    })),
    timelineEvents: run.timelineEvents.map((event) => ({
      ...event,
      characters: parseStringList(event.charactersJson),
    })),
  };
}

export async function saveAnalysisResult(input: {
  projectId: string;
  manuscriptId?: string | null;
  scope: "project" | "chapter";
  analysis: StoryAnalysis;
}) {
  const { projectId, manuscriptId, scope, analysis } = input;

  return prisma.$transaction(async (tx) => {
    const run = await tx.analysisRun.create({
      data: {
        projectId,
        manuscriptId: manuscriptId ?? null,
        scope,
        status: "completed",
        summary: analysis.summary,
        rawJson: JSON.stringify(analysis),
      },
    });

    if (analysis.storyline.length > 0) {
      await tx.storyBeat.createMany({
        data: analysis.storyline.map((beat) => ({
          projectId,
          analysisRunId: run.id,
          beatOrder: beat.beatOrder,
          title: beat.title,
          summary: beat.summary,
          involvedCharactersJson: JSON.stringify(beat.involvedCharacters),
          conflict: beat.conflict,
          outcome: beat.outcome,
          sourceChapterTitle: beat.sourceChapterTitle,
        })),
      });
    }

    if (analysis.timeline.length > 0) {
      await tx.timelineEvent.createMany({
        data: analysis.timeline.map((event) => ({
          projectId,
          analysisRunId: run.id,
          chronologicalOrder: event.chronologicalOrder,
          narrativeOrder: event.narrativeOrder,
          estimatedTimeLabel: event.estimatedTimeLabel,
          title: event.title,
          description: event.description,
          charactersJson: JSON.stringify(event.characters),
          location: event.location,
          cause: event.cause,
          effect: event.effect,
          confidence: event.confidence,
        })),
      });
    }

    if (analysis.characters.length > 0) {
      await tx.characterProfile.createMany({
        data: analysis.characters.map((character) => ({
          projectId,
          analysisRunId: run.id,
          name: character.name,
          role: character.role,
          desire: character.desire,
          weakness: character.weakness,
          conflict: character.conflict,
          relationshipNotes: character.relationshipNotes,
          arcSummary: character.arcSummary,
          firstAppearanceChapter: character.firstAppearanceChapter,
          importanceScore: character.importanceScore,
        })),
      });
    }

    if (analysis.eventWeights.length > 0) {
      await tx.eventWeight.createMany({
        data: analysis.eventWeights.map((weight) => ({
          projectId,
          analysisRunId: run.id,
          category: weight.category,
          characterCount: weight.characterCount,
          percentage: weight.percentage,
          diagnosis: weight.diagnosis,
          recommendation: weight.recommendation,
        })),
      });
    }

    if (analysis.consistencyIssues.length > 0) {
      await tx.consistencyIssue.createMany({
        data: analysis.consistencyIssues.map((issue) => ({
          projectId,
          analysisRunId: run.id,
          severity: issue.severity,
          type: issue.type,
          description: issue.description,
          relatedChapter: issue.relatedChapter,
          suggestion: issue.suggestion,
        })),
      });
    }

    return run;
  });
}

function parseRawAnalysis(rawJson: string) {
  try {
    return StoryAnalysisSchema.parse(JSON.parse(rawJson));
  } catch {
    return null;
  }
}

function inferAnalysisMetadata(run: {
  scope: string;
  summary: string;
}) {
  if (run.summary.includes("Mock")) {
    return {
      provider: "mock" as const,
      model: "local-mock",
    };
  }

  const provider = process.env.STORY_ANALYZER_PROVIDER?.trim().toLowerCase();
  const llmScope =
    process.env.STORY_ANALYZER_LLM_SCOPE?.trim().toLowerCase() ?? "chapter";

  if (provider === "openai" && (llmScope === "all" || llmScope === run.scope)) {
    return {
      provider: "openai" as const,
      model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    };
  }

  return {
    provider: "unknown" as const,
  };
}
