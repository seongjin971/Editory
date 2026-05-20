"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { clsx } from "clsx";

type SubmitButtonProps = {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
};

const variantClass = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] disabled:bg-[#8aa7a9]",
  secondary:
    "border border-[var(--line)] bg-white text-[#25302b] hover:border-[#9aa6a0] disabled:text-[#8b948f]",
  danger:
    "border border-[#e2b9b9] bg-white text-[var(--danger)] hover:bg-[#fff5f5] disabled:text-[#b89191]",
};

export function SubmitButton({
  children,
  pendingText = "처리 중",
  className,
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed",
        variantClass[variant],
        className,
      )}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingText : children}
    </button>
  );
}
