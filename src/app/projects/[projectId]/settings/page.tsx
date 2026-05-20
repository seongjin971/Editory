import { Save, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { deleteProject, updateProject } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { getProject } from "@/lib/data";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[var(--line)] bg-white p-6">
        <p className="text-sm font-semibold text-[var(--accent)]">프로젝트 설정</p>
        <h2 className="mt-2 text-2xl font-bold">작품 정보</h2>
        <form action={updateProject} className="mt-6 space-y-5">
          <input name="projectId" type="hidden" value={project.id} />
          <label className="block space-y-2">
            <span className="text-sm font-semibold">프로젝트 제목</span>
            <input
              className="h-11 w-full rounded-md border border-[var(--line)] px-3 outline-none focus:border-[var(--accent)]"
              defaultValue={project.title}
              maxLength={120}
              name="title"
              required
              type="text"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold">설명</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-[var(--line)] p-3 outline-none focus:border-[var(--accent)]"
              defaultValue={project.description}
              name="description"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">장르</span>
              <input
                className="h-11 w-full rounded-md border border-[var(--line)] px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={project.genre}
                name="genre"
                type="text"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">타깃 독자</span>
              <input
                className="h-11 w-full rounded-md border border-[var(--line)] px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={project.targetAudience}
                name="targetAudience"
                type="text"
              />
            </label>
          </div>
          <SubmitButton pendingText="저장 중">
            <Save aria-hidden="true" className="h-4 w-4" />
            설정 저장
          </SubmitButton>
        </form>
      </section>

      <section className="rounded-lg border border-[#e2b9b9] bg-white p-6">
        <h3 className="text-lg font-bold text-[var(--danger)]">프로젝트 삭제</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          원고와 분석 결과가 함께 삭제됩니다.
        </p>
        <form action={deleteProject} className="mt-4">
          <input name="projectId" type="hidden" value={project.id} />
          <SubmitButton pendingText="삭제 중" variant="danger">
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            프로젝트 삭제
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
