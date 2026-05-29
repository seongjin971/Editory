import { BarChart3, FileText, PencilLine, WandSparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { analyzeProject } from "@/app/actions";
import { DemoAnalysisNotice } from "@/components/demo-analysis-notice";
import { ProjectWorkspaceFrame } from "@/components/project-workspace-frame";
import { SubmitButton } from "@/components/submit-button";
import { getProjectOverview } from "@/lib/data";
import { countCharacters, formatDate, formatNumber } from "@/lib/format";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectOverview(projectId);

  if (!project) {
    notFound();
  }

  const latestRun = project.analysisRuns[0];
  const totalCharacters = project.manuscripts.reduce(
    (sum, manuscript) => sum + countCharacters(manuscript.body),
    0,
  );

  return (
    <ProjectWorkspaceFrame
      companion={
        <OverviewCompanion
          latestRunDate={latestRun ? formatDate(latestRun.createdAt) : null}
          projectId={project.id}
        />
      }
      companionTitle="프로젝트 도구"
      eyebrow="프로젝트 개요"
      meta={project.genre || "장르 미지정"}
      pageKey="overview"
      projectId={project.id}
      title={project.title}
    >
      <div className="space-y-5">
        <section className="rounded-lg border border-[var(--line)] bg-white p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">작업 요약</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                {project.description || "아직 프로젝트 설명이 없습니다."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold transition hover:border-[#9aa6a0]"
                href={`/projects/${project.id}/write`}
              >
                <PencilLine aria-hidden="true" className="h-4 w-4" />
                쓰기 열기
              </Link>
              <form action={analyzeProject}>
                <input name="projectId" type="hidden" value={project.id} />
                <SubmitButton pendingText="분석 중">
                  <WandSparkles aria-hidden="true" className="h-4 w-4" />
                  스토리 분석하기
                </SubmitButton>
              </form>
            </div>
          </div>
        </section>

        <DemoAnalysisNotice compact />

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard label="원고" value={`${project.manuscripts.length}`} />
          <MetricCard label="글자 수" value={formatNumber(totalCharacters)} />
          <MetricCard
            label="등장인물"
            value={`${latestRun?._count.characters ?? 0}`}
          />
          <MetricCard label="사건" value={`${latestRun?._count.timelineEvents ?? 0}`} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="rounded-lg border border-[var(--line)] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">최근 원고</h2>
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
                href={`/projects/${project.id}/manuscripts`}
              >
                <FileText aria-hidden="true" className="h-4 w-4" />
                전체 보기
              </Link>
            </div>
            <div className="mt-4 divide-y divide-[var(--line)]">
              {project.manuscripts.slice(0, 5).map((manuscript) => (
                <Link
                  className="block py-4 transition hover:bg-[#f7f9f7]"
                  href={`/projects/${project.id}/write?manuscriptId=${manuscript.id}`}
                  key={manuscript.id}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {manuscript.chapterNumber}. {manuscript.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {formatNumber(countCharacters(manuscript.body))}자
                      </p>
                    </div>
                    <span className="text-xs text-[var(--muted)]">
                      {formatDate(manuscript.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))}
              {project.manuscripts.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--muted)]">
                  등록된 원고가 없습니다.
                </p>
              ) : null}
            </div>
          </div>

          <aside className="rounded-lg border border-[var(--line)] bg-white p-5">
            <div className="flex items-center gap-2">
              <BarChart3 aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="font-bold">최근 분석</h2>
            </div>
            {latestRun ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-[var(--muted)]">{latestRun.summary}</p>
                <p className="text-xs font-semibold text-[#6b746f]">
                  {formatDate(latestRun.createdAt)}
                </p>
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--line)] px-3 font-semibold"
                  href={`/projects/${project.id}/analysis`}
                >
                  리포트 열기
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">
                아직 저장된 분석 결과가 없습니다.
              </p>
            )}
          </aside>
        </section>
      </div>
    </ProjectWorkspaceFrame>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-5">
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-2xl font-bold text-[#1d2320]">{value}</p>
    </div>
  );
}

function OverviewCompanion({
  latestRunDate,
  projectId,
}: {
  latestRunDate: string | null;
  projectId: string;
}) {
  return (
    <div className="space-y-2 text-sm">
      <Link
        className="flex items-center justify-between rounded-md bg-[var(--panel-soft)] px-3 py-2 font-semibold"
        href={`/projects/${projectId}/write`}
      >
        쓰기 공간
        <span>열기</span>
      </Link>
      <Link
        className="flex items-center justify-between rounded-md bg-[var(--panel-soft)] px-3 py-2 font-semibold"
        href={`/projects/${projectId}/analysis`}
      >
        분석 리포트
        <span>확인</span>
      </Link>
      <div className="rounded-md border border-[var(--line)] p-3">
        <p className="text-xs font-bold text-[var(--accent)]">최근 분석</p>
        <p className="mt-1 text-[var(--muted)]">
          {latestRunDate ?? "아직 분석 기록이 없습니다."}
        </p>
      </div>
    </div>
  );
}
