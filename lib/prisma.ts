import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma");
}

const globalForPrisma = globalThis as unknown as {
    pool: Pool | undefined;
    adapter: PrismaPg | undefined;
    prisma: PrismaClient | undefined;
};

const poolMax = Number.parseInt(
    process.env.DATABASE_POOL_MAX ?? (process.env.VERCEL || process.env.NODE_ENV === "production" ? "1" : "15"),
    10
);

const pool =
    globalForPrisma.pool ??
    new Pool({
        connectionString,
        max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 1,
        idleTimeoutMillis: 60_000,
        connectionTimeoutMillis: 30_000,
        ssl: {
            rejectUnauthorized: false
        }
    });

const adapter = globalForPrisma.adapter ?? new PrismaPg(pool);

const createPrismaClient = () => {
    const client = new PrismaClient({
        adapter,
        log: [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "info" },
            { emit: "event", level: "warn" },
        ],
    });

    return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
    globalForPrisma.adapter = adapter;
    globalForPrisma.prisma = prisma;
}

export default prisma;
