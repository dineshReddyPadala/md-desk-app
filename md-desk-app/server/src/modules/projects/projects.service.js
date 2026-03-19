const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

async function list(prisma, query = {}) {
  const { status, clientId, page = 1, limit = DEFAULT_LIMIT } = query;
  const where = {};
  if (status && String(status).trim()) where.status = String(status).trim();
  if (clientId && String(clientId).trim()) where.clientId = String(clientId).trim();
  const take = Math.min(Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;
  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { client: { select: { id: true, name: true, email: true, phone: true, company: true } } },
    }),
    prisma.project.count({ where }),
  ]);
  return { items, total, page: Math.floor(skip / take) + 1, limit: take, totalPages: Math.ceil(total / take) };
}

async function getById(prisma, id) {
  return prisma.project.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true, email: true, phone: true, company: true } } },
  });
}

async function create(prisma, data) {
  return prisma.project.create({
    data: {
      name: data.name,
      description: data.description || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      documentUrl: data.documentUrl || null,
      status: data.status || 'PENDING',
      clientId: data.clientId || null,
    },
    include: { client: { select: { id: true, name: true, email: true, phone: true, company: true } } },
  });
}

async function update(prisma, id, data) {
  const updateData = {};
  if (data.name != null) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.documentUrl !== undefined) updateData.documentUrl = data.documentUrl || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.clientId !== undefined) updateData.clientId = data.clientId || null;
  return prisma.project.update({
    where: { id },
    data: updateData,
    include: { client: { select: { id: true, name: true, email: true, phone: true, company: true } } },
  });
}

async function updateStatus(prisma, id, status) {
  const valid = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
  if (!valid.includes(status)) {
    const err = new Error('Invalid status');
    err.statusCode = 400;
    throw err;
  }
  return prisma.project.update({
    where: { id },
    data: { status },
    include: { client: { select: { id: true, name: true, email: true, phone: true, company: true } } },
  });
}

async function remove(prisma, id) {
  return prisma.project.delete({ where: { id } });
}

async function bulkCreateFromRows(prisma, rows) {
  const created = [];
  const errors = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.name != null ? String(row.name).trim() : '';
    if (!name) {
      errors.push({ row: i + 1, message: 'Name is required' });
      continue;
    }
    try {
      let clientId = null;
      if (row.clientEmail && String(row.clientEmail).trim()) {
        const user = await prisma.user.findUnique({
          where: { email: String(row.clientEmail).trim().toLowerCase(), role: 'CUSTOMER' },
        });
        if (user) clientId = user.id;
      }
      const project = await prisma.project.create({
        data: {
          name,
          description: row.description != null ? String(row.description).trim() || null : null,
          startDate: row.startDate ? new Date(row.startDate) : null,
          endDate: row.endDate ? new Date(row.endDate) : null,
          status: ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(String(row.status || '').trim().toUpperCase())
            ? String(row.status).trim().toUpperCase()
            : 'PENDING',
          clientId,
        },
        include: { client: { select: { id: true, name: true, email: true, phone: true, company: true } } },
      });
      created.push(project);
    } catch (e) {
      errors.push({ row: i + 1, message: e.message || 'Failed to create' });
    }
  }
  return { created, errors };
}

module.exports = { list, getById, create, update, updateStatus, remove, bulkCreateFromRows };
