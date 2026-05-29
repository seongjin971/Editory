"use client";

import { BookOpenCheck, Search, SlidersHorizontal, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  analyzeWritingAssistant,
  findRelatedWords,
  type GrammarIssue,
} from "@/lib/writing-assistant";
import { formatNumber } from "@/lib/format";

type WritingAssistantPanelProps = {
  text: string;
};

export function WritingAssistantPanel({ text }: WritingAssistantPanelProps) {
  const [grammarEnabled, setGrammarEnabled] = useState(false);
  const [wordQuery, setWordQuery] = useState("");
  const result = useMemo(() => analyzeWritingAssistant(text), [text]);
  const wordResults = useMemo(() => findRelatedWords(wordQuery), [wordQuery]);
  const hasText = text.trim().length > 0;

  return (
    <details className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3" open>
      <summary className="cursor-pointer select-none text-sm font-bold text-[var(--foreground)]">
        집필 점검
      </summary>

      <div className="mt-3 space-y-4">
        {!hasText ? (
          <p className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 text-sm text-[var(--muted)]">
            원고를 입력하면 문체, 반복 어휘, 문장 개선 단서가 여기에 표시됩니다.
          </p>
        ) : (
          <>
            <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
              <div className="flex items-start gap-2">
                <BookOpenCheck aria-hidden="true" className="mt-0.5 h-4 w-4 text-[var(--accent)]" />
                <div>
                  <p className="text-xs font-bold text-[var(--muted)]">문체 분석</p>
                  <h3 className="mt-1 font-bold">{result.styleProfile.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {result.styleProfile.note}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <Metric label="평균 문장" value={`${result.styleProfile.averageSentenceLength}자`} />
                <Metric
                  label="대화성"
                  value={`${Math.round(result.styleProfile.dialogueRatio * 100)}%`}
                />
                {result.styleProfile.tags.map((tag) => (
                  <span
                    className="rounded-full bg-[var(--panel-soft)] px-2 py-1 text-[var(--muted)]"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Wand2 aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />
                  <p className="text-sm font-bold">문장 개선</p>
                </div>
                <span className="text-xs font-semibold text-[var(--muted)]">
                  {formatNumber(result.sentenceSuggestions.length)}개
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {result.sentenceSuggestions.length > 0 ? (
                  result.sentenceSuggestions.map((item) => (
                    <article className="rounded-md bg-[var(--panel-soft)] p-3" key={`${item.reason}-${item.source}`}>
                      <p className="text-xs font-bold text-[var(--accent)]">{item.reason}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.source}</p>
                      <p className="mt-2 text-sm leading-6">{item.suggestion}</p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    눈에 띄는 반복이나 과도하게 긴 문장이 아직 없습니다.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />
                  <p className="text-sm font-bold">문법 체크</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
                  <input
                    checked={grammarEnabled}
                    className="h-4 w-4 accent-[var(--accent)]"
                    onChange={(event) => setGrammarEnabled(event.target.checked)}
                    type="checkbox"
                  />
                  켜기
                </label>
              </div>
              {grammarEnabled ? (
                <GrammarIssueList issues={result.grammarIssues} />
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  필요할 때만 켜서 공백, 문장부호, 긴 문장 같은 기본 항목을 확인합니다.
                </p>
              )}
            </section>
          </>
        )}

        <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
          <label className="text-sm font-bold" htmlFor="word-finder-query">
            단어 찾기
          </label>
          <div className="mt-2 flex gap-2">
            <input
              className="field-input min-w-0 flex-1 text-sm"
              id="word-finder-query"
              onChange={(event) => setWordQuery(event.target.value)}
              placeholder="예: 오래된 보관소 냄새, 불안한 예감"
              value={wordQuery}
            />
            <Search aria-hidden="true" className="mt-3 h-4 w-4 text-[var(--muted)]" />
          </div>
          <div className="mt-3 space-y-2">
            {wordResults.length > 0 ? (
              wordResults.map((entry) => (
                <div className="rounded-md bg-[var(--panel-soft)] p-3" key={entry.category}>
                  <p className="text-xs font-bold text-[var(--accent)]">{entry.category}</p>
                  <p className="mt-1 text-sm leading-6">{entry.words.join(", ")}</p>
                </div>
              ))
            ) : (
              <p className="text-xs leading-5 text-[var(--muted)]">
                떠오르지 않는 단어를 문장으로 설명해보세요. 로컬 어휘 사전에서 가까운 표현을 찾습니다.
              </p>
            )}
          </div>
        </section>
      </div>
    </details>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-[var(--panel-soft)] px-2 py-1 text-[var(--muted)]">
      {label} {value}
    </span>
  );
}

function GrammarIssueList({ issues }: { issues: GrammarIssue[] }) {
  if (issues.length === 0) {
    return (
      <p className="mt-3 text-sm text-[var(--muted)]">
        기본 규칙 기준으로 눈에 띄는 문법/표기 이슈가 없습니다.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {issues.map((issue) => (
        <article className="rounded-md bg-[var(--panel-soft)] p-3" key={`${issue.description}-${issue.example}`}>
          <p className="text-xs font-bold text-[var(--accent)]">
            {issue.severity === "medium" ? "확인 필요" : "가벼운 점검"}
          </p>
          <h4 className="mt-1 text-sm font-bold">{issue.description}</h4>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{issue.example}</p>
          <p className="mt-2 text-sm leading-6">{issue.suggestion}</p>
        </article>
      ))}
    </div>
  );
}
