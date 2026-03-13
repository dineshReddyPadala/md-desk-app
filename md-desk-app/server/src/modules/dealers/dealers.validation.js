const createDealerSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      city: { type: 'string' },
      phone: { type: 'string' },
      imageUrl: { type: 'string' },
      locationLat: { type: 'number' },
      locationLong: { type: 'number' },
    },
  },
};

const updateDealerSchema = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      city: { type: 'string' },
      phone: { type: 'string' },
      imageUrl: { type: 'string' },
      locationLat: { type: 'number' },
      locationLong: { type: 'number' },
    },
  },
};

const dealerIdParam = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
};

module.exports = { createDealerSchema, updateDealerSchema, dealerIdParam };
