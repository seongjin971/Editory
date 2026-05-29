import { Save, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { deleteProject, updateProject } from "@/app/actions";
import { ProjectWorkspaceFrame } from "@/components/project-workspace-frame";
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
    <ProjectWorkspaceFrame
      companion={<SettingsCompanion />}
      companionTitle="설정 메모"
      eyebrow="프로젝트 설정"
      meta="작품 정보와 위험 작업"
      pageKey="settings"
      projectId={project.id}
      title="프로젝트 정보"
    >
      <div className="space-y-5">
        <section className="rounded-lg border border-[var(--line)] bg-white p-6">
          <form action={updateProject} className="space-y-5">
            <input name="projectId" type="hidden" value={project.id} />
            <label className="block space-y-2">
              <span className="text-sm font-semibold">프로젝트 제목</span>
              <input
                className="field-input"
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
                className="field-textarea"
                defaultValue={project.description}
                name="description"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold">장르</span>
                <input
                  className="field-input"
                  defaultValue={project.genre}
                  name="genre"
                  type="text"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold">대상 독자</span>
                <input
                  className="field-input"
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
          <h2 className="text-lg font-bold text-[var(--danger)]">프로젝트 삭제</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            원고와 분석 결과가 함께 삭제됩니다. 테스트 데이터가 아니라면 신중하게 진행하세요.
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
    </ProjectWorkspaceFrame>
  );
}

function SettingsCompanion() {
  return (
    <div className="space-y-3 text-sm leading-6 text-[var(--muted)]">
      <p className="rounded-md bg-[var(--panel-soft)] p-3">
        이 화면은 작품 메타 정보를 관리하는 곳입니다. 원고 내용과 분석 결과는 다른 메뉴에서
        다룹니다.
      </p>
      <p className="rounded-md bg-[var(--panel-soft)] p-3">
        삭제는 되돌릴 수 없으니 테스트 프로젝트가 아닐 때는 먼저 백업 여부를 확인하세요.
      </p>
    </div>
  );
}
