const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const emailService = require('../../services/email.service');

const SALT_ROUNDS = 10;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const otpStore = new Map(); // email -> { otp, expiresAt }

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function setOtp(email, otp) {
  otpStore.set(email.toLowerCase(), { otp, expiresAt: Date.now() + OTP_TTL_MS });
}

function verifyAndConsumeOtp(email, otp) {
  const key = email.toLowerCase();
  const entry = otpStore.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return false;
  }
  if (entry.otp !== String(otp)) return false;
  otpStore.delete(key);
  return true;
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

async function sendOtp(prisma, email) {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 400;
    throw err;
  }
  const otp = generateOtp();
  setOtp(email, otp);
  await emailService.sendOtpEmail(email, otp);
}

async function registerUser(prisma, data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 400;
    throw err;
  }
  if (!verifyAndConsumeOtp(data.email, data.otp)) {
    const err = new Error('Invalid or expired OTP');
    err.statusCode = 400;
    throw err;
  }
  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      phone: data.phone,
      city: data.city,
      role: 'CUSTOMER',
    },
    select: { id: true, name: true, email: true, role: true, phone: true, city: true, createdAt: true },
  });
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { user, token };
}

async function loginUser(prisma, { email, phone }, password) {
  const where = email ? { email: email.toLowerCase().trim() } : { phone: (phone || '').trim() };
  const user = await prisma.user.findFirst({ where });
  if (!user) {
    const err = new Error('Invalid email/phone or password');
    err.statusCode = 401;
    throw err;
  }
  const valid = await comparePassword(password, user.password);
  if (!valid) {
    const err = new Error('Invalid email/phone or password');
    err.statusCode = 401;
    throw err;
  }
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  const safe = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    city: user.city,
    createdAt: user.createdAt,
  };
  return { user: safe, token };
}

async function getMe(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, phone: true, city: true, createdAt: true },
  });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

module.exports = { sendOtp, registerUser, loginUser, getMe, hashPassword, comparePassword, signToken };
