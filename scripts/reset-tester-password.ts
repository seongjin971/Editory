import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.env.TESTER_EMAIL ?? "test@test.com";
const newPassword = process.argv[2] ?? process.env.TESTER_PASSWORD;

async function main() {
  if (!newPassword) {
    throw new Error(
      "새 비밀번호를 입력해 주세요. 예: npm run auth:reset-tester -- new-password",
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      role: "tester",
    },
  });

  console.log(`Reset tester password for ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
