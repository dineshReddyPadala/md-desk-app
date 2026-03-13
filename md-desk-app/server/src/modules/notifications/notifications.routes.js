const notificationsController = require('./notifications.controller');

async function notificationsRoutes(fastify) {
  const auth = fastify.authenticateJWT;
  const schema = { tags: ['notifications'], security: [{ bearerAuth: [] }] };
  fastify.get('/', { preHandler: auth, schema: { ...schema, summary: 'My notifications', querystring: { type: 'object', properties: { limit: { type: 'integer' } } } } }, notificationsController.list);
  fastify.get('/unread-count', { preHandler: auth, schema: { ...schema, summary: 'Unread count' } }, notificationsController.unreadCount);
  fastify.patch('/:id/read', { preHandler: auth, schema: { ...schema, summary: 'Mark read', params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } }, notificationsController.markRead);
  fastify.post('/mark-all-read', { preHandler: auth, schema: { ...schema, summary: 'Mark all read' } }, notificationsController.markAllRead);
}

module.exports = notificationsRoutes;
