import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-[var(--line)] bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-[var(--accent)]">스토리랩</p>
        <h1 className="mt-2 text-2xl font-bold">테스터 로그인</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          초대된 tester 계정으로만 MVP에 접근할 수 있습니다.
        </p>
        <LoginForm nextPath={next ?? "/"} />
      </section>
    </main>
  );
}
