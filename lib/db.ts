import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client. In development Next.js hot-reloads modules, which
 * would otherwise create a new client (and a new SQLite connection) on every
 * change and exhaust connections. We cache the instance on globalThis.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
