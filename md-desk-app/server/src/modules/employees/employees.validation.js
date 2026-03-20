const createEmployeeSchema = {
  body: {
    type: 'object',
    required: ['name', 'email', 'mobile'],
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      mobile: { type: 'string' },
      designation: { type: 'string' },
    },
  },
};

const updateEmployeeSchema = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      mobile: { type: 'string' },
      designation: { type: 'string' },
    },
  },
};

const idParamSchema = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
};

const listQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1 },
      limit: { type: 'integer', default: 20 },
      search: { type: 'string' },
    },
  },
};

module.exports = { createEmployeeSchema, updateEmployeeSchema, idParamSchema, listQuerySchema };
