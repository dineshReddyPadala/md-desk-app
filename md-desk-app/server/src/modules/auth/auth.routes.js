const { sendOtp, register, login, me } = require('./auth.controller');
const { sendOtpSchema, registerSchema, loginSchema } = require('./auth.validation');

const userObjectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    role: { type: 'string', enum: ['ADMIN', 'CUSTOMER'] },
    phone: { type: 'string' },
    city: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const registerResponse = {
  201: {
    description: 'Registered',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: userObjectSchema,
            token: { type: 'string' },
          },
        },
      },
    },
  },
};

const loginResponse = {
  200: {
    description: 'Logged in',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: userObjectSchema,
            token: { type: 'string' },
          },
        },
      },
    },
  },
};

const meResponse = {
  200: {
    description: 'Current user',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: userObjectSchema,
          },
        },
      },
    },
  },
};

async function authRoutes(fastify) {
  fastify.post('/send-otp', {
    schema: {
      tags: ['auth'],
      summary: 'Send OTP to email for registration',
      body: sendOtpSchema.body,
      response: {
        200: {
          description: 'OTP sent',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { success: { type: 'boolean' }, message: { type: 'string' } },
              },
            },
          },
        },
      },
    },
    handler: sendOtp,
  });
  fastify.post('/register', {
    schema: {
      tags: ['auth'],
      summary: 'Customer registration',
      body: registerSchema.body,
      response: registerResponse,
    },
    handler: register,
  });
  fastify.post('/login', {
    schema: {
      tags: ['auth'],
      summary: 'Login',
      body: loginSchema.body,
      response: loginResponse,
    },
    handler: login,
  });
  fastify.get('/me', {
    preHandler: fastify.authenticateJWT,
    schema: {
      tags: ['auth'],
      summary: 'Current user',
      security: [{ bearerAuth: [] }],
      response: meResponse,
    },
    handler: me,
  });
}

module.exports = authRoutes;
