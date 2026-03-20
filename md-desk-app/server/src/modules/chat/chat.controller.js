const chatService = require('./chat.service');
const { getIo } = require('../../socket');

function emitChatEvent(roomId, event, payload) {
  const io = getIo();
  if (io) io.to(`chat:${roomId}`).emit(event, payload);
}

function publicMessageFromCreated(msg) {
  if (!msg) return null;
  return {
    id: msg.id,
    roomId: msg.roomId,
    senderId: msg.senderId,
    kind: msg.kind,
    body: msg.body,
    attachmentUrl: msg.attachmentUrl,
    attachmentMime: msg.attachmentMime,
    createdAt: msg.createdAt,
    sender: msg.sender,
    deliveryStatus: null,
  };
}

async function listRooms(req, reply) {
  const data = await chatService.listMyRooms(req.server.prisma, req.user);
  return reply.send({ success: true, ...data });
}

async function suggestedContacts(req, reply) {
  const users = await chatService.suggestedContacts(req.server.prisma, req.user);
  return reply.send({ success: true, users });
}

async function getProjectRoom(req, reply) {
  try {
    const room = await chatService.getOrCreateProjectRoom(req.server.prisma, req.params.projectId, req.user);
    return reply.send({ success: true, room });
  } catch (e) {
    return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
  }
}

async function openDirect(req, reply) {
  try {
    const room = await chatService.findOrCreateDirectRoom(req.server.prisma, req.user, req.body.otherUserId);
    return reply.send({ success: true, room });
  } catch (e) {
    return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
  }
}

async function listMessages(req, reply) {
  try {
    const { before, limit } = req.query || {};
    const data = await chatService.listMessages(req.server.prisma, req.params.roomId, req.user, {
      before,
      limit,
    });
    return reply.send({ success: true, ...data });
  } catch (e) {
    return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
  }
}

async function send(req, reply) {
  try {
    const message = await chatService.sendMessage(req.server.prisma, req.params.roomId, req.user, req.body);
    const full = await req.server.prisma.chatMessage.findUnique({
      where: { id: message.id },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
    emitChatEvent(req.params.roomId, 'chat:message', {
      roomId: req.params.roomId,
      message: publicMessageFromCreated(full),
    });
    return reply.status(201).send({ success: true, message });
  } catch (e) {
    return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
  }
}

async function read(req, reply) {
  try {
    await chatService.markRead(req.server.prisma, req.params.roomId, req.user);
    emitChatEvent(req.params.roomId, 'chat:read', {
      roomId: req.params.roomId,
      userId: req.user.id,
      readAt: new Date().toISOString(),
    });
    return reply.send({ success: true });
  } catch (e) {
    return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
  }
}

async function adminProjects(req, reply) {
  const items = await chatService.adminProjectsWithChat(req.server.prisma);
  return reply.send({ success: true, items });
}

module.exports = {
  listRooms,
  suggestedContacts,
  getProjectRoom,
  openDirect,
  listMessages,
  send,
  read,
  adminProjects,
};
