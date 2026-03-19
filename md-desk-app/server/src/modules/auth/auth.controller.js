const authService = require('./auth.service');

async function sendOtp(req, reply) {
  const { email } = req.body;
  await authService.sendOtp(req.server.prisma, email);
  return reply.send({ success: true, message: 'OTP sent to your email' });
}

async function register(req, reply) {
  const data = req.body;
  if (data.password !== data.confirmPassword) {
    return reply.status(400).send({ success: false, message: 'Password and confirm password do not match' });
  }
  const { confirmPassword, otp, ...rest } = data;
  const result = await authService.registerUser(req.server.prisma, { ...rest, otp, password: data.password });
  return reply.status(201).send({ success: true, ...result });
}

async function login(req, reply) {
  const { email, phone, password } = req.body;
  if (!email && !phone) {
    return reply.status(400).send({ success: false, message: 'Provide email or phone' });
  }
  const result = await authService.loginUser(req.server.prisma, { email: email || null, phone: phone || null }, password);
  return reply.send({ success: true, ...result });
}

async function forgotPassword(req, reply) {
  const { email } = req.body;
  await authService.forgotPassword(req.server.prisma, email);
  return reply.send({ success: true, message: 'If an account exists with this email, you will receive a reset link.' });
}

async function resetPassword(req, reply) {
  const { token, newPassword } = req.body;
  await authService.resetPassword(req.server.prisma, token, newPassword);
  return reply.send({ success: true, message: 'Password updated. You can now sign in.' });
}

async function sendLoginOtp(req, reply) {
  const { email } = req.body;
  await authService.sendLoginOtp(req.server.prisma, email);
  return reply.send({ success: true, message: 'OTP sent to your email' });
}

async function verifyLoginOtp(req, reply) {
  const { email, otp } = req.body;
  const result = await authService.verifyLoginOtp(req.server.prisma, email, otp);
  return reply.send({ success: true, ...result });
}

async function me(req, reply) {
  const user = await authService.getMe(req.server.prisma, req.user.id);
  return reply.send({ success: true, user });
}

module.exports = { sendOtp, register, login, me, forgotPassword, resetPassword, sendLoginOtp, verifyLoginOtp };
