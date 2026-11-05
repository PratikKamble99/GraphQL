import { PrismaClient, Prisma, Post } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/client";
import DataLoader from "dataloader";

export function createPostLoader(
  prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>
) {
    // batch function to load posts by user IDs and Dataloader() takes single arays from .load() arg methods.
  return new DataLoader<number, Post[]>(async (userIds) => {
    const posts = await prisma.post.findMany({
      where: { userId: { in: [...userIds] } },
    });

    const postsMap: Record<number, Post[]> = {};
    // initialize the postsMap with empty arrays for each userId
    userIds.forEach((id) => {
      postsMap[id] = [];
    });

    // map posts to their respective users in the postsMap
    posts.forEach((post) => {
      postsMap[post.userId].push(post);
    });

    // return posts in the order of userIds
    return userIds.map((id) => postsMap[id]);
  });
}