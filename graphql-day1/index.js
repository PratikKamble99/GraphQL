const { ApolloServer, gql } = require("apollo-server");

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    getFullName: String! 
  }

  type Query {
    hello: String!
    user: User!
  }
`;

const resolvers = {
  Query: { // This works as GET request
    hello: () => "Welcome to GraphQL Day 1!", // this is one resolver which return data
    user: () => ({	
      id: 1,
      name: "Pratik",
      email: "pratik@example.com"
    })
  },
 User:{
	getFullName: (parent) => parent.name+" "+parent.email // This allows you to add custom computed field in schema
 }
};

/*
 
 Eg. When you query user -> it allows you to access that new field with type defined fields
	user: {
	id
	name
	getFullName
	}

 **/

const server = new ApolloServer({ typeDefs, resolvers });

server.listen(4000).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

