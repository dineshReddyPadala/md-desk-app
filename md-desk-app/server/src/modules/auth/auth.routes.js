const { sendOtp, register, login, me, forgotPassword, resetPassword, sendLoginOtp, verifyLoginOtp } = require('./auth.controller');
const {
  sendOtpSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendLoginOtpSchema,
  verifyLoginOtpSchema,
} = require('./auth.validation');

const userObjectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    role: { type: 'string', enum: ['ADMIN', 'CUSTOMER'] },
    phone: { type: 'string' },
    city: { type: 'string' },
    company: { type: 'string' },
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
  fastify.post('/forgot-password', {
    schema: {
      tags: ['auth'],
      summary: 'Request password reset email',
      body: forgotPasswordSchema.body,
      response: {
        200: {
          description: 'Reset email sent if account exists',
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
    handler: forgotPassword,
  });
  fastify.post('/reset-password', {
    schema: {
      tags: ['auth'],
      summary: 'Reset password with token',
      body: resetPasswordSchema.body,
      response: {
        200: {
          description: 'Password updated',
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
    handler: resetPassword,
  });
  fastify.post('/send-login-otp', {
    schema: {
      tags: ['auth'],
      summary: 'Send OTP to email for login',
      body: sendLoginOtpSchema.body,
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
    handler: sendLoginOtp,
  });
  fastify.post('/verify-login-otp', {
    schema: {
      tags: ['auth'],
      summary: 'Verify OTP and login',
      body: verifyLoginOtpSchema.body,
      response: loginResponse,
    },
    handler: verifyLoginOtp,
  });
}

module.exports = authRoutes;
