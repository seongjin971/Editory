import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { ProjectWorkspaceFrame } from "@/components/project-workspace-frame";
import { getLatestAnalysis } from "@/lib/data";

export default async function StorylinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const analysis = await getLatestAnalysis(projectId);

  return (
    <ProjectWorkspaceFrame
      companion={
        <StorylineCompanion
          beats={analysis?.storyBeats.map((beat) => ({
            chapter: beat.sourceChapterTitle,
            id: beat.id,
            order: beat.beatOrder,
            title: beat.title,
          })) ?? []}
        />
      }
      companionTitle="비트 목차"
      eyebrow="스토리라인"
      meta={
        analysis
          ? `${analysis.storyBeats.length}개 비트 · ${analysis.createdAt.toLocaleDateString("ko-KR")}`
          : "분석 결과 없음"
      }
      pageKey="storyline"
      projectId={projectId}
      title="읽는 순서의 사건 흐름"
    >
      {!analysis ? (
        <EmptyState title="스토리라인이 없습니다">
          원고 분석을 실행하면 핵심 사건이 읽는 순서대로 정리됩니다.
        </EmptyState>
      ) : (
        <ol className="space-y-4">
          {analysis.storyBeats.map((beat) => (
            <li
              className="rounded-lg border border-[var(--line)] bg-white p-5"
              key={beat.id}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <Badge>{beat.beatOrder}</Badge>
                  <h2 className="mt-3 text-xl font-bold">{beat.title}</h2>
                  <p className="mt-2 text-sm font-semibold text-[var(--accent)]">
                    {beat.sourceChapterTitle}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {beat.involvedCharacters.map((character) => (
                    <Badge key={character}>{character}</Badge>
                  ))}
                </div>
              </div>
              <p className="mt-4 leading-7 text-[#34413b]">{beat.summary}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-md bg-[#f7f9f7] p-4">
                  <p className="text-xs font-bold text-[#6b746f]">갈등</p>
                  <p className="mt-2 text-sm leading-6">{beat.conflict}</p>
                </div>
                <div className="rounded-md bg-[#f7f9f7] p-4">
                  <p className="text-xs font-bold text-[#6b746f]">결과</p>
                  <p className="mt-2 text-sm leading-6">{beat.outcome}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </ProjectWorkspaceFrame>
  );
}

function StorylineCompanion({
  beats,
}: {
  beats: Array<{ chapter: string; id: string; order: number; title: string }>;
}) {
  if (beats.length === 0) {
    return (
      <p className="text-sm leading-6 text-[var(--muted)]">
        분석을 실행하면 이곳에서 비트 순서를 훑어볼 수 있습니다.
      </p>
    );
  }

  return (
    <ol className="space-y-2 text-sm">
      {beats.map((beat) => (
        <li className="rounded-md bg-[var(--panel-soft)] p-3" key={beat.id}>
          <p className="text-xs font-bold text-[var(--accent)]">{beat.order}번째 비트</p>
          <p className="mt-1 font-bold">{beat.title}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{beat.chapter}</p>
        </li>
      ))}
    </ol>
  );
}
