import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { getLatestAnalysis } from "@/lib/data";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const analysis = await getLatestAnalysis(projectId);

  return (
    <div className="space-y-5">
      <header className="rounded-lg border border-[var(--line)] bg-white p-6">
        <p className="text-sm font-semibold text-[var(--accent)]">사건 타임라인</p>
        <h2 className="mt-2 text-2xl font-bold">서술 순서와 시간 순서</h2>
      </header>

      {!analysis ? (
        <EmptyState title="타임라인이 없습니다">
          분석을 실행하면 사건의 서술 순서와 추정 시간 순서를 분리해 표시합니다.
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
                    <td className="px-4 py-4">{Math.round(event.confidence * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
