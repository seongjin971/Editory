import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { LlmStoryAnalyzer } from "../src/lib/analysis/llm-story-analyzer";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error(
      "OPENAI_API_KEY가 없습니다. .env에 OPENAI_API_KEY를 설정한 뒤 다시 실행하세요.",
    );
  }

  const projectId = process.argv[2];
  const manuscriptId = process.argv[3];

  const project = projectId
    ? await prisma.project.findUnique({ where: { id: projectId } })
    : await prisma.project.findFirst({ orderBy: { updatedAt: "desc" } });

  if (!project) {
    throw new Error("분석할 프로젝트를 찾지 못했습니다.");
  }

  const manuscripts = manuscriptId
    ? await prisma.manuscript.findMany({
        where: { id: manuscriptId, projectId: project.id },
        orderBy: { chapterNumber: "asc" },
      })
    : await prisma.manuscript.findMany({
        where: { projectId: project.id },
        orderBy: { chapterNumber: "asc" },
        take: 1,
      });

  if (manuscripts.length === 0) {
    throw new Error("분석할 원고 챕터를 찾지 못했습니다.");
  }

  const analyzer = new LlmStoryAnalyzer({
    maxInputChars: readPositiveInteger(process.env.OPENAI_SMOKE_MAX_CHARS, 6000),
  });

  const startedAt = Date.now();
  const analysis = await analyzer.analyze({ project, manuscripts });
  const elapsedMs = Date.now() - startedAt;

  console.log(
    JSON.stringify(
      {
        ok: true,
        provider: "openai",
        model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
        elapsedMs,
        project: {
          id: project.id,
          title: project.title,
        },
        manuscripts: manuscripts.map((manuscript) => ({
          id: manuscript.id,
          title: manuscript.title,
          characters: manuscript.body.length,
        })),
        result: {
          summaryLength: analysis.summary.length,
          storyline: analysis.storyline.length,
          timeline: analysis.timeline.length,
          characters: analysis.characters.length,
          eventWeights: analysis.eventWeights.length,
          consistencyIssues: analysis.consistencyIssues.length,
          recommendations: analysis.recommendations.length,
        },
      },
      null,
      2,
    ),
  );
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
