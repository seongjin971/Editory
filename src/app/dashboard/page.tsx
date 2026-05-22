import { FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { getDashboardProjects } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const projects = await getDashboardProjects();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">Editory</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-[#1d2320]">
            프로젝트
          </h1>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          href="/projects/new"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          새 프로젝트
        </Link>
      </header>

      {projects.length === 0 ? (
        <section className="rounded-lg border border-dashed border-[#cbd4cf] bg-white p-10 text-center">
          <h2 className="text-lg font-semibold">아직 프로젝트가 없습니다</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            첫 원고 프로젝트를 만들고 바로 쓰기를 시작하세요.
          </p>
          <Link
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white"
            href="/projects/new"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            프로젝트 만들기
          </Link>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
          <div className="grid grid-cols-[1.4fr_130px_110px_110px_150px_90px] border-b border-[var(--line)] bg-[#eef2ef] px-4 py-3 text-xs font-bold text-[#59625d] max-lg:hidden">
            <span>프로젝트</span>
            <span>수정일</span>
            <span>원고</span>
            <span>등장인물</span>
            <span>사건</span>
            <span />
          </div>
          <div className="divide-y divide-[var(--line)]">
            {projects.map((project) => (
              <article
                className="grid gap-4 px-4 py-5 lg:grid-cols-[1.4fr_130px_110px_110px_150px_90px] lg:items-center"
                key={project.id}
              >
                <div>
                  <h2 className="font-semibold text-[#1d2320]">{project.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                    {project.description || "프로젝트 설명 없음"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#58615c]">
                    {project.genre ? (
                      <span className="rounded-full bg-[#edf1ee] px-2 py-1">
                        {project.genre}
                      </span>
                    ) : null}
                    {project.targetAudience ? (
                      <span className="rounded-full bg-[#edf1ee] px-2 py-1">
                        {project.targetAudience}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="text-sm text-[#59625d]">
                  {formatDate(project.updatedAt)}
                </span>
                <span className="text-sm font-semibold">
                  {project.manuscriptCount}
                </span>
                <span className="text-sm font-semibold">
                  {project.characterCount}
                </span>
                <span className="text-sm font-semibold">{project.eventCount}</span>
                <Link
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm font-semibold transition hover:border-[#9aa6a0]"
                  href={`/projects/${project.id}/write`}
                >
                  <FolderOpen aria-hidden="true" className="h-4 w-4" />
                  쓰기
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
