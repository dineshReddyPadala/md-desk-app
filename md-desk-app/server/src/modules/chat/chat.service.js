const { getEmployeeProjectScope } = require('../../utils/employeeProjectScope');

function httpError(statusCode, message) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

function sortedPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

/**
 * True if both users are linked to the same project (client ↔ assignee, or both assignees).
 */
async function usersShareProject(prisma, u1, u2) {
  if (u1 === u2) return false;
  const row = await prisma.project.findFirst({
    where: {
      OR: [
        { AND: [{ clientId: u1 }, { assignees: { some: { employeeId: u2 } } }] },
        { AND: [{ clientId: u2 }, { assignees: { some: { employeeId: u1 } } }] },
        {
          AND: [{ assignees: { some: { employeeId: u1 } } }, { assignees: { some: { employeeId: u2 } } }],
        },
      ],
    },
    select: { id: true },
  });
  return !!row;
}

async function assertCanDirectMessage(prisma, actor, otherUserId) {
  if (actor.id === otherUserId) throw httpError(400, 'Cannot message yourself');
  const other = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!other) throw httpError(404, 'User not found');
  if (actor.role === 'ADMIN') return;
  if (actor.role === 'EMPLOYEE' && other.role === 'ADMIN') return;
  const ok = await usersShareProject(prisma, actor.id, otherUserId);
  if (!ok) throw httpError(403, 'You can only message users linked to the same project');
}

async function loadProjectForChat(prisma, projectId) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      assignees: true,
      client: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

async function assertProjectChatAccess(user, project) {
  if (!project) throw httpError(404, 'Project not found');
  if (user.role === 'ADMIN') return;
  if (user.role === 'CUSTOMER') {
    if (project.clientId !== user.id) throw httpError(403, 'Forbidden');
    return;
  }
  if (user.role === 'EMPLOYEE') {
    const ok = project.assignees.some((a) => a.employeeId === user.id);
    if (!ok) throw httpError(403, 'Forbidden');
    return;
  }
  throw httpError(403, 'Forbidden');
}

async function loadRoom(prisma, roomId) {
  return prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      participants: true,
      project: { include: { assignees: true, client: { select: { id: true } } } },
    },
  });
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ id: string, role: string }} user - JWT user
 * @param {string} roomId
 */
async function assertRoomAccess(prisma, user, roomId) {
  const room = await loadRoom(prisma, roomId);
  if (!room) throw httpError(404, 'Chat room not found');
  if (user.role === 'ADMIN') return room;
  const isMember = room.participants.some((p) => p.userId === user.id);
  if (!isMember) throw httpError(403, 'Forbidden');
  return room;
}

function participantUserIds(project) {
  const ids = new Set();
  if (project.clientId) ids.add(project.clientId);
  for (const a of project.assignees || []) ids.add(a.employeeId);
  return [...ids];
}

async function syncProjectRoomParticipants(prisma, roomId, project) {
  const ids = participantUserIds(project);
  if (!ids.length) return;
  await prisma.chatParticipant.createMany({
    data: ids.map((userId) => ({ roomId, userId })),
    skipDuplicates: true,
  });
}

async function getOrCreateProjectRoom(prisma, projectId, user) {
  const project = await loadProjectForChat(prisma, projectId);
  await assertProjectChatAccess(user, project);

  const seedIds = participantUserIds(project);
  if (!seedIds.length) {
    throw httpError(400, 'Add a client or assignees to this project to enable chat');
  }

  let room = await prisma.chatRoom.findFirst({
    where: { type: 'PROJECT_GROUP', projectId },
  });

  if (!room) {
    room = await prisma.chatRoom.create({
      data: {
        type: 'PROJECT_GROUP',
        projectId,
        participants: {
          create: seedIds.map((userId) => ({ userId })),
        },
      },
    });
  } else {
    await syncProjectRoomParticipants(prisma, room.id, project);
  }

  return prisma.chatRoom.findUnique({
    where: { id: room.id },
    include: {
      project: { select: { id: true, name: true, status: true } },
      participants: { include: { user: { select: { id: true, name: true, role: true, email: true } } } },
    },
  });
}

