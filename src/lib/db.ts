import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function getDatabaseUrl(): string {
  // If remote Postgres / pooler URL is provided, use it directly
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  // On Vercel / AWS Lambda serverless runtime, copy dev.db to writable /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = "/tmp/dev.db";
    if (!fs.existsSync(tmpDbPath)) {
      const possibleSources = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
        path.join(__dirname, "dev.db"),
        path.join(__dirname, "..", "dev.db"),
        path.join(__dirname, "..", "..", "prisma", "dev.db"),
      ];

      for (const src of possibleSources) {
        if (fs.existsSync(src)) {
          try {
            fs.copyFileSync(src, tmpDbPath);
            console.log(`Successfully initialized SQLite database from ${src} to ${tmpDbPath}`);
            break;
          } catch (e) {
            console.warn(`Failed to copy SQLite database from ${src}:`, e);
          }
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  return process.env.DATABASE_URL || "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  bio: true,
  skills: true,
  status: true,
  freelanceReady: true,
  departmentId: true,
  joinDate: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function excludePassword<T extends Record<string, any>>(user: T): Omit<T, "passwordHash"> {
  const { passwordHash, ...rest } = user;
  return rest;
}
