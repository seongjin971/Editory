"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getStoryAnalyzer } from "@/lib/analysis";
import { requireUser } from "@/lib/auth";
import { saveAnalysisResult } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import {
  CharacterConceptInputSchema,
  ManuscriptInputSchema,
  ProjectInputSchema,
  formDataToObject,
} from "@/lib/validation";
import { parseWordDocument } from "@/lib/word-import";

const IdSchema = z.string().min(1);
const SaveWritingManuscriptSchema = ManuscriptInputSchema.extend({
  manuscriptId: z.string().min(1).optional().nullable(),
});

export async function createProject(formData: FormData) {
  await requireUser();
  const data = ProjectInputSchema.parse(formDataToObject(formData));
  const project = await prisma.project.create({ data });

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}/write`);
}

export async function updateProject(formData: FormData) {
  await requireUser();
  const projectId = IdSchema.parse(formData.get("projectId"));
  const data = ProjectInputSchema.parse(formDataToObject(formData));

  await prisma.project.update({
    where: { id: projectId },
    data,
  });

  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/settings`);
}

export async function deleteProject(formData: FormData) {
  await requireUser();
  const projectId = IdSchema.parse(formData.get("projectId"));

  await prisma.project.delete({
    where: { id: projectId },
  });

  revalidatePath("/");
  redirect("/");
}

export async function createManuscript(formData: FormData) {
  await requireUser();
  const data = ManuscriptInputSchema.parse(formDataToObject(formData));
  const manuscript = await prisma.manuscript.create({ data });

  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath(`/projects/${data.projectId}/write`);
  redirect(`/projects/${data.projectId}/manuscripts/${manuscript.id}`);
}

export async function updateManuscript(formData: FormData) {
  await requireUser();
  const manuscriptId = IdSchema.parse(formData.get("manuscriptId"));
  const data = ManuscriptInputSchema.parse(formDataToObject(formData));

  await prisma.manuscript.update({
    where: { id: manuscriptId },
    data: {
      chapterNumber: data.chapterNumber,
      title: data.title,
      body: data.body,
      memo: data.memo,
    },
  });

  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath(`/projects/${data.projectId}/manuscripts/${manuscriptId}`);
  revalidatePath(`/projects/${data.projectId}/write`);
  redirect(`/projects/${data.projectId}/manuscripts/${manuscriptId}`);
}

