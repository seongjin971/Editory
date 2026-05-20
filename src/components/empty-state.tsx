import type { ReactNode } from "react";

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#cbd4cf] bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-[#25302b]">{title}</h2>
      {children ? <div className="mt-3 text-sm text-[var(--muted)]">{children}</div> : null}
    </div>
  );
}
