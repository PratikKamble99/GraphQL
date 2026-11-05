const { ApolloServer, gql } = require("apollo-server");

const users = [
  { id: 1, name: "Pratik", age: 25 },
  { id: 2, name: "Ayush", age: 27 }
];

const posts = [
  { id: 1, title: "GraphQL Day 2", userId: 1 },
  { id: 2, title: "Learning Node.js", userId: 1 },
  { id: 3, title: "React Context API", userId: 2 }
];

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    age: Int!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    user: User!
  }

  type Query {
    user(id: ID!): User
    users: [User!]!
  }
`;

const resolvers = {
  Query: {
    users: () => users,
    /* 
    query GetUserDetails {
      users { // Fisrt load users then it's data work as parent to posts - because Posts is inside the User
        id
        name
        posts {
          title
        }
      }
    }
    
    */
    user: (_, args) => users.find((u) => u.id == args.id),
  },

  User: {
    posts: (parent) => posts.filter((p) => p.userId == parent.id)
  },

  Post: {
    user: (parent) => users.find((u) => u.id == parent.userId)
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({
    message: "Hello from context!"   // used in Day 3
  })
});

server.listen(4000).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

