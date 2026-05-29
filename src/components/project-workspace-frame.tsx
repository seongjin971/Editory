"use client";

import { ChevronDown, Maximize2, PanelLeft, PanelLeftClose, PanelRight } from "lucide-react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

type WorkspaceLayout = "splitLeft" | "splitRight" | "wide";

const MIN_PANEL_PERCENT = 24;
const MAX_PANEL_PERCENT = 52;

const layoutLabels: Record<WorkspaceLayout, string> = {
  splitLeft: "보조창 왼쪽",
  splitRight: "보조창 오른쪽",
  wide: "넓게 보기",
};

export function ProjectWorkspaceFrame({
  children,
  companion,
  companionTitle = "보조 창",
  defaultLayout = "splitLeft",
  eyebrow,
  meta,
  pageKey,
  projectId,
  title,
}: {
  children: ReactNode;
  companion?: ReactNode;
  companionTitle?: string;
  defaultLayout?: WorkspaceLayout;
  eyebrow: string;
  meta?: ReactNode;
  pageKey: string;
  projectId: string;
  title: string;
}) {
  const [layout, setLayout] = useState<WorkspaceLayout>(defaultLayout);
  const [panelPercent, setPanelPercent] = useState(30);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const hasCompanion = Boolean(companion);
  const showCompanion = hasCompanion && layout !== "wide";
  const layoutStorageKey = `editory:workspace-layout:${projectId}:${pageKey}`;
  const splitStorageKey = `editory:workspace-split:${projectId}:${pageKey}`;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const savedLayout = window.localStorage.getItem(layoutStorageKey);
      const savedPercent = Number(window.localStorage.getItem(splitStorageKey));

      if (isWorkspaceLayout(savedLayout)) {
        setLayout(savedLayout);
      }

      if (Number.isFinite(savedPercent)) {
        setPanelPercent(clamp(savedPercent, MIN_PANEL_PERCENT, MAX_PANEL_PERCENT));
      }

      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [layoutStorageKey, splitStorageKey]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(layoutStorageKey, layout);
  }, [layout, layoutStorageKey, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(splitStorageKey, String(Math.round(panelPercent)));
  }, [panelPercent, splitStorageKey, storageReady]);

  function updatePanelWidth(clientX: number) {
    const rect = splitRef.current?.getBoundingClientRect();

    if (!rect || rect.width <= 0) {
      return;
    }

    const rawPercent =
      layout === "splitRight"
        ? ((rect.right - clientX) / rect.width) * 100
        : ((clientX - rect.left) / rect.width) * 100;

    setPanelPercent(clamp(rawPercent, MIN_PANEL_PERCENT, MAX_PANEL_PERCENT));
  }

  function startResize(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updatePanelWidth(event.clientX);

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function move(moveEvent: globalThis.PointerEvent) {
      updatePanelWidth(moveEvent.clientX);
    }

    function stop() {
      setDragging(false);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const signedStep = layout === "splitRight" ? -direction * 4 : direction * 4;
    setPanelPercent((current) =>
      clamp(current + signedStep, MIN_PANEL_PERCENT, MAX_PANEL_PERCENT),
    );
  }

  const companionStyle = { flex: `0 0 ${panelPercent}%` };
  const mainStyle = showCompanion ? { flex: "1 1 0%" } : undefined;

  const companionPanel = showCompanion ? (
    <aside className="h-full min-w-0 rounded-lg border border-[var(--line)] bg-white p-4">
      <p className="text-xs font-bold text-[var(--accent)]">자료</p>
      <h2 className="mt-1 text-lg font-bold">{companionTitle}</h2>
      <div className="mt-4">{companion}</div>
    </aside>
  ) : null;

  const splitHandle = showCompanion ? (
    <div
      aria-label="분할 창 크기 조절"
      aria-orientation="vertical"
      aria-valuemax={MAX_PANEL_PERCENT}
      aria-valuemin={MIN_PANEL_PERCENT}
      className={clsx(
        "group hidden w-2 shrink-0 touch-none select-none cursor-col-resize items-center justify-center rounded-full transition md:flex",
        dragging ? "bg-[var(--panel-soft)]" : "hover:bg-[var(--panel-soft)]",
      )}
      onKeyDown={handleKeyDown}
      onPointerDown={startResize}
      role="separator"
      tabIndex={0}
      title="드래그해서 보조 창과 작업 영역의 폭을 조절"
    >
      <span
        className={clsx(
          "h-16 w-1 rounded-full transition",
          dragging ? "bg-[var(--accent)]" : "bg-[var(--line)] group-hover:bg-[var(--accent)]",
        )}
      />
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <header className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold text-[var(--accent)]">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-bold">{title}</h1>
            {meta ? <div className="mt-2 text-sm text-[var(--muted)]">{meta}</div> : null}
          </div>

          <div className="relative flex flex-wrap items-center gap-2">
            {hasCompanion ? (
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold transition hover:border-[#9aa6a0]"
                onClick={() => setMenuOpen((current) => !current)}
                type="button"
              >
                보기
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}

            {menuOpen ? (
              <div className="absolute right-0 top-11 z-30 w-56 rounded-xl border border-[var(--line)] bg-white p-2 shadow-xl">
                <ViewMenuButton
                  active={layout === "splitLeft"}
                  icon={<PanelLeft aria-hidden="true" className="h-4 w-4" />}
                  label="보조창 왼쪽"
                  onClick={() => {
                    setLayout("splitLeft");
                    setMenuOpen(false);
                  }}
                />
                <ViewMenuButton
                  active={layout === "splitRight"}
                  icon={<PanelRight aria-hidden="true" className="h-4 w-4" />}
                  label="보조창 오른쪽"
                  onClick={() => {
                    setLayout("splitRight");
                    setMenuOpen(false);
                  }}
                />
                <ViewMenuButton
                  active={layout === "wide"}
                  icon={<Maximize2 aria-hidden="true" className="h-4 w-4" />}
                  label="넓게 보기"
                  onClick={() => {
                    setLayout("wide");
                    setMenuOpen(false);
                  }}
                />
                <ViewMenuButton
                  active={false}
                  icon={<PanelLeftClose aria-hidden="true" className="h-4 w-4" />}
                  label="보조창 닫기"
                  onClick={() => {
                    setLayout("wide");
                    setMenuOpen(false);
                  }}
                />
              </div>
            ) : null}

            {hasCompanion ? (
              <span className="rounded-full bg-[var(--panel-soft)] px-3 py-2 text-xs font-bold text-[var(--muted)]">
                {layoutLabels[layout]}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={clsx(
          "flex flex-col gap-3 md:gap-1",
          showCompanion && "md:flex-row md:items-stretch",
        )}
        ref={splitRef}
      >
        {layout === "splitLeft" && companionPanel ? (
          <div className="min-w-0 md:min-w-[280px]" style={companionStyle}>
            {companionPanel}
          </div>
        ) : null}

        {layout === "splitLeft" ? splitHandle : null}

        <main className="min-w-0 flex-1" style={mainStyle}>
          {children}
        </main>

        {layout === "splitRight" ? splitHandle : null}

        {layout === "splitRight" && companionPanel ? (
          <div className="min-w-0 md:min-w-[280px]" style={companionStyle}>
            {companionPanel}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ViewMenuButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
        active
          ? "bg-[#e4f1ec] text-[var(--accent)]"
          : "text-[#34413b] hover:bg-[var(--panel-soft)]",
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function isWorkspaceLayout(value: string | null): value is WorkspaceLayout {
  return value === "splitLeft" || value === "splitRight" || value === "wide";
}