async function findOrCreateDirectRoom(prisma, user, otherUserId) {
  await assertCanDirectMessage(prisma, user, otherUserId);
  const [low, high] = sortedPair(user.id, otherUserId);
  let room = await prisma.chatRoom.findFirst({
    where: { type: 'DIRECT', userLowId: low, userHighId: high },
  });
  if (!room) {
    room = await prisma.chatRoom.create({
      data: {
        type: 'DIRECT',
        userLowId: low,
        userHighId: high,
        participants: {
          create: [{ userId: low }, { userId: high }],
        },
      },
    });
  }
  return prisma.chatRoom.findUnique({
    where: { id: room.id },
    include: {
      project: { select: { id: true, name: true, status: true } },
      participants: { include: { user: { select: { id: true, name: true, role: true, email: true } } } },
    },
  });
}

function serializeMessage(m, viewerId, participants) {
  const base = {
    id: m.id,
    roomId: m.roomId,
    senderId: m.senderId,
    kind: m.kind,
    body: m.body,
    attachmentUrl: m.attachmentUrl,
    attachmentMime: m.attachmentMime,
    createdAt: m.createdAt,
    sender: m.sender,
  };
  if (m.senderId !== viewerId) {
    return { ...base, deliveryStatus: null };
  }
  const others = participants.filter((p) => p.userId !== viewerId);
  const t = new Date(m.createdAt).getTime();
  const allSeen =
    others.length > 0 &&
    others.every((p) => p.lastReadAt && new Date(p.lastReadAt).getTime() >= t);
  return { ...base, deliveryStatus: allSeen ? 'seen' : 'delivered' };
}

async function unreadCountForRoom(prisma, roomId, userId, lastReadAt) {
  const after = lastReadAt || new Date(0);
  return prisma.chatMessage.count({
    where: {
      roomId,
      senderId: { not: userId },
      createdAt: { gt: after },
    },
  });
}

async function listMyRooms(prisma, user) {
  if (user.role === 'ADMIN') {
    return { rooms: [], note: 'Use admin project chat list' };
  }
  const parts = await prisma.chatParticipant.findMany({
    where: { userId: user.id },
    include: {
      room: {
        include: {
          project: { select: { id: true, name: true, status: true } },
          participants: { include: { user: { select: { id: true, name: true, role: true, email: true } } } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { id: true, name: true } } },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const out = [];
  for (const p of parts) {
    const unread = await unreadCountForRoom(prisma, p.roomId, user.id, p.lastReadAt);
    const last = p.room.messages[0];
    out.push({
      roomId: p.room.id,
      type: p.room.type,
      project: p.room.project,
      lastMessage: last
        ? {
            id: last.id,
            body: last.body,
            kind: last.kind,
            createdAt: last.createdAt,
            sender: last.sender,
          }
        : null,
      unreadCount: unread,
      lastReadAt: p.lastReadAt,
      participants: p.room.participants.map((x) => ({
        userId: x.userId,
        user: x.user,
      })),
    });
  }
  return { rooms: out };
}

async function adminProjectsWithChat(prisma) {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, email: true } },
      chatRooms: {
        where: { type: 'PROJECT_GROUP' },
        take: 1,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
  return projects.map((p) => {
    const room = p.chatRooms[0];
    const last = room?.messages[0];
    return {
      projectId: p.id,
      projectName: p.name,
      status: p.status,
      client: p.client,
      roomId: room?.id ?? null,
      lastMessage: last
        ? {
            id: last.id,
            body: last.body,
            kind: last.kind,
            createdAt: last.createdAt,
            sender: last.sender,
          }
        : null,
    };
  });
}

async function listMessages(prisma, roomId, user, { before, limit = 50 } = {}) {
  const room = await assertRoomAccess(prisma, user, roomId);
  const take = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100);
  const where = { roomId };
  if (before) {
    const cur = await prisma.chatMessage.findFirst({ where: { id: before, roomId } });
    if (cur) where.createdAt = { lt: cur.createdAt };
  }
  const batch = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: { sender: { select: { id: true, name: true, role: true } } },
  });
  const chronological = batch.slice().reverse();
  const participants = await prisma.chatParticipant.findMany({ where: { roomId } });
  const messages = chronological.map((m) => serializeMessage(m, user.id, participants));
  const nextBefore = batch.length === take ? chronological[0]?.id : null;
  return { messages, nextBefore };
}