export async function deleteManuscript(formData: FormData) {
  await requireUser();
  const projectId = IdSchema.parse(formData.get("projectId"));
  const manuscriptId = IdSchema.parse(formData.get("manuscriptId"));

  await prisma.manuscript.delete({
    where: { id: manuscriptId },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/write`);
  redirect(`/projects/${projectId}/manuscripts`);
}

export async function analyzeProject(formData: FormData) {
  await requireUser();
  const projectId = IdSchema.parse(formData.get("projectId"));
  await runProjectAnalysis(projectId);

  revalidateProject(projectId);
  redirect(`/projects/${projectId}/analysis`);
}

export async function analyzeChapter(formData: FormData) {
  await requireUser();
  const projectId = IdSchema.parse(formData.get("projectId"));
  const manuscriptId = IdSchema.parse(formData.get("manuscriptId"));
  await runChapterAnalysis(projectId, manuscriptId);

  revalidateProject(projectId);
  redirect(`/projects/${projectId}/analysis`);
}

export async function createBlankManuscript(projectIdInput: string) {
  await requireUser();
  const projectId = IdSchema.parse(projectIdInput);
  const latest = await prisma.manuscript.findFirst({
    where: { projectId },
    orderBy: { chapterNumber: "desc" },
  });
  const chapterNumber = (latest?.chapterNumber ?? 0) + 1;
  const manuscript = await prisma.manuscript.create({
    data: {
      projectId,
      chapterNumber,
      title: `${chapterNumber}장 초안`,
      body: "",
      memo: "",
    },
  });

  revalidateProject(projectId);
  revalidatePath(`/projects/${projectId}/manuscripts`);

  return { manuscriptId: manuscript.id };
}

export async function importWordManuscript(formData: FormData) {
  await requireUser();
  const projectId = IdSchema.parse(formData.get("projectId"));
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { error: "가져올 Word 문서를 선택해 주세요.", ok: false };
  }

  try {
    await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

    const imported = await parseWordDocument(file);
    const latest = await prisma.manuscript.findFirst({
      where: { projectId },
      orderBy: { chapterNumber: "desc" },
    });
    const chapterNumber = (latest?.chapterNumber ?? 0) + 1;
    const manuscript = await prisma.manuscript.create({
      data: {
        projectId,
        chapterNumber,
        title: imported.fileBaseName,
        body: imported.plainText,
        contentHtml: imported.contentHtml,
        contentJson: null,
        memo: `Word 문서에서 가져옴: ${file.name}`,
      },
    });

    revalidateProject(projectId);
    revalidatePath(`/projects/${projectId}/manuscripts`);

    return { manuscriptId: manuscript.id, ok: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Word 문서를 가져오는 중 오류가 발생했습니다.",
      ok: false,
    };
  }
}

export async function saveWritingManuscript(input: unknown) {
  await requireUser();
  const data = SaveWritingManuscriptSchema.parse(input);
  const manuscriptId = data.manuscriptId ?? null;

  if (manuscriptId) {
    await prisma.manuscript.findFirstOrThrow({
      where: {
        id: manuscriptId,
        projectId: data.projectId,
      },
    });
  }

  const manuscript = manuscriptId
    ? await prisma.manuscript.update({
        where: { id: manuscriptId },
        data: {
          chapterNumber: data.chapterNumber,
          title: data.title,
          body: data.body,
          contentHtml: data.contentHtml ?? null,
          contentJson: data.contentJson ?? null,
          editorSettings: data.editorSettings ?? null,
          memo: data.memo,
        },
      })
    : await prisma.manuscript.create({
        data: {
          projectId: data.projectId,
          chapterNumber: data.chapterNumber,
          title: data.title,
          body: data.body,
          contentHtml: data.contentHtml ?? null,
          contentJson: data.contentJson ?? null,
          editorSettings: data.editorSettings ?? null,
          memo: data.memo,
        },
      });

  revalidateProject(data.projectId);
  revalidatePath(`/projects/${data.projectId}/manuscripts`);

  return {
    manuscriptId: manuscript.id,
    updatedAt: manuscript.updatedAt.toISOString(),
  };
}

export async function deleteWritingManuscript(input: {
  projectId: string;
  manuscriptId: string;
}) {
  await requireUser();
  const projectId = IdSchema.parse(input.projectId);
  const manuscriptId = IdSchema.parse(input.manuscriptId);

  await prisma.manuscript.deleteMany({
    where: {
      id: manuscriptId,
      projectId,
    },
  });

  const next = await prisma.manuscript.findFirst({
    where: { projectId },
    orderBy: { chapterNumber: "asc" },
  });

  revalidateProject(projectId);
  revalidatePath(`/projects/${projectId}/manuscripts`);

  return { nextManuscriptId: next?.id ?? null };
}

export async function analyzeProjectFromWorkspace(projectIdInput: string) {
  await requireUser();
  const projectId = IdSchema.parse(projectIdInput);
  await runProjectAnalysis(projectId);
  revalidateProject(projectId);

  return { ok: true };
}

export async function analyzeChapterFromWorkspace(input: {
  projectId: string;
  manuscriptId: string;
}) {
  await requireUser();
  const projectId = IdSchema.parse(input.projectId);
  const manuscriptId = IdSchema.parse(input.manuscriptId);
  await runChapterAnalysis(projectId, manuscriptId);
  revalidateProject(projectId);

  return { ok: true };
}

export async function createCharacterConcept(projectIdInput: string) {
  await requireUser();
  const projectId = IdSchema.parse(projectIdInput);
  const count = await prisma.characterConcept.count({ where: { projectId } });
  const concept = await prisma.characterConcept.create({
    data: {
      projectId,
      name: count === 0 ? "새 인물" : `새 인물 ${count + 1}`,
      role: "unknown",
      status: "draft",
      tagsJson: JSON.stringify(["초안"]),
      logline: "이 인물이 이야기에서 맡는 한 줄 기능을 적어보세요.",
    },
  });

  revalidateProject(projectId);
  return { conceptId: concept.id };
}

export async function saveCharacterConcept(formData: FormData) {
  await requireUser();
  const data = CharacterConceptInputSchema.parse(formDataToObject(formData));
  const tagsJson = JSON.stringify(parseHashTags(data.tags));
  const payload = {
    name: data.name,
    role: data.role,
    status: data.status,
    tagsJson,
    logline: data.logline,
    description: data.description,
    appearance: data.appearance,
    voice: data.voice,
    goal: data.goal,
    motivation: data.motivation,
    desire: data.desire,
    fear: data.fear,
    wound: data.wound,
    secret: data.secret,
    strength: data.strength,
    weakness: data.weakness,
    conflict: data.conflict,
    relationshipNotes: data.relationshipNotes,
    backstory: data.backstory,
    arcStart: data.arcStart,
    arcTurningPoint: data.arcTurningPoint,
    arcEnd: data.arcEnd,
    plotFunction: data.plotFunction,
  };

  if (data.conceptId) {
    await prisma.characterConcept.update({
      where: { id: data.conceptId },
      data: payload,
    });
  } else {
    await prisma.characterConcept.create({
      data: {
        ...payload,
        projectId: data.projectId,
      },
    });
  }

  revalidateProject(data.projectId);
}

function parseHashTags(value: string) {
  const hashTags = Array.from(value.matchAll(/#([^#\s,]+)/g), (match) =>
    match[1].trim(),
  ).filter(Boolean);
  const tags =
    hashTags.length > 0
      ? hashTags
      : value
          .split(/[,\s]+/)
          .map((tag) => tag.replace(/^#/, "").trim())
          .filter(Boolean);

  return Array.from(new Set(tags));
}

export async function deleteCharacterConcept(input: {
  conceptId: string;
  projectId: string;
}) {
  await requireUser();
  const projectId = IdSchema.parse(input.projectId);
  const conceptId = IdSchema.parse(input.conceptId);

  await prisma.characterConcept.deleteMany({
    where: {
      id: conceptId,
      projectId,
    },
  });

  revalidateProject(projectId);
  return { ok: true };
}

export async function importAnalyzedCharacterAsConcept(input: {
  characterId: string;
  projectId: string;
}) {
  await requireUser();
  const projectId = IdSchema.parse(input.projectId);
  const characterId = IdSchema.parse(input.characterId);
  const character = await prisma.characterProfile.findFirstOrThrow({
    where: {
      id: characterId,
      projectId,
    },
  });

  const concept = await prisma.characterConcept.create({
    data: {
      projectId,
      name: character.name,
      role: character.role,
      status: "analysis_draft",
      tagsJson: JSON.stringify(["분석 기반", character.firstAppearanceChapter]),
      logline: character.arcSummary,
      desire: character.desire,
      weakness: character.weakness,
      conflict: character.conflict,
      relationshipNotes: character.relationshipNotes,
      arcStart: "원고 분석 결과를 기반으로 초안을 만들었습니다.",
      arcEnd: character.arcSummary,
      plotFunction: `${character.firstAppearanceChapter}에서 처음 포착된 ${character.importanceScore}점 비중의 인물입니다.`,
    },
  });

  revalidateProject(projectId);
  return { conceptId: concept.id };
}

async function runProjectAnalysis(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  });
  const manuscripts = await prisma.manuscript.findMany({
    where: { projectId },
    orderBy: { chapterNumber: "asc" },
  });
  const analyzer = getStoryAnalyzer("project");

  try {
    const analysis = await analyzer.analyze({ project, manuscripts });
    await saveAnalysisResult({
      projectId,
      scope: "project",
      analysis,
    });
  } catch (error) {
    await recordFailedAnalysis(projectId, null, "project", error);
    throw error;
  }
}

async function runChapterAnalysis(projectId: string, manuscriptId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  });
  const manuscript = await prisma.manuscript.findFirstOrThrow({
    where: {
      id: manuscriptId,
      projectId,
    },
  });
  const analyzer = getStoryAnalyzer("chapter");

  try {
    const analysis = await analyzer.analyze({
      project,
      manuscripts: [manuscript],
    });
    await saveAnalysisResult({
      projectId,
      manuscriptId,
      scope: "chapter",
      analysis,
    });
  } catch (error) {
    await recordFailedAnalysis(projectId, manuscriptId, "chapter", error);
    throw error;
  }
}

async function recordFailedAnalysis(
  projectId: string,
  manuscriptId: string | null,
  scope: "project" | "chapter",
  error: unknown,
) {
  await prisma.analysisRun.create({
    data: {
      projectId,
      manuscriptId,
      scope,
      status: "failed",
      summary: "분석 중 오류가 발생했습니다.",
      rawJson: JSON.stringify({
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    },
  });
}

function revalidateProject(projectId: string) {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/write`);
  revalidatePath(`/projects/${projectId}/analysis`);
  revalidatePath(`/projects/${projectId}/storyline`);
  revalidatePath(`/projects/${projectId}/timeline`);
  revalidatePath(`/projects/${projectId}/characters`);
  revalidatePath(`/projects/${projectId}/event-weights`);
  revalidatePath(`/projects/${projectId}/issues`);
}
