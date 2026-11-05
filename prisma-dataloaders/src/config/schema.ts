import { gql } from "apollo-server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { resolvers } from "../resolvers/resolvers.js";

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String
    createdAt: String!
    user: User!
  }

  enum Role {
    USER
    ADMIN
  }

  input CreateUserInput {
    name: String!
    email: String!
    role: Role!
  }

  input CreatePostInput {
    title: String!
    content: String
    userId: ID!
  }

  input PostFilter {
    titleContains: String
    contentContains: String
    userId: Int
    createdAfter: String
    createdBefore: String
  }

  enum SortOrder {
    asc
    desc
  }

  input PostSort {
    field: String!
    order: SortOrder!
  }

  type PaginatedPosts {
    posts: [Post!]!
    hasNextPage: Boolean!
    lastCursor: String
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
  }

  extend type Query {
    postsOffset(limit: Int!, offset: Int!): [Post!]!
    postsCursor(first: Int!, after: String): PaginatedPosts!
  }

  extend type Query {
    postsFiltered(
      filter: PostFilter
      sort: PostSort
      first: Int
      after: String
    ): [Post!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    createPost(input: CreatePostInput!): Post!
  }

  extend type Mutation {
    loginUser(email: String!): AuthPayload!
  }

  extend type Mutation {
    updatePost(id: ID!): Post!
  }

  type Subscription {
    postAdded: Post!
  }
`;


export const schema = makeExecutableSchema({
  typeDefs,
  resolvers: resolvers,
});

