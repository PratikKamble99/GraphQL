import { resolvers } from "../src/resolvers";

describe("createUser resolver", () => {
  it("creates user successfully", async () => {
    const ctx: any = {
      prisma: {
        user: {
          create: jest.fn().mockResolvedValue({
            id: 1,
            name: "Pratik",
            email: "test@test.com"
          })
        }
      }
    };

    const result = await resolvers.Mutation.createUser(
      null,
      { input: { name: "User1", email: "test@test.com", role:"USER" } },
      ctx
    );

    expect(result.id).toBeTruthy();
    expect(result.email).toBe("test@test.com");
  });
});
