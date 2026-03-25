async function createMessage(prisma, userId, data) {
  return prisma.message.create({
    data: {
      userId,
      subject: data.subject,
      message: data.message,
    },
  });
}

function buildMessageWhere(replyStatus = '', fromDate = '', toDate = '') {
  const where = {};
  if (replyStatus === 'REPLIED') where.adminReply = { not: null };
  if (replyStatus === 'PENDING') where.adminReply = null;
  const createdAt = {};
  if (fromDate) {
    const parsed = new Date(`${String(fromDate).trim()}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) createdAt.gte = parsed;
  }
  if (toDate) {
    const parsed = new Date(`${String(toDate).trim()}T23:59:59.999Z`);
    if (!Number.isNaN(parsed.getTime())) createdAt.lte = parsed;
  }
  if (Object.keys(createdAt).length) where.createdAt = createdAt;
  return where;
}

async function listAdmin(prisma, page = 1, limit = 20, filters = {}) {
  const skip = (page - 1) * limit;
  const where = buildMessageWhere(filters.replyStatus, filters.fromDate, filters.toDate);
  const [items, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function listAllAdmin(prisma, filters = {}) {
  const where = buildMessageWhere(filters.replyStatus, filters.fromDate, filters.toDate);
  return prisma.message.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function listMy(prisma, userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { userId } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getById(prisma, id) {
  const msg = await prisma.message.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!msg) {
    const err = new Error('Message not found');
    err.statusCode = 404;
    throw err;
  }
  return msg;
}

async function reply(prisma, id, replyText, adminId) {
  const msg = await prisma.message.findUnique({ where: { id } });
  if (!msg) {
    const err = new Error('Message not found');
    err.statusCode = 404;
    throw err;
  }
  return prisma.message.update({
    where: { id },
    data: { adminReply: replyText, repliedAt: new Date() },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

module.exports = { createMessage, listAdmin, listAllAdmin, listMy, getById, reply };
