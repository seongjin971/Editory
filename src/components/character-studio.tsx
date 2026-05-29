"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createCharacterConcept,
  deleteCharacterConcept,
  saveCharacterConcept,
} from "@/app/actions";
import { roleLabels } from "@/lib/labels";

type CharacterConceptItem = {
  arcEnd: string;
  arcStart: string;
  arcTurningPoint: string;
  appearance: string;
  backstory: string;
  conflict: string;
  description: string;
  desire: string;
  fear: string;
  goal: string;
  id: string;
  logline: string;
  motivation: string;
  name: string;
  plotFunction: string;
  relationshipNotes: string;
  role: string;
  secret: string;
  status: string;
  strength: string;
  tagsJson: string;
  voice: string;
  weakness: string;
  wound: string;
};

export function CharacterStudio({
  concepts,
  embedded = false,
  projectId,
}: {
  concepts: CharacterConceptItem[];
  embedded?: boolean;
  projectId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(concepts[0]?.id ?? null);
  const selectedConcept =
    concepts.find((concept) => concept.id === selectedId) ?? concepts[0] ?? null;
  const plannedCount = concepts.filter((concept) => concept.status === "planned").length;
  const revisionCount = concepts.filter(
    (concept) => concept.status === "needs_revision",
  ).length;

  async function handleCreateConcept() {
    setBusy("create");
    try {
      const result = await createCharacterConcept(projectId);
      setSelectedId(result.conceptId);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleteConcept(conceptId: string) {
    if (!window.confirm("이 캐릭터 설정을 삭제할까요?")) {
      return;
    }

    setBusy("delete");
    try {
      await deleteCharacterConcept({ conceptId, projectId });
      setSelectedId(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {!embedded ? (
      <header className="rounded-lg border border-[var(--line)] bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">작가 설계</p>
            <h2 className="mt-2 text-2xl font-bold">캐릭터 설계실</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              이곳은 작가가 직접 정하는 인물 설정만 다룹니다. 원고를 읽고 추정한
              AI 결과는 분석 리포트에서 따로 확인하세요.
            </p>
            <Link
              className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-[var(--line)] px-3 text-sm font-semibold text-[#34413b] hover:border-[#9aa6a0]"
              href={`/projects/${projectId}/analysis`}
            >
              AI 분석 리포트 보기
            </Link>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 text-sm xl:max-w-sm">
            <Metric label="설계 인물" value={`${concepts.length}`} />
            <Metric label="설계 완료" value={`${plannedCount}`} />
            <Metric label="수정 필요" value={`${revisionCount}`} />
          </div>
        </div>
      </header>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-[var(--line)] bg-white p-4 xl:sticky xl:top-4 xl:self-start">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">설계 인물</h3>
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm font-semibold hover:border-[#9aa6a0]"
              disabled={busy !== null}
              onClick={handleCreateConcept}
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              추가
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {concepts.length === 0 ? (
              <button
                className="w-full rounded-md border border-dashed border-[#cbd4cf] px-3 py-8 text-sm font-semibold text-[var(--muted)]"
                onClick={handleCreateConcept}
                type="button"
              >
                첫 캐릭터 설정 만들기
              </button>
            ) : (
              concepts.map((concept) => (
                <button
                  className={`w-full rounded-md border px-3 py-3 text-left transition ${
                    selectedConcept?.id === concept.id
                      ? "border-[#9cc2bc] bg-[#eef7f4]"
                      : "border-[var(--line)] bg-white hover:border-[#b7c5bf]"
                  }`}
                  key={concept.id}
                  onClick={() => setSelectedId(concept.id)}
                  type="button"
                >
                  <span className="block font-bold">{concept.name}</span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {roleLabels[concept.role] ?? concept.role} ·{" "}
                    {statusLabel(concept.status)}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {selectedConcept ? (
          <CharacterConceptForm
            concept={selectedConcept}
            onDelete={() => handleDeleteConcept(selectedConcept.id)}
            projectId={projectId}
          />
        ) : (
          <section className="rounded-lg border border-dashed border-[#cbd4cf] bg-white p-8 text-center">
            <p className="text-sm font-semibold text-[var(--accent)]">컨셉 시트</p>
            <h3 className="mt-2 text-xl font-bold">아직 설계된 인물이 없습니다</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              먼저 주요 인물을 하나 만들고 욕망, 약점, 관계, 아크를 채워보세요.
            </p>
            <button
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
              disabled={busy !== null}
              onClick={handleCreateConcept}
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              첫 캐릭터 만들기
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

function CharacterConceptForm({
  concept,
  onDelete,
  projectId,
}: {
  concept: CharacterConceptItem;
  onDelete?: () => void;
  projectId: string;
}) {
  const tags = formatTagsForInput(parseTags(concept.tagsJson));

  return (
    <form
      action={saveCharacterConcept}
      className="min-w-0 rounded-lg border border-[var(--line)] bg-white p-5"
      key={concept.id}
    >
      <input name="projectId" type="hidden" value={projectId} />
      <input name="conceptId" type="hidden" value={concept.id} />

      <div className="border-b border-[var(--line)] pb-5">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">컨셉 시트</p>
          <h3 className="mt-1 text-2xl font-bold">{concept.name || "새 인물"}</h3>
        </div>
        <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          <Field label="이름">
            <input
              className="field-input text-xl font-bold"
              defaultValue={concept.name}
              name="name"
            />
          </Field>
          <Field label="역할">
            <select className="field-input" defaultValue={concept.role} name="role">
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="상태">
            <select className="field-input" defaultValue={concept.status} name="status">
              <option value="draft">초안</option>
              <option value="planned">설계 완료</option>
              <option value="needs_revision">수정 필요</option>
              <option value="analysis_draft">분석 기반</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(220px,0.75fr)_minmax(320px,1.25fr)]">
        <Field label="태그">
          <input
            className="field-input"
            defaultValue={tags}
            name="tags"
            placeholder="#비밀 #조력자 #관계갈등"
          />
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            여러 태그는 #으로 구분해 붙입니다. 예: #외부자 #라이벌 #숨은비밀
          </p>
        </Field>
        <Field label="한 줄 컨셉">
          <input
            className="field-input"
            defaultValue={concept.logline}
            name="logline"
            placeholder="이 인물이 이야기에서 맡는 기능을 한 문장으로 적어보세요."
          />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="설명">
          <textarea
            className="field-textarea min-h-24"
            defaultValue={concept.description}
            name="description"
          />
        </Field>
      </div>

      <SectionTitle eyebrow="외형과 목소리" title="독자가 먼저 감지하는 정보" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="외형/소품">
          <textarea className="field-textarea" defaultValue={concept.appearance} name="appearance" />
        </Field>
        <Field label="말투/문체 감각">
          <textarea className="field-textarea" defaultValue={concept.voice} name="voice" />
        </Field>
      </div>

      <SectionTitle eyebrow="내면 동력" title="움직이게 하는 것" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="겉목표">
          <textarea className="field-textarea" defaultValue={concept.goal} name="goal" />
        </Field>
        <Field label="동기">
          <textarea className="field-textarea" defaultValue={concept.motivation} name="motivation" />
        </Field>
        <Field label="욕망">
          <textarea className="field-textarea" defaultValue={concept.desire} name="desire" />
        </Field>
        <Field label="두려움">
          <textarea className="field-textarea" defaultValue={concept.fear} name="fear" />
        </Field>
        <Field label="상처">
          <textarea className="field-textarea" defaultValue={concept.wound} name="wound" />
        </Field>
        <Field label="비밀">
          <textarea className="field-textarea" defaultValue={concept.secret} name="secret" />
        </Field>
      </div>

      <SectionTitle eyebrow="드라마 구조" title="갈등과 변화" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="강점">
          <textarea className="field-textarea" defaultValue={concept.strength} name="strength" />
        </Field>
        <Field label="약점">
          <textarea className="field-textarea" defaultValue={concept.weakness} name="weakness" />
        </Field>
        <Field label="핵심 갈등">
          <textarea className="field-textarea" defaultValue={concept.conflict} name="conflict" />
        </Field>
        <Field label="플롯 기능">
          <textarea className="field-textarea" defaultValue={concept.plotFunction} name="plotFunction" />
        </Field>
      </div>

      <SectionTitle eyebrow="관계와 과거" title="장면 안에서 드러나는 배경" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="관계 메모">
          <textarea
            className="field-textarea min-h-28"
            defaultValue={concept.relationshipNotes}
            name="relationshipNotes"
          />
        </Field>
        <Field label="백스토리">
          <textarea className="field-textarea min-h-28" defaultValue={concept.backstory} name="backstory" />
        </Field>
      </div>

      <SectionTitle eyebrow="아크" title="시작, 전환, 결말" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Field label="시작점">
          <textarea className="field-textarea" defaultValue={concept.arcStart} name="arcStart" />
        </Field>
        <Field label="전환점">
          <textarea
            className="field-textarea"
            defaultValue={concept.arcTurningPoint}
            name="arcTurningPoint"
          />
        </Field>
        <Field label="도착점">
          <textarea className="field-textarea" defaultValue={concept.arcEnd} name="arcEnd" />
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[var(--line)] pt-5">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#e2b9b9] px-4 text-sm font-semibold text-[var(--danger)] hover:bg-[#fff5f5]"
          disabled={!onDelete}
          onClick={onDelete}
          type="button"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          삭제
        </button>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
          type="submit"
        >
          캐릭터 설정 저장
        </button>
      </div>
    </form>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[#6b746f]">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-3 mt-7 border-t border-[var(--line)] pt-5">
      <p className="text-xs font-bold text-[var(--accent)]">{eyebrow}</p>
      <h3 className="mt-1 text-lg font-bold">{title}</h3>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#f7f9f7] p-3">
      <p className="text-xs font-bold text-[#6b746f]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#25302b]">{value}</p>
    </div>
  );
}

function parseTags(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag) => typeof tag === "string") : [];
  } catch {
    return [];
  }
}

function formatTagsForInput(tags: string[]) {
  return tags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ");
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    analysis_draft: "분석 기반",
    draft: "초안",
    needs_revision: "수정 필요",
    planned: "설계 완료",
  };

  return labels[value] ?? value;
}
