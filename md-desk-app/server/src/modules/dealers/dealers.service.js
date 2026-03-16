async function list(prisma, city = null) {
  const where = city ? { city: { contains: city, mode: 'insensitive' } } : {};
  return prisma.dealer.findMany({ where, orderBy: { name: 'asc' } });
}

async function getById(prisma, id) {
  return prisma.dealer.findUnique({ where: { id } });
}

function normalizeCity(city) {
  if (city == null || String(city).trim() === '') return null;
  return String(city).trim().toLowerCase();
}

async function findByNameAndCity(prisma, name, city, excludeId = null) {
  const where = {
    name: { equals: name, mode: 'insensitive' },
    ...(excludeId && { id: { not: excludeId } }),
  };
  const all = await prisma.dealer.findMany({ where });
  const normalizedInput = normalizeCity(city);
  const match = all.find((d) => {
    const dCity = normalizeCity(d.city);
    return (dCity ?? null) === (normalizedInput ?? null);
  });
  return match || null;
}

async function create(prisma, data) {
  const existing = await findByNameAndCity(prisma, data.name, data.city);
  if (existing) {
    const err = new Error('A dealer with this name and city already exists.');
    err.statusCode = 409;
    throw err;
  }
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
  const name = data.name != null ? data.name : undefined;
  const city = data.city !== undefined ? data.city : undefined;
  if (name != null || city !== undefined) {
    const current = await prisma.dealer.findUnique({ where: { id } });
    if (!current) return null;
    const checkName = name != null ? name : current.name;
    const checkCity = city !== undefined ? city : current.city;
    const existing = await findByNameAndCity(prisma, checkName, checkCity, id);
    if (existing) {
      const err = new Error('A dealer with this name and city already exists.');
      err.statusCode = 409;
      throw err;
    }
  }
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
