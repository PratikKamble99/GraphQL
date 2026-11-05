import { PrismaClient, Prisma, User } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/client";
import DataLoader from "dataloader";

export function createUserLoader(
  prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>
) {
  /* 
    1. DataLoader collects all .load() calls 
    2. Passes them as one array to your batch function
    3. Returns an array of results in the same order    
*/
  return new DataLoader<number, User | undefined>(async (userIds) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...userIds] } },
    });

    const userMap: Record<number, User> = {};
    users.forEach((user: User) => {
      userMap[user.id] = user;
    });

    return userIds.map((id) => userMap[id]);
  });
}
