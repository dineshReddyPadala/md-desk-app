const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');

/** Socket.IO instance (set after listen). Controllers use getIo() instead of Fastify decorator (decorators cannot be added after start). */
let ioInstance = null;

function getIo() {
  return ioInstance;
}

/**
 * Attach Socket.IO to the Fastify HTTP server, authenticate by JWT, and join rooms:
 * - user:{userId} for each connected user (customers and admins)
 * - admin for admin users (so we can emit "new message" / "new complaint" to all admins)
 */
function attachSocket(fastify) {
  if (!fastify.server) {
    fastify.log.warn('Socket.IO: fastify.server not available (call after listen)');
    return null;
  }
  const io = new Server(fastify.server, {
    cors: {
      origin: config.cors.allowedOrigins,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.id;
      socket.role = decoded.role;
      next();
    } catch (err) {
      next(new Error(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const room = `user:${userId}`;
    socket.join(room);
    if (socket.role === 'ADMIN') {
      socket.join('admin');
    }
    fastify.log.info({ userId, role: socket.role }, 'Socket connected');
    socket.on('disconnect', () => {
      fastify.log.info({ userId }, 'Socket disconnected');
    });
  });

  ioInstance = io;
  fastify.log.info('Socket.IO attached');
  return io;
}

module.exports = { attachSocket, getIo };
