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
];

const SENTENCE_END_PATTERN = /[.!?。！？…]$/;

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

  const withoutFillers = removeFillerWords(normalized);
  const withoutRepeats = collapseRepeatedTokens(withoutFillers);
  const tidyPunctuation = withoutRepeats
    .replace(/\s+([,.!?。！？])/g, "$1")
    .replace(/([,.!?。！？])(?=\S)/g, "$1 ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const shaped = splitLongSentences(tidyPunctuation);

  return ensureFinalPunctuation(shaped);
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
  const sentences = value
    .split(/(?<=[.!?。！？])\s+/)
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
