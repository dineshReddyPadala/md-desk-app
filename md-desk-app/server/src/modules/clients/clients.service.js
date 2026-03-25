const bcrypt = require('bcrypt');
const crypto = require('crypto');
const emailService = require('../../services/email.service');

const SALT_ROUNDS = 10;

function generateRandomPassword() {
  return crypto.randomBytes(8).toString('base64').replace(/[/+=]/g, '').slice(0, 12);
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function toClientShape(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    company: user.company,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function buildDateRange(fromDate, toDate) {
  const createdAt = {};
  if (fromDate) {
    const parsed = new Date(`${String(fromDate).trim()}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) createdAt.gte = parsed;
  }
  if (toDate) {
    const parsed = new Date(`${String(toDate).trim()}T23:59:59.999Z`);
    if (!Number.isNaN(parsed.getTime())) createdAt.lte = parsed;
  }
  return Object.keys(createdAt).length ? createdAt : null;
}

async function list(prisma, query = {}) {
  const { search, company, fromDate, toDate, page = 1, limit = DEFAULT_LIMIT } = query;
  const where = { role: 'CUSTOMER' };
  if (search && String(search).trim()) {
    const term = String(search).trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { company: { contains: term, mode: 'insensitive' } },
    ];
  }
  if (company && String(company).trim()) {
    where.company = { contains: String(company).trim(), mode: 'insensitive' };
  }
  const createdAt = buildDateRange(fromDate, toDate);
  if (createdAt) where.createdAt = createdAt;
  const take = Math.min(Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take,
      select: { id: true, name: true, email: true, phone: true, company: true, createdAt: true, updatedAt: true },
    }),
    prisma.user.count({ where }),
  ]);
  const items = users.map(toClientShape);
  return { items, total, page: Math.floor(skip / take) + 1, limit: take, totalPages: Math.ceil(total / take) };
}

async function listAll(prisma, query = {}) {
  const { search, company, fromDate, toDate } = query;
  const where = { role: 'CUSTOMER' };
  if (search && String(search).trim()) {
    const term = String(search).trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { company: { contains: term, mode: 'insensitive' } },
    ];
  }
  if (company && String(company).trim()) {
    where.company = { contains: String(company).trim(), mode: 'insensitive' };
  }
  const createdAt = buildDateRange(fromDate, toDate);
  if (createdAt) where.createdAt = createdAt;
  const users = await prisma.user.findMany({
    where,
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, phone: true, company: true, createdAt: true, updatedAt: true },
  });
  return users.map(toClientShape);
}

async function getById(prisma, id) {
  const user = await prisma.user.findFirst({
    where: { id, role: 'CUSTOMER' },
    select: { id: true, name: true, email: true, phone: true, company: true, createdAt: true, updatedAt: true, projects: { select: { id: true, name: true, status: true } } },
  });
  if (!user) return null;
  return { ...toClientShape(user), projects: user.projects };
}

async function create(prisma, data) {
  const name = (data.name || '').trim();
  const email = (data.email || '').toLowerCase().trim();
  if (!name) {
    const err = new Error('Name is required for client');
    err.statusCode = 400;
    throw err;
  }
  if (!email) {
    const err = new Error('Email is required for client');
    err.statusCode = 400;
    throw err;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('A user with this email already exists');
    err.statusCode = 409;
    throw err;
  }
  const temporaryPassword = generateRandomPassword();
  const hashed = await hashPassword(temporaryPassword);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: data.phone ? String(data.phone).trim() || null : null,
      company: data.company ? String(data.company).trim() || null : null,
      role: 'CUSTOMER',
      password: hashed,
    },
    select: { id: true, name: true, email: true, phone: true, company: true, createdAt: true, updatedAt: true },
  });
  await emailService.sendNewClientEmail(user.email, user.name, temporaryPassword);
  return toClientShape(user);
}

async function update(prisma, id, data) {
  const user = await prisma.user.findFirst({ where: { id, role: 'CUSTOMER' } });
  if (!user) return null;
  const updateData = {};
  if (data.name != null) updateData.name = String(data.name).trim();
  if (data.phone !== undefined) updateData.phone = data.phone ? String(data.phone).trim() || null : null;
  if (data.email !== undefined) updateData.email = (data.email || '').toLowerCase().trim();
  if (data.company !== undefined) updateData.company = data.company ? String(data.company).trim() || null : null;
  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, phone: true, company: true, createdAt: true, updatedAt: true },
  });
  return toClientShape(updated);
}

async function remove(prisma, id) {
  const user = await prisma.user.findFirst({ where: { id, role: 'CUSTOMER' } });
  if (!user) return null;
  await prisma.user.delete({ where: { id } });
  return true;
}

async function bulkCreateFromRows(prisma, rows) {
  const created = [];
  const errors = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.name != null ? String(row.name).trim() : '';
    const email = row.email != null ? String(row.email).trim().toLowerCase() : '';
    if (!name) {
      errors.push({ row: i + 1, message: 'Name is required' });
      continue;
    }
    if (!email) {
      errors.push({ row: i + 1, message: 'Email is required' });
      continue;
    }
    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        errors.push({ row: i + 1, message: 'A user with this email already exists' });
        continue;
      }
      const temporaryPassword = generateRandomPassword();
      const hashed = await hashPassword(temporaryPassword);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone: row.phone != null ? String(row.phone).trim() || null : null,
          company: row.company != null ? String(row.company).trim() || null : null,
          role: 'CUSTOMER',
          password: hashed,
        },
        select: { id: true, name: true, email: true, phone: true, company: true, createdAt: true, updatedAt: true },
      });
      created.push(toClientShape(user));
      await emailService.sendNewClientEmail(user.email, user.name, temporaryPassword);
    } catch (e) {
      errors.push({ row: i + 1, message: e.message || 'Failed to create' });
    }
  }
  return { created, errors };
}

module.exports = { list, listAll, getById, create, update, remove, bulkCreateFromRows };
