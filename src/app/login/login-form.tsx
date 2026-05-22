"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: "" };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input name="next" type="hidden" value={nextPath} />
      <label className="block">
        <span className="text-sm font-bold text-[#34413b]">이메일</span>
        <input
          autoComplete="email"
          className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
          name="email"
          placeholder="test@test.com"
          type="email"
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold text-[#34413b]">비밀번호</span>
        <input
          autoComplete="current-password"
          className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
          name="password"
          type="password"
        />
      </label>
      {state.error ? (
        <p className="rounded-md border border-[#e2b9b9] bg-[#fff5f5] px-3 py-2 text-sm font-semibold text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}
      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        <LogIn aria-hidden="true" className="h-4 w-4" />
        {pending ? "로그인 중" : "로그인"}
      </button>
    </form>
  );
}
