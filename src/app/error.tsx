"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <section className="w-full max-w-md rounded-lg border border-[#e2b9b9] bg-white p-6">
        <p className="text-sm font-semibold text-[var(--danger)]">오류</p>
        <h1 className="mt-2 text-xl font-bold">요청을 완료하지 못했습니다</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">{error.message}</p>
        <button
          className="mt-5 h-10 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white"
          onClick={reset}
          type="button"
        >
          다시 시도
        </button>
      </section>
    </main>
  );
}
