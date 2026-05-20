"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { WorkspaceNav } from "@/components/workspace-nav";

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div
        className={clsx(
          "mx-auto grid w-full gap-4 px-4 py-4 md:px-6",
          writingMode
            ? "max-w-[1760px] lg:grid-cols-[76px_minmax(0,1fr)]"
            : "max-w-[1560px] lg:grid-cols-[260px_minmax(0,1fr)]",
        )}
      >
        <aside
          className={clsx(
            "rounded-lg border border-[var(--line)] bg-[#f9faf8] lg:sticky lg:top-4 lg:h-[calc(100vh-32px)]",
            writingMode ? "p-2" : "p-4",
          )}
        >
          <Link
            className={clsx(
              "inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[#58615c] hover:text-[#25302b]",
              writingMode ? "h-10 w-10 justify-center" : "px-0",
            )}
            href="/dashboard"
            title="프로젝트"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className={writingMode ? "sr-only" : ""}>프로젝트</span>
          </Link>

          {!writingMode ? (
            <div className="mt-5 border-b border-[var(--line)] pb-4">
              <p className="text-xs font-bold text-[var(--accent)]">스토리랩</p>
              <h1 className="mt-2 line-clamp-2 text-xl font-bold text-[#1d2320]">
                {title}
              </h1>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                {genre || "장르 미지정"}
              </p>
            </div>
          ) : null}

          <div className={writingMode ? "mt-3" : "mt-4"}>
            <WorkspaceNav compact={writingMode} projectId={projectId} />
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
