import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GlobalSettingsPanel } from "@/components/settings/global-settings-panel";

export default function GlobalSettingsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-8 md:px-8">
      <Link
        className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
        href="/dashboard"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        프로젝트 목록
      </Link>

      <header className="mt-6">
        <p className="text-sm font-semibold text-[var(--accent)]">Editory</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal">전역 설정</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          모든 프로젝트에 공통으로 적용되는 설정입니다. 프로젝트별 제목·장르·삭제는 각
          프로젝트의 <strong>프로젝트 설정</strong>에서 관리하세요.
        </p>
      </header>

      <div className="mt-8">
        <GlobalSettingsPanel />
      </div>
    </main>
  );
}
