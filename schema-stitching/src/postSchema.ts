import { makeExecutableSchema } from "@graphql-tools/schema";

export const postSchema = makeExecutableSchema({
  typeDefs: `
    type Post {
      id: ID!
      title: String!
      userId: ID!
    }

    type Query {
      postsByUser(userId: ID!): [Post!]!
    }
  `,
  resolvers: {
    Query: {
      postsByUser: (_, { userId }) => [
        { id: "1", title: "Hello GraphQL", userId }
      ]
    }
  }
});
