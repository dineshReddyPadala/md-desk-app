async function list(prisma, search = '') {
  const where = {};
  if (search && String(search).trim()) {
    const term = String(search).trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ];
  }
  return prisma.product.findMany({ where, orderBy: { name: 'asc' } });
}

async function getById(prisma, id) {
  return prisma.product.findUnique({ where: { id } });
}

async function findByName(prisma, name, excludeId = null) {
  const where = { name: { equals: name, mode: 'insensitive' } };
  if (excludeId) where.id = { not: excludeId };
  return prisma.product.findFirst({ where });
}

async function create(prisma, data) {
  const existing = await findByName(prisma, data.name);
  if (existing) {
    const err = new Error('A product with this name already exists.');
    err.statusCode = 409;
    throw err;
  }
  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
    },
  });
}

async function update(prisma, id, data) {
  if (data.name != null) {
    const existing = await findByName(prisma, data.name, id);
    if (existing) {
      const err = new Error('A product with this name already exists.');
      err.statusCode = 409;
      throw err;
    }
  }
  return prisma.product.update({
    where: { id },
    data: {
      ...(data.name != null && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
    },
  });
}

async function remove(prisma, id) {
  return prisma.product.delete({ where: { id } });
}

module.exports = { list, getById, findByName, create, update, remove };
