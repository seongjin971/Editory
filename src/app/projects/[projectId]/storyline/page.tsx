import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/badge";
import { getLatestAnalysis } from "@/lib/data";

export default async function StorylinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const analysis = await getLatestAnalysis(projectId);

  return (
    <div className="space-y-5">
      <header className="rounded-lg border border-[var(--line)] bg-white p-6">
        <p className="text-sm font-semibold text-[var(--accent)]">스토리라인</p>
        <h2 className="mt-2 text-2xl font-bold">읽는 순서의 사건 흐름</h2>
      </header>

      {!analysis ? (
        <EmptyState title="스토리라인이 없습니다">
          분석을 실행하면 핵심 사건이 읽는 순서대로 표시됩니다.
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
                  <h3 className="mt-3 text-xl font-bold">{beat.title}</h3>
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
    </div>
  );
}
