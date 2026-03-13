const fp = require('fastify-plugin');

async function authorizeRole(fastify) {
  fastify.decorate('authorizeRole', function (roles) {
    return async function (request, reply) {
      if (!request.user) {
        return reply.status(401).send({ success: false, message: 'Unauthorized' });
      }
      const allowed = Array.isArray(roles) ? roles : [roles];
      if (!allowed.includes(request.user.role)) {
        return reply.status(403).send({ success: false, message: 'Forbidden' });
      }
    };
  });
}

module.exports = fp(authorizeRole, { name: 'authorizeRole' });
