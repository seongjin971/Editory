import { CharacterStudio } from "@/components/character-studio";
import { getCharacterConcepts } from "@/lib/data";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const concepts = await getCharacterConcepts(projectId);

  return (
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
      projectId={projectId}
    />
  );
}
