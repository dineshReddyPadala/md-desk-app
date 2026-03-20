const createComplaintSchema = {
  body: {
    type: 'object',
    required: ['project_location', 'description', 'category'],
    properties: {
      name: { type: 'string' },
      phone: { type: 'string' },
      city: { type: 'string' },
      product_used: { type: 'string' },
      project_location: { type: 'string' },
      project_id: { type: 'string' },
      description: { type: 'string' },
      category: { type: 'string', enum: ['PRODUCT', 'SERVICE', 'DELIVERY', 'TECHNICAL'] },
    },
  },
};

const updateStatusSchema = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  body: {
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'] },
      priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
    },
  },
};

const queryListSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1 },
      limit: { type: 'integer', default: 10 },
      status: { type: 'string' },
      priority: { type: 'string' },
      city: { type: 'string' },
    },
  },
};

module.exports = { createComplaintSchema, updateStatusSchema, queryListSchema };
