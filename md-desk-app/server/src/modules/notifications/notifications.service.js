function getNotificationDelegate(prisma) {
  const delegate = prisma.notification;
  if (!delegate) {
    throw new Error('Prisma client missing Notification model. Run: npx prisma generate');
  }
  return delegate;
}

async function create(prisma, { userId, type, title, body }) {
  return getNotificationDelegate(prisma).create({
    data: { userId, type, title, body: body ?? null },
  });
}

async function notifyAdmins(prisma, { type, title, body }) {
  const staff = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'EMPLOYEE'] } },
    select: { id: true },
  });
  await Promise.all(staff.map((a) => create(prisma, { userId: a.id, type, title, body })));
}

async function listForUser(prisma, userId, { limit = 20 } = {}) {
  return getNotificationDelegate(prisma).findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

async function unreadCount(prisma, userId) {
  return getNotificationDelegate(prisma).count({
    where: { userId, readAt: null },
  });
}

async function markRead(prisma, id, userId) {
  return getNotificationDelegate(prisma).updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
}

async function markAllRead(prisma, userId) {
  return getNotificationDelegate(prisma).updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

module.exports = { create, notifyAdmins, listForUser, unreadCount, markRead, markAllRead };
