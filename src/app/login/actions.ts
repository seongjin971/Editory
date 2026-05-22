"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LoginState = {
  error: string;
};

const LoginSchema = z.object({
  email: z.string().email(),
  next: z.string().optional(),
  password: z.string().min(1),
});

export async function loginAction(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "이메일과 비밀번호를 확인해 주세요." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user) {
    return { error: "이메일과 비밀번호를 확인해 주세요." };
  }

  const passwordMatches = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return { error: "이메일과 비밀번호를 확인해 주세요." };
  }

  await setSessionCookie(user);
  redirect(getSafeNextPath(parsed.data.next));
}

function getSafeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}
