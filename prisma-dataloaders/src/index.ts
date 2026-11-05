import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import depthLimit from "graphql-depth-limit";
import { useServer } from "graphql-ws/use/ws";
import http from "http";
import { WebSocketServer } from "ws";
import {
  Context,
  createContext,
  prisma,
  wsCreateContext,
} from "./config/context.js";
import { blockNonPersistedQueries } from "./config/persistQuery.js";
import { schema } from "./config/schema.js";
import { redis } from "./redis/redis.js";

const allowedQueries = new Set([
  "GetPosts",
  "CreatePost",
  "Login"
]);

export const JWT_SECRET = "JWT_SECRET";

// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

// 🔥 WebSocket server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

const serverCleanup = useServer(
  {
    schema: schema,
    // websocket server context
    context: async (ctx) => wsCreateContext(ctx),
  },
  wsServer
);

const server = new ApolloServer<Context>({
  schema: schema,
  introspection: true,
  persistedQueries: {
    cache: {
      async get(hash: string) {
        console.log(hash, "Hash");
        const query = await redis.get(`apq:${hash}`);
        return query ?? null;
      },

      async set(hash: string, query: string) {
        // TTL: 24 hours
        console.log(hash, "Hash");
        await redis.set(`apq:${hash}`, query, "EX", 60 * 60 * 24);
      },
    } as any,
  },
  validationRules: [depthLimit(5)],
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    blockNonPersistedQueries,
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});
// Ensure we wait for our server to start
await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  express.json(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
   rateLimit({
    windowMs: 60 *1000,
    max: 1
  }),
  expressMiddleware(server, {
    context: async ({ req }) => createContext(req),
  })
);

new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve))
  .then((res) => {
    console.log(`🚀 Server ready at http://localhost:4000/graphql`);
    console.log("🚀 WS GraphQL: ws://localhost:4000/graphql");
  })
  .catch((err) => {
    console.error("Server failed to start", err);
    prisma.$disconnect();
  });
