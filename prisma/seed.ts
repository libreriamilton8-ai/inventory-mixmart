import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/client";
import { getDatabaseConnection } from "../src/lib/database-url";
import { hashPassword } from "../src/lib/password";

const ADMIN_EMAIL =
  process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase() ||
  "libreriamilton8@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD;

const database = getDatabaseConnection();
const adapter = new PrismaPg(
  {
    connectionString: database.connectionString,
  },
  {
    schema: database.schema,
  },
);
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!ADMIN_PASSWORD) {
    throw new Error("ADMIN_SEED_PASSWORD is required to seed the administrator.");
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  await prisma.user.upsert({
    where: {
      email: ADMIN_EMAIL,
    },
    create: {
      username: "admin",
      email: ADMIN_EMAIL,
      firstName: "Administrador",
      lastName: "MixMart",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    update: {
      username: "admin",
      firstName: "Administrador",
      lastName: "MixMart",
      passwordHash,
      role: "ADMIN",
      isActive: true,
      deletedAt: null,
    },
  });

  console.log(`Seeded admin user: ${ADMIN_EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
