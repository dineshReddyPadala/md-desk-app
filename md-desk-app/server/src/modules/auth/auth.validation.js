const sendOtpSchema = {
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' },
    },
  },
};

const registerSchema = {
  body: {
    type: 'object',
    required: ['name', 'email', 'otp', 'password', 'confirmPassword'],
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
      otp: { type: 'string', minLength: 6, maxLength: 6 },
      password: { type: 'string', minLength: 6 },
      confirmPassword: { type: 'string', minLength: 6 },
      phone: { type: 'string' },
      city: { type: 'string' },
      company: { type: 'string' },
    },
  },
};

const loginSchema = {
  body: {
    type: 'object',
    required: ['password'],
    properties: {
      email: { type: 'string', format: 'email' },
      phone: { type: 'string' },
      password: { type: 'string' },
    },
  },
};

const forgotPasswordSchema = {
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' },
    },
  },
};

const resetPasswordSchema = {
  body: {
    type: 'object',
    required: ['token', 'newPassword'],
    properties: {
      token: { type: 'string', minLength: 1 },
      newPassword: { type: 'string', minLength: 6 },
    },
  },
};

const sendLoginOtpSchema = {
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' },
    },
  },
};

const verifyLoginOtpSchema = {
  body: {
    type: 'object',
    required: ['email', 'otp'],
    properties: {
      email: { type: 'string', format: 'email' },
      otp: { type: 'string', minLength: 6, maxLength: 6 },
    },
  },
};

module.exports = {
  sendOtpSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendLoginOtpSchema,
  verifyLoginOtpSchema,
};
