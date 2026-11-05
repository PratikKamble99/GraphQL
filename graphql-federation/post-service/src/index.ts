import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import {gql} from "graphql-tag";

const typeDefs = gql`
  type Post {
    id: ID!
    title: String!
    user: User!
  }

  extend type User @key(fields: "id") {
    id: ID! @external
    posts: [Post!]!
  }

  type Query {
    posts: [Post!]!
  }
`;

const posts = [
  { id: "1", title: "GraphQL Day 13", userId: "1" },
  { id: "2", title: "Federation Explained", userId: "2" },
];

const resolvers = {
  Query: {
    posts: () => posts,
  },
  User: {
    posts: (user: any) => posts.filter((p) => p.userId === user.id),
  },
  Post: {
    user: (post: any) => ({ id: post.userId }),
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, { listen: { port: 4002 } });
console.log("📝 Posts subgraph running on 4002");
