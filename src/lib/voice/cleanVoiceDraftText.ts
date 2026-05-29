const FILLER_WORDS = [
  "어",
  "음",
  "으음",
  "아",
  "아니",
  "그니까",
  "그러니까",
  "저기",
  "막",
  "에이",
  "어유",
  "에휴",
];

const SENTENCE_END_PATTERN = /[.!?。！？…]$/;

// Spoken dictation commands -> punctuation / newline. User-controlled, near-zero false-positive.
const DICTATION_COMMANDS: Array<[RegExp, string]> = [
  [/\s*(?:마침표|온점)\s*/g, ". "],
  [/\s*(?:쉼표|반점|콤마)\s*/g, ", "],
  [/\s*(?:물음표|의문부호)\s*/g, "? "],
  [/\s*(?:느낌표|감탄부호)\s*/g, "! "],
  [/\s*(?:새\s*문단|새문단|단락\s*나눔)\s*/g, "\n\n"],
  [/\s*(?:줄바꿈|개행|엔터)\s*/g, "\n"],
];

// Korean declarative / interrogative / exclamatory final endings, used to gate sentence-break insertion.
const SENTENCE_END_VERB_FORMS =
  "(?:다|요|까|네|군|지|구나|어요|아요|에요|예요|니다|습니다|입니다|군요|네요|까요)";

// Conjunctions / discourse markers that strongly tend to start a new sentence when preceded by a verb ending.
const SENTENCE_STARTERS = [
  "하지만",
  "그러나",
  "따라서",
  "그러므로",
  "게다가",
  "또한",
  "한편",
  "그리고",
  "그래서",
  "그런데",
];

export function cleanVoiceDraftText(input: string) {
  // TODO: 추후 프로젝트 등장인물/지명/이전 문맥을 참고한 LLM 보정 연결.
  const normalized = input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) {
    return "";
  }

  // Filler/repeat removal first so dictation \n inserts later are not collapsed
  // by the space-based tokenizer in those helpers.
  const withoutFillers = removeFillerWords(normalized);
  const withoutRepeats = collapseRepeatedTokens(withoutFillers);
  const withCommands = applyDictationCommands(withoutRepeats);
  const tidyPunctuation = withCommands
    .replace(/[ \t]+([,.!?。！？])/g, "$1")
    .replace(/([,.!?。！？])(?=\S)/g, "$1 ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  const withBreaks = insertSentenceBreaks(tidyPunctuation);
  const shaped = splitLongSentences(withBreaks);

  return ensureFinalPunctuation(shaped);
}

function applyDictationCommands(value: string) {
  let result = value;

  for (const [pattern, replacement] of DICTATION_COMMANDS) {
    result = result.replace(pattern, replacement);
  }

  // Collapse runs of duplicate punctuation that can appear when commands stack (e.g. "마침표 줄바꿈").
  result = result
    .replace(/\.\s*\.+/g, ".")
    .replace(/,\s*,+/g, ",")
    .replace(/\?\s*\?+/g, "?")
    .replace(/!\s*!+/g, "!");

  return result;
}

function insertSentenceBreaks(value: string) {
  let result = value;

  for (const starter of SENTENCE_STARTERS) {
    const pattern = new RegExp(
      `([가-힣]+?${SENTENCE_END_VERB_FORMS})\\s+(${starter})(?=\\s|$|[.!?,])`,
      "gu",
    );
    result = result.replace(pattern, "$1. $2");
  }

  return result;
}

function removeFillerWords(value: string) {
  return value
    .split(/\s+/)
    .filter((token) => {
      const plainToken = token.replace(/[,.!?。！？"“”'‘’]/g, "");
      return !FILLER_WORDS.includes(plainToken);
    })
    .join(" ")
    .trim();
}

function collapseRepeatedTokens(value: string) {
  const tokens = value.split(/\s+/);
  const compacted: string[] = [];

  for (const token of tokens) {
    const previous = compacted.at(-1);
    const normalizedToken = normalizeToken(token);
    const normalizedPrevious = previous ? normalizeToken(previous) : "";

    if (normalizedToken && normalizedToken === normalizedPrevious) {
      continue;
    }

    compacted.push(token);
  }

  return compacted.join(" ");
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[,.!?。！？"“”'‘’]/g, "");
}

function splitLongSentences(value: string) {
  // Use [ \t]+ instead of \s+ so that explicit paragraph breaks (\n\n from "새 문단")
  // and single \n (from "줄바꿈") survive the split/join roundtrip.
  const sentences = value
    .split(/(?<=[.!?。！？])[ \t]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return value;
  }

  return sentences
    .flatMap((sentence) => splitLongSentence(sentence))
    .join("\n")
    .trim();
}

function splitLongSentence(sentence: string) {
  const maxLength = 130;

  if (sentence.length <= maxLength) {
    return [sentence];
  }

  const chunks: string[] = [];
  let remaining = sentence;

  while (remaining.length > maxLength) {
    const pivot = findSplitPoint(remaining, maxLength);
    chunks.push(ensureFinalPunctuation(remaining.slice(0, pivot).trim()));
    remaining = remaining.slice(pivot).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

function findSplitPoint(value: string, maxLength: number) {
  const candidates = [",", " 그리고 ", " 하지만 ", " 그런데 ", " 그래서 ", " "];

  for (const candidate of candidates) {
    const index = value.lastIndexOf(candidate, maxLength);

    if (index > 48) {
      return index + candidate.length;
    }
  }

  return maxLength;
}

function ensureFinalPunctuation(value: string) {
  const trimmed = value.trim();

  if (!trimmed || SENTENCE_END_PATTERN.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}.`;
}
