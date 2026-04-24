import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { inventorySoftDeleteExtension } from "../../prisma/extensions/soft-delete.extension";

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const prismaRaw = new PrismaClient({ adapter });

  return {
    prisma: prismaRaw.$extends(inventorySoftDeleteExtension),
    prismaRaw,
  };
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prismaClients = globalThis.prismaGlobal ?? prismaClientSingleton();
const prisma = prismaClients.prisma;

export default prisma;
export const prismaRaw = prismaClients.prismaRaw;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prismaClients;
