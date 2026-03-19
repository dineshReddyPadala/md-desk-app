const createClientSchema = {
  body: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      phone: { type: 'string' },
      company: { type: 'string' },
    },
  },
};

const updateClientSchema = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      phone: { type: 'string' },
      email: { type: 'string', format: 'email' },
      company: { type: 'string' },
    },
  },
};

const clientIdParam = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
};

module.exports = { createClientSchema, updateClientSchema, clientIdParam };
