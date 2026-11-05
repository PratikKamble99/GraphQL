import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { gql } from "graphql-tag";

const typeDefs = gql`
  type User @key(fields: "id") {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }
`;

const users = [
  { id: "1", name: "Pratik", email: "pratik@test.com" },
  { id: "2", name: "Rahul", email: "rahul@test.com" },
];

const resolvers = {
  Query: {
    users: () => users,
    user: (_: any, { id }: any) => users.find((u) => u.id === id),
  },
  User: {
    __resolveReference: (ref: any) => users.find((u) => u.id === ref.id),
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

const {url} = await startStandaloneServer(server, {
  listen: {
    port: 4001,
  },
});
console.log("👤 Users subgraph running on "+url);
