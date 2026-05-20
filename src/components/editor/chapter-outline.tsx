import { FilePlus2 } from "lucide-react";
import { countCharacters, formatNumber } from "@/lib/format";

export type ChapterOutlineItem = {
  body: string;
  chapterNumber: number;
  id: string;
  title: string;
};

export function ChapterOutline({
  busy,
  chapters,
  onCreateChapter,
  onSelectChapter,
  selectedId,
}: {
  busy: boolean;
  chapters: ChapterOutlineItem[];
  onCreateChapter: () => void;
  onSelectChapter: (manuscriptId: string) => void;
  selectedId: string | null;
}) {
  return (
    <aside className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">챕터</h2>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--line)] text-[#34413b] transition hover:border-[#9aa6a0]"
          disabled={busy}
          onClick={onCreateChapter}
          title="새 챕터"
          type="button"
        >
          <FilePlus2 aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {chapters.length === 0 ? (
          <button
            className="w-full rounded-md border border-dashed border-[#cbd4cf] px-3 py-8 text-center text-sm font-semibold text-[var(--muted)]"
            disabled={busy}
            onClick={onCreateChapter}
            type="button"
          >
            첫 챕터 만들기
          </button>
        ) : (
          chapters.map((chapter) => {
            const active = chapter.id === selectedId;

            return (
              <button
                className={`w-full rounded-md border px-3 py-3 text-left transition ${
                  active
                    ? "border-[#9cc2bc] bg-[#eef7f4]"
                    : "border-[var(--line)] bg-white hover:border-[#b7c5bf]"
                }`}
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                type="button"
              >
                <span className="block text-xs font-bold text-[var(--accent)]">
                  {chapter.chapterNumber}장
                </span>
                <span className="mt-1 block truncate text-sm font-semibold">
                  {chapter.title}
                </span>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {formatNumber(countCharacters(chapter.body))}자
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
