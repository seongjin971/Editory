export type StyleProfile = {
  averageSentenceLength: number;
  dialogueRatio: number;
  label: string;
  note: string;
  tags: string[];
};

export type GrammarIssue = {
  description: string;
  example: string;
  severity: "low" | "medium";
  suggestion: string;
};

export type SentenceSuggestion = {
  reason: string;
  source: string;
  suggestion: string;
};

export type RepeatedWord = {
  count: number;
  suggestions: string[];
  word: string;
};

export type WritingAssistantResult = {
  grammarIssues: GrammarIssue[];
  repeatedWords: RepeatedWord[];
  sentenceSuggestions: SentenceSuggestion[];
  styleProfile: StyleProfile;
};

type LexiconEntry = {
  category: string;
  keywords: string[];
  words: string[];
};

const STOP_WORDS = new Set([
  "그리고",
  "그러나",
  "하지만",
  "그래서",
  "그런데",
  "나는",
  "그는",
  "그녀",
  "우리",
  "그들",
  "것은",
  "것이",
  "것을",
  "있다",
  "없다",
  "했다",
  "한다",
  "있는",
  "없는",
  "한다면",
  "때문",
]);

const SYNONYMS: Record<string, string[]> = {
  감정: ["정서", "마음결", "기색", "동요"],
  걸었다: ["다가섰다", "발을 옮겼다", "천천히 나아갔다"],
  길: ["골목", "통로", "행로", "길목"],
  눈: ["시선", "눈빛", "눈동자"],
  말했다: ["속삭였다", "대답했다", "중얼거렸다", "입을 열었다"],
  문: ["문짝", "입구", "문틈", "현관"],
  바람: ["기류", "찬바람", "외풍", "숨결"],
  밤: ["야간", "어둠", "심야", "밤공기"],
  보았다: ["응시했다", "바라보았다", "훑었다", "시선을 두었다"],
  빛: ["광원", "희미한 빛", "섬광", "여광"],
  사람: ["인물", "누군가", "행인", "상대"],
  생각: ["짐작", "예감", "판단", "의심"],
  소리: ["기척", "울림", "잡음", "파열음"],
  어둠: ["그늘", "암흑", "먹빛", "어스름"],
};

const STYLE_WORDS = {
  classic: ["운명", "침묵", "영혼", "비극", "고독", "기억", "숙명"],
  contemporary: ["메시지", "휴대폰", "카페", "엘리베이터", "아파트", "버스"],
  sensory: ["냄새", "온기", "차가운", "축축한", "희미한", "거친", "눅눅한"],
};

const WORD_LEXICON: LexiconEntry[] = [
  {
    category: "불안/예감",
    keywords: ["불안", "찜찜", "무서운", "예감", "위험", "초조"],
    words: ["불길한", "섬뜩한", "뒤숭숭한", "서늘한", "어수선한"],
  },
  {
    category: "오래된 공간",
    keywords: ["낡은", "오래된", "먼지", "냄새", "폐허", "보관소"],
    words: ["퀴퀴한", "묵은", "바랜", "눅진한", "먼지 낀"],
  },
  {
    category: "희미한 빛",
    keywords: ["빛", "희미", "어둠", "조명", "달", "새벽"],
    words: ["어스름한", "푸르스름한", "창백한", "흐릿한", "잔광"],
  },
  {
    category: "긴장된 침묵",
    keywords: ["침묵", "조용", "긴장", "정적", "숨"],
    words: ["숨 막히는", "팽팽한", "정적에 잠긴", "말 없는", "고요한"],
  },
  {
    category: "관계 변화",
    keywords: ["사이", "관계", "멀어진", "가까운", "믿음", "의심"],
    words: ["균열", "거리감", "유대", "의구심", "끌림"],
  },
  {
    category: "추적/탐색",
    keywords: ["찾다", "추적", "단서", "흔적", "조사", "탐색"],
    words: ["실마리", "흔적", "단초", "수색", "뒤쫓다"],
  },
];

