export const roleLabels: Record<string, string> = {
  protagonist: "주인공",
  antagonist: "대립자",
  ally: "조력자",
  mentor: "멘토",
  rival: "라이벌",
  love_interest: "관계 축",
  side_character: "주변 인물",
  unknown: "미분류",
};

export const issueTypeLabels: Record<string, string> = {
  timeline_contradiction: "타임라인 충돌",
  motivation_inconsistency: "동기 불일치",
  unresolved_event: "미해결 사건",
  repeated_information: "정보 반복",
  missing_causal_link: "인과 누락",
  sudden_relationship_change: "관계 급변",
  other: "기타",
};

export const severityLabels: Record<string, string> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
};

export function diagnosisClass(diagnosis: string) {
  if (diagnosis === "부족") return "bg-[#fff6df] text-[#7a4b12]";
  if (diagnosis === "과다") return "bg-[#fdeaea] text-[#8c3030]";
  return "bg-[#e4f1ec] text-[#256044]";
}

export function severityClass(severity: string) {
  if (severity === "high") return "bg-[#fdeaea] text-[#8c3030]";
  if (severity === "medium") return "bg-[#fff6df] text-[#7a4b12]";
  return "bg-[#e9eef2] text-[#40515f]";
}
