import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { getLatestAnalysis } from "@/lib/data";
import { issueTypeLabels, severityClass, severityLabels } from "@/lib/labels";

export default async function IssuesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const analysis = await getLatestAnalysis(projectId);

  return (
    <div className="space-y-5">
      <header className="rounded-lg border border-[var(--line)] bg-white p-6">
        <p className="text-sm font-semibold text-[var(--accent)]">설정 충돌</p>
        <h2 className="mt-2 text-2xl font-bold">일관성 이슈 후보</h2>
      </header>

      {!analysis ? (
        <EmptyState title="설정 충돌 결과가 없습니다">
          분석을 실행하면 타임라인, 동기, 미해결 사건 후보를 표시합니다.
        </EmptyState>
      ) : analysis.issues.length === 0 ? (
        <EmptyState title="감지된 충돌 후보가 없습니다">
          현재 원고에서는 MVP 규칙으로 잡힌 일관성 이슈가 없습니다.
        </EmptyState>
      ) : (
        <section className="space-y-3">
          {analysis.issues.map((issue) => (
            <article
              className="rounded-lg border border-[var(--line)] bg-white p-5"
              key={issue.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={severityClass(issue.severity)}>
                  {severityLabels[issue.severity] ?? issue.severity}
                </Badge>
                <Badge>{issueTypeLabels[issue.type] ?? issue.type}</Badge>
                <span className="text-sm font-semibold text-[var(--muted)]">
                  {issue.relatedChapter}
                </span>
              </div>
              <p className="mt-4 leading-7 text-[#34413b]">{issue.description}</p>
              <div className="mt-4 rounded-md bg-[#f7f9f7] p-4">
                <p className="text-xs font-bold text-[#6b746f]">제안</p>
                <p className="mt-2 text-sm leading-6">{issue.suggestion}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
