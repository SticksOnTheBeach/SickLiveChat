// src/services/prisma.ts
// Exporte un singleton PrismaClient pour éviter les connexions multiples
// dans les rechargements à chaud (ts-node-dev, hot reload).

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  global.__prisma = prisma;
}
