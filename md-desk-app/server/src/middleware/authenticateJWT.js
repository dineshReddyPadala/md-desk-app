const fp = require('fastify-plugin');
const jwt = require('jsonwebtoken');
const config = require('../config');

async function authenticateJWT(fastify) {
  fastify.decorate('authenticateJWT', async function (request, reply) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ success: false, message: 'No token provided' });
      }
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret);
      request.user = decoded;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return reply.status(401).send({ success: false, message: 'Token expired' });
      }
      return reply.status(401).send({ success: false, message: 'Invalid token' });
    }
  });
}

module.exports = fp(authenticateJWT, { name: 'authenticateJWT' });
