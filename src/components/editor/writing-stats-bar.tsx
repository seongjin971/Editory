import { formatNumber } from "@/lib/format";

export function WritingStatsBar({
  characterCount,
  paragraphCount,
  showCharacterCount,
}: {
  characterCount: number;
  paragraphCount: number;
  showCharacterCount: boolean;
}) {
  const readingMinutes = Math.max(1, Math.ceil(characterCount / 550));

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-[var(--line)] bg-[#f8faf8] px-4 py-3 text-xs font-semibold text-[#64706a]">
      {showCharacterCount ? <span>{formatNumber(characterCount)}자</span> : null}
      <span>{formatNumber(paragraphCount)}문단</span>
      <span>예상 읽기 {readingMinutes}분</span>
    </div>
  );
}