function validateSendPayload(body) {
  const kind = body.kind || 'TEXT';
  if (!['TEXT', 'FILE', 'VOICE'].includes(kind)) throw httpError(400, 'Invalid message kind');
  if (kind === 'TEXT') {
    const text = (body.body || '').trim();
    if (!text) throw httpError(400, 'Text body is required');
    return { kind, body: text, attachmentUrl: null, attachmentMime: null };
  }
  if (!body.attachmentUrl || typeof body.attachmentUrl !== 'string') {
    throw httpError(400, 'attachmentUrl is required for file/voice messages');
  }
  return {
    kind,
    body: body.body ? String(body.body).trim() || null : null,
    attachmentUrl: body.attachmentUrl,
    attachmentMime: body.attachmentMime || null,
  };
}

async function sendMessage(prisma, roomId, user, body) {
  await assertRoomAccess(prisma, user, roomId);
  const payload = validateSendPayload(body);
  const msg = await prisma.chatMessage.create({
    data: {
      roomId,
      senderId: user.id,
      kind: payload.kind,
      body: payload.body,
      attachmentUrl: payload.attachmentUrl,
      attachmentMime: payload.attachmentMime,
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });
  const participants = await prisma.chatParticipant.findMany({ where: { roomId } });
  return serializeMessage(msg, user.id, participants);
}

async function markRead(prisma, roomId, user) {
  await assertRoomAccess(prisma, user, roomId);
  await prisma.chatParticipant.updateMany({
    where: { roomId, userId: user.id },
    data: { lastReadAt: new Date() },
  });
  return { ok: true };
}

async function suggestedContacts(prisma, user) {
  if (user.role === 'ADMIN') {
    return prisma.user.findMany({
      where: { role: { in: ['EMPLOYEE', 'CUSTOMER'] } },
      select: { id: true, name: true, role: true, email: true },
      take: 300,
      orderBy: { name: 'asc' },
    });
  }
  if (user.role === 'CUSTOMER') {
    const projects = await prisma.project.findMany({
      where: { clientId: user.id },
      include: {
        assignees: { include: { employee: { select: { id: true, name: true, email: true, role: true } } } },
      },
    });
    const map = new Map();
    for (const p of projects) {
      for (const a of p.assignees) map.set(a.employee.id, a.employee);
    }
    return [...map.values()];
  }
  if (user.role === 'EMPLOYEE') {
    const { projectIds } = await getEmployeeProjectScope(prisma, user.id);
    if (!projectIds.length) return [];
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        client: { select: { id: true, name: true, email: true, role: true } },
        assignees: { include: { employee: { select: { id: true, name: true, email: true, role: true } } } },
      },
    });
    const map = new Map();
    for (const p of projects) {
      if (p.client) map.set(p.client.id, p.client);
      for (const a of p.assignees) {
        if (a.employeeId !== user.id) map.set(a.employee.id, a.employee);
      }
    }
    return [...map.values()];
  }
  return [];
}

/**
 * For socket: same rules as HTTP without throwing HTTP-style errors (returns { ok, room? }).
 */
async function canJoinChatRoom(prisma, user, roomId) {
  try {
    const room = await assertRoomAccess(prisma, user, roomId);
    return { ok: true, room };
  } catch (e) {
    return { ok: false, message: e.message, statusCode: e.statusCode || 500 };
  }
}

module.exports = {
  assertRoomAccess,
  getOrCreateProjectRoom,
  findOrCreateDirectRoom,
  listMyRooms,
  listMessages,
  sendMessage,
  markRead,
  adminProjectsWithChat,
  suggestedContacts,
  canJoinChatRoom,
  loadRoom,
};
