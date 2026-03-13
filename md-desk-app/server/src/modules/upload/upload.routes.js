const uploadController = require('./upload.controller');

async function uploadRoutes(fastify) {
  const authSchema = { tags: ['upload'], security: [{ bearerAuth: [] }] };
  fastify.post('/', { preHandler: fastify.authenticateJWT, schema: { ...authSchema, summary: 'Upload single file (jpg, png, pdf)' } }, uploadController.upload);
  fastify.post('/multiple', { preHandler: fastify.authenticateJWT, schema: { ...authSchema, summary: 'Upload multiple files' } }, uploadController.uploadMultiple);
}

module.exports = uploadRoutes;
