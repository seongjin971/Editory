import type { Manuscript, Project } from "@prisma/client";
import { countCharacters } from "@/lib/format";
import {
  EventCategorySchema,
  StoryAnalysisSchema,
  type EventCategory,
  type StoryAnalysis,
} from "./schema";
import type { StoryAnalyzer } from "./story-analyzer";

type Unit = {
  manuscript: Manuscript;
  text: string;
  narrativeIndex: number;
};

type CharacterEstimate = {
  name: string;
  count: number;
  firstIndex: number;
  chapterTitle: string;
  chapterPosition: number;
};

const EVENT_CATEGORIES = EventCategorySchema.options;

const CATEGORY_KEYWORDS: Record<EventCategory, string[]> = {
  도입: ["처음", "시작", "문을", "도착", "아침", "밤", "눈을"],
  "일상/설정": ["도시", "마을", "규칙", "평소", "일상", "기록", "설명", "연구소"],
  발단: ["발견", "도착", "시작", "계기", "편지", "신호", "사라"],
  갈등: ["갈등", "거절", "위험", "막", "싸", "다툼", "의심", "비밀"],
  "추적/탐색": ["찾", "조사", "추적", "탐색", "지도", "단서", "흔적"],
  감정선: ["마음", "두려", "슬픔", "분노", "믿", "후회", "기억"],
  반전: ["사실", "갑자기", "하지만", "그러나", "뜻밖", "드러"],
  클라이맥스: ["결심", "대결", "폭발", "마지막", "막다른", "선택"],
  "결말/후킹": ["끝", "다음", "문밖", "남았다", "예고", "후", "속삭"],
};

const CATEGORY_TARGETS: Record<EventCategory, [number, number]> = {
  도입: [5, 14],
  "일상/설정": [7, 18],
  발단: [8, 18],
  갈등: [12, 28],
  "추적/탐색": [8, 22],
  감정선: [8, 22],
  반전: [3, 12],
  클라이맥스: [6, 18],
  "결말/후킹": [4, 14],
};

const CAUSAL_WORDS = [
  "그래서",
  "때문",
  "왜냐하면",
  "따라서",
  "결국",
  "원인",
  "결과",
  "그로 인해",
  "이유",
  "바람에",
];

const KOREAN_STOPWORDS = new Set([
  "그리고",
  "하지만",
  "그러나",
  "그래서",
  "오늘",
  "내일",
  "어제",
  "사람",
  "도시",
  "마을",
  "시간",
  "장소",
  "기억",
  "문제",
  "사건",
  "원고",
  "챕터",
  "아침",
  "저녁",
  "비밀",
  "단서",
  "편지",
  "연구소",
  "보관소",
  "항구",
  "등대",
  "지도",
  "명부",
  "숫자",
  "서가",
  "이름",
  "열쇠",
  "신호",
  "표지",
  "문장",
  "기록",
  "카드",
  "본문",
  "렌즈",
  "페이지",
]);

const ROLE_ORDER = [
  "protagonist",
  "ally",
  "rival",
  "mentor",
  "antagonist",
  "side_character",
  "unknown",
] as const;

