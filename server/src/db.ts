import { PrismaClient } from "@prisma/client";

// Single shared Prisma client.
export const prisma = new PrismaClient();
