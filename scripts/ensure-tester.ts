import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const testerEmail = process.env.TESTER_EMAIL ?? "test@test.com";
const testerPassword = process.env.TESTER_PASSWORD;

async function main() {
  if (!testerPassword) {
    throw new Error("TESTER_PASSWORD must be set before creating the tester account.");
  }

  const passwordHash = await bcrypt.hash(testerPassword, 12);

  await prisma.user.upsert({
    where: { email: testerEmail },
    update: {
      passwordHash,
      role: "tester",
    },
    create: {
      email: testerEmail,
      passwordHash,
      role: "tester",
    },
  });

  console.log(`Tester account is ready: ${testerEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
