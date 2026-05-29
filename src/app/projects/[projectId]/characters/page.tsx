import { CharacterStudio } from "@/components/character-studio";
import { ProjectWorkspaceFrame } from "@/components/project-workspace-frame";
import { getCharacterConcepts } from "@/lib/data";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const concepts = await getCharacterConcepts(projectId);

  return (
    <ProjectWorkspaceFrame
      companion={<CharacterCompanion conceptCount={concepts.length} />}
      companionTitle="설계 가이드"
      eyebrow="캐릭터 설계"
      meta={`${concepts.length}명 설계 중 · 원고 분석과 직접 설계 분리`}
      pageKey="characters"
      projectId={projectId}
      title="캐릭터 컨셉 작업실"
    >
      <CharacterStudio
        concepts={concepts.map((concept) => ({
          arcEnd: concept.arcEnd,
          arcStart: concept.arcStart,
          arcTurningPoint: concept.arcTurningPoint,
          appearance: concept.appearance,
          backstory: concept.backstory,
          conflict: concept.conflict,
          description: concept.description,
          desire: concept.desire,
          fear: concept.fear,
          goal: concept.goal,
          id: concept.id,
          logline: concept.logline,
          motivation: concept.motivation,
          name: concept.name,
          plotFunction: concept.plotFunction,
          relationshipNotes: concept.relationshipNotes,
          role: concept.role,
          secret: concept.secret,
          status: concept.status,
          strength: concept.strength,
          tagsJson: concept.tagsJson,
          voice: concept.voice,
          weakness: concept.weakness,
          wound: concept.wound,
        }))}
        embedded
        projectId={projectId}
      />
    </ProjectWorkspaceFrame>
  );
}

function CharacterCompanion({ conceptCount }: { conceptCount: number }) {
  return (
    <div className="space-y-3 text-sm leading-6">
      <div className="rounded-md bg-[var(--panel-soft)] p-3">
        <p className="font-bold">직접 설계</p>
        <p className="mt-1 text-[var(--muted)]">
          작가가 먼저 이름, 욕망, 약점, 관계, 아크를 정리하는 공간입니다.
        </p>
      </div>
      <div className="rounded-md bg-[var(--panel-soft)] p-3">
        <p className="font-bold">원고 분석</p>
        <p className="mt-1 text-[var(--muted)]">
          분석 리포트의 등장인물 결과와 비교하면서 설정을 보강합니다.
        </p>
      </div>
      <div className="rounded-md border border-[var(--line)] p-3">
        <p className="text-xs font-bold text-[var(--accent)]">현재 설계 인물</p>
        <p className="mt-1 text-2xl font-bold">{conceptCount}</p>
      </div>
    </div>
  );
}
