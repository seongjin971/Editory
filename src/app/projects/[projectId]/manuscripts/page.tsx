import { FilePlus2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteManuscript } from "@/app/actions";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { getManuscripts } from "@/lib/data";
import { countCharacters, formatDate, formatNumber } from "@/lib/format";

export default async function ManuscriptListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const manuscripts = await getManuscripts(projectId);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 rounded-lg border border-[var(--line)] bg-white p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">원고</p>
          <h2 className="mt-2 text-2xl font-bold">챕터 목록</h2>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white"
          href={`/projects/${projectId}/manuscripts/new`}
        >
          <FilePlus2 aria-hidden="true" className="h-4 w-4" />
          새 원고
        </Link>
      </header>

      {manuscripts.length === 0 ? (
        <EmptyState title="원고가 비어 있습니다">
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white"
            href={`/projects/${projectId}/manuscripts/new`}
          >
            <FilePlus2 aria-hidden="true" className="h-4 w-4" />
            첫 챕터 만들기
          </Link>
        </EmptyState>
      ) : (
        <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
          <div className="grid grid-cols-[90px_1fr_120px_150px_170px] border-b border-[var(--line)] bg-[#eef2ef] px-4 py-3 text-xs font-bold text-[#59625d] max-lg:hidden">
            <span>번호</span>
            <span>제목</span>
            <span>글자 수</span>
            <span>수정일</span>
            <span />
          </div>
          <div className="divide-y divide-[var(--line)]">
            {manuscripts.map((manuscript) => (
              <article
                className="grid gap-4 px-4 py-4 lg:grid-cols-[90px_1fr_120px_150px_170px] lg:items-center"
                key={manuscript.id}
              >
                <span className="text-sm font-bold">{manuscript.chapterNumber}</span>
                <div>
                  <h3 className="font-semibold">{manuscript.title}</h3>
                  {manuscript.memo ? (
                    <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">
                      {manuscript.memo}
                    </p>
                  ) : null}
                </div>
                <span className="text-sm text-[#59625d]">
                  {formatNumber(countCharacters(manuscript.body))}
                </span>
                <span className="text-sm text-[#59625d]">
                  {formatDate(manuscript.updatedAt)}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm font-semibold"
                    href={`/projects/${projectId}/manuscripts/${manuscript.id}`}
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                    편집
                  </Link>
                  <form action={deleteManuscript}>
                    <input name="projectId" type="hidden" value={projectId} />
                    <input name="manuscriptId" type="hidden" value={manuscript.id} />
                    <SubmitButton pendingText="삭제 중" variant="danger">
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                      삭제
                    </SubmitButton>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
