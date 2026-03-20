const fp = require('fastify-plugin');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');

async function swaggerPlugin(fastify, opts) {
  const port = opts.port || 3000;
  const apiPrefix = opts.apiPrefix || '/api/v1';

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'MD Desk API',
        description: 'Complaint management system API. Use **Authorize** to set a JWT for protected routes.',
        version: '1.0.0',
      },
      servers: [
        { url: `http://localhost:${port}${apiPrefix}`, description: 'Local' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT from login/register',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string' },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string', enum: ['ADMIN', 'EMPLOYEE', 'CUSTOMER'] },
              phone: { type: 'string' },
              city: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      tags: [
        { name: 'auth', description: 'Authentication' },
        { name: 'complaints', description: 'Complaint management' },
        { name: 'messages', description: 'Customer messages' },
        { name: 'dashboard', description: 'Admin dashboard' },
        { name: 'upload', description: 'File upload' },
        { name: 'products', description: 'Products' },
        { name: 'dealers', description: 'Dealers' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
    },
    staticCSP: true,
  });
}

module.exports = fp(swaggerPlugin, { name: 'swagger' });
