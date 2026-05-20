"use client";

import {
  AlertTriangle,
  BarChart3,
  Clock3,
  FileText,
  GitBranch,
  LayoutDashboard,
  PencilLine,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Fragment } from "react";

const navGroups = [
  {
    title: "집필/설계",
    links: [
      { label: "쓰기", href: "/write", icon: PencilLine },
      { label: "개요", href: "", icon: LayoutDashboard },
      { label: "원고", href: "/manuscripts", icon: FileText },
      { label: "캐릭터 설계", href: "/characters", icon: Users },
    ],
  },
  {
    title: "AI 분석",
    links: [
      { label: "분석 리포트", href: "/analysis", icon: BarChart3 },
      { label: "스토리라인", href: "/storyline", icon: GitBranch },
      { label: "타임라인", href: "/timeline", icon: Clock3 },
      { label: "사건 비중", href: "/event-weights", icon: BarChart3 },
      { label: "설정 충돌", href: "/issues", icon: AlertTriangle },
    ],
  },
  {
    title: "관리",
    links: [{ label: "프로젝트 설정", href: "/settings", icon: Settings }],
  },
];

export function WorkspaceNav({
  compact = false,
  projectId,
}: {
  compact?: boolean;
  projectId: string;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav
      className={clsx(
        "flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible",
        compact && "items-center",
      )}
    >
      {navGroups.map((group, groupIndex) => (
        <Fragment key={group.title}>
          {!compact ? (
            <p
              className={clsx(
                "hidden px-3 text-[11px] font-bold uppercase tracking-wide text-[#7b8580] lg:block",
                groupIndex === 0 ? "pt-0" : "pt-3",
              )}
            >
              {group.title}
            </p>
          ) : groupIndex > 0 ? (
            <span
              aria-hidden="true"
              className="hidden h-px w-7 bg-[var(--line)] lg:block"
            />
          ) : null}

          {group.links.map((link) => {
            const href = `${base}${link.href}`;
            const active =
              link.href === ""
                ? pathname === base
                : pathname === href || pathname.startsWith(`${href}/`);
            const Icon = link.icon;

            return (
              <Link
                className={clsx(
                  "inline-flex shrink-0 items-center gap-2 rounded-md text-sm font-medium transition",
                  compact ? "h-10 w-10 justify-center px-0 py-0" : "px-3 py-2",
                  active
                    ? "bg-[#d9e7e4] text-[#133f42]"
                    : "text-[#58615c] hover:bg-white hover:text-[#25302b]",
                )}
                href={href}
                key={href}
                title={link.label}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                <span className={compact ? "sr-only" : ""}>{link.label}</span>
              </Link>
            );
          })}
        </Fragment>
      ))}
    </nav>
  );
}
