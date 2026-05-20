import { WandSparkles } from "lucide-react";
import { analyzeProject } from "@/app/actions";
import { Badge } from "@/components/badge";
import { DemoAnalysisNotice } from "@/components/demo-analysis-notice";
import { EmptyState } from "@/components/empty-state";
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
    <div className="space-y-5">
      <header className="flex flex-col gap-4 rounded-lg border border-[var(--line)] bg-white p-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">분석 리포트</p>
          <h2 className="mt-2 text-2xl font-bold">서사 구조 분석 리포트</h2>
          {analysis ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              {formatDate(analysis.createdAt)} 생성
            </p>
          ) : null}
        </div>
        <form action={analyzeProject}>
          <input name="projectId" type="hidden" value={projectId} />
          <SubmitButton pendingText="분석 중">
            <WandSparkles aria-hidden="true" className="h-4 w-4" />
            스토리 분석하기
          </SubmitButton>
        </form>
      </header>

      <DemoAnalysisNotice />

      {!analysis ? (
        <EmptyState title="분석 리포트가 없습니다">
          원고를 저장한 뒤 스토리 분석을 실행하면 구조화된 결과가 이곳에 표시됩니다.
        </EmptyState>
      ) : (
        <>
          <section className="rounded-lg border border-[var(--line)] bg-white p-6">
            <h3 className="text-lg font-bold">전체 요약</h3>
            <p className="mt-3 leading-7 text-[#34413b]">{analysis.summary}</p>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-6">
            <h3 className="text-lg font-bold">핵심 사건 목록</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {analysis.storyBeats.slice(0, 6).map((beat) => (
                <article
                  className="rounded-md border border-[var(--line)] p-4"
                  key={beat.id}
                >
                  <div className="flex items-center gap-2">
                    <Badge>{beat.beatOrder}</Badge>
                    <h4 className="font-semibold">{beat.title}</h4>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {beat.summary}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-6">
            <h3 className="text-lg font-bold">스토리라인</h3>
            <ol className="mt-4 space-y-3">
              {analysis.storyBeats.map((beat) => (
                <li className="rounded-md bg-[#f7f9f7] p-4" key={beat.id}>
                  <p className="text-sm font-bold text-[var(--accent)]">
                    {beat.beatOrder}. {beat.sourceChapterTitle}
                  </p>
                  <h4 className="mt-1 font-semibold">{beat.title}</h4>
                  <p className="mt-2 text-sm text-[var(--muted)]">{beat.outcome}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-6">
            <h3 className="text-lg font-bold">타임라인</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#eef2ef] text-xs text-[#59625d]">
                  <tr>
                    <th className="px-3 py-3">시간순</th>
                    <th className="px-3 py-3">서술순</th>
                    <th className="px-3 py-3">시점</th>
                    <th className="px-3 py-3">사건</th>
                    <th className="px-3 py-3">인과</th>
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
            <h3 className="text-lg font-bold">등장인물 분석</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {analysis.characters.map((character) => (
                <article
                  className="rounded-md border border-[var(--line)] p-4"
                  key={character.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold">{character.name}</h4>
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
            <h3 className="text-lg font-bold">사건별 글 비중</h3>
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
            <h3 className="text-lg font-bold">캐릭터 아크</h3>
            <div className="mt-4 space-y-3">
              {analysis.characters.map((character) => (
                <article className="rounded-md bg-[#f7f9f7] p-4" key={character.id}>
                  <h4 className="font-semibold">{character.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {character.arcSummary}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-6">
            <h3 className="text-lg font-bold">설정 충돌</h3>
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
            <h3 className="text-lg font-bold">개선 제안</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[#34413b]">
              {analysis.recommendations.map((recommendation) => (
                <li className="rounded-md bg-[#f7f9f7] px-4 py-3" key={recommendation}>
                  {recommendation}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
