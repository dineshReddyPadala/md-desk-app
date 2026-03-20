const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

function generateRandomPassword() {
  return crypto.randomBytes(8).toString('base64').replace(/[/+=]/g, '').slice(0, 12);
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function toEmployeeShape(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.phone || '',
    designation: user.designation,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function list(prisma, page = 1, limit = 20, search = '') {
  const take = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
  const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;
  const where = { role: 'EMPLOYEE' };
  if (search && String(search).trim()) {
    const term = String(search).trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { designation: { contains: term, mode: 'insensitive' } },
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        designation: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  const items = users.map(toEmployeeShape);
  return { items, total, page: Math.floor(skip / take) + 1, limit: take, totalPages: Math.ceil(total / take) };
}

async function create(prisma, data) {
  const email = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('A user with this email already exists');
    err.statusCode = 400;
    throw err;
  }
  const plainPassword = generateRandomPassword();
  const hashed = await hashPassword(plainPassword);
  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      phone: data.mobile.trim(),
      password: hashed,
      role: 'EMPLOYEE',
      designation: data.designation ? data.designation.trim() : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      designation: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { user: toEmployeeShape(user), temporaryPassword: plainPassword };
}

async function getById(prisma, id) {
  const user = await prisma.user.findFirst({
    where: { id, role: 'EMPLOYEE' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      designation: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    const err = new Error('Employee not found');
    err.statusCode = 404;
    throw err;
  }
  return toEmployeeShape(user);
}

async function update(prisma, id, data) {
  await getById(prisma, id);
  if (data.email) {
    const email = data.email.trim().toLowerCase();
    const conflict = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (conflict) {
      const err = new Error('A user with this email already exists');
      err.statusCode = 400;
      throw err;
    }
  }
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name != null && { name: data.name.trim() }),
      ...(data.email != null && { email: data.email.trim().toLowerCase() }),
      ...(data.mobile != null && { phone: data.mobile.trim() }),
      ...(data.designation !== undefined && { designation: data.designation ? data.designation.trim() : null }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      designation: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return toEmployeeShape(user);
}

async function remove(prisma, id) {
  await getById(prisma, id);
  await prisma.user.delete({ where: { id } });
}

module.exports = { list, create, getById, update, remove };
