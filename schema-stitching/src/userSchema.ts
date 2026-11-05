import { makeExecutableSchema } from "@graphql-tools/schema";

export const userSchema = makeExecutableSchema({
  typeDefs: `
    type User {
      id: ID!
      name: String!
    }

    type Query {
      user(id: ID!): User
    }
  `,
  resolvers: {
    Query: {
      user: (_, { id }) => ({ id, name: "Pratik" })
    }
  }
});
