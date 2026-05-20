import { clsx } from "clsx";
import type { ReactNode } from "react";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        className ?? "bg-[#eef2ef] text-[#58615c]",
      )}
    >
      {children}
    </span>
  );
}
