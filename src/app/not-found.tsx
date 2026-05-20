import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <section className="w-full max-w-md rounded-lg border border-[var(--line)] bg-white p-6 text-center">
        <p className="text-sm font-semibold text-[var(--accent)]">404</p>
        <h1 className="mt-2 text-xl font-bold">페이지를 찾을 수 없습니다</h1>
        <Link
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white"
          href="/dashboard"
        >
          프로젝트로 이동
        </Link>
      </section>
    </main>
  );
}
