const { ApolloServer, gql, ApolloError } = require("apollo-server");

let users = [
  { id: 1, name: "Pratik", age: 25 },
  { id: 2, name: "Ayush", age: 27 }
];

let nextId = 3;

const typeDefs = gql`
  input CreateUserInput {
    name: String!
    age: Int!
  }

  input UpdateUserInput {
    id: ID!
    name: String
    age: Int
  }

  type MutationResponse {
    success: Boolean!
    message: String
    user: User
  }

  type User {
    id: ID!
    name: String!
    age: Int!
  }

  type Query {
    users: [User!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): MutationResponse!
    updateUser(input: UpdateUserInput!): MutationResponse!
    deleteUser(id: ID!): MutationResponse!
  }
`;



const resolvers = {
  Query: {
    users: () => users
  },

  Mutation: {
    createUser: (_, { input }) => {
      if (input.age < 1) {
        throw new ApolloError("Age must be positive", "INVALID_AGE");
      }

      const newUser = {
        id: nextId++,
        name: input.name,
        age: input.age
      };

      users.push(newUser);

      return {
        success: true,
        message: "User created successfully",
        user: newUser
      };
    },

    updateUser: (_, { input }) => {
      const user = users.find(u => u.id == input.id);

      if (!user) {
        throw new ApolloError("User not found", "NOT_FOUND");
      }

      if (input.name) user.name = input.name;
      if (input.age) user.age = input.age;

      return {
        success: true,
        message: "User updated",
        user
      };
    },

    deleteUser: (_, { id }) => {
      const index = users.findIndex(u => u.id == id);

      if (index === -1) {
        throw new ApolloError("User not found", "NOT_FOUND");
      }

      const deleted = users.splice(index, 1)[0];

      return {
        success: true,
        message: "User deleted",
        user: deleted
      };
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen(4000).then(({ url }) => {
  console.log(`🚀 Day 3 GraphQL server ready at ${url}`);
});

