import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, User } from "@prisma/client";
import { randomUUID } from "crypto";
import "dotenv/config";
import { Request } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../index.js";
import { createPostLoader } from "../loaders/postLoaders.js";
import { createUserLoader } from "../loaders/userLoaders.js";
import { logger } from "../logger/logger.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL, // the DB connection string
});

export const prisma = new PrismaClient({
  adapter,
  // log: ["query", "info", "warn", "error"],
});

export type Context = {
  prisma: PrismaClient;
  userId?: number;
  role?: string;
  requestId?: string;
  loaders: {
    userLoader: ReturnType<typeof createUserLoader>;
    postLoader: ReturnType<typeof createPostLoader>;
  };
};

export async function createContext(req: Request): Promise<Context> {
  const requestId = randomUUID();

  logger.info({
    requestId,
    operation: req.body?.operationName
  }, "Incoming GraphQL request");

  const configuration = {
    requestId,
    prisma,
    loaders: {
      userLoader: createUserLoader(prisma),
      postLoader: createPostLoader(prisma),
    },
  };

  // console.log(req.body.query, 'QUERY')
  const auth = req.headers.authorization || "";

  const token = auth.replace("Bearer ", "");

  if (!token) return { ...configuration };

  let user: User | undefined = undefined;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const result = await prisma.user.findFirst({
      where: {
        id: {
          equals: Number(payload.userId),
        },
      },
    });
    if (result) user = result;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.warn("JWT expired — continuing as guest", err);
    } else {
      console.warn("Invalid JWT — continuing as guest", err);
    }
  }

  return {
    userId: user?.id,
    role: user?.role,
    ...configuration,
  };
}

export function wsCreateContext(ctx: any): { userId?: number } {
  const auth = ctx.connectionParams?.Authorization || "";

  const token = auth.replace("Bearer ", "");
  if (!token) return {};

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    ctx.userId = Number(payload.userId);
  } catch (err) {
    console.warn("WebSocket JWT verification failed:", err);
  }

  return {
    userId: ctx.userId,
  };
}
