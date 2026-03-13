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

module.exports = { sendOtpSchema, registerSchema, loginSchema };
