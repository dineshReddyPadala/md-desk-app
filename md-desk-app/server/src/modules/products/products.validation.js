const createProductSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      imageUrl: { type: 'string' },
    },
  },
};

const updateProductSchema = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      imageUrl: { type: 'string' },
    },
  },
};

const productIdParam = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
};

module.exports = { createProductSchema, updateProductSchema, productIdParam };
