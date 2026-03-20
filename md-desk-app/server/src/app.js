const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const multipart = require('@fastify/multipart');
const sensible = require('@fastify/sensible');

const config = require('./config');
const { createLogger } = require('./utils/logger');
const prismaPlugin = require('./plugins/prisma');
const swaggerPlugin = require('./plugins/swagger');
const cachePlugin = require('./plugins/cache');
const authenticateJWT = require('./middleware/authenticateJWT');
const authorizeRole = require('./middleware/authorizeRole');
const { errorHandler } = require('./middleware/errorHandler');
const registerRoutes = require('./routes');
const { attachSocket } = require('./socket');

const logger = createLogger(config.logLevel);

async function build() {
  const fastify = Fastify({ logger: logger.child({ module: 'app' }) });

  fastify.decorate('config', config);

  await fastify.register(cors, {
    origin: config.cors.allowedOrigins,
    credentials: true,
  });
  await fastify.register(sensible);
  await fastify.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await fastify.register(prismaPlugin);
  await fastify.register(cachePlugin, { config });
  await fastify.register(authenticateJWT);
  await fastify.register(authorizeRole);
  await fastify.register(swaggerPlugin, { port: config.port, apiPrefix: config.apiPrefix });

  fastify.setErrorHandler(errorHandler);

  await fastify.register(registerRoutes, { prefix: config.apiPrefix });

  fastify.get('/health', async () => ({ status: 'ok' }));

  return fastify;
}

async function start() {
  const app = await build();
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    attachSocket(app);
    app.log.info(`Server listening on http://0.0.0.0:${config.port}`);
    app.log.info(`API prefix: ${config.apiPrefix}`);
    app.log.info(`Swagger docs: http://localhost:${config.port}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
