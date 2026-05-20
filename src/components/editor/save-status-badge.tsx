import { Check, Loader2, PencilLine } from "lucide-react";

export function SaveStatusBadge({
  status,
}: {
  status: "saved" | "saving" | "dirty";
}) {
  const config = {
    saved: {
      icon: Check,
      label: "저장됨",
      className: "bg-[#e4f1ec] text-[#256044]",
    },
    saving: {
      icon: Loader2,
      label: "저장 중",
      className: "bg-[#eef2ef] text-[#58615c]",
    },
    dirty: {
      icon: PencilLine,
      label: "변경사항 있음",
      className: "bg-[#fff6df] text-[#7a4b12]",
    },
  }[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${config.className}`}
    >
      <Icon
        aria-hidden="true"
        className={`h-3.5 w-3.5 ${status === "saving" ? "animate-spin" : ""}`}
      />
      {config.label}
    </span>
  );
}
