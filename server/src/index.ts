import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { tempStore } from './storage/tempStore.js';
import { signetBot } from './bot/bot.js';
import { documentRoutes } from './routes/documentRoutes.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

async function startServer() {
  const server = Fastify({
    logger: {
      level: config.isProduction ? 'info' : 'debug'
    }
  });

  // Enable CORS
  await server.register(cors, {
    origin: true,
    credentials: true
  });

  // Support multipart uploads (up to 30MB)
  await server.register(multipart, {
    limits: {
      fileSize: 30 * 1024 * 1024 // 30 MB
    }
  });

  // Register API routes
  await server.register(documentRoutes);

  // Serve compiled frontend in production or if available
  const publicCandidates = [
    path.join(dirname, 'public'),
    path.join(dirname, '../public'),
    path.resolve(dirname, '../../web/dist')
  ];

  let staticRoot: string | null = null;
  for (const candidate of publicCandidates) {
    if (fs.existsSync(candidate)) {
      staticRoot = candidate;
      break;
    }
  }

  if (staticRoot) {
    server.log.info(`[Signet] Serving frontend assets from ${staticRoot}`);
    await server.register(fastifyStatic, {
      root: staticRoot,
      prefix: '/'
    });

    // Fallback for SPA navigation
    server.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api') || request.url.startsWith('/health')) {
        return reply.status(404).send({ error: 'Endpoint not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  // Start background tasks
  tempStore.startCleanupScheduler(10 * 60 * 1000); // Check every 10 min
  await signetBot.start();

  // Graceful shutdown handling
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      server.log.info(`Received ${signal}. Shutting down gracefully...`);
      tempStore.stopCleanupScheduler();
      await signetBot.stop();
      await server.close();
      process.exit(0);
    });
  }

  try {
    await server.listen({ port: config.port, host: config.host });
    console.log(`\n======================================================`);
    console.log(`  SIGNET SERVER IS RUNNING`);
    console.log(`  Address:  http://${config.host}:${config.port}`);
    console.log(`  Web App:  ${config.webAppUrl}`);
    console.log(`  Storage:  ${config.storageDir}`);
    console.log(`======================================================\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

startServer();
