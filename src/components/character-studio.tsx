"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  createCharacterConcept,
  deleteCharacterConcept,
  importAnalyzedCharacterAsConcept,
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

type AnalyzedCharacterItem = {
  arcSummary: string;
  conflict: string;
  desire: string;
  firstAppearanceChapter: string;
  id: string;
  importanceScore: number;
  name: string;
  relationshipNotes: string;
  role: string;
  weakness: string;
};

export function CharacterStudio({
  analyzedCharacters,
  concepts,
  projectId,
}: {
  analyzedCharacters: AnalyzedCharacterItem[];
  concepts: CharacterConceptItem[];
  projectId: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"concept" | "analysis">("concept");
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(concepts[0]?.id ?? null);
  const selectedConcept =
    concepts.find((concept) => concept.id === selectedId) ?? concepts[0] ?? null;
  const matchedAnalysis = useMemo(() => {
    if (!selectedConcept) {
      return null;
    }

    return (
      analyzedCharacters.find(
        (character) => normalizeName(character.name) === normalizeName(selectedConcept.name),
      ) ?? null
    );
  }, [analyzedCharacters, selectedConcept]);

  async function handleCreateConcept() {
    setBusy("create");
    try {
      const result = await createCharacterConcept(projectId);
      setSelectedId(result.conceptId);
      setMode("concept");
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

  async function handleImport(characterId: string) {
    setBusy(characterId);
    try {
      const result = await importAnalyzedCharacterAsConcept({ characterId, projectId });
      setSelectedId(result.conceptId);
      setMode("concept");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="rounded-lg border border-[var(--line)] bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">등장인물</p>
            <h2 className="mt-2 text-2xl font-bold">캐릭터 설계실</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              먼저 인물 컨셉을 정해두거나, 원고에서 추출된 분석 결과를 바탕으로
              설정 초안을 만들 수 있습니다.
            </p>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 text-sm xl:max-w-sm">
            <Metric label="설계 인물" value={`${concepts.length}`} />
            <Metric label="분석 인물" value={`${analyzedCharacters.length}`} />
            <Metric
              label="연결됨"
              value={`${countMatchedConcepts(concepts, analyzedCharacters)}`}
            />
          </div>
        </div>
      </header>

      <section className="rounded-lg border border-[var(--line)] bg-white p-3">
        <div className="grid grid-cols-2 rounded-md bg-[#eef2ef] p-1 text-sm font-semibold md:w-[420px]">
          <ModeButton active={mode === "concept"} onClick={() => setMode("concept")}>
            컨셉 설계
          </ModeButton>
          <ModeButton active={mode === "analysis"} onClick={() => setMode("analysis")}>
            원고 분석
          </ModeButton>
        </div>
      </section>

      {mode === "concept" ? (
        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-[var(--line)] bg-white p-4 xl:sticky xl:top-4 xl:self-start">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">인물 목록</h3>
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
              matchedAnalysis={matchedAnalysis}
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
      ) : (
        <AnalysisImportBoard
          analyzedCharacters={analyzedCharacters}
          busy={busy}
          onImport={handleImport}
        />
      )}
    </div>
  );
}

function CharacterConceptForm({
  concept,
  matchedAnalysis,
  onDelete,
  projectId,
}: {
  concept: CharacterConceptItem;
  matchedAnalysis: AnalyzedCharacterItem | null;
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

      <AnalysisBridge analysis={matchedAnalysis} />

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

function AnalysisBridge({
  analysis,
}: {
  analysis: AnalyzedCharacterItem | null;
}) {
  return (
    <details
      className="mt-5 rounded-lg border border-[#d9e7e4] bg-[#f7fbf9] p-4 text-sm"
      open={analysis !== null}
    >
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-[var(--accent)]">원고 분석 연결</p>
            <p className="mt-1 text-[#4f5d57]">
              같은 이름의 분석 인물이 있으면 설정과 원고의 방향을 함께 봅니다.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#4f5d57]">
            {analysis ? `비중 ${analysis.importanceScore}점` : "연결 대기"}
          </span>
        </div>
      </summary>
      {!analysis ? (
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          원고 분석을 실행한 뒤 이름이 같은 인물이 발견되면 욕망, 약점, 갈등,
          아크가 이곳에 표시됩니다.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          <CompareItem label="역할" value={roleLabels[analysis.role] ?? analysis.role} />
          <CompareItem label="욕망" value={analysis.desire} />
          <CompareItem label="약점" value={analysis.weakness} />
          <CompareItem label="갈등" value={analysis.conflict} />
          <CompareItem label="아크" value={analysis.arcSummary} />
          <CompareItem label="첫 등장" value={analysis.firstAppearanceChapter} />
        </div>
      )}
    </details>
  );
}

function AnalysisImportBoard({
  analyzedCharacters,
  busy,
  onImport,
}: {
  analyzedCharacters: AnalyzedCharacterItem[];
  busy: string | null;
  onImport: (characterId: string) => void;
}) {
  if (analyzedCharacters.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#cbd4cf] bg-white p-8 text-center text-sm text-[var(--muted)]">
        원고 분석을 실행하면 추출된 인물을 설정 초안으로 가져올 수 있습니다.
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white">
      <div className="border-b border-[var(--line)] p-5">
        <p className="text-sm font-semibold text-[var(--accent)]">원고 분석</p>
        <h3 className="mt-1 text-xl font-bold">추출된 인물로 설정 만들기</h3>
      </div>
      <div className="divide-y divide-[var(--line)]">
        {analyzedCharacters.map((character) => (
          <article
            className="grid gap-4 p-5 lg:grid-cols-[180px_1fr_160px] lg:items-center"
            key={character.id}
          >
            <div>
              <h4 className="text-lg font-bold">{character.name}</h4>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {roleLabels[character.role] ?? character.role} ·{" "}
                {character.importanceScore}
              </p>
            </div>
            <div className="grid gap-2 text-sm leading-6 text-[#34413b] md:grid-cols-3">
              <MiniInfo label="욕망" value={character.desire} />
              <MiniInfo label="약점" value={character.weakness} />
              <MiniInfo label="갈등" value={character.conflict} />
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:opacity-50"
              disabled={busy !== null}
              onClick={() => onImport(character.id)}
              type="button"
            >
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {busy === character.id ? "가져오는 중" : "설정 초안 만들기"}
            </button>
          </article>
        ))}
      </div>
    </section>
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

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded px-4 py-2 ${
        active ? "bg-white text-[#17484b] shadow-sm" : "text-[#58615c]"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
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

function CompareItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#f7f9f7] p-3">
      <p className="text-xs font-bold text-[#6b746f]">{label}</p>
      <p className="mt-1 leading-6">{value}</p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#6b746f]">{label}</p>
      <p className="mt-1 line-clamp-2">{value}</p>
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

function normalizeName(value: string) {
  return value.trim().toLowerCase();
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

function countMatchedConcepts(
  concepts: CharacterConceptItem[],
  analyzedCharacters: AnalyzedCharacterItem[],
) {
  const analyzedNames = new Set(
    analyzedCharacters.map((character) => normalizeName(character.name)),
  );

  return concepts.filter((concept) => analyzedNames.has(normalizeName(concept.name)))
    .length;
}
