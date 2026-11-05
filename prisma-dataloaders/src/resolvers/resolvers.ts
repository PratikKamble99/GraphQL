import { Role } from "@prisma/client";
import { ApolloError } from "apollo-server";
import jwt from "jsonwebtoken";
import { Context, prisma } from "../config/context.js";
import { pubsub } from "../config/pubsub.js";
import { JWT_SECRET } from "../index.js";
import { withTiming } from "../logger/logger.js";
import { requireAuth, requireOwnership, requireRole } from "../middlewares.js";
import { redis } from "../redis/redis.js";

type TCreatePostInput = {
  title: string;
  content?: string | null;
  userId: string;
};

type TFilter = {
  titleContains?: string;
  contentContains?: string;
  userId?: number;
  createdAfter?: string;
  createdBefore?: string;
};

type TSort = {
  field: string;
  order: "asc" | "desc";
};

export const resolvers = {
  Query: {
    users: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx.userId);
      // only ADMIN can access all users - Role-based authorization
      requireRole(["ADMIN"], ctx.role);

      return ctx.prisma.user.findMany();
    },
    user: async (_: any, args: { id: string }, ctx: Context) => {
      requireRole(["ADMIN"], ctx.role);
      return ctx.prisma.user.findUnique({ where: { id: Number(args.id) } });
    },
    posts: withTiming(async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx.userId);
      requireRole(["ADMIN"], ctx.role);
      const cacheKey = "posts:all";

      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log("posts from redise cache");
        return JSON.parse(cached);
      }

      const posts = await ctx.prisma.post.findMany();
      await redis.set(cacheKey, JSON.stringify(posts), "EX", 60);

      return posts;
    }, "Query.posts"),

    postsOffset: async (
      _: any,
      args: { limit: number; offset: number },
      ctx: Context
    ) => {
      return ctx.prisma.post.findMany({
        skip: args.offset,
        take: args.limit,
        orderBy: { id: "asc" },
      });
    },
    postsCursor: async (
      _: any,
      args: { first: number; after?: string },
      ctx: Context
    ) => {
      const { prisma } = ctx;

      const queryOptions: any = {
        take: args.first, // number of records to fetch
        orderBy: { id: "asc" },
      };

      if (args.after) {
        queryOptions.cursor = { id: Number(args.after) };
        queryOptions.skip = 1; // avoid including the cursor row
      }

      /* 
      FINAL QUERY:
      queryOptions = {
        take: 10,
        orderBy: { id: "asc" },
        cursor: { id: 20 },
        skip: 1
      };
      
      ABOVE QUERY TRANSLATES TO:
      SELECT *
      FROM "Post"
      WHERE "id" > 20 -- (handled by cursor and skip)
      ORDER BY "id" ASC
      LIMIT 10;
      
      */

      const posts = await prisma.post.findMany(queryOptions);

      const lastPost = posts[posts.length - 1];
      console.log(posts.length, args.first);
      return {
        posts,
        hasNextPage: posts.length === args.first,
        lastCursor: lastPost?.id ?? null,
      };
    },
    postsFiltered: async (
      _: any,
      args: { filter: TFilter; sort: TSort; first: string; after: string },
      ctx: Context
    ) => {
      const { filter, sort, first, after } = args;
      const where: any = {};

      // --- Filtering ---
      if (filter) {
        if (filter.titleContains) {
          where.title = { contains: filter.titleContains, mode: "insensitive" };
        }
        if (filter.contentContains) {
          where.content = {
            contains: filter.contentContains,
            mode: "insensitive",
          };
        }
        if (filter.userId) {
          where.userId = filter.userId;
        }
        if (filter.createdAfter) {
          where.createdAt = { gte: new Date(filter.createdAfter) };
        }
        if (filter.createdBefore) {
          where.createdAt = { lte: new Date(filter.createdBefore) };
        }
      }

      // --- Sorting ---
      let orderBy: any = {};
      if (sort) {
        orderBy[sort.field] = sort.order;
      } else {
        // default sort
        orderBy = { createdAt: "desc" };
      }

      // --- Cursor Pagination ---
      const queryOptions: any = {
        where,
        orderBy,
        take: first || 10,
      };

      if (after) {
        queryOptions.cursor = { id: Number(after) };
        queryOptions.skip = 1;
      }

      return ctx.prisma.post.findMany(queryOptions);
    },
  },

  Mutation: {
    createUser: async (
      _: any,
      { input }: { input: { name: string; email: string; role: Role } },
      ctx: Context
    ) => {
      // console.log(input)
      try {
        return await prisma.user.create({
          data: {
            name: input.name,
            email: input.email,
            role: input.role,
          },
        });
      } catch (error) {
        console.error("Error creating user:", error);
        throw new Error("Failed to create user");
      }
    },

    createPost: async (
      _: any,
      { input }: { input: TCreatePostInput },
      ctx: Context
    ) => {
      requireAuth(ctx.userId);
      const post = await ctx.prisma.post.create({
        data: {
          title: input.title,
          content: input.content ?? null,
          userId: Number(input.userId),
        },
      });

      await redis.del("posts:all");
      await redis.del(`posts:user:${ctx.userId}`);

      pubsub.publish("POST_ADDED", { postAdded: post });

      return post;
    },

    loginUser: async (_: any, { email }: { email: string }, ctx: Context) => {
      if (!email) {
        throw new ApolloError("Email is required for login", "EMAIL_REQUIRED");
      }

      const user = await ctx.prisma.user.findUnique({ where: { email } });

      if (!user) {
        throw new ApolloError("User not found", "USER_NOT_FOUND");
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "1h",
      });
      return { user, token };
    },

    updatePost: async (_: any, args: { id: string }, ctx: Context) => {
      // user must be authenticated
      requireAuth(ctx.userId);
      const post = await ctx.prisma.post.findUnique({
        where: { id: Number(args.id) },
      });

      if (!post) {
        throw new ApolloError("Post not found", "POST_NOT_FOUND");
      }

      // user must own the post - Ownership authorization
      requireOwnership(post.userId, ctx.userId);
      return ctx.prisma.post.findUnique({ where: { id: Number(args.id) } });
    },
  },

  // this is for resolving nested fields
  User: {
    posts: async (parent: { id: number }, _args: any, ctx: Context) => {
      // return ctx.prisma.post.findMany({ where: { userId: parent.id } });
      return ctx.loaders.postLoader.load(parent.id);
    },

    // this resolver ensures email privacy = field-level authorization
    email: (
      parent: { id: number; email: string },
      _args: any,
      ctx: Context
    ) => {
      if (ctx.userId === parent.id || ctx.role === "ADMIN") {
        return parent.email;
      }
      return null;
    },
  },

  Post: {
    user: async (parent: { userId: number }, _args: any, ctx: Context) => {
      // return ctx.prisma.user.findUnique({ where: { id: parent.userId } });

      // parent.userId is a single ID, so we use .load() to get the user
      return ctx.loaders.userLoader.load(parent.userId);
    },
  },

  Subscription: {
    postAdded: {
      subscribe: (_: any, __: any, ctx: Context) => {
        requireAuth(ctx.userId);
        return pubsub.asyncIterableIterator(["POST_ADDED"]);
      },
    },
  },
};
