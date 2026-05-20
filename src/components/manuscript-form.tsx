"use client";

import type { Manuscript } from "@prisma/client";
import { Save } from "lucide-react";
import { useState } from "react";
import { updateManuscript, createManuscript } from "@/app/actions";
import { countCharacters, formatNumber } from "@/lib/format";
import { SubmitButton } from "./submit-button";

type ManuscriptFormProps = {
  projectId: string;
  manuscript?: Manuscript;
  nextChapterNumber?: number;
};

export function ManuscriptForm({
  projectId,
  manuscript,
  nextChapterNumber = 1,
}: ManuscriptFormProps) {
  const [body, setBody] = useState(manuscript?.body ?? "");
  const action = manuscript ? updateManuscript : createManuscript;

  return (
    <form action={action} className="space-y-5">
      <input name="projectId" type="hidden" value={projectId} />
      {manuscript ? (
        <input name="manuscriptId" type="hidden" value={manuscript.id} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-[120px_1fr]">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#34413b]">챕터 번호</span>
          <input
            className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
            defaultValue={manuscript?.chapterNumber ?? nextChapterNumber}
            min={1}
            name="chapterNumber"
            required
            type="number"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#34413b]">원고 제목</span>
          <input
            className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
            defaultValue={manuscript?.title ?? ""}
            maxLength={160}
            name="title"
            required
            type="text"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#34413b]">본문</span>
          <span className="rounded-full bg-[#e9eeeb] px-3 py-1 text-xs font-semibold text-[#58615c]">
            {formatNumber(countCharacters(body))}자
          </span>
        </div>
        <textarea
          className="min-h-[520px] w-full rounded-md border border-[var(--line)] bg-white p-4 leading-7 outline-none focus:border-[var(--accent)]"
          name="body"
          onChange={(event) => setBody(event.target.value)}
          value={body}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[#34413b]">메모</span>
        <textarea
          className="min-h-28 w-full rounded-md border border-[var(--line)] bg-white p-3 text-sm leading-6 outline-none focus:border-[var(--accent)]"
          defaultValue={manuscript?.memo ?? ""}
          name="memo"
        />
      </label>

      <SubmitButton pendingText="저장 중">
        <Save aria-hidden="true" className="h-4 w-4" />
        저장
      </SubmitButton>
    </form>
  );
}
