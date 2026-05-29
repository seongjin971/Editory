"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { WorkspaceNav } from "@/components/workspace-nav";

const COLLAPSED_SIDEBAR_WIDTH = 76;
const MAX_WRITING_SIDEBAR_WIDTH = 320;
const LABEL_VISIBLE_WIDTH = 176;

export function ProjectShell({
  children,
  genre,
  projectId,
  title,
}: {
  children: React.ReactNode;
  genre: string;
  projectId: string;
  title: string;
}) {
  const pathname = usePathname();
  const workspaceMode = pathname.startsWith(`/projects/${projectId}`);
  const storageKey = `editory:project-sidebar-width:${projectId}`;
  const [sidebarWidth, setSidebarWidth] = useState(COLLAPSED_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarResizeHandleRef = useRef<HTMLDivElement | null>(null);
  const sidebarWidthRef = useRef(sidebarWidth);
  const sidebarDragCleanupRef = useRef<(() => void) | null>(null);
  const storageReadyRef = useRef(false);
  const expandedWritingNav = workspaceMode && sidebarWidth >= LABEL_VISIBLE_WIDTH;

  useEffect(() => {
    if (!workspaceMode) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const savedWidth = window.localStorage.getItem(storageKey);

      if (savedWidth) {
        setSidebarWidth(clampSidebarWidth(Number(savedWidth)));
      }

      storageReadyRef.current = true;
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [storageKey, workspaceMode]);

  useEffect(() => {
    if (!workspaceMode || !storageReadyRef.current) {
      return;
    }

    window.localStorage.setItem(storageKey, String(Math.round(sidebarWidth)));
  }, [sidebarWidth, storageKey, workspaceMode]);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    return () => {
      sidebarDragCleanupRef.current?.();
    };
  }, []);

  useEffect(() => {
    const handle = sidebarResizeHandleRef.current;

    if (!workspaceMode || !handle) {
      return;
    }

    function start(event: Event) {
      const startX = readClientX(event);

      if (startX === null || sidebarDragCleanupRef.current) {
        return;
      }

      const dragStartX = startX;
      event.preventDefault();
      setIsResizing(true);

      const startWidth = sidebarWidthRef.current;
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      function move(moveEvent: Event) {
        const clientX = readClientX(moveEvent);

        if (clientX === null) {
          return;
        }

        moveEvent.preventDefault();
        setSidebarWidth(clampSidebarWidth(startWidth + clientX - dragStartX));
      }

      function stop() {
        setIsResizing(false);
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        window.removeEventListener("mousemove", move);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("touchmove", move);
        window.removeEventListener("mouseup", stop);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
        window.removeEventListener("touchend", stop);
        window.removeEventListener("touchcancel", stop);
        sidebarDragCleanupRef.current = null;
      }

      window.addEventListener("mousemove", move);
      window.addEventListener("pointermove", move);
      window.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("mouseup", stop);
      window.addEventListener("pointerup", stop);
      window.addEventListener("pointercancel", stop);
      window.addEventListener("touchend", stop);
      window.addEventListener("touchcancel", stop);
      sidebarDragCleanupRef.current = stop;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      const step = event.key === "ArrowRight" ? 16 : -16;
      setSidebarWidth((current) => clampSidebarWidth(current + step));
    }

    handle.addEventListener("mousedown", start);
    handle.addEventListener("pointerdown", start);
    handle.addEventListener("touchstart", start, { passive: false });
    handle.addEventListener("keydown", handleKeyDown);

    return () => {
      sidebarDragCleanupRef.current?.();
      handle.removeEventListener("mousedown", start);
      handle.removeEventListener("pointerdown", start);
      handle.removeEventListener("touchstart", start);
      handle.removeEventListener("keydown", handleKeyDown);
    };
  }, [workspaceMode]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div
        className={clsx(
          "mx-auto grid w-full gap-4 px-4 py-4 md:px-6",
          workspaceMode
            ? "max-w-[1760px] md:grid-cols-[var(--project-sidebar-width)_minmax(0,1fr)]"
            : "max-w-[1560px] lg:grid-cols-[260px_minmax(0,1fr)]",
        )}
        style={
          workspaceMode
            ? ({
                "--project-sidebar-width": `${sidebarWidth}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <aside
          className={clsx(
            "relative rounded-lg border border-[var(--line)] bg-[#f9faf8] md:sticky md:top-4 md:h-[calc(100vh-32px)]",
            workspaceMode ? "p-2 pr-3" : "p-4",
          )}
        >
          <Link
            className={clsx(
              "inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[#58615c] hover:text-[#25302b]",
              workspaceMode && !expandedWritingNav
                ? "h-10 w-10 justify-center"
                : "px-0",
            )}
            href="/dashboard"
            title="프로젝트"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className={workspaceMode && !expandedWritingNav ? "sr-only" : ""}>
              프로젝트
            </span>
          </Link>

          {!workspaceMode || expandedWritingNav ? (
            <div className="mt-5 border-b border-[var(--line)] pb-4">
              <p className="text-xs font-bold text-[var(--accent)]">Editory</p>
              <h1 className="mt-2 line-clamp-2 text-xl font-bold text-[#1d2320]">
                {title}
              </h1>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                {genre || "장르 미지정"}
              </p>
            </div>
          ) : null}

          <div className={workspaceMode ? "mt-3" : "mt-4"}>
            <WorkspaceNav compact={workspaceMode && !expandedWritingNav} projectId={projectId} />
          </div>

          {workspaceMode ? (
            <div
              aria-label="사이드바 폭 조절"
              aria-orientation="vertical"
              aria-valuemax={MAX_WRITING_SIDEBAR_WIDTH}
              aria-valuemin={COLLAPSED_SIDEBAR_WIDTH}
              className={clsx(
                "absolute right-0 top-0 hidden h-full w-5 translate-x-1/2 touch-none select-none cursor-col-resize items-center justify-center md:flex",
                isResizing && "bg-[#d9e7e4]/60",
              )}
              ref={sidebarResizeHandleRef}
              role="separator"
              tabIndex={0}
              title="드래그해서 메뉴 폭 조절"
            >
              <span className="h-12 w-1 rounded-full bg-[#c3cec8]" />
            </div>
          ) : null}
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function clampSidebarWidth(width: number) {
  if (!Number.isFinite(width)) {
    return COLLAPSED_SIDEBAR_WIDTH;
  }

  return Math.min(
    MAX_WRITING_SIDEBAR_WIDTH,
    Math.max(COLLAPSED_SIDEBAR_WIDTH, width),
  );
}

function readClientX(event: Event) {
  if ("touches" in event) {
    const touchEvent = event as TouchEvent;
    return (
      touchEvent.touches[0]?.clientX ??
      touchEvent.changedTouches[0]?.clientX ??
      null
    );
  }

  if ("clientX" in event && typeof event.clientX === "number") {
    return event.clientX;
  }

  return null;
}
