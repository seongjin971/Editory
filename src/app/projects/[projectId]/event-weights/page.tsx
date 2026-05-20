import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { getLatestAnalysis } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { diagnosisClass } from "@/lib/labels";

export default async function EventWeightsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const analysis = await getLatestAnalysis(projectId);

  return (
    <div className="space-y-5">
      <header className="rounded-lg border border-[var(--line)] bg-white p-6">
        <p className="text-sm font-semibold text-[var(--accent)]">사건별 글 비중</p>
        <h2 className="mt-2 text-2xl font-bold">장면 기능 분포</h2>
      </header>

      {!analysis ? (
        <EmptyState title="사건 비중 결과가 없습니다">
          분석을 실행하면 카테고리별 글자 수와 진단이 표시됩니다.
        </EmptyState>
      ) : (
        <section className="rounded-lg border border-[var(--line)] bg-white p-6">
          <div className="space-y-5">
            {analysis.eventWeights.map((weight) => (
              <article key={weight.id}>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold">{weight.category}</h3>
                    <Badge className={diagnosisClass(weight.diagnosis)}>
                      {weight.diagnosis}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {formatNumber(weight.characterCount)}자 · {weight.percentage}%
                  </p>
                </div>
                <div className="mt-3 h-4 overflow-hidden rounded-full bg-[#e6ebe8]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.min(100, weight.percentage)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-[#34413b]">
                  {weight.recommendation}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
