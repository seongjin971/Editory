import { Info } from "lucide-react";

export function DemoAnalysisNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside className="rounded-lg border border-[#d9e7e4] bg-[#f7fbf9] p-4 text-sm leading-6 text-[#40504a]">
      <div className="flex gap-3">
        <Info
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
        />
        <div>
          <p className="font-bold text-[var(--accent)]">현재 분석은 데모 분석입니다</p>
          <p className={compact ? "mt-1" : "mt-1 max-w-3xl"}>
            외부 AI 모델 없이 원고의 문단, 반복 인물명, 사건 키워드, 글자 수 분포를
            로컬 규칙으로 추정합니다. 친구 테스트에서는 집필 흐름, 화면 구성,
            결과를 확인하는 방식 위주로 피드백을 받아주세요.
          </p>
        </div>
      </div>
    </aside>
  );
}
