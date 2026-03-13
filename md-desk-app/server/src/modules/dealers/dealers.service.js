async function list(prisma, city = null) {
  const where = city ? { city: { contains: city, mode: 'insensitive' } } : {};
  return prisma.dealer.findMany({ where, orderBy: { name: 'asc' } });
}

async function getById(prisma, id) {
  return prisma.dealer.findUnique({ where: { id } });
}

async function create(prisma, data) {
  return prisma.dealer.create({
    data: {
      name: data.name,
      city: data.city || null,
      phone: data.phone || null,
      imageUrl: data.imageUrl || null,
      locationLat: data.locationLat != null ? data.locationLat : undefined,
      locationLong: data.locationLong != null ? data.locationLong : undefined,
    },
  });
}

async function update(prisma, id, data) {
  return prisma.dealer.update({
    where: { id },
    data: {
      ...(data.name != null && { name: data.name }),
      ...(data.city !== undefined && { city: data.city || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      ...(data.locationLat !== undefined && { locationLat: data.locationLat }),
      ...(data.locationLong !== undefined && { locationLong: data.locationLong }),
    },
  });
}

async function remove(prisma, id) {
  return prisma.dealer.delete({ where: { id } });
}

module.exports = { list, getById, create, update, remove };
