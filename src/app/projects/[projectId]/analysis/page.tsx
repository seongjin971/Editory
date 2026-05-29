import { WandSparkles } from "lucide-react";
import { analyzeProject } from "@/app/actions";
import { Badge } from "@/components/badge";
import { DemoAnalysisNotice } from "@/components/demo-analysis-notice";
import { EmptyState } from "@/components/empty-state";
import { ProjectWorkspaceFrame } from "@/components/project-workspace-frame";
import { SubmitButton } from "@/components/submit-button";
import { getLatestAnalysis } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import {
  diagnosisClass,
  issueTypeLabels,
  roleLabels,
  severityClass,
  severityLabels,
} from "@/lib/labels";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const analysis = await getLatestAnalysis(projectId);

  return (
    <ProjectWorkspaceFrame
      companion={
        <ReportCompanion
          characterCount={analysis?.characters.length ?? 0}
          issueCount={analysis?.issues.length ?? 0}
          recommendationCount={analysis?.recommendations.length ?? 0}
          storyBeatCount={analysis?.storyBeats.length ?? 0}
          timelineCount={analysis?.timelineEvents.length ?? 0}
        />
      }
      companionTitle="리포트 목차"
      eyebrow="분석 리포트"
      meta={
        analysis
          ? `${formatDate(analysis.createdAt)} 생성 · ${providerLabel(
              analysis.metadata?.provider,
            )}`
          : "분석 결과 없음"
      }
      pageKey="analysis"
      projectId={projectId}
      title="서사 구조 분석 리포트"
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <form action={analyzeProject}>
            <input name="projectId" type="hidden" value={projectId} />
            <SubmitButton
              confirmMessage="스토리 분석을 실행할까요?\n\nOpenAI 모드에서는 API 비용이 발생할 수 있습니다. 한도 5달러 환경에서는 필요한 경우에만 실행하세요."
              pendingText="분석 중"
            >
              <WandSparkles aria-hidden="true" className="h-4 w-4" />
              스토리 분석하기
            </SubmitButton>
          </form>
        </div>

        <DemoAnalysisNotice />

        {!analysis ? (
          <EmptyState title="분석 리포트가 없습니다">
            원고를 저장한 뒤 스토리 분석을 실행하면 구조화된 결과가 이곳에 표시됩니다.
          </EmptyState>
        ) : (
          <>
            <section className="rounded-lg border border-[var(--line)] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">전체 요약</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge className={providerClass(analysis.metadata?.provider)}>
                    {providerLabel(analysis.metadata?.provider)}
                  </Badge>
                  {analysis.metadata?.model ? (
                    <Badge>{analysis.metadata.model}</Badge>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 leading-7 text-[#34413b]">{analysis.summary}</p>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-6">
              <h2 className="text-lg font-bold">핵심 사건 목록</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {analysis.storyBeats.slice(0, 6).map((beat) => (
                  <article
                    className="rounded-md border border-[var(--line)] p-4"
                    key={beat.id}
                  >
                    <div className="flex items-center gap-2">
                      <Badge>{beat.beatOrder}</Badge>
                      <h3 className="font-semibold">{beat.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      {beat.summary}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-6">
              <h2 className="text-lg font-bold">스토리라인</h2>
              <ol className="mt-4 space-y-3">
                {analysis.storyBeats.map((beat) => (
                  <li className="rounded-md bg-[#f7f9f7] p-4" key={beat.id}>
                    <p className="text-sm font-bold text-[var(--accent)]">
                      {beat.beatOrder}. {beat.sourceChapterTitle}
                    </p>
                    <h3 className="mt-1 font-semibold">{beat.title}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">{beat.outcome}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-6">
              <h2 className="text-lg font-bold">타임라인</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#eef2ef] text-xs text-[#59625d]">
                    <tr>
                      <th className="px-3 py-3">시간순</th>
                      <th className="px-3 py-3">서술순</th>
                      <th className="px-3 py-3">시점</th>
                      <th className="px-3 py-3">사건</th>
                      <th className="px-3 py-3">원인</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {analysis.timelineEvents.map((event) => (
                      <tr key={event.id}>
                        <td className="px-3 py-3 font-semibold">
                          {event.chronologicalOrder}
                        </td>
                        <td className="px-3 py-3">{event.narrativeOrder}</td>
                        <td className="px-3 py-3">{event.estimatedTimeLabel}</td>
                        <td className="px-3 py-3">{event.title}</td>
                        <td className="px-3 py-3 text-[var(--muted)]">
                          {event.cause}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-6">
              <h2 className="text-lg font-bold">등장인물 분석</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {analysis.characters.map((character) => (
                  <article
                    className="rounded-md border border-[var(--line)] p-4"
                    key={character.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{character.name}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {roleLabels[character.role] ?? character.role}
                        </p>
                      </div>
                      <Badge>{character.importanceScore}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#34413b]">
                      {character.arcSummary}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-6">
              <h2 className="text-lg font-bold">사건별 글 비중</h2>
              <div className="mt-4 space-y-3">
                {analysis.eventWeights.map((weight) => (
                  <div key={weight.id}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{weight.category}</span>
                      <span className="text-[var(--muted)]">
                        {formatNumber(weight.characterCount)}자 · {weight.percentage}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#e6ebe8]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.min(100, weight.percentage)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className={diagnosisClass(weight.diagnosis)}>
                        {weight.diagnosis}
                      </Badge>
                      <p className="text-sm text-[var(--muted)]">
                        {weight.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-6">
              <h2 className="text-lg font-bold">캐릭터 아크</h2>
              <div className="mt-4 space-y-3">
                {analysis.characters.map((character) => (
                  <article
                    className="rounded-md bg-[#f7f9f7] p-4"
                    key={character.id}
                  >
                    <h3 className="font-semibold">{character.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {character.arcSummary}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-6">
              <h2 className="text-lg font-bold">설정 충돌</h2>
              {analysis.issues.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  현재 감지된 충돌 후보가 없습니다.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {analysis.issues.map((issue) => (
                    <article
                      className="rounded-md border border-[var(--line)] p-4"
                      key={issue.id}
                    >
                      <div className="flex flex-wrap gap-2">
                        <Badge className={severityClass(issue.severity)}>
                          {severityLabels[issue.severity] ?? issue.severity}
                        </Badge>
                        <Badge>{issueTypeLabels[issue.type] ?? issue.type}</Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6">{issue.description}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {issue.suggestion}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-6">
              <h2 className="text-lg font-bold">개선 제안</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#34413b]">
                {analysis.recommendations.map((recommendation) => (
                  <li
                    className="rounded-md bg-[#f7f9f7] px-4 py-3"
                    key={recommendation}
                  >
                    {recommendation}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </ProjectWorkspaceFrame>
  );
}

function providerLabel(provider: string | undefined) {
  if (provider === "openai") {
    return "OpenAI 분석";
  }

  if (provider === "mock") {
    return "Mock 분석";
  }

  return "출처 확인 필요";
}

function providerClass(provider: string | undefined) {
  if (provider === "openai") {
    return "bg-[#e4f1ec] text-[#256044]";
  }

  if (provider === "mock") {
    return "bg-[#fff6df] text-[#7a4b12]";
  }

  return "bg-[#e9eef2] text-[#40515f]";
}

function ReportCompanion({
  characterCount,
  issueCount,
  recommendationCount,
  storyBeatCount,
  timelineCount,
}: {
  characterCount: number;
  issueCount: number;
  recommendationCount: number;
  storyBeatCount: number;
  timelineCount: number;
}) {
  const items = [
    ["핵심 사건", storyBeatCount],
    ["타임라인", timelineCount],
    ["등장인물", characterCount],
    ["설정 충돌", issueCount],
    ["개선 제안", recommendationCount],
  ];

  return (
    <div className="space-y-2">
      {items.map(([label, value]) => (
        <div
          className="flex items-center justify-between rounded-md bg-[var(--panel-soft)] px-3 py-2 text-sm"
          key={label}
        >
          <span className="font-semibold">{label}</span>
          <span className="font-bold text-[var(--accent)]">{value}</span>
        </div>
      ))}
    </div>
  );
}
