const uploadController = require('./upload.controller');

const uploadQuerystring = {
  type: 'object',
  properties: {
    scope: {
      type: 'string',
      enum: ['media', 'image'],
      description: 'media = documents/images/video/audio/zip (projects, complaints, chat). image = product/dealer photos only.',
    },
  },
};

async function uploadRoutes(fastify) {
  const authSchema = { tags: ['upload'], security: [{ bearerAuth: [] }] };
  fastify.post('/', {
    preHandler: fastify.authenticateJWT,
    schema: {
      ...authSchema,
      summary: 'Upload single file',
      description: 'Query scope=media (default) or scope=image. Rejects invalid types with 400 and a clear message.',
      querystring: uploadQuerystring,
    },
  }, uploadController.upload);
  fastify.post('/multiple', {
    preHandler: fastify.authenticateJWT,
    schema: {
      ...authSchema,
      summary: 'Upload multiple files',
      querystring: uploadQuerystring,
    },
  }, uploadController.uploadMultiple);
}

module.exports = uploadRoutes;