export function analyzeWritingAssistant(text: string): WritingAssistantResult {
  const normalized = normalizeText(text);
  const sentences = splitSentences(normalized);
  const words = extractWords(normalized);

  return {
    grammarIssues: findGrammarIssues(normalized, sentences),
    repeatedWords: findRepeatedWords(words),
    sentenceSuggestions: buildSentenceSuggestions(sentences, words),
    styleProfile: analyzeStyle(normalized, sentences),
  };
}

export function findRelatedWords(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const queryTokens = extractWords(normalizedQuery);

  return WORD_LEXICON.map((entry) => {
    const score = entry.keywords.reduce((total, keyword) => {
      if (normalizedQuery.includes(keyword)) {
        return total + 3;
      }

      if (queryTokens.some((token) => keyword.includes(token) || token.includes(keyword))) {
        return total + 1;
      }

      return total;
    }, 0);

    return { ...entry, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => ({
      category: entry.category,
      keywords: entry.keywords,
      words: entry.words,
    }));
}

function analyzeStyle(text: string, sentences: string[]): StyleProfile {
  const sentenceCount = Math.max(1, sentences.length);
  const averageSentenceLength = Math.round(
    sentences.reduce((total, sentence) => total + sentence.length, 0) / sentenceCount,
  );
  const dialogueMarks = (text.match(/[“”"']/g) ?? []).length + (text.match(/\n\s*-/g) ?? []).length;
  const dialogueRatio = Math.min(1, dialogueMarks / Math.max(1, sentenceCount));
  const classicScore = countMatches(text, STYLE_WORDS.classic);
  const contemporaryScore = countMatches(text, STYLE_WORDS.contemporary);
  const sensoryScore = countMatches(text, STYLE_WORDS.sensory);
  const tags: string[] = [];

  if (averageSentenceLength >= 68) {
    tags.push("장문 호흡");
  } else if (averageSentenceLength <= 34) {
    tags.push("짧은 호흡");
  } else {
    tags.push("중간 호흡");
  }

  if (dialogueRatio >= 0.25) {
    tags.push("대화 중심");
  }

  if (sensoryScore >= 4) {
    tags.push("감각 묘사");
  }

  if (classicScore > contemporaryScore + 1 || averageSentenceLength >= 72) {
    return {
      averageSentenceLength,
      dialogueRatio,
      label: "고전적 서사 톤",
      note: "문장 호흡이 길고 추상 정서가 강합니다. 장면 전환부에서는 짧은 문장을 섞으면 밀도가 살아납니다.",
      tags,
    };
  }

  if (dialogueRatio >= 0.25 || contemporaryScore >= classicScore + 2) {
    return {
      averageSentenceLength,
      dialogueRatio,
      label: "컨템포러리 톤",
      note: "현재 장면성과 대화성이 잘 보입니다. 반복 동사만 줄이면 더 선명해집니다.",
      tags,
    };
  }

  if (sensoryScore >= 4) {
    return {
      averageSentenceLength,
      dialogueRatio,
      label: "서정적 묘사 톤",
      note: "감각 단서가 많아 분위기 형성이 좋습니다. 사건 원인과 결과를 한 문장씩 더 보강해도 좋습니다.",
      tags,
    };
  }

  return {
    averageSentenceLength,
    dialogueRatio,
    label: "균형형 서사 톤",
    note: "서술과 장면 진행이 무난하게 균형을 이룹니다. 핵심 장면에 더 강한 감각어를 배치해보세요.",
    tags,
  };
}

function findGrammarIssues(text: string, sentences: string[]): GrammarIssue[] {
  const issues: GrammarIssue[] = [];

  if (/[ \t]{2,}/.test(text)) {
    issues.push({
      description: "연속 공백이 있습니다.",
      example: firstMatch(text, /[^\n]{0,16}[ \t]{2,}[^\n]{0,16}/),
      severity: "low",
      suggestion: "공백을 한 칸으로 정리하세요.",
    });
  }

  if (/\s+[,.!?]/.test(text)) {
    issues.push({
      description: "문장부호 앞에 공백이 있습니다.",
      example: firstMatch(text, /[^\n]{0,16}\s+[,.!?][^\n]{0,16}/),
      severity: "low",
      suggestion: "문장부호는 앞 단어에 붙여 쓰는 편이 자연스럽습니다.",
    });
  }

  if (/[!?]{2,}|\.{4,}|,{2,}/.test(text)) {
    issues.push({
      description: "강한 문장부호가 반복됩니다.",
      example: firstMatch(text, /[^\n]{0,18}([!?]{2,}|\.{4,}|,{2,})[^\n]{0,18}/),
      severity: "low",
      suggestion: "강조가 필요한 대사 외에는 부호 반복을 줄여보세요.",
    });
  }

  if ((text.match(/"/g) ?? []).length % 2 === 1 || (text.match(/“/g) ?? []).length !== (text.match(/”/g) ?? []).length) {
    issues.push({
      description: "따옴표 짝이 맞지 않을 수 있습니다.",
      example: "따옴표 개수를 확인하세요.",
      severity: "medium",
      suggestion: "대사 시작과 끝의 따옴표를 다시 확인하세요.",
    });
  }

  const longSentence = sentences.find((sentence) => sentence.length >= 120);

  if (longSentence) {
    issues.push({
      description: "긴 문장이 있습니다.",
      example: trimExample(longSentence),
      severity: "medium",
      suggestion: "원인, 행동, 결과를 기준으로 두 문장으로 나눠보세요.",
    });
  }

  return issues.slice(0, 6);
}

function findRepeatedWords(words: string[]): RepeatedWord[] {
  const counts = new Map<string, number>();

  for (const word of words) {
    if (STOP_WORDS.has(word) || word.length < 2) {
      continue;
    }

    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({
      count,
      suggestions: SYNONYMS[word] ?? inferSuggestions(word),
      word,
    }));
}

function buildSentenceSuggestions(sentences: string[], words: string[]): SentenceSuggestion[] {
  const suggestions: SentenceSuggestion[] = [];
  const longSentences = sentences.filter((sentence) => sentence.length >= 105).slice(0, 2);

  for (const sentence of longSentences) {
    suggestions.push({
      reason: "긴 문장",
      source: trimExample(sentence),
      suggestion: "중간 접속부에서 끊고, 마지막 문장을 결과나 감정 반응으로 따로 세워보세요.",
    });
  }

  const repeated = findRepeatedWords(words).slice(0, 3);

  for (const item of repeated) {
    suggestions.push({
      reason: "반복 어휘",
      source: `${item.word} · ${item.count}회`,
      suggestion:
        item.suggestions.length > 0
          ? `${item.suggestions.join(", ")} 같은 표현으로 일부만 바꿔보세요.`
          : "같은 단어가 같은 장면 안에서 반복됩니다. 일부는 구체 행동이나 감각 묘사로 바꿔보세요.",
    });
  }

  return suggestions.slice(0, 5);
}

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").trim();
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?。！？…]|다\.|요\.|까\.)\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractWords(text: string) {
  return (text.match(/[가-힣A-Za-z]{2,}/g) ?? []).map((word) => word.toLowerCase());
}

function countMatches(text: string, words: string[]) {
  return words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
}

function firstMatch(text: string, pattern: RegExp) {
  return trimExample(text.match(pattern)?.[0] ?? "");
}

function trimExample(value: string) {
  const trimmed = value.trim();

  if (trimmed.length <= 90) {
    return trimmed;
  }

  return `${trimmed.slice(0, 90)}...`;
}

function inferSuggestions(word: string) {
  if (word.endsWith("했다")) {
    return ["보여주었다", "드러냈다", "이어갔다"];
  }

  if (word.endsWith("적인")) {
    return [word.replace(/적인$/u, "다운"), word.replace(/적인$/u, "스러운")];
  }

  return [];
}
