import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import dotenv from 'dotenv';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { initializeDatabase } from './database.js';
import { verifyToken } from './auth.js';
import restApiRoutes from './restApi.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

// Initialize database
initializeDatabase();

// Create executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create Express app
const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Mount REST API routes
app.use('/api', restApiRoutes);

// Create HTTP server
const httpServer = createServer(app);

// Context function for authentication
const getContext = ({ req }) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  const user = verifyToken(token);
  return { user };
};

// Create Apollo Server
const server = new ApolloServer({
  schema,
  context: getContext,
  plugins: [
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          }
        };
      }
    }
  ]
});

// WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql'
});

const serverCleanup = useServer(
  {
    schema,
    context: async (ctx) => {
      // Get token from connection params
      const token = ctx.connectionParams?.authorization?.replace('Bearer ', '') || '';
      const user = verifyToken(token);
      return { user };
    }
  },
  wsServer
);

// Start server
async function startServer() {
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🔌 Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
    console.log(`📡 REST API ready at http://localhost:${PORT}/api`);
  });
}

startServer().catch((error) => {
  console.error('Error starting server:', error);
});
