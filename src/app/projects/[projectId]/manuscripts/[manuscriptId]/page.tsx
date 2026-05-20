import { Trash2, WandSparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { analyzeChapter, deleteManuscript } from "@/app/actions";
import { ManuscriptForm } from "@/components/manuscript-form";
import { SubmitButton } from "@/components/submit-button";
import { getManuscript } from "@/lib/data";

export default async function ManuscriptEditorPage({
  params,
}: {
  params: Promise<{ projectId: string; manuscriptId: string }>;
}) {
  const { projectId, manuscriptId } = await params;
  const manuscript = await getManuscript(projectId, manuscriptId);

  if (!manuscript) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 rounded-lg border border-[var(--line)] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">원고 편집</p>
          <h2 className="mt-2 text-2xl font-bold">{manuscript.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={analyzeChapter}>
            <input name="projectId" type="hidden" value={projectId} />
            <input name="manuscriptId" type="hidden" value={manuscript.id} />
            <SubmitButton pendingText="분석 중">
              <WandSparkles aria-hidden="true" className="h-4 w-4" />
              스토리 분석하기
            </SubmitButton>
          </form>
          <form action={deleteManuscript}>
            <input name="projectId" type="hidden" value={projectId} />
            <input name="manuscriptId" type="hidden" value={manuscript.id} />
            <SubmitButton pendingText="삭제 중" variant="danger">
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              삭제
            </SubmitButton>
          </form>
        </div>
      </header>

      <section className="rounded-lg border border-[var(--line)] bg-white p-6">
        <ManuscriptForm manuscript={manuscript} projectId={projectId} />
      </section>
    </div>
  );
}
