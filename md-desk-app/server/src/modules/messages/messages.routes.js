const messagesController = require('./messages.controller');
const { composePreHandlers } = require('../../utils/preHandler');

const messageBodySchema = {
  type: 'object',
  required: ['subject', 'message'],
  properties: {
    subject: { type: 'string' },
    message: { type: 'string' },
  },
};

async function messagesRoutes(fastify) {
  fastify.post(
    '/',
    {
      preHandler: fastify.authenticateJWT,
      schema: {
        tags: ['messages'],
        summary: 'Send message to MD',
        security: [{ bearerAuth: [] }],
        body: messageBodySchema,
        response: { 201: { type: 'object', description: 'Message sent' } },
      },
    },
    messagesController.create
  );

  fastify.get('/my', {
    preHandler: fastify.authenticateJWT,
    schema: {
      tags: ['messages'],
      summary: 'My messages (customer)',
      security: [{ bearerAuth: [] }],
      querystring: { type: 'object', properties: { page: { type: 'integer' }, limit: { type: 'integer' } } },
    },
  }, messagesController.myList);

  const admin = composePreHandlers(fastify.authenticateJWT, fastify.authorizeRole('ADMIN'));
  fastify.get('/admin', { preHandler: admin, schema: { tags: ['messages'], summary: 'List messages (admin)', security: [{ bearerAuth: [] }] } }, messagesController.adminList);
  fastify.get('/admin/:id', { preHandler: admin, schema: { tags: ['messages'], summary: 'Get message (admin)', security: [{ bearerAuth: [] }], params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } }, messagesController.getById);
  fastify.post(
    '/admin/:id/reply',
    {
      preHandler: admin,
      schema: {
        tags: ['messages'],
        summary: 'Reply to message (admin)',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        body: { type: 'object', required: ['reply'], properties: { reply: { type: 'string' } } },
      },
    },
    messagesController.reply
  );
}

module.exports = messagesRoutes;
