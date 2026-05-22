import "server-only";

import mammoth from "mammoth";

const MAX_WORD_FILE_SIZE = 12 * 1024 * 1024;
const WORD_DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ImportedWordDocument = {
  contentHtml: string;
  fileBaseName: string;
  plainText: string;
};

export async function parseWordDocument(file: File): Promise<ImportedWordDocument> {
  validateWordFile(file);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml(
      { buffer },
      {
        externalFileAccess: false,
        ignoreEmptyParagraphs: false,
        includeDefaultStyleMap: true,
      },
    ),
    mammoth.extractRawText({ buffer }),
  ]);
  const plainText = normalizePlainText(textResult.value);
  const contentHtml = sanitizeMammothHtml(htmlResult.value) || plainTextToHtml(plainText);

  if (!plainText.trim()) {
    throw new Error("문서에서 가져올 수 있는 텍스트를 찾지 못했습니다.");
  }

  return {
    contentHtml,
    fileBaseName: getFileBaseName(file.name),
    plainText,
  };
}

function validateWordFile(file: File) {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("가져올 Word 문서를 선택해 주세요.");
  }

  if (file.size > MAX_WORD_FILE_SIZE) {
    throw new Error("12MB 이하의 .docx 문서만 가져올 수 있습니다.");
  }

  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".doc")) {
    throw new Error("현재 MVP에서는 .docx 문서만 지원합니다. Word에서 .docx로 저장한 뒤 다시 가져와 주세요.");
  }

  if (!lowerName.endsWith(".docx") && file.type !== WORD_DOCX_MIME) {
    throw new Error(".docx 형식의 Word 문서만 가져올 수 있습니다.");
  }
}

function normalizePlainText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeMammothHtml(value: string) {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|svg|img)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|svg|img)\b[^>]*\/?>/gi, "")
    .replace(
      /<(\/?)(?!p\b|br\b|strong\b|em\b|b\b|i\b|u\b|s\b|strike\b|h1\b|h2\b|h3\b|ul\b|ol\b|li\b|blockquote\b|hr\b)([a-z][a-z0-9-]*)(?:\s[^>]*)?>/gi,
      "",
    )
    .replace(
      /<(p|br|strong|em|b|i|u|s|strike|h1|h2|h3|ul|ol|li|blockquote|hr)\b[^>]*>/gi,
      "<$1>",
    )
    .trim();
}

function plainTextToHtml(value: string) {
  const paragraphs = value
    .split(/\n\s*\n|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return "<p></p>";
  }

  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFileBaseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").trim() || "가져온 원고";
}
