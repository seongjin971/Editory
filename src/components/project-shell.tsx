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
  const writingMode = pathname.startsWith(`/projects/${projectId}/write`);
  const storageKey = `editory:writing-sidebar-width:${projectId}`;
  const [sidebarWidth, setSidebarWidth] = useState(COLLAPSED_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ startWidth: COLLAPSED_SIDEBAR_WIDTH, x: 0 });
  const storageReadyRef = useRef(false);
  const expandedWritingNav = writingMode && sidebarWidth >= LABEL_VISIBLE_WIDTH;

  useEffect(() => {
    if (!writingMode) {
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
  }, [storageKey, writingMode]);

  useEffect(() => {
    if (!writingMode || !storageReadyRef.current) {
      return;
    }

    window.localStorage.setItem(storageKey, String(Math.round(sidebarWidth)));
  }, [sidebarWidth, storageKey, writingMode]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const nextWidth =
        resizeStartRef.current.startWidth + event.clientX - resizeStartRef.current.x;
      setSidebarWidth(clampSidebarWidth(nextWidth));
    }

    function handlePointerUp() {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizing]);

  function startSidebarResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    resizeStartRef.current = {
      startWidth: sidebarWidth,
      x: event.clientX,
    };
    setIsResizing(true);
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div
        className={clsx(
          "mx-auto grid w-full gap-4 px-4 py-4 md:px-6",
          writingMode
            ? "max-w-[1760px] lg:grid-cols-[var(--project-sidebar-width)_minmax(0,1fr)]"
            : "max-w-[1560px] lg:grid-cols-[260px_minmax(0,1fr)]",
        )}
        style={
          writingMode
            ? ({
                "--project-sidebar-width": `${sidebarWidth}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <aside
          className={clsx(
            "relative rounded-lg border border-[var(--line)] bg-[#f9faf8] lg:sticky lg:top-4 lg:h-[calc(100vh-32px)]",
            writingMode ? "p-2 pr-3" : "p-4",
          )}
        >
          <Link
            className={clsx(
              "inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[#58615c] hover:text-[#25302b]",
              writingMode && !expandedWritingNav
                ? "h-10 w-10 justify-center"
                : "px-0",
            )}
            href="/dashboard"
            title="프로젝트"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className={writingMode && !expandedWritingNav ? "sr-only" : ""}>
              프로젝트
            </span>
          </Link>

          {!writingMode || expandedWritingNav ? (
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

          <div className={writingMode ? "mt-3" : "mt-4"}>
            <WorkspaceNav compact={writingMode && !expandedWritingNav} projectId={projectId} />
          </div>

          {writingMode ? (
            <button
              aria-label="사이드바 폭 조절"
              className={clsx(
                "absolute right-0 top-0 hidden h-full w-3 translate-x-1/2 cursor-col-resize items-center justify-center lg:flex",
                isResizing && "bg-[#d9e7e4]/60",
              )}
              onPointerDown={startSidebarResize}
              title="드래그해서 메뉴 폭 조절"
              type="button"
            >
              <span className="h-12 w-1 rounded-full bg-[#c3cec8]" />
            </button>
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
