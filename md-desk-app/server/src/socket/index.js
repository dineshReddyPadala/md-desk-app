const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const chatService = require('../modules/chat/chat.service');

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
    if (socket.role === 'ADMIN' || socket.role === 'EMPLOYEE') {
      socket.join('admin');
    }
    fastify.log.info({ userId, role: socket.role }, 'Socket connected');

    socket.on('chat:join', async (payload, ack) => {
      const roomId = payload && payload.roomId;
      if (!roomId) {
        if (typeof ack === 'function') ack({ ok: false, message: 'roomId required' });
        return;
      }
      try {
        const prisma = fastify.prisma;
        const user = { id: socket.userId, role: socket.role };
        const result = await chatService.canJoinChatRoom(prisma, user, roomId);
        if (!result.ok) {
          if (typeof ack === 'function') ack({ ok: false, message: result.message || 'Forbidden' });
          return;
        }
        socket.join(`chat:${roomId}`);
        if (typeof ack === 'function') ack({ ok: true });
      } catch (err) {
        fastify.log.error({ err, roomId }, 'chat:join failed');
        if (typeof ack === 'function') ack({ ok: false, message: err.message || 'Error' });
      }
    });

    socket.on('chat:leave', (payload) => {
      const roomId = payload && payload.roomId;
      if (roomId) socket.leave(`chat:${roomId}`);
    });

    socket.on('disconnect', () => {
      fastify.log.info({ userId }, 'Socket disconnected');
    });
  });

  ioInstance = io;
  fastify.log.info('Socket.IO attached');
  return io;
}

module.exports = { attachSocket, getIo };
