import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { stitchedSchema } from "./stitchedSchema.js";

const server = new ApolloServer({ schema: stitchedSchema });
startStandaloneServer(server, { listen: { port: 4000 } });
