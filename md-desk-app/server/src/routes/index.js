const authRoutes = require('../modules/auth/auth.routes');
const complaintsRoutes = require('../modules/complaints/complaints.routes');
const uploadRoutes = require('../modules/upload/upload.routes');
const messagesRoutes = require('../modules/messages/messages.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const productsRoutes = require('../modules/products/products.routes');
const dealersRoutes = require('../modules/dealers/dealers.routes');
const notificationsRoutes = require('../modules/notifications/notifications.routes');
const clientsAdminRoutes = require('../modules/clients/clients.routes');
const projectsAdminRoutes = require('../modules/projects/projects.routes');

const complaintsController = require('../modules/complaints/complaints.controller');
const productsController = require('../modules/products/products.controller');
const dealersController = require('../modules/dealers/dealers.controller');
const { updateStatusSchema, queryListSchema } = require('../modules/complaints/complaints.validation');
const { createProductSchema, updateProductSchema, productIdParam } = require('../modules/products/products.validation');
const { createDealerSchema, updateDealerSchema, dealerIdParam } = require('../modules/dealers/dealers.validation');
const { composePreHandlers } = require('../utils/preHandler');

async function registerRoutes(fastify) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(complaintsRoutes, { prefix: '/complaints' });

  fastify.register(async (instance) => {
    const admin = composePreHandlers(instance.authenticateJWT, instance.authorizeRole('ADMIN'));
    const adminComplaintSchema = { tags: ['complaints'], security: [{ bearerAuth: [] }] };
    instance.get('/', { preHandler: admin, schema: { ...adminComplaintSchema, summary: 'List all complaints (admin)', querystring: queryListSchema.querystring } }, complaintsController.adminList);
    instance.get('/high-priority', { preHandler: admin, schema: { ...adminComplaintSchema, summary: 'High priority complaints (admin)', querystring: queryListSchema.querystring } }, complaintsController.highPriority);
    instance.put('/:id/status', { preHandler: admin, schema: { ...adminComplaintSchema, summary: 'Update complaint status (admin)', params: updateStatusSchema.params, body: updateStatusSchema.body } }, complaintsController.updateStatus);
  }, { prefix: '/admin/complaints' });

  fastify.register(uploadRoutes, { prefix: '/upload' });
  fastify.register(messagesRoutes, { prefix: '/messages' });
  fastify.register(dashboardRoutes, { prefix: '/admin/dashboard' });
  fastify.register(productsRoutes, { prefix: '/products' });
  fastify.register(dealersRoutes, { prefix: '/dealers' });
  fastify.register(notificationsRoutes, { prefix: '/notifications' });
  fastify.register(clientsAdminRoutes, { prefix: '/admin/clients' });
  fastify.register(projectsAdminRoutes, { prefix: '/admin/projects' });

  fastify.register(async (instance) => {
    const admin = composePreHandlers(instance.authenticateJWT, instance.authorizeRole('ADMIN'));
    const adminSchema = { tags: ['products'], security: [{ bearerAuth: [] }] };
    instance.post('/', { preHandler: admin, schema: { ...adminSchema, summary: 'Create product', body: createProductSchema.body } }, productsController.create);
    instance.get('/:id', { preHandler: admin, schema: { ...adminSchema, summary: 'Get product (admin)', params: productIdParam.params } }, productsController.getById);
    instance.put('/:id', { preHandler: admin, schema: { ...adminSchema, summary: 'Update product', params: updateProductSchema.params, body: updateProductSchema.body } }, productsController.update);
    instance.delete('/:id', { preHandler: admin, schema: { ...adminSchema, summary: 'Delete product', params: productIdParam.params } }, productsController.remove);
  }, { prefix: '/admin/products' });

  fastify.register(async (instance) => {
    const admin = composePreHandlers(instance.authenticateJWT, instance.authorizeRole('ADMIN'));
    const adminSchema = { tags: ['dealers'], security: [{ bearerAuth: [] }] };
    instance.get('/template', { preHandler: admin, schema: { ...adminSchema, summary: 'Download dealers Excel template' } }, dealersController.template);
    instance.post('/bulk-upload', { preHandler: admin, schema: { ...adminSchema, summary: 'Bulk upload dealers via Excel' } }, dealersController.bulkUpload);
    instance.post('/', { preHandler: admin, schema: { ...adminSchema, summary: 'Create dealer', body: createDealerSchema.body } }, dealersController.create);
    instance.get('/:id', { preHandler: admin, schema: { ...adminSchema, summary: 'Get dealer (admin)', params: dealerIdParam.params } }, dealersController.getById);
    instance.put('/:id', { preHandler: admin, schema: { ...adminSchema, summary: 'Update dealer', params: updateDealerSchema.params, body: updateDealerSchema.body } }, dealersController.update);
    instance.delete('/:id', { preHandler: admin, schema: { ...adminSchema, summary: 'Delete dealer', params: dealerIdParam.params } }, dealersController.remove);
  }, { prefix: '/admin/dealers' });
}

module.exports = registerRoutes;
