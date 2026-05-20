import { notFound } from "next/navigation";
import { WritingWorkspace } from "@/components/writing-workspace";
import { getLatestAnalysis, getManuscripts, getProject } from "@/lib/data";

export default async function WritePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ manuscriptId?: string }>;
}) {
  const { projectId } = await params;
  const { manuscriptId } = await searchParams;
  const [project, manuscripts, latestAnalysis] = await Promise.all([
    getProject(projectId),
    getManuscripts(projectId),
    getLatestAnalysis(projectId),
  ]);

  if (!project) {
    notFound();
  }

  const nextChapterNumber =
    manuscripts.reduce(
      (maxChapter, manuscript) => Math.max(maxChapter, manuscript.chapterNumber),
      0,
    ) + 1;
  const workspaceKey = [
    project.id,
    manuscriptId ?? "",
    manuscripts.length,
    ...manuscripts.map((manuscript) => manuscript.updatedAt.getTime()),
  ].join(":");

  return (
    <WritingWorkspace
      initialManuscriptId={manuscriptId ?? null}
      key={workspaceKey}
      manuscripts={manuscripts.map((manuscript) => ({
        id: manuscript.id,
        chapterNumber: manuscript.chapterNumber,
        title: manuscript.title,
        body: manuscript.body,
        contentHtml: manuscript.contentHtml,
        contentJson: manuscript.contentJson,
        editorSettings: manuscript.editorSettings,
        memo: manuscript.memo,
        updatedAt: manuscript.updatedAt.toISOString(),
      }))}
      insight={
        latestAnalysis
          ? {
              beats: latestAnalysis.storyBeats.map((beat) => ({
                conflict: beat.conflict,
                id: beat.id,
                sourceChapterTitle: beat.sourceChapterTitle,
                title: beat.title,
                summary: beat.summary,
              })),
              characters: latestAnalysis.characters.map((character) => ({
                arcSummary: character.arcSummary,
                desire: character.desire,
                id: character.id,
                importanceScore: character.importanceScore,
                name: character.name,
                role: character.role,
              })),
              timeline: latestAnalysis.timelineEvents.map((event) => ({
                characters: event.characters,
                chronologicalOrder: event.chronologicalOrder,
                confidence: event.confidence,
                description: event.description,
                estimatedTimeLabel: event.estimatedTimeLabel,
                id: event.id,
                location: event.location,
                narrativeOrder: event.narrativeOrder,
                title: event.title,
              })),
              eventWeights: latestAnalysis.eventWeights.map((weight) => ({
                category: weight.category,
                diagnosis: weight.diagnosis,
                id: weight.id,
                percentage: weight.percentage,
              })),
              issues: latestAnalysis.issues.map((issue) => ({
                description: issue.description,
                id: issue.id,
                severity: issue.severity,
                type: issue.type,
              })),
              recommendations: latestAnalysis.recommendations,
            }
          : null
      }
      nextChapterNumber={nextChapterNumber}
      projectId={project.id}
    />
  );
}
