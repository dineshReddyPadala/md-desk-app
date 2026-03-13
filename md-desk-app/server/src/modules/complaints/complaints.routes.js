const complaintsController = require('./complaints.controller');
const { createComplaintSchema, queryListSchema } = require('./complaints.validation');
const { parseMultipartComplaint } = require('./complaints.hooks');
const { composePreHandlers } = require('../../utils/preHandler');

const createComplaintResponse = {
  201: {
    description: 'Created',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            complaint_id: { type: 'string' },
            id: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
};

async function complaintsRoutes(fastify) {
  const auth = fastify.authenticateJWT;
  // preValidation runs before body validation, so multipart is parsed and req.body set in time
  const authThenMultipart = composePreHandlers(fastify.authenticateJWT, parseMultipartComplaint);

  fastify.post(
    '/',
    {
      preValidation: authThenMultipart,
      schema: {
        tags: ['complaints'],
        summary: 'Create complaint',
        security: [{ bearerAuth: [] }],
        body: createComplaintSchema.body,
        response: createComplaintResponse,
      },
    },
    complaintsController.createComplaint
  );
  fastify.get('/my', {
    preHandler: auth,
    schema: {
      tags: ['complaints'],
      summary: 'My complaints',
      security: [{ bearerAuth: [] }],
      querystring: queryListSchema.querystring,
    },
  }, complaintsController.myComplaints);
  fastify.get('/track/:complaintId', {
    preHandler: auth,
    schema: {
      tags: ['complaints'],
      summary: 'Track by complaint ID',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { complaintId: { type: 'string' } }, required: ['complaintId'] },
    },
  }, complaintsController.getByComplaintId);
  fastify.get('/:id', {
    preHandler: auth,
    schema: {
      tags: ['complaints'],
      summary: 'Get complaint by id',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
  }, complaintsController.getComplaint);
}

module.exports = complaintsRoutes;
