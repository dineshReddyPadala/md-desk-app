async function list(prisma) {
  return prisma.product.findMany({ orderBy: { name: 'asc' } });
}

async function getById(prisma, id) {
  return prisma.product.findUnique({ where: { id } });
}

async function create(prisma, data) {
  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
    },
  });
}

async function update(prisma, id, data) {
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

module.exports = { list, getById, create, update, remove };
