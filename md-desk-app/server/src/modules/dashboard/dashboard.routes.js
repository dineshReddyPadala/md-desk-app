const dashboardController = require('./dashboard.controller');
const { composePreHandlers } = require('../../utils/preHandler');

const ADMIN_OR_EMPLOYEE = ['ADMIN', 'EMPLOYEE'];

async function dashboardRoutes(fastify) {
  const staff = composePreHandlers(fastify.authenticateJWT, fastify.authorizeRole(ADMIN_OR_EMPLOYEE));
  const adminSchema = { tags: ['dashboard'], security: [{ bearerAuth: [] }] };
  fastify.get('/summary', { preHandler: staff, schema: { ...adminSchema, summary: 'Dashboard summary counts' } }, dashboardController.summary);
  fastify.get('/region-stats', { preHandler: staff, schema: { ...adminSchema, summary: 'Complaints by region' } }, dashboardController.regionStats);
  fastify.get('/project-complaint-stats', { preHandler: staff, schema: { ...adminSchema, summary: 'Complaints by project (via client mapping)' } }, dashboardController.projectComplaintStats);
  fastify.get('/status-stats', { preHandler: staff, schema: { ...adminSchema, summary: 'Complaints by status (for donut)' } }, dashboardController.statusStats);
  fastify.get('/creation-stats', { preHandler: staff, schema: { ...adminSchema, summary: 'Complaints created per day', querystring: { type: 'object', properties: { days: { type: 'integer', default: 7 } } } } }, dashboardController.creationStats);
}

module.exports = dashboardRoutes;