export class MockStoryAnalyzer implements StoryAnalyzer {
  async analyze(input: {
    project: Project;
    manuscripts: Manuscript[];
  }): Promise<StoryAnalysis> {
    const manuscripts = [...input.manuscripts].sort(
      (a, b) => a.chapterNumber - b.chapterNumber,
    );
    const allText = manuscripts.map((manuscript) => manuscript.body).join("\n\n");
    const units = buildUnits(manuscripts);
    const characters = estimateCharacters(manuscripts, allText);
    const characterNames = characters.map((character) => character.name);
    const storyline = buildStoryline(units, characterNames);
    const timeline = buildTimeline(storyline);
    const eventWeights = buildEventWeights(units);
    const consistencyIssues = buildIssues(manuscripts, units, characters, allText);
    const recommendations = buildRecommendations(eventWeights, consistencyIssues);

    return StoryAnalysisSchema.parse({
      metadata: {
        provider: "mock",
        model: "local-mock",
        generatedAt: new Date().toISOString(),
      },
      summary: buildSummary(input.project, manuscripts, storyline, characters),
      storyline,
      timeline,
      characters: characters.map((character, index) => ({
        name: character.name,
        role: ROLE_ORDER[index] ?? "side_character",
        desire: `${character.name}은(는) 현재 서사에서 잃어버린 질서나 답을 얻으려는 욕망으로 움직입니다.`,
        weakness:
          index === 0
            ? "상황을 혼자 판단하려는 경향이 있어 협력의 타이밍을 놓칠 수 있습니다."
            : "동기가 장면마다 충분히 설명되지 않으면 기능적인 인물로 보일 수 있습니다.",
        conflict: `${character.name}의 선택은 숨겨진 정보와 주변 인물의 이해관계에 부딪힙니다.`,
        relationshipNotes: `${character.name}은(는) 주요 사건을 통해 다른 인물과 신뢰, 의심, 의무의 관계를 형성합니다.`,
        arcSummary: `${character.name}은(는) 사건을 겪으며 단순한 반응에서 의식적인 선택으로 이동하는 흐름을 보입니다.`,
        firstAppearanceChapter: character.chapterTitle,
        importanceScore: Math.min(
          98,
          Math.max(35, 30 + character.count * 8 + (index === 0 ? 15 : 0)),
        ),
      })),
      eventWeights,
      consistencyIssues,
      recommendations,
    });
  }
}

function buildUnits(manuscripts: Manuscript[]) {
  let narrativeIndex = 1;

  return manuscripts.flatMap((manuscript) => {
    const paragraphs = splitParagraphs(manuscript.body);

    return paragraphs.map((text) => ({
      manuscript,
      text,
      narrativeIndex: narrativeIndex++,
    }));
  });
}

