import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { ProjectWorkspaceFrame } from "@/components/project-workspace-frame";
import { getLatestAnalysis } from "@/lib/data";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const analysis = await getLatestAnalysis(projectId);

  return (
    <ProjectWorkspaceFrame
      companion={
        <TimelineCompanion
          events={analysis?.timelineEvents.map((event) => ({
            confidence: event.confidence,
            id: event.id,
            narrativeOrder: event.narrativeOrder,
            timeLabel: event.estimatedTimeLabel,
            title: event.title,
          })) ?? []}
        />
      }
      companionTitle="시간표 요약"
      eyebrow="사건 타임라인"
      meta={
        analysis
          ? `${analysis.timelineEvents.length}개 사건 · 서술 순서와 시간 순서 비교`
          : "분석 결과 없음"
      }
      pageKey="timeline"
      projectId={projectId}
      title="서술 순서와 시간 순서"
    >
      {!analysis ? (
        <EmptyState title="타임라인이 없습니다">
          분석을 실행하면 사건을 서술 순서와 추정 시간 순서로 나누어 보여줍니다.
        </EmptyState>
      ) : (
        <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#eef2ef] text-xs font-bold text-[#59625d]">
                <tr>
                  <th className="px-4 py-3">시간순</th>
                  <th className="px-4 py-3">서술순</th>
                  <th className="px-4 py-3">시점</th>
                  <th className="px-4 py-3">사건</th>
                  <th className="px-4 py-3">인물</th>
                  <th className="px-4 py-3">장소</th>
                  <th className="px-4 py-3">원인</th>
                  <th className="px-4 py-3">결과</th>
                  <th className="px-4 py-3">신뢰도</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {analysis.timelineEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-4 font-bold">
                      {event.chronologicalOrder}
                    </td>
                    <td className="px-4 py-4">{event.narrativeOrder}</td>
                    <td className="px-4 py-4">{event.estimatedTimeLabel}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{event.title}</p>
                      <p className="mt-1 text-[var(--muted)]">{event.description}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {event.characters.map((character) => (
                          <Badge key={character}>{character}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">{event.location}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{event.cause}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{event.effect}</td>
                    <td className="px-4 py-4">
                      {Math.round(event.confidence * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </ProjectWorkspaceFrame>
  );
}

function TimelineCompanion({
  events,
}: {
  events: Array<{
    confidence: number;
    id: string;
    narrativeOrder: number;
    timeLabel: string;
    title: string;
  }>;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm leading-6 text-[var(--muted)]">
        분석 결과가 생기면 이곳에서 시간표를 빠르게 훑어볼 수 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div className="rounded-md bg-[var(--panel-soft)] p-3 text-sm" key={event.id}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold">{event.title}</p>
            <span className="text-xs font-bold text-[var(--accent)]">
              {Math.round(event.confidence * 100)}%
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            서술 {event.narrativeOrder} · {event.timeLabel}
          </p>
        </div>
      ))}
    </div>
  );
}
