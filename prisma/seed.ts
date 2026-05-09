import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/client';
import { getDirectDatabaseConnection } from '../src/lib/database-url';
import { hashPassword } from '../src/lib/password';

const ADMIN_EMAIL =
  process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase() ||
  'libreriamilton8@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD;

const database = getDirectDatabaseConnection();
const searchPath = `${database.schema},public`;
const pgOptions = process.env.PGOPTIONS ?? '';

if (!pgOptions.includes('search_path')) {
  process.env.PGOPTIONS = [pgOptions, `--search_path=${searchPath}`]
    .filter(Boolean)
    .join(' ');
}

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
    throw new Error('ADMIN_SEED_PASSWORD is required to seed the admin user.');
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    create: {
      username: 'admin',
      email: ADMIN_EMAIL,
      firstName: 'Administrador',
      lastName: 'Mixmart',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    update: {
      email: ADMIN_EMAIL,
      firstName: 'Administrador',
      lastName: 'Mixmart',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      deletedAt: null,
    },
  });

  console.log(`Seeded admin user only: ${admin.email ?? admin.username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
