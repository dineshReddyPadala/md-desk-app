const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../config');
const emailService = require('../../services/email.service');

const SALT_ROUNDS = 10;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const LOGIN_OTP_MAX_RETRIES = 5;
const LOGIN_OTP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const otpStore = new Map(); // email -> { otp, expiresAt }
const loginOtpStore = new Map(); // email -> { otp, expiresAt, requestCount, firstRequestAt }

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

function checkLoginOtpRetryLimit(email) {
  const key = email.toLowerCase();
  const entry = loginOtpStore.get(key);
  if (!entry) return;
  const now = Date.now();
  if (now - entry.firstRequestAt > LOGIN_OTP_WINDOW_MS) {
    loginOtpStore.delete(key);
    return;
  }
  if (entry.requestCount >= LOGIN_OTP_MAX_RETRIES) {
    const err = new Error('Too many OTP requests. Please try again after 15 minutes.');
    err.statusCode = 429;
    throw err;
  }
}

function setLoginOtp(email, otp) {
  const key = email.toLowerCase();
  const now = Date.now();
  const existing = loginOtpStore.get(key);
  const firstRequestAt = existing && now - existing.firstRequestAt <= LOGIN_OTP_WINDOW_MS
    ? existing.firstRequestAt
    : now;
  const requestCount = existing && now - existing.firstRequestAt <= LOGIN_OTP_WINDOW_MS
    ? existing.requestCount + 1
    : 1;
  loginOtpStore.set(key, {
    otp,
    expiresAt: now + OTP_TTL_MS,
    requestCount,
    firstRequestAt,
  });
}

function verifyAndConsumeLoginOtp(email, otp) {
  const key = email.toLowerCase();
  const entry = loginOtpStore.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    loginOtpStore.delete(key);
    return false;
  }
  if (entry.otp !== String(otp)) return false;
  loginOtpStore.delete(key);
  return true;
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
      company: data.company,
      role: 'CUSTOMER',
    },
    select: { id: true, name: true, email: true, role: true, phone: true, city: true, company: true, createdAt: true },
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
    company: user.company,
    designation: user.designation,
    createdAt: user.createdAt,
  };
  return { user: safe, token };
}

async function getMe(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, phone: true, city: true, company: true, designation: true, createdAt: true },
  });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

async function forgotPassword(prisma, email) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    return; // Don't reveal whether email exists
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpires: expiresAt },
  });
  const baseUrl = process.env.PASSWORD_RESET_BASE_URL || process.env.CUSTOMER_WEB_URL || 'http://localhost:5174';
  const resetLink = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
  await emailService.sendPasswordResetEmail(user.email, resetLink);
}

async function resetPassword(prisma, token, newPassword) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });
  if (!user) {
    const err = new Error('Invalid or expired reset link');
    err.statusCode = 400;
    throw err;
  }
  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordResetToken: null, passwordResetExpires: null },
  });
}

async function sendLoginOtp(prisma, email) {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    const err = new Error('No account found with this email');
    err.statusCode = 404;
    throw err;
  }
  checkLoginOtpRetryLimit(normalized);
  const otp = generateOtp();
  setLoginOtp(normalized, otp);
  await emailService.sendOtpEmail(user.email, otp);
}

async function verifyLoginOtp(prisma, email, otp) {
  const normalized = email.toLowerCase().trim();
  if (!verifyAndConsumeLoginOtp(normalized, otp)) {
    const err = new Error('Invalid or expired OTP');
    err.statusCode = 400;
    throw err;
  }
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    const err = new Error('Invalid or expired OTP');
    err.statusCode = 400;
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
    company: user.company,
    createdAt: user.createdAt,
  };
  return { user: safe, token };
}

module.exports = {
  sendOtp,
  registerUser,
  loginUser,
  getMe,
  hashPassword,
  comparePassword,
  signToken,
  forgotPassword,
  resetPassword,
  sendLoginOtp,
  verifyLoginOtp,
};
