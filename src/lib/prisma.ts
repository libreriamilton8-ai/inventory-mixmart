import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { inventorySoftDeleteExtension } from "../../prisma/extensions/soft-delete.extension";
import { getDatabaseConnection } from "./database-url";

const prismaClientSingleton = () => {
  const database = getDatabaseConnection();
  const adapter = new PrismaPg(
    {
      connectionString: database.connectionString,
    },
    {
      schema: database.schema,
    },
  );
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
