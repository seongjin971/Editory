import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { ProjectWorkspaceFrame } from "@/components/project-workspace-frame";
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
    <ProjectWorkspaceFrame
      companion={<IssueCompanion issues={analysis?.issues ?? []} />}
      companionTitle="충돌 요약"
      eyebrow="설정 충돌"
      meta={
        analysis
          ? `${analysis.issues.length}개 의심 지점 · 원고 기준`
          : "분석 결과 없음"
      }
      pageKey="issues"
      projectId={projectId}
      title="일관성 이슈 후보"
    >
      {!analysis ? (
        <EmptyState title="설정 충돌 결과가 없습니다">
          분석을 실행하면 타임라인, 동기, 미해결 사건 후보를 표시합니다.
        </EmptyState>
      ) : analysis.issues.length === 0 ? (
        <EmptyState title="감지된 충돌 후보가 없습니다">
          현재 원고에서는 MVP 규칙으로 잡히는 일관성 이슈가 없습니다.
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
    </ProjectWorkspaceFrame>
  );
}

function IssueCompanion({
  issues,
}: {
  issues: Array<{
    id: string;
    relatedChapter: string;
    severity: string;
    type: string;
  }>;
}) {
  if (issues.length === 0) {
    return (
      <p className="text-sm leading-6 text-[var(--muted)]">
        설정 충돌 후보가 생기면 심각도와 관련 챕터를 이곳에서 빠르게 확인할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div className="rounded-md bg-[var(--panel-soft)] p-3 text-sm" key={issue.id}>
          <div className="flex flex-wrap gap-1">
            <Badge className={severityClass(issue.severity)}>
              {severityLabels[issue.severity] ?? issue.severity}
            </Badge>
            <Badge>{issueTypeLabels[issue.type] ?? issue.type}</Badge>
          </div>
          <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
            {issue.relatedChapter}
          </p>
        </div>
      ))}
    </div>
  );
}
