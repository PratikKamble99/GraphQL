const { ApolloServer, gql, ApolloError } = require("apollo-server");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

let users = [];
let id = 1;

const SECRET = "SUPER_SECRET_KEY"; // use env in prod

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  type Query {
    me: User
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
  }
`;
const resolvers = {
  Query: {
    me: (_, __, context) => {
      if (!context.userId) {
        throw new ApolloError("Not authenticated", "UNAUTHENTICATED");
      }
      return users.find(u => u.id === context.userId);
    },
  },

  Mutation: {
    register: async (_, { input }) => {
      const existing = users.find(u => u.email === input.email);
      if (existing) throw new ApolloError("Email already used", "EMAIL_EXISTS");

      const hashed = await bcrypt.hash(input.password, 10);

      const newUser = {
        id: id++,
        name: input.name,
        email: input.email,
        password: hashed
      };

      users.push(newUser);

      const token = jwt.sign({ userId: newUser.id }, SECRET);

      return {
        token,
        user: newUser
      };
    },

    login: async (_, { email, password }) => {
      const user = users.find(u => u.email === email);
      if (!user) throw new ApolloError("Invalid credentials", "BAD_LOGIN");

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new ApolloError("Invalid credentials", "BAD_LOGIN");

      const token = jwt.sign({ userId: user.id }, SECRET);

      return { token, user };
    }
  }
};
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const auth = req.headers.authorization || "";

    console.log(users)

    if (auth.startsWith("Bearer ")) {
      try {
        const token = auth.replace("Bearer ", "");
        const payload = jwt.verify(token, SECRET);
        return { userId: payload.userId };
      } catch {
        return {};
      }
    }

    return {};
  }
});

server.listen(4000).then(({ url }) => {
  console.log(`🚀 Day 4 GraphQL server ready at ${url}`);
});

