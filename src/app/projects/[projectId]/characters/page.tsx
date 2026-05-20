import { CharacterStudio } from "@/components/character-studio";
import { getCharacterConcepts, getLatestAnalysis } from "@/lib/data";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [analysis, concepts] = await Promise.all([
    getLatestAnalysis(projectId),
    getCharacterConcepts(projectId),
  ]);

  return (
    <CharacterStudio
      analyzedCharacters={
        analysis?.characters.map((character) => ({
          arcSummary: character.arcSummary,
          conflict: character.conflict,
          desire: character.desire,
          firstAppearanceChapter: character.firstAppearanceChapter,
          id: character.id,
          importanceScore: character.importanceScore,
          name: character.name,
          relationshipNotes: character.relationshipNotes,
          role: character.role,
          weakness: character.weakness,
        })) ?? []
      }
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
