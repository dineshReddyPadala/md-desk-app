async function createMessage(prisma, userId, data) {
  return prisma.message.create({
    data: {
      userId,
      subject: data.subject,
      message: data.message,
    },
  });
}

async function listAdmin(prisma, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.message.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.message.count(),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
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

module.exports = { createMessage, listAdmin, listMy, getById, reply };
