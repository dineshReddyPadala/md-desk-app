const notificationsService = require('./notifications.service');

async function list(req, reply) {
  const userId = req.user.id;
  const limit = Math.min(Number(req.query?.limit) || 20, 50);
  const list = await notificationsService.listForUser(req.server.prisma, userId, { limit });
  return reply.send({ success: true, items: list });
}

async function unreadCount(req, reply) {
  const count = await notificationsService.unreadCount(req.server.prisma, req.user.id);
  return reply.send({ success: true, count });
}

async function markRead(req, reply) {
  const { id } = req.params;
  await notificationsService.markRead(req.server.prisma, id, req.user.id);
  return reply.send({ success: true });
}

async function markAllRead(req, reply) {
  await notificationsService.markAllRead(req.server.prisma, req.user.id);
  return reply.send({ success: true });
}

module.exports = { list, unreadCount, markRead, markAllRead };
