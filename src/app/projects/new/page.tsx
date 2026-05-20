import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { createProject } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export default function NewProjectPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-8 md:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#58615c] hover:text-[#25302b]"
        href="/dashboard"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        프로젝트
      </Link>
      <section className="mt-8 rounded-lg border border-[var(--line)] bg-white p-6">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">새 프로젝트</p>
          <h1 className="mt-2 text-2xl font-bold">분석할 작품 정보</h1>
        </div>
        <form action={createProject} className="mt-6 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold">프로젝트 제목</span>
            <input
              className="h-11 w-full rounded-md border border-[var(--line)] px-3 outline-none focus:border-[var(--accent)]"
              maxLength={120}
              name="title"
              required
              type="text"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold">설명</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-[var(--line)] p-3 outline-none focus:border-[var(--accent)]"
              name="description"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">장르</span>
              <input
                className="h-11 w-full rounded-md border border-[var(--line)] px-3 outline-none focus:border-[var(--accent)]"
                name="genre"
                type="text"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">타깃 독자</span>
              <input
                className="h-11 w-full rounded-md border border-[var(--line)] px-3 outline-none focus:border-[var(--accent)]"
                name="targetAudience"
                type="text"
              />
            </label>
          </div>
          <SubmitButton pendingText="생성 중">
            <Plus aria-hidden="true" className="h-4 w-4" />
            프로젝트 생성
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}
