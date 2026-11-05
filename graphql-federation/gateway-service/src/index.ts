import { ApolloServer } from "@apollo/server";
import { ApolloGateway } from "@apollo/gateway";
import { startStandaloneServer } from "@apollo/server/standalone";

const gateway = new ApolloGateway({
  serviceList: [
    { name: "users", url: "http://localhost:4001/graphql" },
    { name: "posts", url: "http://localhost:4002/graphql" },
  ],
});

const server = new ApolloServer({ gateway });

const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log("🚀 Gateway running "+url);
