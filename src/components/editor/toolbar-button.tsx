import type { ReactNode } from "react";
import { clsx } from "clsx";

export function ToolbarButton({
  active = false,
  children,
  disabled = false,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={clsx(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-[#8eb9b1] bg-[#e6f2ef] text-[#17484b]"
          : "border-transparent bg-transparent text-[#46514c] hover:border-[var(--line)] hover:bg-white",
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