function splitParagraphs(body: string) {
  const paragraphs = body
    .split(/\r?\n\s*\r?\n|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length > 0) {
    return paragraphs;
  }

  return body
    .split(/(?<=[.!?。？！다요죠])\s+/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function estimateCharacters(
  manuscripts: Manuscript[],
  allText: string,
): CharacterEstimate[] {
  const counts = new Map<string, CharacterEstimate>();
  const tokenPattern =
    /([가-힣]{2,4})(?=은|는|이|가|을|를|와|과|에게|께|의|도|만|부터|까지|랑|하고)|\b([A-Z][A-Za-z]{1,24})\b/gu;

  for (const manuscript of manuscripts) {
    for (const match of manuscript.body.matchAll(tokenPattern)) {
      const name = (match[1] ?? match[2] ?? "").trim();

      if (!isLikelyName(name)) {
        continue;
      }

      const existing = counts.get(name);
      const firstIndex = allText.indexOf(name);

      counts.set(name, {
        name,
        count: (existing?.count ?? 0) + 1,
        firstIndex: existing?.firstIndex ?? firstIndex,
        chapterTitle: existing?.chapterTitle ?? manuscript.title,
        chapterPosition: existing?.chapterPosition ?? manuscript.chapterNumber,
      });
    }
  }

  const estimates = [...counts.values()]
    .filter((character) => character.count >= 2)
    .sort((a, b) => b.count - a.count || a.firstIndex - b.firstIndex)
    .slice(0, 8);

  if (estimates.length > 0) {
    return estimates;
  }

  return [
    {
      name: "주요 인물",
      count: 1,
      firstIndex: 0,
      chapterTitle: manuscripts[0]?.title ?? "원고 없음",
      chapterPosition: manuscripts[0]?.chapterNumber ?? 1,
    },
  ];
}

function isLikelyName(name: string) {
  if (name.length < 2 || name.length > 24) {
    return false;
  }

  if (KOREAN_STOPWORDS.has(name)) {
    return false;
  }

  return !/^\d+$/.test(name);
}

function buildStoryline(units: Unit[], characterNames: string[]) {
  const sampledUnits = sampleUnits(units, 8);

  if (sampledUnits.length === 0) {
    return [
      {
        beatOrder: 1,
        title: "분석할 원고가 없습니다",
        summary: "원고 본문이 추가되면 주요 사건과 전개 흐름을 추출합니다.",
        involvedCharacters: characterNames.slice(0, 1),
        conflict: "아직 판단할 수 있는 갈등 정보가 없습니다.",
        outcome: "원고 입력 후 결과를 갱신할 수 있습니다.",
        sourceChapterTitle: "원고 없음",
      },
    ];
  }

  return sampledUnits.map((unit, index) => {
    const involvedCharacters = characterNames.filter((name) =>
      unit.text.includes(name),
    );

    return {
      beatOrder: index + 1,
      title: makeTitle(unit.text, index + 1),
      summary: summarizeText(unit.text),
      involvedCharacters:
        involvedCharacters.length > 0
          ? involvedCharacters.slice(0, 4)
          : characterNames.slice(0, 2),
      conflict: inferConflict(unit.text),
      outcome: inferOutcome(unit.text, index === sampledUnits.length - 1),
      sourceChapterTitle: unit.manuscript.title,
    };
  });
}

function sampleUnits(units: Unit[], maxCount: number) {
  if (units.length <= maxCount) {
    return units;
  }

  const step = (units.length - 1) / (maxCount - 1);
  const selected = new Map<number, Unit>();

  for (let index = 0; index < maxCount; index += 1) {
    selected.set(Math.round(index * step), units[Math.round(index * step)]);
  }

  return [...selected.values()].sort((a, b) => a.narrativeIndex - b.narrativeIndex);
}

function makeTitle(text: string, fallbackOrder: number) {
  const firstSentence = text.split(/[.!?。？！]/u)[0]?.trim() ?? "";
  const compact = firstSentence.replace(/\s+/g, " ");

  if (compact.length === 0) {
    return `주요 장면 ${fallbackOrder}`;
  }

  return compact.length > 24 ? `${compact.slice(0, 24)}...` : compact;
}

function summarizeText(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();

  if (compact.length <= 120) {
    return compact;
  }

  return `${compact.slice(0, 118)}...`;
}

function inferConflict(text: string) {
  if (/비밀|의심|거짓|숨/u.test(text)) {
    return "숨겨진 정보가 드러나며 인물 간 신뢰가 흔들립니다.";
  }

  if (/위험|막|쫓|추적|싸/u.test(text)) {
    return "외부 압박이 커지며 다음 선택을 강요합니다.";
  }

  if (/마음|두려|후회|분노/u.test(text)) {
    return "인물의 감정과 판단이 서로 충돌합니다.";
  }

  return "장면의 목표와 방해 요소가 아직 더 선명해질 여지가 있습니다.";
}

function inferOutcome(text: string, isLast: boolean) {
  if (isLast) {
    return "다음 전개를 열어 두는 후킹 지점으로 이어집니다.";
  }

  if (/발견|단서|편지|신호/u.test(text)) {
    return "새로운 단서가 생겨 다음 사건으로 이동합니다.";
  }

  if (/결심|선택|약속/u.test(text)) {
    return "인물이 능동적인 결정을 내리며 전환점이 형성됩니다.";
  }

  return "상황 정보가 축적되고 다음 장면의 필요성이 생깁니다.";
}

function buildTimeline(
  storyline: ReturnType<typeof buildStoryline>,
): StoryAnalysis["timeline"] {
  const withTimeRank = storyline.map((beat, index) => {
    const text = `${beat.title} ${beat.summary}`;
    const timeRank = /과거|어릴|회상|전날/u.test(text) ? -10 + index : index;

    return { beat, timeRank };
  });

  const chronological = [...withTimeRank].sort(
    (a, b) => a.timeRank - b.timeRank || a.beat.beatOrder - b.beat.beatOrder,
  );
  const chronologicalOrderByBeat = new Map<number, number>();

  chronological.forEach((item, index) => {
    chronologicalOrderByBeat.set(item.beat.beatOrder, index + 1);
  });

  return storyline.map((beat) => ({
    chronologicalOrder: chronologicalOrderByBeat.get(beat.beatOrder) ?? beat.beatOrder,
    narrativeOrder: beat.beatOrder,
    estimatedTimeLabel: inferTimeLabel(`${beat.title} ${beat.summary}`),
    title: beat.title,
    description: beat.summary,
    characters: beat.involvedCharacters,
    location: inferLocation(`${beat.title} ${beat.summary}`),
    cause: inferCause(beat.summary),
    effect: beat.outcome,
    confidence: 0.72,
  }));
}

function inferTimeLabel(text: string) {
  if (/과거|어릴|회상/u.test(text)) {
    return "서사 이전";
  }

  if (/전날|어젯밤/u.test(text)) {
    return "사건 전날";
  }

  if (/다음날|이후/u.test(text)) {
    return "다음 날 이후";
  }

  return "현재 서사";
}

function inferLocation(text: string) {
  const locations = ["연구소", "역", "시장", "집", "골목", "광장", "옥상", "항구"];
  return locations.find((location) => text.includes(location)) ?? "장소 미상";
}

function inferCause(text: string) {
  if (/때문|그래서|결국|따라서/u.test(text)) {
    return "본문 안에 원인과 결과를 연결하는 표현이 있습니다.";
  }

  if (/발견|단서|편지|신호/u.test(text)) {
    return "새로운 정보가 사건의 직접 원인으로 작동합니다.";
  }

  return "원인 연결은 추정 단계입니다.";
}

function buildEventWeights(units: Unit[]): StoryAnalysis["eventWeights"] {
  const counts = Object.fromEntries(
    EVENT_CATEGORIES.map((category) => [category, 0]),
  ) as Record<EventCategory, number>;

  units.forEach((unit, index) => {
    const category = classifyUnit(unit.text, index, Math.max(1, units.length));
    counts[category] += countCharacters(unit.text);
  });

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return EVENT_CATEGORIES.map((category) => {
    const characterCount = counts[category];
    const percentage = total === 0 ? 0 : round((characterCount / total) * 100);
    const diagnosis = diagnoseCategory(category, percentage);

    return {
      category,
      characterCount,
      percentage,
      diagnosis,
      recommendation: recommendForCategory(category, diagnosis),
    };
  });
}

function classifyUnit(text: string, index: number, totalUnits: number): EventCategory {
  const scores = EVENT_CATEGORIES.map((category) => ({
    category,
    score: CATEGORY_KEYWORDS[category].filter((keyword) => text.includes(keyword))
      .length,
  })).sort((a, b) => b.score - a.score);

  if (scores[0]?.score > 0) {
    return scores[0].category;
  }

  const position = index / totalUnits;

  if (position < 0.12) return "도입";
  if (position < 0.28) return "발단";
  if (position < 0.5) return "갈등";
  if (position < 0.66) return "추적/탐색";
  if (position < 0.82) return "감정선";
  if (position < 0.93) return "클라이맥스";

  return "결말/후킹";
}

function diagnoseCategory(category: EventCategory, percentage: number) {
  const [low, high] = CATEGORY_TARGETS[category];

  if (percentage < low) return "부족" as const;
  if (percentage > high) return "과다" as const;
  return "적정" as const;
}

function recommendForCategory(
  category: EventCategory,
  diagnosis: "부족" | "적정" | "과다",
) {
  if (diagnosis === "부족") {
    return `${category} 비중을 보강하면 독자가 사건의 기능을 더 빨리 파악할 수 있습니다.`;
  }

  if (diagnosis === "과다") {
    return `${category} 장면을 압축하거나 다른 기능의 장면과 결합해 리듬을 조정하세요.`;
  }

  return `${category} 비중은 현재 원고 길이 안에서 안정적인 편입니다.`;
}

function buildIssues(
  manuscripts: Manuscript[],
  units: Unit[],
  characters: CharacterEstimate[],
  allText: string,
): StoryAnalysis["consistencyIssues"] {
  const issues: StoryAnalysis["consistencyIssues"] = [];
  const causalCount = CAUSAL_WORDS.reduce(
    (sum, word) => sum + countOccurrences(allText, word),
    0,
  );

  if (countCharacters(allText) > 500 && causalCount < Math.max(2, units.length / 4)) {
    issues.push({
      severity: "medium",
      type: "missing_causal_link",
      description: "사건은 이어지지만 원인과 결과를 직접 연결하는 문장이 적습니다.",
      relatedChapter: "전체 원고",
      suggestion: "각 주요 사건 뒤에 인물이 왜 다음 행동을 선택하는지 한 문장씩 보강하세요.",
    });
  }

  const repeatedParagraph = findRepeatedParagraph(units);
  if (repeatedParagraph) {
    issues.push({
      severity: "low",
      type: "repeated_information",
      description: "동일하거나 매우 유사한 문단이 반복되어 정보 밀도가 낮아질 수 있습니다.",
      relatedChapter: repeatedParagraph.manuscript.title,
      suggestion: "반복 문단 중 하나를 삭제하거나 새로운 정보로 변주하세요.",
    });
  }

  const lengthIssue = findChapterLengthIssue(manuscripts);
  if (lengthIssue) {
    issues.push({
      severity: "medium",
      type: "other",
      description: `${lengthIssue.title}의 분량이 다른 챕터보다 크게 길어 페이스가 흔들릴 수 있습니다.`,
      relatedChapter: lengthIssue.title,
      suggestion: "긴 챕터를 사건 기능별로 나누거나 일부 설명을 다음 챕터로 분산하세요.",
    });
  }

  const lateCharacter = characters.find(
    (character) =>
      manuscripts.length > 1 &&
      character.chapterPosition > Math.ceil(manuscripts.length / 2) &&
      character.count >= 4,
  );

  if (lateCharacter) {
    issues.push({
      severity: "high",
      type: "motivation_inconsistency",
      description: `${lateCharacter.name}이(가) 뒤늦게 강한 비중으로 등장해 동기 준비가 부족해 보일 수 있습니다.`,
      relatedChapter: lateCharacter.chapterTitle,
      suggestion: "초반부에 이름, 흔적, 평판, 목표 중 하나를 먼저 심어 두세요.",
    });
  }

  return issues.slice(0, 6);
}

function countOccurrences(text: string, word: string) {
  return text.split(word).length - 1;
}

function findRepeatedParagraph(units: Unit[]) {
  const seen = new Set<string>();

  for (const unit of units) {
    const normalized = unit.text.replace(/\s+/g, "");

    if (normalized.length < 40) {
      continue;
    }

    if (seen.has(normalized)) {
      return unit;
    }

    seen.add(normalized);
  }

  return null;
}

function findChapterLengthIssue(manuscripts: Manuscript[]) {
  if (manuscripts.length < 2) {
    return null;
  }

  const lengths = manuscripts.map((manuscript) => ({
    title: manuscript.title,
    length: countCharacters(manuscript.body),
  }));
  const average =
    lengths.reduce((sum, chapter) => sum + chapter.length, 0) / lengths.length;
  const longest = lengths.sort((a, b) => b.length - a.length)[0];

  return longest.length > average * 1.9 ? longest : null;
}

function buildRecommendations(
  eventWeights: StoryAnalysis["eventWeights"],
  issues: StoryAnalysis["consistencyIssues"],
) {
  const weakCategories = eventWeights
    .filter((weight) => weight.diagnosis === "부족")
    .slice(0, 2)
    .map((weight) => weight.category);

  return [
    weakCategories.length > 0
      ? `${weakCategories.join(", ")} 장면을 보강해 서사의 기능 분포를 맞추세요.`
      : "사건 기능 분포는 MVP 기준에서 균형이 좋습니다.",
    issues.length > 0
      ? "설정 충돌 후보를 먼저 정리한 뒤 장면 순서를 조정하세요."
      : "현재 감지된 큰 설정 충돌은 없으므로 다음 분석에서는 긴장 곡선을 더 세밀하게 확인하세요.",
    "각 핵심 사건마다 목표, 방해, 결과가 한 번에 보이도록 문단 첫머리나 끝문장을 다듬어 보세요.",
  ];
}

function buildSummary(
  project: Project,
  manuscripts: Manuscript[],
  storyline: StoryAnalysis["storyline"],
  characters: CharacterEstimate[],
) {
  return `${project.title}은(는) ${manuscripts.length}개 원고에서 ${storyline.length}개의 핵심 사건과 ${characters.length}명의 주요 인물을 추정했습니다. 현재 분석은 장면 기능, 인물 반복 출현, 원인-결과 연결어를 기준으로 만든 로컬 Mock 결과입니다.`;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
