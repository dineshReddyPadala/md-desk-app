const { composePreHandlers } = require('../../utils/preHandler');
const chatController = require('./chat.controller');
const {
  roomIdParam,
  projectIdParam,
  listMessagesQuery,
  sendMessageBody,
  directBody,
} = require('./chat.validation');

const AUTH = ['ADMIN', 'EMPLOYEE', 'CUSTOMER'];
const ADMIN_ONLY = ['ADMIN'];

async function chatRoutes(fastify) {
  const anyUser = composePreHandlers(fastify.authenticateJWT, fastify.authorizeRole(AUTH));
  const adminOnly = composePreHandlers(fastify.authenticateJWT, fastify.authorizeRole(ADMIN_ONLY));
  const schemaBase = { tags: ['chat'], security: [{ bearerAuth: [] }] };

  fastify.get('/rooms', {
    preHandler: anyUser,
    schema: { ...schemaBase, summary: 'List my chat rooms' },
  }, chatController.listRooms);

  fastify.get('/contacts', {
    preHandler: anyUser,
    schema: { ...schemaBase, summary: 'Users you can start a direct chat with' },
  }, chatController.suggestedContacts);

  fastify.get('/projects/:projectId/room', {
    preHandler: anyUser,
    schema: { ...schemaBase, summary: 'Get or create project group chat', params: projectIdParam },
  }, chatController.getProjectRoom);

  fastify.post('/direct', {
    preHandler: anyUser,
    schema: { ...schemaBase, summary: 'Open direct 1:1 chat', body: directBody },
  }, chatController.openDirect);

  fastify.get('/rooms/:roomId/messages', {
    preHandler: anyUser,
    schema: {
      ...schemaBase,
      summary: 'List messages in a room',
      params: roomIdParam,
      querystring: listMessagesQuery,
    },
  }, chatController.listMessages);

  fastify.post('/rooms/:roomId/messages', {
    preHandler: anyUser,
    schema: {
      ...schemaBase,
      summary: 'Send a chat message',
      params: roomIdParam,
      body: sendMessageBody,
    },
  }, chatController.send);

  fastify.post('/rooms/:roomId/read', {
    preHandler: anyUser,
    schema: { ...schemaBase, summary: 'Mark room as read (seen)', params: roomIdParam },
  }, chatController.read);

  fastify.get('/admin/projects', {
    preHandler: adminOnly,
    schema: { ...schemaBase, summary: 'All projects with project chat summary (admin)' },
  }, chatController.adminProjects);
}

module.exports = chatRoutes;
