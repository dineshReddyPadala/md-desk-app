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

function normalizeEmployeeInput(data = {}) {
  return {
    name: data.name != null ? String(data.name).trim() : '',
    email: data.email != null ? String(data.email).trim().toLowerCase() : '',
    mobile: data.mobile != null ? String(data.mobile).trim() : '',
    designation: data.designation != null ? String(data.designation).trim() : '',
  };
}

function validateEmployeeInput(input) {
  if (!input.name) {
    const err = new Error('Name is required');
    err.statusCode = 400;
    throw err;
  }
  if (!input.email) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }
  if (!input.mobile) {
    const err = new Error('Mobile is required');
    err.statusCode = 400;
    throw err;
  }
}

async function createEmployeeRecord(prisma, rawData) {
  const data = normalizeEmployeeInput(rawData);
  validateEmployeeInput(data);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error('A user with this email already exists');
    err.statusCode = 400;
    throw err;
  }
  const plainPassword = generateRandomPassword();
  const hashed = await hashPassword(plainPassword);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.mobile,
      password: hashed,
      role: 'EMPLOYEE',
      designation: data.designation || null,
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

async function list(prisma, page = 1, limit = 20, search = '') {
  return listWithFilters(prisma, { page, limit, search });
}

function buildEmployeeWhere(search = '', designation = '', fromDate = '', toDate = '') {
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
  if (designation && String(designation).trim()) {
    where.designation = { contains: String(designation).trim(), mode: 'insensitive' };
  }
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

async function listWithFilters(prisma, options = {}) {
  const { page = 1, limit = 20, search = '', designation = '', fromDate = '', toDate = '' } = options;
  const take = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
  const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;
  const where = buildEmployeeWhere(search, designation, fromDate, toDate);
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

async function listAll(prisma, search = '') {
  const where = buildEmployeeWhere(search);
  const users = await prisma.user.findMany({
    where,
    orderBy: { name: 'asc' },
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
  return users.map(toEmployeeShape);
}

async function listAllWithFilters(prisma, options = {}) {
  const { search = '', designation = '', fromDate = '', toDate = '' } = options;
  const where = buildEmployeeWhere(search, designation, fromDate, toDate);
  const users = await prisma.user.findMany({
    where,
    orderBy: { name: 'asc' },
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
  return users.map(toEmployeeShape);
}

async function create(prisma, data) {
  return createEmployeeRecord(prisma, data);
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
  const normalized = normalizeEmployeeInput({
    name: data.name,
    email: data.email,
    mobile: data.mobile,
    designation: data.designation,
  });
  if (data.email) {
    const email = normalized.email;
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
      ...(data.name != null && { name: normalized.name }),
      ...(data.email != null && { email: normalized.email }),
      ...(data.mobile != null && { phone: normalized.mobile }),
      ...(data.designation !== undefined && { designation: normalized.designation || null }),
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

async function bulkCreateFromRows(prisma, rows) {
  const created = [];
  const errors = [];
  for (let i = 0; i < rows.length; i += 1) {
    try {
      created.push(await createEmployeeRecord(prisma, rows[i]));
    } catch (err) {
      errors.push({ row: i + 1, message: err.message || 'Failed to create employee' });
    }
  }
  return { created, errors };
}

module.exports = { list, listWithFilters, listAll, listAllWithFilters, create, getById, update, remove, bulkCreateFromRows };
