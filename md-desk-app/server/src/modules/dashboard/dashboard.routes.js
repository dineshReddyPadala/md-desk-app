const dashboardController = require('./dashboard.controller');
const { composePreHandlers } = require('../../utils/preHandler');

async function dashboardRoutes(fastify) {
  const admin = composePreHandlers(fastify.authenticateJWT, fastify.authorizeRole('ADMIN'));
  const adminSchema = { tags: ['dashboard'], security: [{ bearerAuth: [] }] };
  fastify.get('/summary', { preHandler: admin, schema: { ...adminSchema, summary: 'Dashboard summary counts' } }, dashboardController.summary);
  fastify.get('/region-stats', { preHandler: admin, schema: { ...adminSchema, summary: 'Complaints by region' } }, dashboardController.regionStats);
  fastify.get('/product-stats', { preHandler: admin, schema: { ...adminSchema, summary: 'Complaints by product' } }, dashboardController.productStats);
  fastify.get('/status-stats', { preHandler: admin, schema: { ...adminSchema, summary: 'Complaints by status (for donut)' } }, dashboardController.statusStats);
  fastify.get('/creation-stats', { preHandler: admin, schema: { ...adminSchema, summary: 'Complaints created per day', querystring: { type: 'object', properties: { days: { type: 'integer', default: 7 } } } } }, dashboardController.creationStats);
}

module.exports = dashboardRoutes;
