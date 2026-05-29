import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { ProjectWorkspaceFrame } from "@/components/project-workspace-frame";
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
    <ProjectWorkspaceFrame
      companion={<WeightCompanion weights={analysis?.eventWeights ?? []} />}
      companionTitle="분포 요약"
      eyebrow="사건별 글 비중"
      meta={
        analysis
          ? `${analysis.eventWeights.length}개 범주 · 글자 수 기준`
          : "분석 결과 없음"
      }
      pageKey="event-weights"
      projectId={projectId}
      title="장면 기능 분포"
    >
      {!analysis ? (
        <EmptyState title="사건 비중 결과가 없습니다">
          분석을 실행하면 카테고리별 글자 수와 비중 진단이 표시됩니다.
        </EmptyState>
      ) : (
        <section className="rounded-lg border border-[var(--line)] bg-white p-6">
          <div className="space-y-5">
            {analysis.eventWeights.map((weight) => (
              <article key={weight.id}>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold">{weight.category}</h2>
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
    </ProjectWorkspaceFrame>
  );
}

function WeightCompanion({
  weights,
}: {
  weights: Array<{
    category: string;
    diagnosis: string;
    id: string;
    percentage: number;
  }>;
}) {
  if (weights.length === 0) {
    return (
      <p className="text-sm leading-6 text-[var(--muted)]">
        분석을 실행하면 부족하거나 과한 장면 기능을 한눈에 볼 수 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {weights.map((weight) => (
        <div key={weight.id}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="font-bold">{weight.category}</span>
            <Badge className={diagnosisClass(weight.diagnosis)}>
              {weight.diagnosis}
            </Badge>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e6ebe8]">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${Math.min(100, weight.percentage)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
