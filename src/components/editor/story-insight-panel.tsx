import { Badge } from "@/components/badge";
import { DemoAnalysisNotice } from "@/components/demo-analysis-notice";
import { diagnosisClass, issueTypeLabels, roleLabels, severityClass } from "@/lib/labels";
import type { ReactNode } from "react";

export type StoryInsightData = {
  beats: Array<{
    conflict?: string;
    id: string;
    sourceChapterTitle?: string;
    title: string;
    summary: string;
  }>;
  characters: Array<{
    arcSummary?: string;
    desire?: string;
    id: string;
    importanceScore: number;
    name: string;
    role: string;
  }>;
  timeline: Array<{
    characters: string[];
    chronologicalOrder: number;
    confidence: number;
    description: string;
    estimatedTimeLabel: string;
    id: string;
    location: string;
    narrativeOrder: number;
    title: string;
  }>;
  eventWeights: Array<{
    category: string;
    diagnosis: string;
    id: string;
    percentage: number;
  }>;
  issues: Array<{
    description: string;
    id: string;
    severity: string;
    type: string;
  }>;
  recommendations: string[];
};

export function StoryInsightPanel({ insight }: { insight: StoryInsightData | null }) {
  if (!insight) {
    return (
      <div className="rounded-md border border-dashed border-[#cbd4cf] bg-white p-5 text-sm leading-6 text-[var(--muted)]">
        저장된 분석 결과가 없습니다. 원고를 저장한 뒤 현재 챕터나 전체 원고를 분석해 보세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DemoAnalysisNotice compact />

      <InsightSection title="핵심 사건">
        {insight.beats.slice(0, 4).map((beat) => (
          <article className="rounded-md bg-[#f7f9f7] p-3" key={beat.id}>
            <h4 className="text-sm font-bold">{beat.title}</h4>
            <p className="mt-1 line-clamp-3 text-xs leading-5 text-[var(--muted)]">
              {beat.summary}
            </p>
          </article>
        ))}
      </InsightSection>

      <InsightSection title="등장인물">
        <div className="flex flex-wrap gap-2">
          {insight.characters.slice(0, 8).map((character) => (
            <Badge key={character.id}>
              {character.name} · {roleLabels[character.role] ?? character.role} ·{" "}
              {character.importanceScore}
            </Badge>
          ))}
        </div>
      </InsightSection>

      <InsightSection title="사건 비중">
        {insight.eventWeights.map((weight) => (
          <div className="space-y-1" key={weight.id}>
            <div className="flex items-center justify-between gap-2 text-xs font-semibold">
              <span>{weight.category}</span>
              <Badge className={diagnosisClass(weight.diagnosis)}>
                {weight.diagnosis}
              </Badge>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#e6ebe8]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${Math.min(100, weight.percentage)}%` }}
              />
            </div>
          </div>
        ))}
      </InsightSection>

      <InsightSection title="설정 충돌">
        {insight.issues.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">감지된 충돌 후보가 없습니다.</p>
        ) : (
          insight.issues.slice(0, 4).map((issue) => (
            <article className="rounded-md bg-[#f7f9f7] p-3" key={issue.id}>
              <div className="flex flex-wrap gap-2">
                <Badge className={severityClass(issue.severity)}>
                  {issue.severity}
                </Badge>
                <Badge>{issueTypeLabels[issue.type] ?? issue.type}</Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                {issue.description}
              </p>
            </article>
          ))
        )}
      </InsightSection>

      <InsightSection title="개선 제안">
        <ul className="space-y-2 text-xs leading-5 text-[#34413b]">
          {insight.recommendations.slice(0, 4).map((recommendation) => (
            <li className="rounded-md bg-[#f7f9f7] p-3" key={recommendation}>
              {recommendation}
            </li>
          ))}
        </ul>
      </InsightSection>
    </div>
  );
}

function InsightSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-bold text-[#25302b]">{title}</h3>
      {children}
    </section>
  );
}
