import { ManuscriptForm } from "@/components/manuscript-form";
import { getManuscripts } from "@/lib/data";

export default async function NewManuscriptPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const manuscripts = await getManuscripts(projectId);
  const nextChapterNumber =
    manuscripts.reduce(
      (maxChapter, manuscript) => Math.max(maxChapter, manuscript.chapterNumber),
      0,
    ) + 1;

  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-6">
      <p className="text-sm font-semibold text-[var(--accent)]">새 원고</p>
      <h2 className="mt-2 text-2xl font-bold">챕터 작성</h2>
      <div className="mt-6">
        <ManuscriptForm
          nextChapterNumber={nextChapterNumber}
          projectId={projectId}
        />
      </div>
    </div>
  );
}
