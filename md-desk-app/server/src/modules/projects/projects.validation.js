const createProjectSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' },
      documentUrl: { type: 'string' },
      status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
      clientId: { type: 'string' },
    },
  },
};

const updateProjectSchema = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' },
      documentUrl: { type: 'string' },
      status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
      clientId: { type: 'string' },
    },
  },
};

const projectIdParam = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
};

const updateStatusSchema = {
  params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  body: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] } } },
};

module.exports = { createProjectSchema, updateProjectSchema, projectIdParam, updateStatusSchema };
