import type { ReactNode } from "react";

export function FocusModeShell({
  children,
  onExit,
}: {
  children: ReactNode;
  onExit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[#f1f4f2] px-4 py-5">
      <div className="mx-auto flex max-w-6xl justify-end">
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#25302b] px-4 text-sm font-semibold text-white"
          onClick={onExit}
          type="button"
        >
          집중 모드 종료
        </button>
      </div>
      <div className="mx-auto mt-4 max-w-6xl">{children}</div>
    </div>
  );
}
