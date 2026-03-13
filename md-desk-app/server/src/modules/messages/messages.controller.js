const messagesService = require('./messages.service');
const notificationsService = require('../notifications/notifications.service');

async function create(req, reply) {
  const { subject, message } = req.body;
  const created = await messagesService.createMessage(req.server.prisma, req.user.id, {
    subject,
    message,
  });
  try {
    await notificationsService.notifyAdmins(req.server.prisma, {
      type: 'new_message',
      title: 'New customer message',
      body: subject,
    });
  } catch (err) {
    req.log?.error?.(err) || console.error('Notification notifyAdmins failed:', err);
  }
  return reply.status(201).send({ success: true, message: created });
}

async function myList(req, reply) {
  const { page = 1, limit = 20 } = req.query || {};
  const result = await messagesService.listMy(req.server.prisma, req.user.id, Number(page), Number(limit));
  return reply.send({ success: true, ...result });
}

async function adminList(req, reply) {
  const { page = 1, limit = 20 } = req.query || {};
  const result = await messagesService.listAdmin(
    req.server.prisma,
    Number(page),
    Number(limit)
  );
  return reply.send({ success: true, ...result });
}

async function getById(req, reply) {
  const { id } = req.params;
  const msg = await messagesService.getById(req.server.prisma, id);
  return reply.send({ success: true, message: msg });
}

async function reply(req, reply) {
  const { id } = req.params;
  const { reply: replyText } = req.body;
  const msg = await messagesService.reply(req.server.prisma, id, replyText, req.user.id);
  return reply.send({ success: true, message: msg });
}

module.exports = { create, myList, adminList, getById, reply };
